"""
YouTube to MP3 Converter Backend
---------------------------------
A Flask application that handles:
1. Receive YouTube URLs from the frontend
2. Download and converting videos to MP3 using yt-dlp
3. Apply audio trimming with pydub
4. Add metadata with mutagen
5. Serve the converted files to the frontend for download

Key Features:
- Temporary file management with automatic cleanup
- Audio trimming with start/end time parameters
- ID3 metadata tagging (title, artist, album, genre)
- CORS support for frontend communication
- Error handling and console logging

Dependencies:
- Flask, flask-cors, yt-dlp, pydub, mutagen
"""
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import yt_dlp
import os
import atexit
import shutil
import uuid
import logging
from pydub import AudioSegment
from mutagen.id3 import ID3, TIT2, TPE1, TPE2,TALB, TCON
from werkzeug.middleware.proxy_fix import ProxyFix

PORT = int(os.environ.get("PORT", 10000))

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)
CORS(app, origins=["https://tiago-mp3converter.onrender.com/", "http://localhost:3000"], expose_headers=['X-Video-Title'])

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create temp folder
DOWNLOAD_FOLDER = "temp_download"
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

# Cleanup function to remove the entire temp directory on exit
def cleanup_temp_dir():
    try:
        # Clean the folder temp_download, but leave the folder as existing
        shutil.rmtree(DOWNLOAD_FOLDER)
        os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)
        print(f"Successfully cleaned up temp directory: {DOWNLOAD_FOLDER}")
    except Exception as e:
        print(f"Error cleaning temp directory: {e}")

# Register the cleanup function
atexit.register(cleanup_temp_dir)

@app.route("/api/convert", methods=["POST", "OPTIONS"])
def convert():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    output_path = None
    temp_file = None
    
    try:
        data = request.get_json()
        youtube_url = data.get("url")
        
        if not youtube_url:
            return jsonify({"error": "Missing YouTube URL"}), 400

        logger.info(f"Processing: {youtube_url}")

        # Generate unique filename
        file_id = uuid.uuid4()
        output_path = os.path.join(DOWNLOAD_FOLDER, f"{file_id}.mp3")

        # Download and convert options
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': output_path.replace('.mp3', '.%(ext)s'),
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'quiet': True,
        }

        # First, download without trimming to get the full audio
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=True)
            title = info.get('title', 'audio')

        # Load the downloaded audio
        audio = AudioSegment.from_file(output_path)
        duration_ms = len(audio)

        # Apply trimming if specified using pydub
        start_time = data.get("start")
        end_time = data.get("end")
        
        if (start_time is not None and start_time > 0) or end_time is not None:
            logger.info(f"Trimming audio from {start_time}s to {end_time}s")
            
            # Convert seconds to milliseconds
            start_ms = int(float(start_time) * 1000) if start_time is not None else 0
            end_ms = int(float(end_time) * 1000) if end_time is not None else duration_ms
            
            # Ensure start and end are within valid range
            start_ms = max(0, min(start_ms, duration_ms))
            end_ms = max(start_ms, min(end_ms, duration_ms))
            
            # Create a temporary file for the trimmed audio
            temp_id = uuid.uuid4()
            temp_file = os.path.join(DOWNLOAD_FOLDER, f"{temp_id}_trimmed.mp3")
            
            # Extract the segment and export
            trimmed_audio = audio[start_ms:end_ms]
            trimmed_audio.export(temp_file, format="mp3", bitrate="192k")
            
            # Use the trimmed file for sending
            output_path = temp_file

        # Add metadata to the file if provided
        add_metadata_to_mp3(output_path, data)
        
        # Send file
        response = send_file(
            output_path,
            as_attachment=True,
            download_name=f"{data.get('title', title[:50])}.mp3",
            mimetype="audio/mpeg"
        )

        # Add the original video title to headers
        response.headers['X-Video-Title'] = title

        # Clean temp_download after response
        cleanup_temp_dir()
        
        return response
    
    except Exception as e:
        logger.error(f"Conversion failed: {str(e)}")
        cleanup()
        return jsonify({"error": f"Conversion failed: {str(e)}"}), 500

def add_metadata_to_mp3(file_path, data):
    """
    Add metadata to MP3 file using mutagen.
    
    Args:
        file_path (str): Path to the MP3 file
        data (dict): Dictionary containing metadata fields
    """
    
    try:
        # Extract metadata fields from request data
        title = data.get("title")
        artist = data.get("artist")
        album = data.get("album")
        genre = data.get("genre")
        
        # Skip if no metadata provided
        if not any([title, artist, album, genre]):
            logger.info("No metada data provided")
            logger.info(data.get('title'))
            return
        
        logger.info(f"Adding metadata to {file_path}")
        
        # Try to load existing ID3 tags or create new ones
        try:
            tags = ID3(file_path)
        except:
            # If the file doesn't have an ID3 tag, create one
            tags = ID3()
        
        # Add metadata if provided
        if title:
            tags["TIT2"] = TIT2(encoding=3, text=title)
        if artist:
            tags["TPE1"] = TPE1(encoding=3, text=artist)
            tags["TPE2"] = TPE2(encoding=3, text=artist)
        if album:
            tags["TALB"] = TALB(encoding=3, text=album)
        if genre:
            tags["TCON"] = TCON(encoding=3, text=genre)
        
        # Save the tags to the file
        tags.save(file_path)
        logger.info("Metadata added successfully")
        
    except Exception as e:
        logger.error(f"Failed to add metadata: {str(e)}")
        # Continue without metadata if it fails

if __name__ == "__main__":
    app.run(host="0.0.0.0",port=PORT)