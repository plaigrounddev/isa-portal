import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    glass?: boolean;
}

export function Card({ children, className = '', glass = false, ...props }: CardProps) {
    return (
        <div
            className={`${glass ? 'glass-panel' : ''} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
