import { MDXRemote } from 'next-mdx-remote/rsc';
import Quiz from './Quiz';
import ExerciseModule from '../../../components/ExerciseModule';
import { Question } from '@/types';

interface AcademyModuleProps {
  content: string;
  moduleId: string;
  questions?: Question[];
}

const AcademyModule: React.FC<AcademyModuleProps> = ({
  content,
  moduleId,
  questions = [],
}) => {
  const components = {
    Quiz: () => <Quiz questions={questions} moduleId={moduleId} />,
    ExerciseModule: ExerciseModule,
  };

  return <MDXRemote source={content} components={components} />;
};

export default AcademyModule;
