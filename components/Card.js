// components/Card.js
'use client';
import React from 'react';

export function Card({ title, children }) {
  return (
    <div className="w-full bg-white p-8 rounded-2xl shadow-2xl border border-gray-100">
      {title && (
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
