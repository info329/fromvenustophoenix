import React from 'react';
import { cn } from '@/lib/utils/helpers';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full px-4 py-2.5 bg-white border rounded-xl appearance-none transition-all duration-200',
              'focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500',
              'disabled:bg-gray-50 disabled:text-gray-500',
              error 
                ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500/10 focus:border-red-500' 
                : 'border-gray-200 text-gray-900 hover:border-gray-300',
              className
            )}
            {...props}
          >
            {children ? children : (
              <>
                <option value="">Select an option...</option>
                {options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </>
            )}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-500 ml-1">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500 ml-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
