import React from 'react';

export default function BusinessCard({ business }) {
  // Mock logic to handle category icons or styling
  const getIcon = (category) => {
    return (
      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 p-2.5 rounded-lg">
            {getIcon(business.category)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{business.name}</h3>
            <p className="text-sm text-gray-500">{business.category}</p>
          </div>
        </div>
        <div className="bg-green-100 bg-opacity-50 text-emerald-600 text-xs font-bold px-2.5 py-1 rounded-full flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          Active
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
        <span className="text-gray-500">ID: {business.id.substring(0, 8)}...</span>
        <button className="text-blue-600 hover:text-blue-800 font-medium transition-colors">View Details</button>
      </div>
    </div>
  );
}
