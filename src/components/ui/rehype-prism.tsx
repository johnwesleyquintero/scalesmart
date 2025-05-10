import { CodeBlockProps } from './chat-interface';

const RehypePrism = ({ className, children }: CodeBlockProps) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  if (language === 'mermaid') {
    return <pre className="mermaid">{String(children).trim()}</pre>;
  }

  return <code className={className}>{children}</code>;
};

export default RehypePrism;
