use serde_json::Value;
use std::{
    path::{Path, PathBuf},
    process::Command,
};

fn project_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..")
}

fn runtime_script() -> PathBuf {
    project_root().join("scripts/abraxas_source_runtime.py")
}

fn python_executable() -> Result<PathBuf, String> {
    let candidates = [
        "/opt/homebrew/bin/python3",
        "/usr/local/bin/python3",
        "/usr/bin/python3",
    ];

    for candidate in candidates {
        let path = Path::new(candidate);
        if path.is_file() {
            return Ok(path.to_path_buf());
        }
    }

    Err("No se encontró python3 para Fast Source Runtime.".into())
}

fn run_runtime_sync(args: Vec<String>) -> Result<Value, String> {
    let python = python_executable()?;
    let script = runtime_script();

    if !script.is_file() {
        return Err(format!(
            "Runtime script no existe: {}",
            script.display()
        ));
    }

    let result = Command::new(python)
        .arg(&script)
        .args(&args)
        .current_dir(project_root())
        .output()
        .map_err(|error| format!("Runtime launch error: {error}"))?;

    if !result.status.success() {
        return Err(
            String::from_utf8_lossy(&result.stderr)
                .trim()
                .to_string()
        );
    }

    let stdout = String::from_utf8_lossy(&result.stdout);
    if stdout.trim().is_empty() {
        return Ok(Value::Null);
    }

    serde_json::from_str(stdout.trim()).map_err(|error| {
        format!(
            "Runtime devolvió JSON inválido: {error}\n{}",
            stdout.trim()
        )
    })
}

async fn run_runtime(args: Vec<String>) -> Result<Value, String> {
    tauri::async_runtime::spawn_blocking(move || run_runtime_sync(args))
        .await
        .map_err(|error| format!("Runtime task join error: {error}"))?
}

#[tauri::command]
pub async fn source_runtime_status() -> Result<Value, String> {
    run_runtime(vec!["status".into()]).await
}

#[tauri::command]
pub async fn source_runtime_sources() -> Result<Value, String> {
    run_runtime(vec!["sources".into()]).await
}

#[tauri::command]
pub async fn source_runtime_jobs() -> Result<Value, String> {
    run_runtime(vec!["jobs".into()]).await
}

#[tauri::command]
pub async fn source_runtime_assets() -> Result<Value, String> {
    run_runtime(vec!["assets".into()]).await
}

#[tauri::command]
pub async fn source_runtime_register(
    path: String,
    role: String,
) -> Result<Value, String> {
    let allowed = [
        "horizontal_master",
        "vertical_master",
        "audio_master",
        "other",
    ];

    if !allowed.contains(&role.as_str()) {
        return Err(format!("Invalid source role: {role}"));
    }

    run_runtime(vec![
        "register".into(),
        "--source".into(),
        path,
        "--role".into(),
        role,
    ])
    .await
}

#[tauri::command]
pub async fn source_runtime_index_assets(
    folder: String,
) -> Result<Value, String> {
    run_runtime(vec![
        "index-assets".into(),
        "--folder".into(),
        folder,
    ])
    .await
}

#[tauri::command]
pub async fn source_runtime_enqueue_thumbnail(
    source_id: String,
    at_seconds: f64,
) -> Result<Value, String> {
    if !at_seconds.is_finite() || at_seconds < 0.0 {
        return Err("Invalid thumbnail timestamp.".into());
    }

    run_runtime(vec![
        "enqueue-thumbnail".into(),
        "--source-id".into(),
        source_id,
        "--at".into(),
        at_seconds.to_string(),
    ])
    .await
}

#[tauri::command]
pub async fn source_runtime_enqueue_waveform(
    source_id: String,
) -> Result<Value, String> {
    run_runtime(vec![
        "enqueue-waveform".into(),
        "--source-id".into(),
        source_id,
    ])
    .await
}

#[tauri::command]
pub async fn source_runtime_worker_once() -> Result<Value, String> {
    run_runtime(vec!["worker-once".into()]).await
}

#[tauri::command]
pub async fn source_runtime_drain(
    max_jobs: u32,
) -> Result<Value, String> {
    run_runtime(vec![
        "drain".into(),
        "--max".into(),
        max_jobs.clamp(1, 64).to_string(),
    ])
    .await
}
