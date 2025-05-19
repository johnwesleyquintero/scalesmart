import React from 'react';

interface ExerciseModuleProps {
  exercise: string;
  userId: string;
  courseId: string;
  moduleId: string;
}

const ExerciseModule: React.FC<ExerciseModuleProps> = ({
  exercise,
  userId,
  courseId,
  moduleId,
}) => {
  const handleComplete = async () => {
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
          progress: 100, // Mark as complete
        }),
      });

      if (response.ok) {
        alert('Exercise completed!');
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
      <h2>Exercise</h2>
      <p>{exercise}</p>
      <textarea />
      <button onClick={handleComplete}>Mark as Complete</button>
    </div>
  );
};

export default ExerciseModule;
