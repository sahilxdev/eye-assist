import React, { useState, useEffect, useRef } from 'react';

function SpeechApp() {
  const [text, setText] = useState(''); // Text state for input and speech result
  const [isListening, setIsListening] = useState(false); // State to track whether it's listening or not
  const recognition = useRef(null); // Use ref to store SpeechRecognition instance
  
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
  }, []);

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="flex flex-col space-y-4 w-full max-w-md">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={toggleListening}
            className={`w-full sm:w-auto px-6 py-3 rounded-lg text-white ${isListening ? 'bg-red-500' : 'bg-blue-500'} hover:bg-opacity-90 transition`}
          >
            {isListening ? 'Stop Listening' : 'Start Speech to Text'}
          </button>
        </div>

        <p
          className="w-full p-4 mb-4 border border-gray-300 rounded-lg bg-white text-lg text-gray-800"
        >
          {text}
        </p>
      </div>
    </div>
  );
}

export default SpeechApp;
