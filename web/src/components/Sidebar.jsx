import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Parse user info safely
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { firstname: 'Admin', lastname: 'Workspace' };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: (
      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )},
    { name: 'Businesses', path: '/businesses', icon: (
      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )},
    { name: 'Billing', path: '/billing', icon: (
      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )},
    { name: 'Export & Reports', path: '/export', icon: (
      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )}
  ];

  return (
    <div className="w-64 h-screen bg-white hidden md:flex flex-col border-r border-gray-200 sticky top-0">
      {/* Profile Section */}
      <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
        <div className="bg-orange-200 text-orange-800 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
          {user.firstname.charAt(0)}{user.lastname ? user.lastname.charAt(0) : ''}
        </div>
        <div>
          <h1 className="font-semibold text-gray-900 leading-tight">Multi-Biz</h1>
          <p className="text-sm text-gray-500">{user.firstname} {user.lastname}</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  location.pathname === item.path || (item.path === '/businesses' && location.pathname.startsWith('/business'))
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center px-3 py-2 w-full text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors font-medium"
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log Out
        </button>
      </div>
    </div>
  );
}
