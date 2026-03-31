import React from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'pill' | 'outline' | 'icon-circle';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    icon?: React.ReactNode;
}

export function Button({ variant = 'pill', icon, children, className = '', ...props }: ButtonProps) {
    const isIconOnly = variant === 'icon-circle';

    return (
        <button
            className={`${styles.base} ${styles[variant]} ${className}`}
            {...props}
        >
            {!isIconOnly && children}
            {icon && <span className={styles.icon}>{icon}</span>}
        </button>
    );
}
