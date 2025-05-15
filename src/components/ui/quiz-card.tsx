import React from 'react';

interface QuizCardProps {
  question: string;
  options: string[];
  correctAnswer: string;
}

const QuizCard: React.FC<QuizCardProps> = ({
  question,
  options,
  correctAnswer,
}) => {
  return (
    <div>
      <h3>{question}</h3>
      <ul>
        {options.map((option) => (
          <li key={option}>{option}</li>
        ))}
      </ul>
      <p>Correct Answer: {correctAnswer}</p>
    </div>
  );
};

export default QuizCard;
