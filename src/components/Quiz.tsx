import React, { useState, useEffect } from 'react';
import useAcademyStorage from '@/hooks/use-academy-storage';
import useUserProfile from '@/hooks/use-user-profile'; // Import the hook
import { ModuleType } from '@/types';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface QuizProps {
  questions: Question[];
  moduleId: string;
}

const Quiz: React.FC<QuizProps> = ({ questions, moduleId }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>(
    Array(questions.length).fill(''),
  );
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const { saveData } = useAcademyStorage();

  useEffect(() => {
    // Load saved answers from IndexedDB (if any)
    // This is a placeholder; you'll need to implement the loading logic
    // using the useAcademyStorage hook.
  }, [moduleId]);

  const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = event.target.value;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    setShowFeedback(true);
    let correctAnswersCount = 0;
    questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswersCount++;
      }
    });
    const newScore = (correctAnswersCount / questions.length) * 100;
    setScore(newScore);

    // Save quiz results to IndexedDB
    saveData({
      courses: [
        {
          id: moduleId, // Assuming moduleId is the course ID
          title: 'Quiz', // You might want to fetch the actual course title
          type: ModuleType.QUIZ,
          description: 'Quiz Description',
          duration: '10 minutes',
          level: 'Beginner',
          locked: false,
          progress: newScore,
          modules: [],
          completed: true,
          metadata: {
            level: 'Beginner',
            tags: [],
            category: 'Quiz',
          },
        },
      ],
    });

    // Award badge upon course completion
    // This is a placeholder; replace with actual badge awarding logic
    const badgeId = 'course-completion-badge';
    // Get the current user profile
    const { userProfile, updateUserProfile } = useUserProfile();

    // Update the user profile with the new badge
    if (userProfile && !userProfile.badges?.includes(badgeId)) {
      const updatedProfile = {
        ...userProfile,
        badges: [...(userProfile.badges || []), badgeId],
      };
      updateUserProfile(updatedProfile);
    }
  };

  const handleNextQuestion = () => {
    setShowFeedback(false);
    setCurrentQuestion(currentQuestion + 1);
  };

  return (
    <div>
      <h2>Quiz</h2>
      {currentQuestion < questions.length ? (
        <div>
          <h3>Question {currentQuestion + 1}</h3>
          <p>{questions[currentQuestion].text}</p>
          {questions[currentQuestion].options.map((option) => (
            <label key={option}>
              <input
                type="radio"
                value={option}
                checked={answers[currentQuestion] === option}
                onChange={handleAnswerChange}
              />
              {option}
            </label>
          ))}
          {showFeedback && (
            <div>
              {answers[currentQuestion] ===
              questions[currentQuestion].correctAnswer ? (
                <p>Correct!</p>
              ) : (
                <p>
                  Incorrect. The correct answer is{' '}
                  {questions[currentQuestion].correctAnswer}.
                </p>
              )}
              <p>{questions[currentQuestion].explanation}</p>
              {currentQuestion < questions.length - 1 ? (
                <button onClick={handleNextQuestion}>Next Question</button>
              ) : (
                <button onClick={handleSubmit}>Submit Quiz</button>
              )}
            </div>
          )}
          {!showFeedback && (
            <button onClick={() => setShowFeedback(true)}>Check Answer</button>
          )}
        </div>
      ) : (
        <div>
          <h3>Quiz Completed!</h3>
          <p>Your score: {score}%</p>
        </div>
      )}
    </div>
  );
};

export default Quiz;
