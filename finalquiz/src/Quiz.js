// src/Quiz.js
import React, { useState, useEffect } from 'react';
import './Quiz.css'; // Aapka Quiz.css file

// Shuffle function (yeh waise hi rahega)
function shuffleArray(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null);     // Error state

  useEffect(() => {
    // Backend se questions fetch karein
    fetch('http://127.0.0.1:5000/api/questions') // Aapke backend ka URL
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok. Status: ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        if (data && data.length > 0) {
          setQuestions(shuffleArray(data)); // Fetched data ko shuffle karke set karein
        } else {
          // Agar data empty array hai ya data hi nahi hai
          throw new Error('No questions received from backend or data is empty.');
        }
        setLoading(false); // Loading complete
      })
      .catch(error => {
        console.error('Error fetching questions:', error);
        setError(`Failed to load questions. ${error.message}`); // Error message set karein
        setLoading(false); // Loading complete (with error)
      });
  }, []); // Empty dependency array -> yeh effect sirf component mount hone par chalega

  const handleAnswerOptionClick = (selectedOption) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(selectedOption);
    const correctAnswer = questions[currentQuestionIndex].correctAnswer;
    if (selectedOption === correctAnswer) {
      setScore(score + 1);
      setIsCorrect(true);
    } else {
      setIsCorrect(false);
    }
  };

  const handleNextQuestion = () => {
    const nextQuestion = currentQuestionIndex + 1;
    if (nextQuestion < questions.length) {
      setCurrentQuestionIndex(nextQuestion);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      setShowScore(true);
    }
  };

  const getButtonClass = (option) => {
    if (selectedAnswer === null) return '';
    if (!questions[currentQuestionIndex]) return ''; 
    const currentQ = questions[currentQuestionIndex];
    if (option === currentQ.correctAnswer) return 'correct';
    if (option === selectedAnswer && option !== currentQ.correctAnswer) return 'incorrect';
    return '';
  };

  const handlePlayAgain = () => {
    setLoading(true);
    setError(null);
    // Fetch questions again for a fresh set, including potential new shuffle from backend if it did that
    fetch('http://127.0.0.1:5000/api/questions')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok during play again. Status: ' + response.status);
        }
        return response.json();
      })
      .then(data => {
         if (data && data.length > 0) {
          setQuestions(shuffleArray(data));
        } else {
          throw new Error('No questions received from backend or data is empty during play again.');
        }
        setCurrentQuestionIndex(0);
        setScore(0);
        setShowScore(false);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching questions on play again:', error);
        setError(`Failed to reload questions. ${error.message}`);
        setLoading(false);
      });
  };

  if (loading) {
    return <div className="quiz-container"><p className="loading-message">Loading questions...</p></div>;
  }

  if (error) {
    return <div className="quiz-container"><p className="error-message">{error}</p></div>;
  }

  if (questions.length === 0 && !loading) { 
    return <div className="quiz-container"><p>No questions available. Please try again later.</p></div>;
  }
  
  if (showScore) {
    return (
      <div className="quiz-container score-section">
        <h2>Quiz Finished!</h2>
        <p>Your score is: {score} / {questions.length}</p>
        <button onClick={handlePlayAgain} className="next-button">Play Again</button>
      </div>
    );
  }

  if (!questions[currentQuestionIndex]) {
      return <div className="quiz-container"><p className="loading-message">Preparing question...</p></div>; 
  }
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="quiz-container">
      <h2>Quiz Game</h2>
      <div className="question-section">
        <h3>Question {currentQuestionIndex + 1} / {questions.length}</h3>
        <p>{currentQuestion.question}</p>
      </div>
      <div className="options-section">
        {currentQuestion.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswerOptionClick(option)}
            disabled={selectedAnswer !== null}
            className={getButtonClass(option)}
          >
            {option}
          </button>
        ))}
      </div>
      {selectedAnswer && (
        <div className="feedback-section">
          {isCorrect ? (
            <p className="feedback-correct">Correct answer!</p>
          ) : (
            <p className="feedback-incorrect">
              Incorrect! The correct answer is: {currentQuestion.correctAnswer}
            </p>
          )}
          <button onClick={handleNextQuestion} className="next-button">
            {currentQuestionIndex === questions.length - 1 ? 'Show Score' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  );
}

export default Quiz;