'use client';

import { Button } from '@/components/ui/button';
import { useAcademy } from '@/context/AcademyContext';
import React, { useEffect, useState } from 'react';

interface Question {
  id: string;
  text: string;
  questionType: 'multipleChoice' | 'trueFalse' | 'fillInTheBlank' | 'text';
  options?: string[]; // Only for multipleChoice
  correctAnswer: string | string[]; // String for single answer, string[] for multiple correct answers
  feedback?: { [key: string]: string }; // Feedback for incorrect answers, keyed by option or other identifier
  explanation?: string; // Explanation for the correct answer
}

interface QuizProps {
  questions: Question[];
}

const Quiz: React.FC<QuizProps> = ({ questions }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    let isCorrect = false;
    if (currentQuestion.questionType !== 'text') {
      if (Array.isArray(currentQuestion.correctAnswer)) {
        isCorrect = currentQuestion.correctAnswer.includes(answer);
      } else {
        isCorrect = answer === currentQuestion.correctAnswer;
      }
    } else {
      isCorrect =
        answer.toLowerCase() ===
        (currentQuestion.correctAnswer as string).toLowerCase();
    }
    setIsAnswerCorrect(isCorrect);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer && isAnswerCorrect) {
      setScore(score + 1);
    }
    setSelectedAnswer('');
    setIsAnswerCorrect(null);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setIsAnswerCorrect(null);
    setScore(0);
    setQuizCompleted(false);
  };

  const { startModule, activeModule } = useAcademy(); // Use startModule from context

  useEffect(() => {
    if (quizCompleted) {
      // If the activeModule is this quiz, mark it as completed via context
      // This will also update course progress and save data.
      if (activeModule && activeModule.type === 'quiz' /* && activeModule.id === thisQuizModule.id */) {
        // You might want to pass the actual activeModule object if it contains more than just type
        startModule(activeModule); 
      }
    }
  }, [quizCompleted, activeModule, startModule, score, questions.length]); // Added score and questions.length if they are needed for quizResult logic elsewhere

  if (quizCompleted) {
    return (
      <div className="p-4 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">Quiz Completed!</h2>
        <p>
          Your score: {score} / {questions.length}
        </p>
        <Button onClick={handleRestartQuiz}>Restart Quiz</Button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">
        Question {currentQuestionIndex + 1} of {questions.length}
      </h2>
      <p className="mb-4">{currentQuestion.text}</p>
      {currentQuestion.questionType === 'multipleChoice' && (
        <div className="space-y-2">
          {currentQuestion.options?.map((option) => (
            <button
              key={option}
              onClick={() => handleAnswerSelect(option)}
              className={`p-2 border rounded-md w-full text-left ${
                selectedAnswer === option
                  ? 'bg-blue-100 border-blue-500'
                  : 'border-gray-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
      {currentQuestion.questionType === 'text' && (
        <input
          type="text"
          value={selectedAnswer}
          onChange={(e) => handleAnswerSelect(e.target.value)}
          className="p-2 border rounded-md w-full"
        />
      )}
      {isAnswerCorrect !== null && (
        <>
          <p
            className={`mt-2 ${isAnswerCorrect ? 'text-green-500' : 'text-red-500'}`}
          >
            {isAnswerCorrect ? 'Correct!' : 'Incorrect.'}
          </p>
          {!isAnswerCorrect && currentQuestion.feedback && selectedAnswer && (
            <p className="mt-1 text-sm italic">
              {currentQuestion.feedback[selectedAnswer] || 'Incorrect'}
            </p>
          )}
          {isAnswerCorrect && currentQuestion.explanation && (
            <p className="mt-1 text-sm italic">{currentQuestion.explanation}</p>
          )}
        </>
      )}
      <Button
        onClick={handleNextQuestion}
        disabled={!selectedAnswer}
        className="mt-4"
      >
        {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
      </Button>
    </div>
  );
};

export default Quiz;
