/**
 * YouTube to MP3 Converter Frontend
 * ---------------------------------
 * A React application that allows users to:
 * 1. Enter YouTube URLs
 * 2. Preview and trim audio
 * 3. Add metadata
 * 4. Download as MP3
 * 
 * Dependencies:
 * - React, react-range, lucide-react
 */

import React, { useState, useRef, useEffect } from "react";
import { Range } from "react-range";
import { Play, Pause, Download, Music } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Convert seconds to MM:SS format
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Parse MM:SS format to seconds
const parseTimeInput = (timeStr) => {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return 0;
  
  const mins = parseInt(parts[0], 10);
  const secs = parseInt(parts[1], 10);
  
  if (isNaN(mins) || isNaN(secs)) return 0;
  return (mins * 60) + secs;
};

// Error display component
const ErrorMessage = ({ message, onDismiss }) => (
  <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex justify-between">
    <span>{message}</span>
    <button onClick={onDismiss} className="text-red-700 font-bold">×</button>
  </div>
);

// Success message component
const SuccessMessage = ({ message }) => (
  <p className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
    {message}
  </p>
);

// Time input component
const TimeInput = ({ value, onChange, max, label }) => {
  const [inputValue, setInputValue] = useState(formatTime(value));
  
  // Update input value when prop changes
  useEffect(() => {
    setInputValue(formatTime(value));
  }, [value]);
  
  const handleBlur = () => {
    const seconds = parseTimeInput(inputValue);
    // Ensure the value is within bounds
    const validSeconds = Math.min(Math.max(0, seconds), max);
    onChange(validSeconds);
    // Format the value to ensure consistent display
    setInputValue(formatTime(validSeconds));
  };
  
  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="text-xs text-gray-600">
      <span className="mr-1">{label}:</span>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className="w-16 text-center border border-gray-300 rounded py-1 px-2"
        placeholder="MM:SS"
        pattern="[0-9]{2}:[0-9]{2}"
      />
    </div>
  );
};

