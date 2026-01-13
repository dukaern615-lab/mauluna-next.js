import { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export default function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#3D2817] mb-1">
          {label}
        </label>
      )}
      <select
        {...props}
        className={`w-full px-3 py-2 pr-8 border border-[#E8E4E0] rounded-lg bg-white text-[#3D2817] focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/20 transition-colors ${className}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}











