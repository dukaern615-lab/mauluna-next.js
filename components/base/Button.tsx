import { ReactNode } from 'react';
import Link from 'next/link';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'cta';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  to?: string;
  href?: string;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  to,
  href,
  className = '',
  type = 'button',
  disabled = false
}: ButtonProps) {
  const baseClasses = 'whitespace-nowrap cursor-pointer font-medium transition-all duration-200 flex items-center justify-center';
  
  const variantClasses = {
    primary: 'bg-[#C9A876] hover:bg-[#B8956A] text-white',
    secondary: 'bg-[#F9F6F3] hover:bg-[#E8E4E0] text-[#3D2817]',
    outline: 'border-2 border-[#C9A876] text-[#C9A876] hover:bg-[#C9A876] hover:text-white',
    cta: 'bg-[#D97860] hover:bg-[#E89580] text-white'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-lg'
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;
  
  // If 'to' or 'href' prop is provided, render as Link
  const linkPath = to || href;
  if (linkPath) {
    return (
      <Link
        href={linkPath}
        className={`${classes} no-underline`}
        onClick={onClick}
        style={{ textDecoration: 'none' }}
      >
        {children}
      </Link>
    );
  }
  
  // Otherwise render as button
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
}











