#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod machine;
#[cfg(target_os = "macos")]
mod macos_cache;
#[cfg(target_os = "macos")]
mod macos_fullscreen;

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::Duration;
use tauri::{AppHandle, Manager};

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            auth_code,
            client_secret,
            save_client_secret,
            clear_browser_cache,
            quit_app
        ])
        .setup(|app| {
            // macOS 在窗口显示前进入全屏会被系统丢掉，所以等窗口出来再进
            if let Some(window) = app.get_window("main") {
                let _ = window.set_fullscreen(true);
                let retry = window.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(Duration::from_millis(700));
                    #[cfg(target_os = "macos")]
                    macos_fullscreen::enter_if_needed(&retry);
                    #[cfg(not(target_os = "macos"))]
                    let _ = retry.set_fullscreen(true);
                });
            }
            #[cfg(target_os = "macos")]
            macos_fullscreen::install(app.handle());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// 本机唯一编码。学生端用它去查授权。
#[tauri::command]
fn auth_code() -> Result<String, String> {
    machine::machine_code()
}

/// 本机已经保存的秘钥。还没激活时是空字符串。
#[tauri::command]
fn client_secret(app: AppHandle) -> String {
    read_setting(&app).secret
}

/// 清掉网页缓存。本机保存的秘钥不动。
#[tauri::command]
fn clear_browser_cache() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    macos_cache::clear_webview_data()?;
    Ok(())
}

/// 关闭客户端。
#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

/// 秘钥验证通过后写入本机配置。
#[tauri::command]
fn save_client_secret(app: AppHandle, secret: String) -> Result<(), String> {
    let secret = secret.trim().to_string();
    if secret.is_empty() {
        return Err("请输入秘钥".to_string());
    }
    write_setting(&app, &secret)
}

#[derive(Serialize, Deserialize)]
struct Setting {
    #[serde(rename = "Secret", default)]
    secret: String,
}

fn read_setting(app: &AppHandle) -> Setting {
    let Ok(path) = setting_path(app) else {
        return empty_setting();
    };
    let Ok(text) = fs::read_to_string(path) else {
        return empty_setting();
    };
    serde_json::from_str(&text).unwrap_or_else(|_| empty_setting())
}

fn write_setting(app: &AppHandle, secret: &str) -> Result<(), String> {
    let path = setting_path(app)?;
    let setting = Setting {
        secret: secret.to_string(),
    };
    let text = serde_json::to_string_pretty(&setting).map_err(|e| format!("保存配置失败: {e}"))?;
    fs::write(path, text).map_err(|e| format!("保存配置失败: {e}"))
}

fn empty_setting() -> Setting {
    Setting {
        secret: String::new(),
    }
}

fn setting_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path_resolver()
        .app_data_dir()
        .ok_or("读不到本机数据目录")?;
    fs::create_dir_all(&dir).map_err(|e| format!("创建数据目录失败: {e}"))?;
    Ok(dir.join("setting.json"))
}
