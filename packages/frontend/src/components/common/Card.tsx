import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
}

export default function Card({ children, interactive, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${
        interactive ? 'active:bg-gray-50 transition-colors' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
