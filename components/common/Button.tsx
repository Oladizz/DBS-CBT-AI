
import React from 'react';

const Button: React.FC<{
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    children: React.ReactNode;
    className?: string;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    disabled?: boolean;
    title?: string;
}> = ({ onClick, children, className = '', variant = 'primary', disabled = false, title = '' }) => {
    const baseClasses = 'inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const styles = {
        primary: 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
        secondary: 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus:ring-indigo-500',
        danger: 'border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
        success: 'border-transparent text-white bg-green-600 hover:bg-green-700 focus:ring-green-500',
    };

    return (
        <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${styles[variant]} ${className}`} title={title}>
            {children}
        </button>
    );
};

export default Button;
