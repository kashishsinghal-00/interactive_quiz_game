// src/App.js
import React from 'react';
import './App.css'; // Imports the styles for .App
import Quiz from './Quiz.js';

function App() {
  return (
    <div className="App"> {/* This div gets the perspective style */}
      <Quiz />           {/* The Quiz component will be a child in this 3D space */}
    </div>
  );
}

export default App;