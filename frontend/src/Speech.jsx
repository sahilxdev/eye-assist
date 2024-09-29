import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'

function SpeechApp() {
  const [text, setText] = useState(''); // Text state for input and speech result
  const [isListening, setIsListening] = useState(false); // State to track whether it's listening or not
  const [image, setImage] = useState(null); // State to store captured image
  const recognition = useRef(null); // Use ref to store SpeechRecognition instance
  const [postUrl, setPostUrl] = useState("");
  const [level, setLevel] = useState(0);
  const [result, setResult] = useState("");
  const [command, setCommand] = useState("");
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

    const fetchUrl = async () => { 
      try { 
        const response = await axios.get("https://url-store-4bt0.onrender.com/"); 
        setPostUrl(response.data.url); 
        console.log(postUrl); 
         
      } catch (error) { 
        console.error("Error fetching the URL:", error); 
      } 
    }; 

    fetchUrl();

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
      captureImage();
      let c = getUrlForKeyword(findKeywords(text));
      setCommand(c);
      handleSubmit();
    } else {
      setText(''); // Clear text when starting new recognition
      recognition.current.start(); // Start listening
      setIsListening(true);
    }
  };

  // Effect to trigger Text-to-Speech when text updates
  useEffect(() => {
    if (result) {
      const speechSynthesis = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(result);

      utterance.lang = 'en-US';

      // Speak the result
      speechSynthesis.speak(utterance);
    }
  }, [result]); // Run this effect when the text state changes

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

  function findKeywords(inputString) { 
    // Split the string into an array of words 
    const words = inputString.split(' '); 
 
    // Check for the specific phrases in order of priority 
    for (let i = 0; i < words.length; i++) { 
        if (words[i] === "see") { 
            // Check for "see detail" or "see more detail" 
            if (i + 2 < words.length && words[i + 1] === "more" && words[i + 2] === "detail") { 
                return "see more detail"; 
            } 
            if (i + 1 < words.length && words[i + 1] === "detail") { 
                return "see detail"; 
            } 
            return "see"; // Return "see" if no detail is found 
        } 
 
        // Check for "read" 
        if (words[i] === "read") { 
            return "read"; // Return "read" if found 
        } 
    } 
 
    // If none of the phrases are found, return null or an appropriate message 
    return null; // You can change this to a default value if needed 
  }

  function getUrlForKeyword(keyword) {    
    if (keyword === "see") {
    setLevel(0)
    return `${postUrl}/describe`; // URL for "see"    
    } else if (keyword === "see detail") {
      setLevel(1)
    return `${postUrl}/describe`; // URL for "see detail"   
     } else if (keyword === "see more detail") {
      setLevel(2)
    return `${postUrl}/describe`; // URL for "see more detail"  
      } else if (keyword === "read") {
    return `${postUrl}/ocr`; // URL for "read"   
     } else {
    return null; // Return null if keyword doesn't match any expected value   
     }
  }

  const handleSubmit = async () => { 
    if (!postUrl) { 
      console.error("Post URL is not set yet."); 
      return; 
    } 
    const formData = new FormData(); 
    formData.append("level", level); 
    if (image) { 
      formData.append("image", image); 
    } 
 
    try { 
      const response = await axios.post(`${getUrlForKeyword}`, formData, { 
        headers: { 
          "Content-Type": "multipart/form-data", 
        }, 
      }); 
      console.log("Response:", response.data);
      setResult(response.data.result);
    } catch (error) { 
      console.error("Error submitting data:", error); 
    } 
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden">
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

        <p className="min-w-64 p-4 mb-4 border border-gray-300 rounded-lg bg-white text-lg text-gray-800">
          {result}
        </p>
      </div>
    </div>
  );
}

export default SpeechApp;
