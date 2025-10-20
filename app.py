from flask import Flask, render_template, request, send_file
import yt_dlp
import os
import tempfile

app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        video_url = request.form.get("url")
        if not video_url:
            return render_template("index.html", error="Please enter a URL!")

        # Create temporary file for download
        temp_dir = tempfile.gettempdir()
        ydl_opts = {
            'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(video_url, download=True)
                filename = ydl.prepare_filename(info)

            # Return the file to browser to trigger download
            return send_file(filename, as_attachment=True)

        except Exception as e:
            return render_template("index.html", error=f"Error: {str(e)}")

    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True)
