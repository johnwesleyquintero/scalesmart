import React, { useState, useEffect, useCallback } from 'react';
import useAcademyStorage from '@/hooks/use-academy-storage';
import useUserProfile from '@/hooks/use-user-profile';
import { ModuleType, QuizResult } from '@/types';
import { useAcademy } from '@/context/AcademyContext';

interface QuestionInput {
  id?: number; // Optional, as MDX might not provide it
  question: string; // Matches 'question' field from MDX
  options: string[];
  correctAnswer: number; // Expecting index from MDX
  explanation?: string; // Optional, as MDX might not provide it
}

interface QuizProps {
  questions: QuestionInput[];
  moduleId: string;
}

const Quiz: React.FC<QuizProps> = ({ questions, moduleId }) => {
  const { activeCourse } = useAcademy();
  const { userProfile } = useUserProfile();
  const { markModuleProgress, updateQuizResult, getQuizResult } =
    useAcademyStorage();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(() =>
    Array(questions.length).fill(null),
  );
  const [attempts, setAttempts] = useState(0);

  const userId = userProfile?.id || 'defaultUserId';
  const courseId = activeCourse?.id || 'defaultCourseId';

  // Effect for loading initial quiz data and setting progress
  useEffect(() => {
    const savedResult = getQuizResult(moduleId);
    if (savedResult) {
      setQuizScore(savedResult.score);
      setAttempts(savedResult.attempts);
      // The progress should reflect the saved score.
      // This line can cause a loop if markModuleProgress or courseId are unstable
      // and cause this effect to re-run.
      markModuleProgress(courseId, moduleId, savedResult.score);
    }
  }, [moduleId, courseId, getQuizResult, markModuleProgress]);

  // Effect for resetting userAnswers when questions change (e.g., different quiz loaded)
  useEffect(() => {
    setUserAnswers(Array(questions.length).fill(null));
  }, [questions.length]);

  const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAnswer(event.target.value);
    // Also update the userAnswers array for the current question
    setUserAnswers((prevAnswers) => {
      const newAnswers = [...prevAnswers];
      newAnswers[currentQuestionIndex] = event.target.value;
      return newAnswers;
    });
  };

  const handleSubmitAnswer = useCallback(() => {
    setShowFeedback(true);
    // The user's answer for the current question is already stored in userAnswers
    // by handleAnswerChange. selectedAnswer holds the UI state for the current question.
  }, []);

  const handleNextQuestion = useCallback(() => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
  }, []);

  const handleQuizCompletion = useCallback(async () => {
    let correctAnswersCount = 0;
    questions.forEach((question, index) => {
      const selectedOpt = userAnswers[index];
      const correctOpt = question.options[question.correctAnswer];
      if (selectedOpt === correctOpt) {
        correctAnswersCount++;
      }
    });

    const finalScore =
      questions.length > 0
        ? Math.round((correctAnswersCount / questions.length) * 100)
        : 0;

    setQuizScore(finalScore);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    const PASS_THRESHOLD = 70; // Example: 70% to pass
    const passed = finalScore >= PASS_THRESHOLD;

    const result: QuizResult = {
      score: finalScore,
      attempts: newAttempts,
      pass: passed,
    };

    await markModuleProgress(courseId, moduleId, finalScore);
    updateQuizResult(moduleId, result);

    // Award badge upon course completion (if applicable)
    const badgeId = 'quiz-master-badge'; // Example badge
    if (userProfile && passed && !userProfile.badges?.includes(badgeId)) {
      const updatedProfile = {
        ...userProfile,
        badges: [...(userProfile.badges || []), badgeId],
      };
      // Assuming updateUserProfile saves to IndexedDB or backend
      // updateUserProfile(updatedProfile);
    }
  }, [
    courseId,
    questions,
    userAnswers,
    moduleId,
    markModuleProgress,
    updateQuizResult,
    attempts,
    userProfile,
  ]);

  // Helper layout component
  const QuizLayout: React.FC<{ title: string; children: React.ReactNode }> = ({
    title,
    children,
  }) => (
    <div className="quiz-container p-4">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {children}
    </div>
  );

  // Component for displaying the completed quiz view
  interface QuizCompletedViewProps {
    score: number;
    attempts: number;
  }
  const QuizCompletedView: React.FC<QuizCompletedViewProps> = ({
    score,
    attempts,
  }) => (
    <div className="text-center">
      <h3 className="text-xl font-semibold mb-2">Quiz Completed!</h3>
      <p className="text-lg">Your score: {score}%</p>
      <p className="text-sm text-gray-600">Attempts: {attempts}</p>
      <p
        className={`mt-4 font-medium ${score >= 70 ? 'text-green-600' : 'text-red-600'}`}
      >
        Module marked as {score}% complete.
        {score < 70 && ' (You did not pass this time.)'}
      </p>
    </div>
  );

  // Component for displaying the active question
  interface ActiveQuestionDisplayProps {
    currentQuestion: QuestionInput;
    currentQuestionIndex: number;
    totalQuestions: number;
    selectedAnswer: string | null;
    showFeedback: boolean;
    onAnswerChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmitAnswer: () => void;
    onNextQuestion: () => void;
    onFinishQuiz: () => void;
  }
  const ActiveQuestionDisplay: React.FC<ActiveQuestionDisplayProps> = ({
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    selectedAnswer,
    showFeedback,
    onAnswerChange,
    onSubmitAnswer,
    onNextQuestion,
    onFinishQuiz,
  }) => (
    <div className="question-section">
      <h3 className="text-lg font-semibold mb-3">
        Question {currentQuestionIndex + 1} of {totalQuestions}
      </h3>
      <p className="mb-4 text-gray-800">{currentQuestion.question}</p>
      <div className="options-grid grid gap-2">
        {currentQuestion.options.map((option) => (
          <label
            key={option}
            className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors duration-200 ${
              selectedAnswer === option
                ? 'bg-blue-100 border-blue-500'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              value={option}
              checked={selectedAnswer === option}
              onChange={onAnswerChange}
              className="mr-2"
            />
            {option}
          </label>
        ))}
      </div>

      {showFeedback && (
        <div className="feedback-section mt-4 p-3 border rounded-md">
          {selectedAnswer ===
          currentQuestion.options[currentQuestion.correctAnswer] ? (
            <p className="text-green-600 font-medium">Correct!</p>
          ) : (
            <p className="text-red-600 font-medium">
              Incorrect. The correct answer is{' '}
              <span className="font-bold">
                {currentQuestion.options[currentQuestion.correctAnswer]}
              </span>
              .
            </p>
          )}
          {currentQuestion.explanation && (
            <p className="text-sm text-gray-700 mt-2">
              Explanation: {currentQuestion.explanation}
            </p>
          )}
          <button
            onClick={
              currentQuestionIndex < totalQuestions - 1
                ? onNextQuestion
                : onFinishQuiz
            }
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {currentQuestionIndex < totalQuestions - 1
              ? 'Next Question'
              : 'Finish Quiz'}
          </button>
        </div>
      )}

      {!showFeedback && (
        <button
          onClick={onSubmitAnswer}
          disabled={selectedAnswer === null}
          className={`mt-4 px-4 py-2 rounded-md transition-colors ${
            selectedAnswer === null
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          Check Answer
        </button>
      )}
    </div>
  );

  // Component for the "View Results" screen
  interface QuizPendingResultsDisplayProps {
    onViewResults: () => void;
  }
  const QuizPendingResultsDisplay: React.FC<QuizPendingResultsDisplayProps> = ({
    onViewResults,
  }) => (
    <div className="text-center">
      <h3 className="text-xl font-semibold mb-2">Quiz Finished!</h3>
      <p className="text-lg mb-4">
        Click below to see your final results and mark the module complete.
      </p>
      <button
        onClick={onViewResults}
        className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-lg"
      >
        View Results
      </button>
    </div>
  );

  return (
    <QuizLayout title="Quiz">
      {quizScore !== null ? (
        <QuizCompletedView score={quizScore} attempts={attempts} />
      ) : currentQuestionIndex < questions.length ? (
        <ActiveQuestionDisplay
          currentQuestion={questions[currentQuestionIndex]}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          selectedAnswer={selectedAnswer}
          showFeedback={showFeedback}
          onAnswerChange={handleAnswerChange}
          onSubmitAnswer={handleSubmitAnswer}
          onNextQuestion={handleNextQuestion}
          onFinishQuiz={handleQuizCompletion}
        />
      ) : (
        <QuizPendingResultsDisplay onViewResults={handleQuizCompletion} />
      )}
    </QuizLayout>
  );
};

export default Quiz;
