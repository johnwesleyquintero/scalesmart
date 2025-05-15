'use client';

import { Button } from '@/components/ui/button';
import { useAcademy } from '@/context/AcademyContext';
import React, { useEffect, useState } from 'react';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
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
    const isCorrect = answer === currentQuestion.correctAnswer;
    setIsAnswerCorrect(isCorrect);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === currentQuestion.correctAnswer) {
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

  const { academyData, saveData, activeCourse } = useAcademy();

  useEffect(() => {
    if (quizCompleted && activeCourse) {
      const quizResult = {
        courseId: activeCourse?.id,
        quizId: '1', // Assuming a single quiz per course for now
        score: score,
        totalQuestions: questions.length,
      };

      const newQuizResults = academyData.quizResults
        ? [...academyData.quizResults, quizResult]
        : [quizResult];
      saveData({ ...academyData, quizResults: newQuizResults });
    }
  }, [
    quizCompleted,
    score,
    questions.length,
    activeCourse?.id,
    academyData,
    saveData,
  ]);

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
      <div className="space-y-2">
        {currentQuestion.options.map((option) => (
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
      {isAnswerCorrect !== null && (
        <>
          <p
            className={`mt-2 ${isAnswerCorrect ? 'text-green-500' : 'text-red-500'}`}
          >
            {isAnswerCorrect ? 'Correct!' : 'Incorrect.'}
          </p>
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
