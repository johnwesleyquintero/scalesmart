import React, { useState, useEffect, useCallback, useRef } from 'react';
import useAcademyStorage from '@/hooks/use-academy-storage';
import useUserProfile from '@/hooks/use-user-profile';

import { ModuleType, QuizResult } from '@/types';
import { useAcademy } from '@/context/AcademyContext';
import CertificateDisplay from './CertificateDisplay';

interface QuestionInput {
  id?: number; // Optional, as MDX might not provide it
  question: string; // Matches 'question' field from MDX
  options: string[];
  correctAnswer: number; // Expecting index from MDX
  explanation?: string; // Optional, as MDX might not provide it
}

const MAX_CERTIFICATE_ATTEMPTS = 3;
const PASS_THRESHOLD = 70;

interface QuizProps {
  questions: QuestionInput[];
  moduleId: string;
}

const Quiz: React.FC<QuizProps> = ({ questions, moduleId }) => {
  const { activeCourse } = useAcademy();
  const { userProfile, updateUserProfile } = useUserProfile();
  const { updateQuizResult, getQuizResult } = useAcademyStorage();

  const markModuleProgress = useCallback(
    useAcademyStorage().markModuleProgress,
    [],
  );

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(() =>
    Array(questions.length).fill(null),
  );
  const [attempts, setAttempts] = useState(0);
  const [certificateAwarded, setCertificateAwarded] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    if (userProfile?.name) {
      setUserName(userProfile.name);
    }
  }, [userProfile?.name]);

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
      setCertificateAwarded(savedResult.certificateAwarded || false);
      markModuleProgress(courseId, moduleId, savedResult.score);
    } else {
      // Initialize for a fresh quiz if no saved data
      setQuizScore(null);
      setAttempts(0);
      setCertificateAwarded(false);
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

    const PASS_THRESHOLD = 70; // Example: 70% to pass
    const passed = finalScore >= PASS_THRESHOLD;
    const updatedAttempts = attempts + 1;

    const passedThisAttempt = finalScore >= PASS_THRESHOLD;
    let newCertificateStatus = certificateAwarded;

    // Check if certificate can be awarded
    if (
      !newCertificateStatus &&
      passedThisAttempt &&
      updatedAttempts <= MAX_CERTIFICATE_ATTEMPTS
    ) {
      newCertificateStatus = true;
    }
    setCertificateAwarded(newCertificateStatus);

    const result: QuizResult = {
      score: finalScore,
      attempts: updatedAttempts,
      pass: passedThisAttempt,
      certificateAwarded: newCertificateStatus,
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
      await updateUserProfile(updatedProfile);
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
    certificateAwarded, // Added
    updateUserProfile, // Added
  ]);

  // Helper layout component
  const QuizLayout: React.FC<{ title: string; children: React.ReactNode }> = ({
    title,
    children,
  }) => (
    <div className="quiz-container p-4 text-gray-900 dark:text-gray-100">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {children}
    </div>
  );

  // Component for displaying the completed quiz view
  interface QuizCompletedViewProps {
    score: number;
    attempts: number;
    totalAttempts: number;
    isCertificateEarned: boolean;
  }
  const QuizCompletedView: React.FC<QuizCompletedViewProps> = ({
    score,
    attempts,
    totalAttempts,
    isCertificateEarned,
  }) => {
    const passedCurrentAttempt = score >= PASS_THRESHOLD;
    const attemptsRemainingForCert = MAX_CERTIFICATE_ATTEMPTS - totalAttempts;
    const [customName, setCustomName] = useState<string>(
      localStorage.getItem('customName') || '',
    );
    const courseName = activeCourse?.title || 'This Course';

    return (
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Quiz Completed!
        </h3>
        <p className="text-lg text-gray-800 dark:text-gray-200">
          Your score for this attempt: {score}%
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total attempts: {totalAttempts}
        </p>

        {isCertificateEarned ? (
          <>
            <p className="mt-4 font-medium text-emerald-600 dark:text-emerald-400 text-lg">
              🎉 Congratulations! You&apos;ve earned the certificate for this
              quiz! 🎉
            </p>
            <input
              type="text"
              placeholder="Enter your name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="mt-2 p-2 border rounded-md text-black dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
            <CertificateDisplay
              userName={customName || userName}
              courseName={courseName}
            />
          </>
        ) : passedCurrentAttempt && totalAttempts > MAX_CERTIFICATE_ATTEMPTS ? (
          <p className="mt-4 font-medium text-orange-500 dark:text-orange-400">
            Great score! However, you&apos;ve used more than{' '}
            {MAX_CERTIFICATE_ATTEMPTS} attempts for the certificate.
          </p>
        ) : !passedCurrentAttempt &&
          totalAttempts < MAX_CERTIFICATE_ATTEMPTS ? (
          <p className="mt-4 font-medium text-blue-600 dark:text-blue-400">
            You did not pass this time. You have {attemptsRemainingForCert}{' '}
            attempt(s) remaining to earn the certificate.
          </p>
        ) : (
          <p className="mt-4 font-medium text-red-600 dark:text-red-400">
            You did not pass this time and have no more attempts for the
            certificate, or you&apos;ve exceeded the attempt limit.
          </p>
        )}
        <p
          className={`mt-2 font-medium ${passedCurrentAttempt ? 'text-success dark:text-success-dark' : 'text-red-600 dark:text-red-400'}`}
        >
          Module marked as {score}% complete for this attempt.
        </p>
      </div>
    );
  };

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
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
        Question {currentQuestionIndex + 1} of {totalQuestions}
      </h3>
      <p className="mb-4 text-gray-800 dark:text-gray-200">
        {currentQuestion.question}
      </p>
      <div className="options-grid grid gap-2">
        {currentQuestion.options.map((option) => (
          <label
            key={option}
            className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors duration-200 text-gray-800 dark:text-gray-100 ${
              selectedAnswer === option
                ? 'bg-blue-100 border-blue-500 dark:bg-blue-800 dark:border-blue-500 dark:text-white'
                : 'bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600'
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
        <div className="feedback-section mt-4 p-3 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
          {selectedAnswer ===
          currentQuestion.options[currentQuestion.correctAnswer] ? (
            <p className="text-success font-medium dark:text-success-dark">
              Correct!
            </p>
          ) : (
            <p className="text-red-600 font-medium dark:text-red-400">
              Incorrect. The correct answer is{' '}
              <span className="font-bold">
                {currentQuestion.options[currentQuestion.correctAnswer]}
              </span>
              .
            </p>
          )}
          {currentQuestion.explanation && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
              Explanation: {currentQuestion.explanation}
            </p>
          )}
          <button
            onClick={
              currentQuestionIndex < totalQuestions - 1
                ? onNextQuestion
                : onFinishQuiz
            }
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-800"
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
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
              : 'bg-success text-success-foreground hover:bg-success/90 dark:bg-green-700 dark:hover:bg-green-800 dark:text-white'
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
        <QuizCompletedView
          score={quizScore}
          attempts={attempts}
          totalAttempts={attempts}
          isCertificateEarned={certificateAwarded}
        />
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
