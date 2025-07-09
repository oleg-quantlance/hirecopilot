// components/Alert.js
'use client';

const VARIANTS = {
  info: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
};

export function Alert({ message, title, variant = 'info', isDismissible = false }) {
  return (
    <div className={`rounded-lg p-4 text-sm ${VARIANTS[variant] || VARIANTS.info}`}> 
      {title && <div className="font-semibold mb-1">{title}</div>}
      <div>{message}</div>
    </div>
  );
}
