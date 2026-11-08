#![allow(unexpected_cfgs)]

use block::ConcreteBlock;
use objc::runtime::Object;
use objc::{class, msg_send, sel, sel_impl};
use tauri::{AppHandle, Manager};

type Id = *mut Object;

/// 窗口已经显示但仍不在全屏时，再进一次。配置里的全屏发生得太早，系统会丢掉。
pub fn enter_if_needed(window: &tauri::Window) {
    let Ok(ns_window) = window.ns_window() else {
        return;
    };
    let ns_window = ns_window as Id;
    unsafe {
        let mask: usize = msg_send![ns_window, styleMask];
        if mask & (1 << 14) == 0 {
            let _: () = msg_send![ns_window, performSelectorOnMainThread: sel!(toggleFullScreen:) withObject: std::ptr::null_mut::<Object>() waitUntilDone: false];
        }
    }
}

/// WebKit 收到 Esc 后直接让窗口退出全屏，不会走到 NSWindow 的 cancelOperation:。
/// 在事件送到 WebKit 之前吃掉这个键，再补一次页面上的 keydown，学习页仍能用 Esc 关提示。
pub fn install(app: AppHandle) {
    let handler = ConcreteBlock::new(move |event: Id| -> Id {
        if event.is_null() || !is_escape(event) || !target_is_fullscreen(event) {
            return event;
        }
        if let Some(window) = app.get_window("main") {
            let _ = window.eval(
                "window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true,cancelable:true}))",
            );
        }
        std::ptr::null_mut()
    });
    let handler = handler.copy();
    unsafe {
        let _: Id = msg_send![class!(NSEvent), addLocalMonitorForEventsMatchingMask:1u64 << 10 handler:&*handler];
    }
    std::mem::forget(handler);
}

fn is_escape(event: Id) -> bool {
    unsafe {
        let kind: u64 = msg_send![event, type];
        if kind != 10 {
            return false;
        }
        let code: u16 = msg_send![event, keyCode];
        code == 53
    }
}

fn target_is_fullscreen(event: Id) -> bool {
    unsafe {
        let mut window: Id = msg_send![event, window];
        if window.is_null() {
            let app: Id = msg_send![class!(NSApplication), sharedApplication];
            window = msg_send![app, keyWindow];
        }
        if window.is_null() {
            return false;
        }
        let mask: usize = msg_send![window, styleMask];
        // NSWindowStyleMaskFullScreen
        mask & (1 << 14) != 0
    }
}
