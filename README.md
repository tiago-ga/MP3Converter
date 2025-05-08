# MP3 Converter

![MP3 Converter](https://github.com/user-attachments/assets/fd2c5c9f-28d2-4a44-a2c1-5241154015dd)
[Video version (same DEMO)](https://github.com/user-attachments/assets/c7d7e8b4-cfcc-471d-8e83-a2ee921e9680)

A lightweight, feature-rich web application that lets you convert YouTube videos to MP3 format with advanced trimming and metadata capabilities. Perfect for creating audio snippets, podcast excerpts, or saving your favorite music tracks for offline listening.

## 🌟 Features

- **YouTube Video Conversion**: Convert any YouTube video to high-quality MP3 (192kbps)
- **Real-time Audio Preview**: Play and verify audio before downloading
- **Advanced Audio Trimming**: Precisely select start and end points with interactive slider or manual time input
- **Metadata Editing**: Add custom title, artist, album, and genre information to your MP3 files
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Clean User Interface**: Intuitive controls with status feedback and error handling

## 📋 Requirements

### Backend
- Python 3.11
- Flask 3.1.0+
- yt-dlp 2025.4.30+
- PyDub 0.25.1+
- Mutagen 1.47.0+
- Additional dependencies in `backend/requirements.txt`

### Frontend
- Node.js 16.0+
- npm or yarn
- React 19.0.0+
- Vite 6.3.1+
- Additional dependencies in `frontend/package.json`

## 🚀 Setup & Installation

### Prerequisites

Before starting, ensure you have the following installed:

- **Python 3.11+**: [Download Python](https://www.python.org/downloads/release/python-3110/)
- **Node.js 16.0+**: [Download Node.js](https://nodejs.org/)
- **FFmpeg**: Required for audio processing
  - **Windows**: 
    ```bash
    # Using Chocolatey
    choco install ffmpeg
    
    # Or directly download from https://ffmpeg.org/download.html
    ```
  - **macOS**:
    ```bash
    brew install ffmpeg
    ```
  - **Linux**:
    ```bash
    sudo apt update
    sudo apt install ffmpeg
    ```

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/tiago-ga/MP3Converter.git
   cd MP3Converter
   ```

2. Create and activate a virtual environment in the backend:
   ```bash
   # Enter backend directory
   cd backend

   # Create virtual environment
   py -3.11 -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   
   If you encounter any issues with specific packages:
   ```bash
   # Install core dependencies separately
   pip install Flask==3.1.0 flask-cors==5.0.1
   pip install yt-dlp==2025.4.30
   pip install pydub==0.25.1 mutagen==1.47.0
   pip install Werkzeug==3.1.3 gunicorn==23.0.0
   ```

4. Run the Flask server:
   ```bash
   # On Windows
   py app.py
   
   # On macOS/Linux
   python3 app.py
   ```
   The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory (ideally on a new terminal):
   ```bash
   cd ../frontend  # If coming from backend directory
   # OR
   cd frontend     # If in project root
   ```

2. Install Node.js dependencies:
   ```bash
   # Using npm
   npm install
   
   # OR using yarn
   yarn install
   ```

3. Start the development server:
   ```bash
   # Using npm
   npm run dev
   
   # OR using yarn
   yarn dev
   ```
   The frontend will run on `http://localhost:5173`

4. For production build:
   ```bash
   # Using npm
   npm run build
   
   # OR using yarn
   yarn build
   ```
   
   The build files will be generated in a `dist` directory.

### Verifying Installation

1. Backend verification:
   - Open `http://localhost:5000` in your browser
   - You should see a message or at least no error (as the API doesn't serve a frontend directly)

2. Frontend verification:
   - Open `http://localhost:5173` in your browser
   - You should see the YouTube to MP3 Converter interface

## 📁 Project Structure

```
youtube-mp3-converter/
├── .gitignore
├── DemoMP3Converter.webm
├── README.md
├── backend/
│   ├── app.py           # Flask application with YouTube to MP3 conversion logic
│   └── requirements.txt # Python dependencies
└── frontend/
    ├── index.html       # Main HTML template
    ├── package.json     # JavaScript dependencies
    ├── public/          # Static assets like icons
    ├── src/
    │   ├── App.jsx      # Main React component with conversion interface
    │   ├── index.css    # Global CSS styles
    │   └── main.jsx     # React entry point
    ├── vite.config.js   # Vite configuration
    └── .env.development # Environment variables for development
```

## 🔍 How It Works

1. Enter a valid YouTube URL in the input field (not from playlists, individual video)
2. Click "Convert" and wait for the video to be processed
3. Preview the audio with the built-in player
4. Trim the audio using the interactive slider or time inputs
5. Add custom metadata (title, artist, album, genre)
6. Click "Download MP3" to save the converted file to your device

## ⚠️ Disclaimer

This application is provided for **educational purposes only**. Please respect copyright laws and YouTube's Terms of Service when using this tool. 

Some key points to consider:
- Only download content for which you have the necessary rights or permissions
- Do not distribute copyrighted material without authorization
- YouTube's Terms of Service prohibit downloading content without explicit permission
- This tool should not be used for commercial purposes
- The creators of this application are not responsible for any misuse or legal issues that may arise

## 📝 License

[MIT License]()
