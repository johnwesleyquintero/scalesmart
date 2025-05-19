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
  return (
    <div>
      <h2>Exercise</h2>
      <p>User ID: {userId}</p>
      <p>Course ID: {courseId}</p>
      <p>Module ID: {moduleId}</p>
      <p>{exercise}</p>
      <textarea placeholder="Enter your answer here..." rows={5} cols={50} />
    </div>
  );
};

export default ExerciseModule;
