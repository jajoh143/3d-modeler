use std::fs;
use std::path::PathBuf;

#[tauri::command]
fn save_project_file(path: String, contents: String) -> Result<(), String> {
    let p = PathBuf::from(&path);
    if let Some(parent) = p.parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent).map_err(|e| format!("create_dir_all: {e}"))?;
        }
    }
    fs::write(&p, contents).map_err(|e| format!("write {path}: {e}"))
}

#[tauri::command]
fn load_project_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("read {path}: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![save_project_file, load_project_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
