import os
import threading
import json
import time
import traceback
from datetime import datetime
from flask import Flask, render_template, request, jsonify
import yt_dlp
from tkinter import Tk, filedialog

try:
    import webview
    HAVE_WEBVIEW = True
except Exception:
    HAVE_WEBVIEW = False

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DOWNLOADS_DIR = os.path.join(BASE_DIR, "downloads")
HISTORY_FILE = os.path.join(DOWNLOADS_DIR, "history.json")
os.makedirs(DOWNLOADS_DIR, exist_ok=True)
if not os.path.exists(HISTORY_FILE):
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump([], f)

progress_info = {"percent": 0.0, "status": "idle", "title": "", "error": ""}
from threading import Lock
_progress_lock = Lock()

app = Flask(__name__, static_folder="web/static", template_folder="web/templates")

def save_history_entry(entry):
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        data = []
    data.insert(0, entry)
    data = data[:50]
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def safe_set_progress(**kwargs):
    with _progress_lock:
        for k, v in kwargs.items():
            progress_info[k] = v

def safe_get_progress():
    with _progress_lock:
        return dict(progress_info)

def make_progress_hook():
    def hook(d):
        status = d.get("status")
        if status == "downloading":
            percent_str = d.get("_percent_str", "0").replace("%", "").strip()
            try:
                percent = float(percent_str)
            except:
                percent = 0.0
            filename = d.get("info_dict", {}).get("title") or d.get("filename") or ""
            safe_set_progress(percent=percent, status="downloading", title=filename)
        elif status == "finished":
            safe_set_progress(percent=100.0, status="finished")
    return hook

def fetch_info(url):
    try:
        with yt_dlp.YoutubeDL({"quiet": True, "nocheckcertificate": True}) as ydl:
            info = ydl.extract_info(url, download=False)
            return info
    except Exception as e:
        return {"error": str(e)}

def download_worker(url, format_id, convert_to_mp3, out_folder):
    safe_set_progress(percent=0.0, status="starting", title="")
    try:
        info = fetch_info(url)
        title = info.get("title", "") if isinstance(info, dict) else ""
        safe_set_progress(status="preparing", title=title or url)

        if convert_to_mp3:
            ydl_format = "bestaudio/best"
            postprocessors = [{"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": "192"}]
        else:
            if format_id and format_id.lower() not in ("auto", "best", ""):
                ydl_format = f"{format_id}+bestaudio/best"
            else:
                ydl_format = "bestvideo+bestaudio/best"
            postprocessors = []

        outtmpl = os.path.join(out_folder, "%(title)s.%(ext)s")
        ydl_opts = {
            "format": ydl_format,
            "outtmpl": outtmpl,
            "progress_hooks": [make_progress_hook()],
            "merge_output_format": "mp4",
            "quiet": True,
            "nocheckcertificate": True,
            "postprocessor_args": ["-c:v", "libx264", "-c:a", "aac", "-shortest"],
            "postprocessors": postprocessors
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info_result = ydl.extract_info(url, download=True)
            except Exception as e:
                if "Requested format is not available" in str(e):
                    safe_set_progress(status="fallback", title="Falling back to best")
                    ydl_opts["format"] = "bestvideo+bestaudio/best"
                    with yt_dlp.YoutubeDL(ydl_opts) as ydl2:
                        info_result = ydl2.extract_info(url, download=True)
                else:
                    raise

        filename = ydl.prepare_filename(info_result) if isinstance(info_result, dict) else ""
        entry = {
            "title": info_result.get("title", "Unknown") if isinstance(info_result, dict) else str(url),
            "url": url,
            "file": filename,
            "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        save_history_entry(entry)
        safe_set_progress(percent=100.0, status="completed", title=entry["title"])
    except Exception as e:
        safe_set_progress(status=f"error: {str(e)}", error=traceback.format_exc())

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/formats", methods=["POST"])
def formats_route():
    url = request.form.get("url", "").strip()
    if not url:
        return jsonify({"error": "no url"}), 400
    try:
        with yt_dlp.YoutubeDL({"quiet": True, "nocheckcertificate": True}) as ydl:
            info = ydl.extract_info(url, download=False)
        formats = []
        for f in info.get("formats", []):
            formats.append({
                "format_id": f.get("format_id"),
                "ext": f.get("ext"),
                "height": f.get("height"),
                "vcodec": f.get("vcodec"),
                "acodec": f.get("acodec"),
                "note": f.get("format_note"),
                "filesize": f.get("filesize") or f.get("filesize_approx")
            })
        return jsonify({"formats": formats})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/download", methods=["POST"])
def download_route():
    data = request.get_json(force=True)
    url = data.get("url", "").strip()
    format_id = data.get("format_id", "auto")
    convert_to_mp3 = bool(data.get("mp3"))
    out_folder = data.get("folder") or DOWNLOADS_DIR
    if not url:
        return jsonify({"error": "missing url"}), 400
    os.makedirs(out_folder, exist_ok=True)
    t = threading.Thread(target=download_worker, args=(url, format_id, convert_to_mp3, out_folder), daemon=True)
    t.start()
    return jsonify({"status": "started"})

@app.route("/progress")
def progress_route():
    return jsonify(progress_info)

@app.route("/history")
def history_route():
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        data = []
    return jsonify(data)

@app.route("/choose_folder")
def choose_folder_route():
    try:
        root = Tk()
        root.withdraw()
        folder = filedialog.askdirectory(title="Select download folder")
        root.destroy()
        return jsonify({"path": folder}) if folder else jsonify({"path": None})
    except Exception as e:
        return jsonify({"path": None, "error": str(e)}), 500

def start_server():
    app.run(host="127.0.0.1", port=5000, debug=False, threaded=True)

def start_gui(with_webview=True):
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(0.5)
    url = "http://127.0.0.1:5000/"
    if HAVE_WEBVIEW and with_webview:
        webview.create_window("Subhra Downloader Pro", url, width=1000, height=780, resizable=True)
        webview.start()
    else:
        import webbrowser
        webbrowser.open(url)

if __name__ == "__main__":
    start_gui(with_webview=True)
