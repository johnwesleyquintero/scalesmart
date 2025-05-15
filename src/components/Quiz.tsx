import React, { useState } from 'react';

type Question = {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
};

type QuizProps = {
  questions: Question[];
};

const Quiz: React.FC<QuizProps> = ({ questions }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>(
    new Array(questions.length).fill(''),
  );
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = event.target.value;
    setUserAnswers(newAnswers);
  };

  const goToNextQuestion = () => {
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

  const calculateScore = () => {
    let score = 0;
    for (let i = 0; i < questions.length; i++) {
      if (userAnswers[i] === questions[i].correctAnswer) {
        score++;
      }
    }
    return score;
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  if (showResults) {
    const score = calculateScore();
    return (
      <div>
        <h2>Quiz Results</h2>
        <p>
          You scored {score} out of {questions.length}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>Question {currentQuestionIndex + 1}</h2>
      <p>{currentQuestion.text}</p>
      <form>
        {currentQuestion.options.map((option) => (
          <div key={option}>
            <label>
              <input
                type="radio"
                value={option}
                checked={userAnswers[currentQuestionIndex] === option}
                onChange={handleAnswerChange}
              />
              {option}
            </label>
          </div>
        ))}
        {currentQuestionIndex < questions.length - 1 ? (
          <button onClick={goToNextQuestion}>Next Question</button>
        ) : (
          <button onClick={handleSubmit}>Submit Quiz</button>
        )}
      </form>
    </div>
  );
};

export default Quiz;
