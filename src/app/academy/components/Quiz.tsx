'use client';

import React, { useState, useEffect, useCallback } from 'react';
import useAcademyStorage from '@/hooks/use-academy-storage';
import useUserProfile from '@/hooks/use-user-profile';

import { ModuleType, QuizResult } from '@/types';
import { useAcademy } from '@/context/AcademyContext';
import CertificateDisplay from './CertificateDisplay';
import { UserProfile } from '@/lib/models/user';

interface QuestionInput {
  id?: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

const MAX_CERTIFICATE_ATTEMPTS = 3;
const PASS_THRESHOLD = 70; // Only one definition, top-level

interface QuizProps {
  questions: QuestionInput[];
  moduleId: string;
  onQuizComplete: (result: QuizResult) => void; // Callback to report quiz completion
  // New props for certificate
  instructorName: string;
  instructorTitle: string;
  issuingOrganizationName: string;
}

// Moved child components outside for better organization and memoization
interface QuizLayoutProps {
  title: string;
  children: React.ReactNode;
}
const QuizLayout: React.FC<QuizLayoutProps> = ({ title, children }) => (
  <div className="quiz-container p-4 text-gray-900 dark:text-gray-100">
    <h2 className="text-2xl font-bold mb-4">{title}</h2>
    {children}
  </div>
);

interface QuizCompletedViewProps {
  score: number;
  totalAttempts: number;
  isCertificateEarned: boolean;
  userProfile: UserProfile | null;
  // New props for certificate
  instructorName: string;
  instructorTitle: string;
  issuingOrganizationName: string;
  courseCompletionDate: string; // Added for certificate
  certificateId: string; // Added for certificate
}
const QuizCompletedView: React.FC<QuizCompletedViewProps> = React.memo(
  ({
    score,
    totalAttempts,
    isCertificateEarned,
    userProfile,
    instructorName, // Destructure new props
    instructorTitle,
    issuingOrganizationName,
    courseCompletionDate, // Destructure new prop
    certificateId, // Destructure new prop
  }) => {
    const { activeCourse } = useAcademy();
    const [customCertificateName, setCustomCertificateName] =
      useState<string>('');

    useEffect(() => {
      const storedName = localStorage.getItem('customCertificateName');
      if (storedName) {
        setCustomCertificateName(storedName);
      } else if (userProfile?.name) {
        setCustomCertificateName(userProfile.name);
      }
    }, [userProfile?.name]);

    const handleCustomCertificateNameChange = (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const newName = event.target.value;
      setCustomCertificateName(newName);
      localStorage.setItem('customCertificateName', newName);
    };

    const passedCurrentAttempt = score >= PASS_THRESHOLD;
    const attemptsRemainingForCert = MAX_CERTIFICATE_ATTEMPTS - totalAttempts;
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
              Congratulations! You've earned the certificate for this quiz!
            </p>
            <input
              type="text"
              placeholder="Enter your name"
              value={customCertificateName}
              onChange={handleCustomCertificateNameChange}
              maxLength={100}
              className="mt-2 p-2 border rounded-md text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
            <CertificateDisplay
              userName={
                customCertificateName || userProfile?.name || 'Valued Learner'
              }
              courseName={courseName}
              courseCompletionDate={courseCompletionDate}
              certificateId={certificateId}
              instructorName={instructorName} // Pass prop
              instructorTitle={instructorTitle} // Pass prop
              issuingOrganizationName={issuingOrganizationName} // Pass prop
            />
          </>
        ) : passedCurrentAttempt && totalAttempts > MAX_CERTIFICATE_ATTEMPTS ? (
          <p className="mt-4 font-medium text-orange-500 dark:text-orange-400">
            Great score! However, you've used more than{' '}
            {MAX_CERTIFICATE_ATTEMPTS} attempt's for the certificate.
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
            certificate, or you've exceeded the attempt limit.
          </p>
        )}
        <p
          className={`mt-2 font-medium ${
            passedCurrentAttempt
              ? 'text-success dark:text-success-dark'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          Module marked as {score}% complete for this attempt.
        </p>
      </div>
    );
  },
);
QuizCompletedView.displayName = 'QuizCompletedView';

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
const ActiveQuestionDisplay: React.FC<ActiveQuestionDisplayProps> = React.memo(
  ({
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    selectedAnswer,
    showFeedback,
    onAnswerChange,
    onSubmitAnswer,
    onNextQuestion,
    onFinishQuiz,
  }) => {
    const { options, question, correctAnswer } = currentQuestion;
    return (
      <div className="question-section">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </h3>
        <p className="mb-4 text-gray-800 dark:text-gray-200">{question}</p>
        <div className="options-grid grid gap-2">
          {options.map((option) => (
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
            {selectedAnswer === options[correctAnswer] ? (
              <p className="text-success font-medium dark:text-success-dark">
                Correct!
              </p>
            ) : (
              <p className="text-red-600 font-medium dark:text-red-400">
                Incorrect. The correct answer is{' '}
                <span className="font-bold">{options[correctAnswer]}</span>.
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
  },
);
ActiveQuestionDisplay.displayName = 'ActiveQuestionDisplay';

interface QuizPendingResultsDisplayProps {
  onShowResults: () => void;
}
const QuizPendingResultsDisplay: React.FC<QuizPendingResultsDisplayProps> =
  React.memo(({ onShowResults }) => (
    <div className="text-center">
      <h3 className="text-xl font-semibold mb-2">Quiz Finished!</h3>
      <p className="text-lg mb-4">Click below to see your final results.</p>
      <button
        onClick={onShowResults}
        className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-lg"
      >
        View Results
      </button>
    </div>
  ));
QuizPendingResultsDisplay.displayName = 'QuizPendingResultsDisplay';

const Quiz: React.FC<QuizProps> = ({
  questions,
  moduleId,
  onQuizComplete,
  instructorName, // Destructure new props
  instructorTitle,
  issuingOrganizationName,
}) => {
  const { activeCourse } = useAcademy();
  const { userProfile, updateUserProfile } = useUserProfile();
  const { getQuizResult } = useAcademyStorage();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(() =>
    Array(questions.length).fill(null),
  );
  const [attempts, setAttempts] = useState(0);
  const [certificateAwarded, setCertificateAwarded] = useState<boolean>(false);
  const [showResults, setShowResults] = useState(false);
  const [completionDate, setCompletionDate] = useState<string | undefined>(
    undefined,
  );
  const [certificateUniqueId, setCertificateUniqueId] = useState<
    string | undefined
  >(undefined);

  const userId = userProfile?.id;
  const courseId = activeCourse?.id;

  useEffect(() => {
    const savedResult = getQuizResult(moduleId);
    if (savedResult) {
      setQuizScore(savedResult.score);
      setAttempts(savedResult.attempts);
      setCertificateAwarded(savedResult.certificateAwarded || false);
      setCompletionDate(savedResult.completionDate);
      setCertificateUniqueId(savedResult.certificateId);
    } else {
      setQuizScore(null);
      setAttempts(0);
      setCertificateAwarded(false);
      setCompletionDate(undefined);
      setCertificateUniqueId(undefined);
    }
  }, [moduleId, getQuizResult]);

  useEffect(() => {
    setUserAnswers(Array(questions.length).fill(null));
  }, [questions.length]);

  const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAnswer(event.target.value);
    setUserAnswers((prevAnswers) => {
      const newAnswers = [...prevAnswers];
      newAnswers[currentQuestionIndex] = event.target.value;
      return newAnswers;
    });
  };

  const handleSubmitAnswer = useCallback(() => {
    setShowFeedback(true);
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

      // Validate correctAnswer before accessing options
      if (
        question.correctAnswer >= 0 &&
        question.correctAnswer < question.options.length
      ) {
        if (selectedOpt === question.options[question.correctAnswer]) {
          correctAnswersCount++;
        }
      }
    });

    const finalScore =
      questions.length > 0
        ? Math.round((correctAnswersCount / questions.length) * 100)
        : 0;

    setQuizScore(finalScore);

    const passedThisAttempt = finalScore >= PASS_THRESHOLD;
    const updatedAttempts = attempts + 1;

    let newCertificateStatus = certificateAwarded;
    let currentCompletionDate: string | undefined = completionDate;
    let currentCertificateId: string | undefined = certificateUniqueId;

    if (
      !newCertificateStatus &&
      passedThisAttempt &&
      updatedAttempts <= MAX_CERTIFICATE_ATTEMPTS
    ) {
      newCertificateStatus = true;
      currentCompletionDate = new Date().toISOString(); // Set completion date
      currentCertificateId = crypto.randomUUID(); // Generate unique ID
    }
    setCertificateAwarded(newCertificateStatus);
    setAttempts(updatedAttempts);
    setCompletionDate(currentCompletionDate);
    setCertificateUniqueId(currentCertificateId);

    const result: QuizResult = {
      score: finalScore,
      attempts: updatedAttempts,
      pass: passedThisAttempt,
      certificateAwarded: newCertificateStatus,
      completionDate: currentCompletionDate,
      certificateId: currentCertificateId,
    };

    // Call the onQuizComplete prop to report the result to the parent
    onQuizComplete(result);

    // Handle badge awarding here, as it's a side effect of passing the quiz
    const badgeId = 'quiz-master-badge';
    if (
      userProfile &&
      passedThisAttempt &&
      !userProfile.badges?.includes(badgeId)
    ) {
      const updatedProfile = {
        ...userProfile,
        badges: [...(userProfile.badges || []), badgeId],
      };
      await updateUserProfile(updatedProfile);
    }
  }, [
    questions,
    userAnswers,
    onQuizComplete,
    attempts,
    userProfile,
    certificateAwarded,
    updateUserProfile,
    completionDate, // Add to dependencies
    certificateUniqueId, // Add to dependencies
  ]);

  const handleShowResults = useCallback(() => {
    // This is called when "View Results" button is clicked.
    // We *do not* want to re-run handleQuizCompletion here, as it's already done.
    // Instead, just set the state to show the results.
    setShowResults(true);
  }, []);

  return (
    <QuizLayout title={'Quiz'}>
      {showResults && quizScore !== null ? (
        <QuizCompletedView
          score={quizScore}
          totalAttempts={attempts}
          isCertificateEarned={certificateAwarded}
          userProfile={userProfile}
          instructorName={instructorName} // Pass prop
          instructorTitle={instructorTitle} // Pass prop
          issuingOrganizationName={issuingOrganizationName} // Pass prop
          courseCompletionDate={completionDate || new Date().toISOString()} // Pass actual completion date
          certificateId={certificateUniqueId || 'N/A'} // Pass generated ID
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
        <QuizPendingResultsDisplay onShowResults={handleShowResults} />
      )}
    </QuizLayout>
  );
};

export default Quiz;
