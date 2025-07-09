// components/InputField.js

import React from 'react';

export function InputField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  disabled = false,
  readOnly = false,
  error,
  placeholder,
  required = false,
}) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        className={`w-full rounded-md border px-3 py-2 shadow-sm text-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled || readOnly
            ? 'bg-gray-100 border-gray-300 text-gray-500'
            : 'bg-white border-gray-300 text-gray-900'
        }`}
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        required={required}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// Alias export for compatibility
export const Input = InputField;
