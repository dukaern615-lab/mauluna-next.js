import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#3D2817] mb-1">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`w-full px-3 py-2 border border-[#E8E4E0] rounded-lg bg-white text-[#3D2817] placeholder-[#5C4B42] focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/20 transition-colors ${className}`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}