export default function App() {
  // Form data state
  const [formData, setFormData] = useState({
    url: "",
    title: "",
    artist: "",
    album: "",
    genre: "",
    start: 0,
    end: 0,
  });

  // Application state
  const [status, setStatus] = useState("");
  const [isConverted, setIsConverted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [rangeValues, setRangeValues] = useState([0, 1000]);
  const [audioDuration, setAudioDuration] = useState(1000);
  const [audioUrl, setAudioUrl] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [videoTitle, setVideoTitle] = useState("");

  // Refs
  const audioRef = useRef(null);

  /**
   * Handle form input changes
   * @param {Object} e - The event object
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Handle the conversion process
   */
  const handleConvert = async () => {
    setStatus("Converting...");
    setError(null);
    setIsConverted(false);

    // Properly reset all audio-related states
    setAudioUrl("");
    setCurrentTime(0);
    setRangeValues([0, 1000]);
    setAudioDuration(1000);
    setVideoTitle("");
    
    // Reset audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
    }
    setIsPlaying(false);

    // Validate URL
    if (!formData.url || !formData.url.match(/youtube\.com|youtu\.be/)) {
      setError("Please enter a valid YouTube URL");
      setStatus("");
      return;
    }

    try {
      console.log("Starting conversion process...");
      
      const response = await fetch("${API_BASE}/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: formData.url,
          title: formData.title || undefined,
          artist: formData.artist || undefined,
          album: formData.album || undefined,
          genre: formData.genre || undefined,
          start: formData.start || 0,
          end: formData.end || undefined,
        }),
      });

      console.log("Received response:", response);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend error:", errorData);
        throw new Error(errorData.error || "Conversion failed");
      }

      // Get the title from the custom header
      const ytTitle = response.headers.get("X-Video-Title");
      setVideoTitle(ytTitle || " ");

      // Create audio preview
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      
      setIsConverted(true);
      setStatus("Conversion complete!");
      console.log("Conversion successful");

    } catch (err) {
      console.error("Conversion error:", err);
      setError(err.message);
      setStatus("Failed to convert");
    }
  };

  /**
   * Handle download of the converted MP3
   */
  const handleDownload = async () => {
    if (!audioUrl) return;
    
    setStatus("Preparing download...");
    
    try {
      // Reconvert with the new values (if added metadata added or trimmed the mp3 during preview)
      const response = await fetch("${API_BASE}/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: formData.url,
          title: formData.title || undefined,
          artist: formData.artist || undefined,
          album: formData.album || undefined,
          genre: formData.genre || undefined,
          start: rangeValues[0],
          end: rangeValues[1],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Download preparation failed");
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${formData.title || "download"}.mp3`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      // Clean up the temporary URL
      URL.revokeObjectURL(downloadUrl);
      setStatus("Download complete!");

    } catch (err) {
      console.error("Download error:", err);
      setError(err.message);
      setStatus("Failed to download");
    }
  };

  /**
   * Toggle audio playback
   */
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Set the current time to the selected start point before playing
      audioRef.current.currentTime = rangeValues[0];
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Update start time from manual input
  const handleStartTimeChange = (seconds) => {
    // Ensure start time is less than end time
    const newStart = Math.min(seconds, rangeValues[1] - 1);
    setRangeValues([newStart, rangeValues[1]]);
    
    // If playing, update current playback position
    if (audioRef.current && isPlaying) {
      audioRef.current.currentTime = newStart;
    }
  };

  // Update end time from manual input
  const handleEndTimeChange = (seconds) => {
    // Ensure end time is greater than start time
    const newEnd = Math.max(seconds, rangeValues[0] + 1);
    setRangeValues([rangeValues[0], Math.min(newEnd, audioDuration)]);
  };

  // Update time display during playback
  useEffect(() => {
    const updateTime = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        
        // Stop playback if we reach the end range
        if (audioRef.current.currentTime >= rangeValues[1]) {
          audioRef.current.pause();
          setIsPlaying(false);
          audioRef.current.currentTime = rangeValues[0];
        }
      }
    };

    // Always update the current time, whether playing or not
    const timeInterval = setInterval(updateTime, 100);
    return () => clearInterval(timeInterval);
  }, [rangeValues]);

  // Load audio metadata and update duration when audio element is ready
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      // Create a function to handle metadata loading
      const handleMetadata = () => {
        const duration = audioRef.current.duration;
        if (duration && !isNaN(duration)) {
          const roundedDuration = Math.floor(duration);
          console.log("Audio duration loaded:", roundedDuration);
          setAudioDuration(roundedDuration);
          // Explicitly set range to full duration
          setRangeValues([0, roundedDuration]);
        } else {
          // Handle case where duration couldn't be loaded
          console.warn("Could not load audio duration");
        }
      };

      // Add event listener for metadata loading
      audioRef.current.addEventListener('loadedmetadata', handleMetadata);
      
      // If metadata is already loaded, call the handler immediately
      if (audioRef.current.readyState >= 1) {
        handleMetadata();
      }

      // Clean up event listener
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('loadedmetadata', handleMetadata);
        }
      };
    }
  }, [audioUrl]);
  
  // Clean up audio URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-4">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-6">
        {/* Header */}
        <h1 className="text-xl font-bold mb-4 flex items-center">
          <Music className="mr-2" /> YouTube to MP3 Converter
        </h1>

        {/* URL Input Section */}
        <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
          <input
            type="url"
            name="url"
            placeholder="Enter YouTube URL (e.g., https://youtube.com/watch?v=...)"
            value={formData.url}
            onChange={handleChange}
            className="flex-1 p-3 border border-gray-300 rounded-lg w-full"
            required
          />
          <button
            onClick={handleConvert}
            disabled={!formData.url}
            className={`px-4 py-2 rounded-lg ${formData.url ? 
              "bg-indigo-600 text-white hover:bg-indigo-700" : 
              "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
          >
            Convert
          </button>
        </div>
        {/* Show video title after conversion */}
        {isConverted && videoTitle && (
          <p className="mb-4 text-sm text-gray-600">
            Video Title: <span className="font-medium">{videoTitle}</span>
          </p>
        )}
        {/* Conversion Results Section */}
        {isConverted && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Audio Preview</h2>
              
              {/* Trim Controls */}
              <div className="px-2 py-4">
                {/* Audio position track for clicking to seek */}
                <div 
                  className="h-8 relative cursor-pointer mb-2" 
                  onClick={(e) => {
                    // Get the click position as a percentage of the track width
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickPos = (e.clientX - rect.left) / rect.width;
                    
                    // Convert to seconds
                    const clickTime = Math.floor(clickPos * audioDuration);
                    
                    // Set the playback position
                    if (audioRef.current) {
                      audioRef.current.currentTime = clickTime;
                      setCurrentTime(clickTime);
                      
                      // If not already playing, start playback
                      if (!isPlaying) {
                        audioRef.current.play();
                        setIsPlaying(true);
                      }
                    }
                  }}
                >
                  {/* Background track */}
                  <div className="absolute top-3 h-2 w-full bg-gray-300 rounded"></div>
                  
                  {/* Selected range overlay */}
                  <div
                    className="absolute top-3 h-2 bg-blue-500 rounded"
                    style={{
                      left: `${(rangeValues[0] / audioDuration) * 100}%`,
                      width: `${((rangeValues[1] - rangeValues[0]) / audioDuration) * 100}%`,
                    }}
                  />
                  
                  {/* Current playback position */}
                  <div 
                    className="absolute h-8 flex items-center"
                    style={{
                      left: `${(currentTime / audioDuration) * 100}%`,
                    }}
                  >
                    <div className="w-1 h-6 bg-red-500 rounded-full"></div>
                  </div>
                  
                  {/* Tooltip showing hover position (optional) */}
                  <div className="w-full h-full opacity-0"></div>
                </div>
                
                {/* Range slider for trim controls */}
                <Range
                  step={1}
                  min={0}
                  max={Math.floor(audioDuration)}
                  values={rangeValues}
                  onChange={setRangeValues}
                  renderTrack={({ props, children }) => (
                    <div
                      {...props}
                      className="h-2 bg-gray-300 rounded relative"
                    >
                      <div
                        className="absolute bg-blue-500 h-2 rounded"
                        style={{
                          left: `${(rangeValues[0] / audioDuration) * 100}%`,
                          width: `${((rangeValues[1] - rangeValues[0]) / audioDuration) * 100}%`,
                        }}
                      />
                      {children}
                    </div>
                  )}
                  renderThumb={({ props }) => (
                    <div
                      {...props}
                      className="w-4 h-4 bg-blue-600 rounded-full shadow-md"
                    />
                  )}
                />
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  {/* Replaced static labels with time input components */}
                  <TimeInput
                    value={rangeValues[0]}
                    onChange={handleStartTimeChange}
                    max={audioDuration - 1}
                    label="Start"
                  />
                  <TimeInput
                    value={rangeValues[1]}
                    onChange={handleEndTimeChange}
                    max={audioDuration}
                    label="End"
                  />
                  <div className="text-xs text-gray-600">
                    <span>Duration: {formatTime(audioDuration)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={togglePlay}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="mr-2" /> Pause Preview
                      </>
                    ) : (
                      <>
                        <Play className="mr-2" /> Play Preview
                      </>
                    )}
                  </button>
                  
                  {/* Current time display with trimming changes */}
                  <div className="ml-3 px-3 py-2 bg-gray-100 rounded-lg">
                    <span className="text-sm font-medium">
                      {formatTime(currentTime)} / {formatTime((rangeValues[1]))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hidden audio element for preview */}
              <audio
                key={audioUrl} // This forces React to recreate the element when URL changes
                ref={audioRef}
                src={audioUrl}
                onLoadedMetadata={() => {
                  if (audioRef.current) {
                    const duration = audioRef.current.duration || 1000;
                    setAudioDuration(duration);
                    setRangeValues([0, Math.floor(duration)]);
                  }
                }}
                onEnded={() => setIsPlaying(false)}
                onTimeUpdate={() => {
                  if (audioRef.current && audioRef.current.currentTime >= rangeValues[1]) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                    // Reset to start position
                    audioRef.current.currentTime = rangeValues[0];
                  }
                }}
                className="hidden"
              />
            </div>

            {/* Metadata Section */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Metadata</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="title"
                  placeholder="Track Title"
                  value={formData.title}
                  onChange={handleChange}
                  className="p-3 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  name="artist"
                  placeholder="Artist"
                  value={formData.artist}
                  onChange={handleChange}
                  className="p-3 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  name="album"
                  placeholder="Album"
                  value={formData.album}
                  onChange={handleChange}
                  className="p-3 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  name="genre"
                  placeholder="Genre"
                  value={formData.genre}
                  onChange={handleChange}
                  className="p-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
            >
              <Download className="mr-2" /> Download MP3
            </button>
          </>
        )}

        {/* Status Messages */}
        {error && (
          <ErrorMessage 
            message={error} 
            onDismiss={() => setError(null)} 
          />
        )}
        {status && !error && (
          <SuccessMessage message={status} />
        )}
      </div>
    </div>
  );
}