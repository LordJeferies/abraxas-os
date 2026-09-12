use tauri::{
    Manager,
    WebviewUrl,
    WebviewWindowBuilder,
};

#[tauri::command]
pub async fn open_floating_editor_window(
    app: tauri::AppHandle,
    kind: String,
) -> Result<(), String> {
    let (label, title, width, height) = match kind.as_str() {
        "timeline" => (
            "floating-timeline",
            "Abraxas · Timeline",
            1120.0,
            360.0,
        ),
        "ghost" => (
            "floating-ghost",
            "Abraxas · Ghost Info",
            430.0,
            760.0,
        ),
        _ => {
            return Err(format!(
                "Unsupported floating editor kind: {kind}"
            ));
        }
    };

    if let Some(window) = app.get_webview_window(label) {
        window
            .set_always_on_top(true)
            .map_err(|error| error.to_string())?;
        window
            .show()
            .map_err(|error| error.to_string())?;
        window
            .set_focus()
            .map_err(|error| error.to_string())?;
        return Ok(());
    }

    WebviewWindowBuilder::new(
        &app,
        label,
        WebviewUrl::App("index.html".into()),
    )
    .title(title)
    .inner_size(width, height)
    .min_inner_size(320.0, 220.0)
    .resizable(true)
    .decorations(true)
    .always_on_top(true)
    .visible_on_all_workspaces(true)
    .build()
    .map_err(|error| error.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn close_floating_editor_window(
    app: tauri::AppHandle,
    kind: String,
) -> Result<(), String> {
    let label = match kind.as_str() {
        "timeline" => "floating-timeline",
        "ghost" => "floating-ghost",
        _ => return Ok(()),
    };

    if let Some(window) = app.get_webview_window(label) {
        window
            .close()
            .map_err(|error| error.to_string())?;
    }

    Ok(())
}
