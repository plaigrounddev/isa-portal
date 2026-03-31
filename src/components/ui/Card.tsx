import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    glass?: boolean;
}

export function Card({ children, className = '', glass = false, ...props }: CardProps) {
    return (
        <div
            className={`${styles.card} ${glass ? 'glass' : ''} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
