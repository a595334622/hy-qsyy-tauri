use sha2::{Digest, Sha256};
use std::process::Command;

/// 本机机器码。同一台电脑保持不变，拷到别的电脑会变。
pub fn machine_code() -> Result<String, String> {
    let raw = raw_id()?;
    let mut hasher = Sha256::new();
    hasher.update(b"qsyy-machine-v1");
    hasher.update(raw.trim().as_bytes());
    let digest = hasher.finalize();
    let hex = hex::encode(&digest[..8]).to_uppercase();
    Ok(format!(
        "{}-{}-{}-{}",
        &hex[0..4],
        &hex[4..8],
        &hex[8..12],
        &hex[12..16]
    ))
}

fn raw_id() -> Result<String, String> {
    let id = read_platform_id()?;
    let trimmed = id.trim();
    if trimmed.is_empty() || is_placeholder(trimmed) {
        return Err("读不到这台电脑的机器号".to_string());
    }
    Ok(trimmed.to_string())
}

fn is_placeholder(value: &str) -> bool {
    let upper = value.to_uppercase();
    upper.contains("TO BE FILLED")
        || upper.contains("DEFAULT STRING")
        || upper.contains("SYSTEM SERIAL NUMBER")
        || upper == "NONE"
        || upper == "UNKNOWN"
}

#[cfg(target_os = "macos")]
fn read_platform_id() -> Result<String, String> {
    let output = Command::new("ioreg")
        .args(["-rd1", "-c", "IOPlatformExpertDevice"])
        .output()
        .map_err(|e| format!("读取机器号失败: {e}"))?;
    let text = String::from_utf8_lossy(&output.stdout);
    for line in text.lines() {
        if let Some(value) = line.split("IOPlatformUUID").nth(1) {
            if let Some(start) = value.find('"') {
                let rest = &value[start + 1..];
                if let Some(end) = rest.find('"') {
                    return Ok(rest[..end].to_string());
                }
            }
        }
    }
    Err("读不到这台电脑的机器号".to_string())
}

#[cfg(target_os = "linux")]
fn read_platform_id() -> Result<String, String> {
    std::fs::read_to_string("/etc/machine-id").map_err(|e| format!("读取机器号失败: {e}"))
}

#[cfg(target_os = "windows")]
fn read_platform_id() -> Result<String, String> {
    use std::os::windows::process::CommandExt;
    let output = Command::new("reg")
        .args([
            "query",
            r"HKLM\SOFTWARE\Microsoft\Cryptography",
            "/v",
            "MachineGuid",
        ])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| format!("读取机器号失败: {e}"))?;
    let text = String::from_utf8_lossy(&output.stdout);
    for line in text.lines() {
        if let Some(value) = line.split("REG_SZ").nth(1) {
            return Ok(value.trim().to_string());
        }
    }
    Err("读不到这台电脑的机器号".to_string())
}

#[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
fn read_platform_id() -> Result<String, String> {
    Err("这个系统暂不支持机器码".to_string())
}
