// src/App.js
import React, { useState, useEffect, useRef } from 'react';

function SpeechApp() {
  const [text, setText] = useState(''); // Text state for input and speech result
  const [isListening, setIsListening] = useState(false); // State to track whether it's listening or not
  const [isSpeaking, setIsSpeaking] = useState(false); // State to track if text-to-speech is ongoing
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
      setText(prevText => `${prevText} ${transcript}`); // Append the recognized text to existing text
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
      recognition.current.start(); // Start listening
      setIsListening(true);
    }
  };

  // Handle Text-to-Speech functionality
  const handleTextToSpeech = () => {
    const speechSynthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = 'en-US';
    setIsSpeaking(true); // Set speaking state while speaking

    utterance.onend = () => {
      setIsSpeaking(false); // Reset speaking state after speech ends
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false); // Reset speaking state on error
    };

    speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">Speech-to-Text & Text-to-Speech App</h1>

      <textarea
        rows="8"
        className="w-full max-w-lg p-4 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Speak or type here..."
      />

      <div className="space-x-4">
        <button
          onClick={toggleListening}
          className={`px-6 py-3 rounded-lg text-white ${isListening ? 'bg-red-500' : 'bg-blue-500'} hover:bg-opacity-90 transition`}
        >
          {isListening ? 'Stop Listening' : 'Start Speech to Text'}
        </button>

        <button
          onClick={handleTextToSpeech}
          disabled={isSpeaking} // Disable the button if speaking is ongoing
          className={`px-6 py-3 rounded-lg text-white ${isSpeaking ? 'bg-gray-500' : 'bg-green-500'} hover:bg-opacity-90 transition`}
        >
          {isSpeaking ? 'Speaking...' : 'Text to Speech'}
        </button>
      </div>
    </div>
  );
}

export default SpeechApp;
