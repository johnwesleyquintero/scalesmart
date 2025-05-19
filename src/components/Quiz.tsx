import React, { useState } from 'react';

interface QuizProps {
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
  userId: string;
  courseId: string;
  moduleId: string;
}

const Quiz: React.FC<QuizProps> = ({
  questions,
  userId,
  courseId,
  moduleId,
}) => {
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));

  const handleAnswerChange = (index: number, value: number) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    let score = 0;
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correctAnswer) {
        score++;
      }
    }

    const percentage = (score / questions.length) * 100;

    try {
      const response = await fetch('/api/module-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          courseId: courseId,
          moduleId: moduleId,
          progress: percentage,
        }),
      });

      if (response.ok) {
        alert(`Quiz completed! Your score: ${percentage}%`);
      } else {
        console.error('Failed to update progress:', response.status);
        alert('Failed to update progress. Please try again.');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Error updating progress. Please try again.');
    }
  };

  return (
    <div>
      <h2>Quiz</h2>
      {questions.map((question, index) => (
        <div key={index}>
          <p>{question.question}</p>
          <ul>
            {question.options.map((option, optionIndex) => (
              <li key={optionIndex}>
                <label>
                  <input
                    type="radio"
                    name={`question-${index}`}
                    value={optionIndex}
                    onChange={() => handleAnswerChange(index, optionIndex)}
                  />
                  {option}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <button onClick={handleSubmit}>Submit Quiz</button>
    </div>
  );
};

export default Quiz;
