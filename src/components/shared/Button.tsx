import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
