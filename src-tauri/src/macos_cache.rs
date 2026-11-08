#![allow(unexpected_cfgs)]

use block::ConcreteBlock;
use objc::runtime::Object;
use objc::{class, msg_send, sel, sel_impl};

type Id = *mut Object;

/// 清掉 WKWebView 的网页缓存、Cookie 和本地存储。
/// 完成回调会回到主线程，而这条命令就在主线程上，不能在这里等待。
pub fn clear_webview_data() -> Result<(), String> {
    let handler = ConcreteBlock::new(|| {}).copy();
    unsafe {
        let store: Id = msg_send![class!(WKWebsiteDataStore), defaultDataStore];
        let types: Id = msg_send![class!(WKWebsiteDataStore), allWebsiteDataTypes];
        if store.is_null() || types.is_null() {
            return Err("清理缓存失败".to_string());
        }
        let since: Id = msg_send![class!(NSDate), dateWithTimeIntervalSince1970: 0f64];
        let _: () = msg_send![store, removeDataOfTypes: types modifiedSince: since completionHandler: &*handler];
    }
    Ok(())
}
