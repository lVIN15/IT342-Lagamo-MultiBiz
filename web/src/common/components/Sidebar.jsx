import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import ProfileModal from './ProfileModal';
import LogoutConfirmationModal from './LogoutConfirmationModal';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Parse user info safely
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { firstname: 'Admin', lastname: 'Workspace' };
  
  const [avatarUrl, setAvatarUrl] = useState(user.profilePictureUrl || null);
  const [imageError, setImageError] = useState(false);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('http://localhost:8080/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (e) {
      console.error("Logout API failed", e);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setIsLogoutModalOpen(false);
      navigate('/login');
    }
  };

  const isAdmin = user.role === 'SUPER_ADMIN';

  const ownerNavItems = [
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

  const adminNavItems = [
    { name: 'Platform Overview', path: '/admin', icon: (
      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )},
    { name: 'Users', path: '/admin/users', icon: (
      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )},
    { name: 'Businesses', path: '/admin/businesses', icon: (
      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )}
  ];

  const navItems = isAdmin ? adminNavItems : ownerNavItems;

  return (
    <div className="w-64 h-screen bg-white hidden md:flex flex-col border-r border-gray-200 sticky top-0">
      {/* Profile Section — Clickable to open Profile Modal */}
      <div
        onClick={() => setIsProfileModalOpen(true)}
        className="p-6 border-b border-gray-100 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden bg-orange-200 text-orange-800">
          {avatarUrl && !imageError ? (
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              className="w-full h-full object-cover" 
              onError={() => setImageError(true)}
            />
          ) : (
            <>{user.firstname.charAt(0)}{user.lastname ? user.lastname.charAt(0) : ''}</>
          )}
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
                  location.pathname === item.path
                  || (item.path === '/businesses' && location.pathname.startsWith('/business'))
                  || (item.path === '/admin/users' && location.pathname.startsWith('/admin/users'))
                  || (item.path === '/admin/businesses' && location.pathname.startsWith('/admin/businesses'))
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
          onClick={() => setIsLogoutModalOpen(true)}
          className="w-full flex items-center px-4 py-3 text-red-600 rounded-xl hover:bg-red-50 hover:text-red-700 transition-colors font-medium"
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log Out
        </button>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentAvatarUrl={avatarUrl}
        onAvatarUpdate={(newUrl) => {
          setAvatarUrl(newUrl);
          setImageError(false); // Reset error state on new upload
          const updatedUser = { ...user, profilePictureUrl: newUrl };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
