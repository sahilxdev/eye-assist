import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

function SpeechApp() {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [image, setImage] = useState(null);
  const recognition = useRef(null);
  const [postUrl, setPostUrl] = useState("");
  const [level, setLevel] = useState(0);
  const [result, setResult] = useState("");
  const [command, setCommand] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    console.log("Component mounted");

    const fetchUrl = async () => {
      try {
        console.log("Fetching URL...");
        const response = await axios.get("https://url-store-4bt0.onrender.com/");
        console.log("Fetched URL:", response.data.url);
        setPostUrl(response.data.url);
      } catch (error) {
        console.error("Error fetching the URL:", error);
      }
    };

    fetchUrl();
  }, []);

  useEffect(() => {
    if (!postUrl) {
      console.log("Waiting for postUrl to be set...");
      return;
    }

    console.log("Post URL is set, initializing...");

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      alert('Sorry, your browser does not support speech recognition.');
      return;
    }

    recognition.current = new SpeechRecognition();
    recognition.current.continuous = false;
    recognition.current.interimResults = false;
    recognition.current.lang = 'en-US';

    recognition.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("Speech recognized:", transcript);
      setText(transcript);
    
      processText(transcript);
    };
        
    recognition.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.current.onend = () => {
      console.log("Speech recognition ended");
      setIsListening(false);
      captureImage();
    };

    startCamera();

    return () => {
      console.log("Cleaning up camera...");
      if (videoRef.current) {
        const stream = videoRef.current.srcObject;
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
        }
      }
    };
  }, [postUrl]);

  const startCamera = async () => {
    console.log("Starting camera");
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadedmetadata', () => {
            console.log("Video metadata loaded");
            videoRef.current.play();
          });
        }
      } catch (error) {
        console.error('Error accessing the camera:', error);
      }
    }
  };

  const toggleListening = useCallback(() => {
    if (!postUrl) {
      console.error("Post URL not set. Please wait until the URL is fetched.");
      return;
    }

    console.log("Toggling listening state");
    if (isListening) {
      console.log("Stopping speech recognition");
      recognition.current.stop();
    } else {
      console.log("Starting speech recognition");
      setText('');
      recognition.current.start();
      setIsListening(true);
    }
  }, [isListening, postUrl]);

  const captureImage = useCallback(() => {
    console.log("Capturing image");
    const canvas = canvasRef.current;
    const video = videoRef.current;
  
    if (canvas && video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
      const imageData = canvas.toDataURL('image/png');
      setImage(imageData);
      console.log("Image captured");
  
      if (command) {
        console.log("Command available, submitting...");
        handleSubmit(command, imageData);
      } else {
        console.error("No valid command found to submit.");
      }
    } else {
      console.error("Canvas or video not available for capturing image.");
    }
  }, [command]);

  const processText = useCallback((inputText) => {
    console.log("Processing recognized text:", inputText);
    const keyword = findKeywords(inputText);
    console.log("Keyword found:", keyword);
  
    if (postUrl) {
      const newCommand = getUrlForKeyword(keyword);
      console.log("New command:", newCommand);
      setCommand(newCommand);
    } else {
      console.error("Post URL is not set yet. Waiting for URL to be fetched.");
    }
  }, [postUrl]);
  
  useEffect(() => {
    if (command) {
      console.log("Command set, triggering image capture");
      captureImage();
    }
  }, [command, captureImage]);

  function findKeywords(inputString) {
    console.log("Finding keywords in:", inputString);
    if (!inputString) return null;
    const words = inputString.toLowerCase().split(' ');

    for (let i = 0; i < words.length; i++) {
      if (words[i] === "see") {
        if (i + 2 < words.length && words[i + 1] === "more" && words[i + 2] === "detail") {
          return "see more detail";
        }
        if (i + 1 < words.length && words[i + 1] === "detail") {
          return "see detail";
        }
        return "see";
      }

      if (words[i] === "read") {
        return "read";
      }
    }

    return null;
  }

  function getUrlForKeyword(keyword) {
    console.log("Getting URL for keyword:", keyword);
    if (!postUrl) {
      console.error("Post URL is not set yet.");
      return null;
    }
    if (keyword === "see") {
      console.log("Setting level to 0");
      setLevel(0);
      return `${postUrl}/describe`;
    } else if (keyword === "see detail") {
      console.log("Setting level to 1");
      setLevel(1);
      return `${postUrl}/describe`;
    } else if (keyword === "see more detail") {
      console.log("Setting level to 2");
      setLevel(2);
      return `${postUrl}/describe`;
    } else if (keyword === "read") {
      return `${postUrl}/ocr`;
    } else {
      console.log("No matching keyword found");
      return null;
    }
  }
  
  const handleSubmit = useCallback((command, image) => {
    console.log("Handling submit");
    console.log("Command:", command);
    console.log("Image data length:", image ? image.length : "No image");
    console.log("Level:", level);
  
    if (!image) {
      console.error("No image captured for submission.");
      return;
    }
  
    if (!command) {
      console.error("No valid command found to submit.");
      return;
    }
  
    const formData = new FormData();
    
    // Check if image is already a Blob or File
    if (image instanceof Blob || image instanceof File) {
      formData.append('image', image, 'image.jpg');
    } else {
      // If image is base64 string, convert it to Blob
      fetch(image)
        .then(res => res.blob())
        .then(blob => {
          formData.append('image', blob, 'image.jpg');
          sendFormData(command, formData);
        })
        .catch(error => {
          console.error("Error converting image to Blob:", error);
        });
      return; // Exit early as we're handling the submission in the Promise chain
    }
    
    formData.append('level', level);
  
    sendFormData(command, formData);
  }, [level]);
  
  const sendFormData = (command, formData) => {
    console.log("Sending form data to server");
    fetch(command, {
      method: 'POST',
      body: formData,
    })
    .then(response => {
      console.log("Server response received");
      return response.json();
    })
    .then(data => {
      console.log("Submission successful:", data);
    })
    .catch(error => {
      console.error("Submission failed:", error);
    });
  };

  useEffect(() => {
    if (result) {
      console.log("Speaking result:", result);
      const speechSynthesis = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(result);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  }, [result]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden">
      <p>Recognized text: {text}</p>
      <div className="flex flex-col items-center justify-between space-y-4 w-full max-w-md">
        <div className="relative w-full h-[240px] mb-4 border border-gray-300 rounded-lg">
          <video ref={videoRef} className="w-full h-full rounded-lg"></video>
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

        <div className="mt-4">
          <p>Speech recognition status: {isListening ? 'Listening...' : 'Not Listening'}</p>
        </div>
      </div>
    </div>
  );
}

export default SpeechApp;