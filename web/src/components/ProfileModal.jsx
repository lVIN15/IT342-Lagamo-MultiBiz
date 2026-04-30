import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function ProfileModal({ isOpen, onClose, onAvatarUpdate, currentAvatarUrl }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Avatar upload state
  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Change password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
      // Reset password form when modal opens
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwError('');
      setPwSuccess('');
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication error. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:8080/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setProfile(result.data);
      } else {
        setError(result.error?.message || 'Failed to load profile.');
      }
    } catch {
      setError('Connection error. Could not load profile.');
    } finally {
      setLoading(false);
    }
  };

  const formatEmployeeId = (uuid) => {
    try {
      return `MB-${uuid.split('-')[1].toUpperCase()}`;
    } catch {
      return 'MB-N/A';
    }
  };

  const formatDate = (raw) => {
    try {
      const date = new Date(raw);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return raw;
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show optimistic preview immediately so user sees their upload
    const objectUrl = URL.createObjectURL(file);
    setImageError(false); // reset error state for new image
    setProfile(prev => ({ ...prev, profilePictureUrl: objectUrl }));
    if (onAvatarUpdate) onAvatarUpdate(objectUrl);

    // Upload to backend (mock)
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('token');
    try {
      await fetch('http://localhost:8080/api/v1/users/me/profile-picture', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      // The backend saves the mock Supabase URL to the database.
      // We keep showing the objectUrl in this session to prevent a broken image.
    } catch (err) {
      console.error("Failed to upload mock picture", err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (newPassword !== confirmPassword) {
      setPwError('New password and confirm password do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }

    setPwLoading(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:8080/api/v1/users/me/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setPwSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Auto-hide the form after a short delay
        setTimeout(() => {
          setShowPasswordForm(false);
          setPwSuccess('');
        }, 2000);
      } else {
        setPwError(result.error?.message || 'Failed to change password.');
      }
    } catch {
      setPwError('Connection error. Please try again.');
    } finally {
      setPwLoading(false);
    }
  };

  if (!isOpen) return null;

  // Eye toggle icon components
  const EyeOpen = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
  const EyeClosed = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-gray-800">My Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <svg className="w-8 h-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <p className="mt-3 text-sm text-gray-500">Loading profile...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          ) : profile ? (
            <>
              {/* Avatar + Name + Email */}
              <div className="flex flex-col items-center mb-6">
                <div 
                  className="relative w-20 h-20 rounded-full bg-orange-200 flex items-center justify-center font-bold text-2xl mb-3 cursor-pointer overflow-hidden group border-2 border-white shadow-sm"
                  onClick={() => fileInputRef.current?.click()}
                  title="Change Profile Picture"
                >
                  {(currentAvatarUrl || profile.profilePictureUrl) && !imageError ? (
                    <img 
                      src={currentAvatarUrl || profile.profilePictureUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <span className="text-orange-800">
                      {profile.firstname?.charAt(0)}{profile.lastname?.charAt(0)}
                    </span>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingAvatar ? (
                      <svg className="w-6 h-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </div>
                </div>
                
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />

                <h3 className="text-xl font-bold text-gray-900">{profile.firstname} {profile.lastname}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{profile.email}</p>

                {/* Badges */}
                <div className="flex items-center gap-2 mt-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    {profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1).toLowerCase()}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    {profile.subscriptionStatus || 'Basic'} Plan
                  </span>
                </div>
              </div>

              {/* Details Card */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-5">
                {/* Employee ID */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Employee ID</span>
                  <span className="text-sm font-semibold text-gray-800">{formatEmployeeId(profile.id)}</span>
                </div>
                <div className="border-t border-gray-200" />

                {/* Role */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Role</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1).toLowerCase()}
                  </span>
                </div>
                <div className="border-t border-gray-200" />

                {/* Member Since */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Member Since</span>
                  <span className="text-sm font-semibold text-gray-800">{formatDate(profile.createdAt)}</span>
                </div>
              </div>

              {/* Change Password Section */}
              {!showPasswordForm ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Change Password
                </button>
              ) : (
                <form onSubmit={handleChangePassword} className="border border-gray-200 rounded-xl p-4 space-y-3 animate-in">
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Change Password</h4>

                  {pwError && (
                    <div className="bg-red-50 text-red-700 p-2.5 rounded-lg text-xs border border-red-200 flex items-start gap-2">
                      <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {pwError}
                    </div>
                  )}
                  {pwSuccess && (
                    <div className="bg-green-50 text-green-700 p-2.5 rounded-lg text-xs border border-green-200 flex items-start gap-2">
                      <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {pwSuccess}
                    </div>
                  )}

                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPw ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showCurrentPw ? <EyeClosed /> : <EyeOpen />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showNewPw ? <EyeClosed /> : <EyeOpen />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPw ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPw ? <EyeClosed /> : <EyeOpen />}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPwError('');
                        setPwSuccess('');
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="px-4 py-2 bg-[#123458] text-white rounded-full text-xs font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {pwLoading ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save Password'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
