import React, { useState, useEffect, useRef } from 'react';

function SpeechApp() {
  const [text, setText] = useState(''); // Text state for input and speech result
  const [isListening, setIsListening] = useState(false); // State to track whether it's listening or not
  const [image, setImage] = useState(null); // State to store captured image
  const recognition = useRef(null); // Use ref to store SpeechRecognition instance
  const videoRef = useRef(null); // Ref for the video element
  const canvasRef = useRef(null); // Ref for the canvas element

  // Set up speech recognition only once (on component mount)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Sorry, your browser does not support speech recognition.');
      return;
    }

    // Initialize recognition instance
    recognition.current = new SpeechRecognition();
    recognition.current.continuous = false; // Stop listening after speech detected
    recognition.current.interimResults = false; // Get final results only (not intermediate)
    recognition.current.lang = 'en-US';

    // Handle successful speech recognition
    recognition.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText(transcript); // Set the recognized text (replacing previous text)
      setIsListening(false); // Stop listening after result
    };

    // Handle errors
    recognition.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false); // Ensure we reset listening state on error
    };

    recognition.current.onend = () => {
      setIsListening(false); // Reset listening state when speech recognition ends
    };

    // Start the camera
    startCamera();

    return () => {
      if (videoRef.current) {
        const stream = videoRef.current.srcObject;
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop()); // Stop the video tracks
        }
      }
    };
  }, []);

  // Function to start the camera
  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (error) {
        console.error('Error accessing the camera:', error);
      }
    }
  };

  // Handle Speech-to-Text toggle
  const toggleListening = () => {
    if (isListening) {
      recognition.current.stop(); // Stop if already listening
    } else {
      setText(''); // Clear text when starting new recognition
      recognition.current.start(); // Start listening
      setIsListening(true);
    }
  };

  // Effect to trigger Text-to-Speech when text updates
  useEffect(() => {
    if (text) {
      const speechSynthesis = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.lang = 'en-US';

      // Speak the text
      speechSynthesis.speak(utterance);
    }
  }, [text]); // Run this effect when the text state changes

  // Capture image from video feed
  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (canvas && video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = canvas.toDataURL('image/png'); // Get image as data URL
      setImage(imageData); // Store the image in state
      alert('Image clicked!'); // Alert the user
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden">
      <div className="flex flex-col items-center justify-between space-y-4 w-full max-w-md">
        <div className="relative w-full h-[240px] mb-4 border border-gray-300 rounded-lg">
          <video ref={videoRef} className="w-full h-full rounded-lg" onClick={captureImage}></video>
          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
          {image && <img src={image} alt="Captured" className="absolute inset-0 w-full h-full object-cover rounded-lg" />}
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={toggleListening}
            className={`h-[220px] min-w-60 sm:w-auto px-6 py-3 rounded-full text-xl text-white ${isListening ? 'bg-red-500' : 'bg-blue-500'} hover:bg-opacity-90 transition`}
          >
            {isListening ? 'Stop Listening' : 'Start Speech to Text'}
          </button>
        </div>

        <p className="min-w-64 p-4 mb-4 border border-gray-300 rounded-lg bg-white text-lg text-gray-800">
          {text}
        </p>
      </div>
    </div>
  );
}

export default SpeechApp;
