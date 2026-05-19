import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  const [activeTab, setActiveTab] = useState('staff');

  return (
    <div className="bg-[#e8e5df] text-on-surface font-[Inter] antialiased selection:bg-primary-container selection:text-on-primary-container">

      {/* ─── TopNavBar ──────────────────────────────────────────────── */}
      <nav className="bg-surface/90 backdrop-blur-md text-primary border-b border-outline-variant sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-edge-margin max-w-[1200px] mx-auto h-16">
          <div className="flex items-center gap-gutter">
            <Link to="/" className="flex items-center gap-2">
              <img src="/multibiz_logo.png" alt="Multi-Biz Logo" className="h-8 w-auto object-contain" />
              <span className="text-[18px] font-[700] text-on-surface tracking-tight hidden sm:block">Multi-Biz</span>
            </Link>
            <div className="hidden md:flex items-center gap-stack-base ml-8">
              <a className="text-[14px] font-[600] text-on-surface-variant hover:text-primary transition-colors" href="#features">Features</a>
              <a className="text-[14px] font-[600] text-on-surface-variant hover:text-primary transition-colors" href="#roles">Roles</a>
              <a className="text-[14px] font-[600] text-on-surface-variant hover:text-primary transition-colors" href="#pricing">Pricing</a>
            </div>
          </div>
          <div className="flex items-center gap-stack-base">
            <Link className="text-[14px] font-[600] text-on-surface hover:text-primary transition-colors hidden sm:block" to="/login">Login</Link>
            <Link className="bg-primary text-on-primary px-4 py-2 rounded text-[14px] font-[600] hover:bg-primary-container hover:text-on-primary-container transition-colors" to="/register">Get Started</Link>
          </div>
        </div>
      </nav>

      <main>
        {/* ─── Hero Section ──────────────────────────────────────────── */}
        <section className="px-edge-margin py-20 max-w-[1200px] mx-auto overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-[28px] lg:text-[36px] font-[900] leading-[1.2] tracking-[-0.02em] text-slate-text">
                Manage Your Business Operations from a Single Dashboard.
              </h1>
              <p className="text-[16px] leading-[1.5] text-on-surface-variant max-w-xl">
                A clean and secure multi-tenant platform. Manage your staff, track daily logs, and process payments safely in one centralized system.
              </p>
              <div className="pt-4">
                <Link className="inline-flex bg-primary text-on-primary px-6 py-3 rounded text-[14px] font-[600] hover:bg-primary-container hover:text-on-primary-container transition-colors" to="/register">
                  Get Started
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-surface border border-border-subtle rounded-lg p-card-padding shadow-sm relative z-10">
                <div className="border-b border-border-subtle pb-4 mb-6 flex justify-between items-center">
                  <span className="text-[18px] font-[700] leading-[1.4] text-slate-text">Owner Dashboard</span>
                  <span className="material-symbols-outlined text-outline">more_horiz</span>
                </div>
                <div className="rounded-lg overflow-hidden">
                  <img
                    src="/dashboard-preview.png"
                    alt="Multi-Biz Owner Dashboard showing real-time revenue analytics, transactions, and business overview"
                    className="w-full h-auto block"
                  />
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-full h-full bg-surface-container rounded-lg -z-10 border border-outline-variant/30"></div>
            </div>
          </div>
        </section>

        {/* ─── Core Features ─────────────────────────────────────────── */}
        <section className="bg-surface-container-lowest border-y border-border-subtle py-20" id="features">
          <div className="px-edge-margin max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-[24px] font-[700] leading-[1.3] text-slate-text">Core Features</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="bg-surface border border-border-subtle p-card-padding rounded-lg group hover:border-primary/50 transition-colors flex flex-col">
                <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined">hub</span>
                </div>
                <h3 className="text-[18px] font-[700] leading-[1.4] text-slate-text mb-3">Centralized Multi-Business Management</h3>
                <p className="text-[14px] leading-[1.5] text-on-surface-variant flex-grow">
                  Stop juggling spreadsheets. Create, manage, and monitor multiple micro-businesses or branches from a single, unified command center.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="bg-surface border border-border-subtle p-card-padding rounded-lg group hover:border-primary/50 transition-colors flex flex-col">
                <div className="w-12 h-12 bg-tertiary-container text-on-tertiary-container rounded flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined">smartphone</span>
                </div>
                <h3 className="text-[18px] font-[700] leading-[1.4] text-slate-text mb-3">Dedicated Staff Mobile App</h3>
                <p className="text-[14px] leading-[1.5] text-on-surface-variant flex-grow">
                  Empower your team with a native Android application. Staff can easily log daily income, track expenses, and upload receipt images directly from their phones.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="bg-surface border border-border-subtle p-card-padding rounded-lg group hover:border-primary/50 transition-colors flex flex-col">
                <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined">monitoring</span>
                </div>
                <h3 className="text-[18px] font-[700] leading-[1.4] text-slate-text mb-3">Real-Time Revenue Dashboard</h3>
                <p className="text-[14px] leading-[1.5] text-on-surface-variant flex-grow">
                  Watch your empire grow in real-time. Our web dashboard uses advanced data-polling to instantly update your charts and analytics.
                </p>
              </div>
              {/* Feature 4 */}
              <div className="bg-surface border border-border-subtle p-card-padding rounded-lg group hover:border-primary/50 transition-colors flex flex-col">
                <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined">admin_panel_settings</span>
                </div>
                <h3 className="text-[18px] font-[700] leading-[1.4] text-slate-text mb-3">Strict Role-Based Security</h3>
                <p className="text-[14px] leading-[1.5] text-on-surface-variant flex-grow">
                  Multi-Biz features robust Role-Based Access Control (RBAC), ensuring a strict separation between Business Owners and Staff.
                </p>
              </div>
              {/* Feature 5 */}
              <div className="bg-surface border border-border-subtle p-card-padding rounded-lg group hover:border-primary/50 transition-colors flex flex-col">
                <div className="w-12 h-12 bg-tertiary-container text-on-tertiary-container rounded flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined">receipt_long</span>
                </div>
                <h3 className="text-[18px] font-[700] leading-[1.4] text-slate-text mb-3">Digital Receipt Storage</h3>
                <p className="text-[14px] leading-[1.5] text-on-surface-variant flex-grow">
                  Say goodbye to lost paper trails. Staff can snap photos of physical receipts via the mobile app, securely uploading and attaching them to transactions.
                </p>
              </div>
              {/* Feature 6 */}
              <div className="bg-surface border border-border-subtle p-card-padding rounded-lg group hover:border-primary/50 transition-colors flex flex-col">
                <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <h3 className="text-[18px] font-[700] leading-[1.4] text-slate-text mb-3">Automated Email CSV Reports</h3>
                <p className="text-[14px] leading-[1.5] text-on-surface-variant flex-grow">
                  Your accounting, simplified. Generate comprehensive CSV financial reports and have them delivered directly to your email inbox.
                </p>
              </div>
              {/* Feature 7 */}
              <div className="bg-surface border border-border-subtle p-card-padding rounded-lg group hover:border-primary/50 transition-colors flex flex-col">
                <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined">currency_exchange</span>
                </div>
                <h3 className="text-[18px] font-[700] leading-[1.4] text-slate-text mb-3">Live Currency Conversion</h3>
                <p className="text-[14px] leading-[1.5] text-on-surface-variant flex-grow">
                  Multi-Biz integrates directly with external financial APIs to provide real-time currency conversions (e.g., PHP to USD) right on your dashboard.
                </p>
              </div>
              {/* Feature 8 */}
              <div className="bg-surface border border-border-subtle p-card-padding rounded-lg group hover:border-primary/50 transition-colors flex flex-col">
                <div className="w-12 h-12 bg-tertiary-container text-on-tertiary-container rounded flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined">login</span>
                </div>
                <h3 className="text-[18px] font-[700] leading-[1.4] text-slate-text mb-3">Seamless Google OAuth Login</h3>
                <p className="text-[14px] leading-[1.5] text-on-surface-variant flex-grow">
                  Frictionless onboarding. Users can register and log in securely using their existing Google accounts.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Role Showcase ─────────────────────────────────────────── */}
        <section className="py-20 px-edge-margin max-w-[1200px] mx-auto" id="roles">
          <div className="text-center mb-12">
            <h2 className="text-[24px] font-[700] leading-[1.3] text-slate-text">Designed for Your Entire Team</h2>
          </div>
          <div className="max-w-3xl mx-auto border border-border-subtle rounded-lg overflow-hidden bg-surface">
            {/* Tabs */}
            <div className="flex border-b border-border-subtle bg-surface-container-lowest">
              <button
                className={`flex-1 py-4 px-6 text-[14px] font-[600] transition-colors focus:outline-none ${activeTab === 'owner'
                  ? 'text-primary border-b-2 border-primary bg-surface'
                  : 'text-on-surface-variant hover:text-slate-text hover:bg-surface'
                  }`}
                onClick={() => setActiveTab('owner')}
              >
                Business Owner
              </button>
              <button
                className={`flex-1 py-4 px-6 text-[14px] font-[600] transition-colors focus:outline-none ${activeTab === 'staff'
                  ? 'text-primary border-b-2 border-primary bg-surface'
                  : 'text-on-surface-variant hover:text-slate-text hover:bg-surface'
                  }`}
                onClick={() => setActiveTab('staff')}
              >
                Staff Member
              </button>
            </div>
            {/* Tab Content */}
            <div className="p-8">
              {activeTab === 'owner' && (
                <div className="flex gap-6 items-start transition-opacity duration-300">
                  <div className="w-16 h-16 bg-primary-fixed rounded flex-shrink-0 flex items-center justify-center text-on-primary-fixed">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: '"OPSZ" 32' }}>storefront</span>
                  </div>
                  <div>
                    <h3 className="text-[18px] font-[700] leading-[1.4] text-slate-text mb-2">Business Owner Overview</h3>
                    <p className="text-[16px] leading-[1.5] text-on-surface-variant">
                      Total control from a unified command center. Monitor real-time analytics across multiple branches, assign staff to specific locations, manage premium subscriptions, and generate comprehensive CSV reports—all from an intuitive web dashboard.
                    </p>
                  </div>
                </div>
              )}
              {activeTab === 'staff' && (
                <div className="flex gap-6 items-start transition-opacity duration-300">
                  <div className="w-16 h-16 bg-secondary-fixed rounded flex-shrink-0 flex items-center justify-center text-on-secondary-fixed">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: '"OPSZ" 32' }}>badge</span>
                  </div>
                  <div>
                    <h3 className="text-[18px] font-[700] leading-[1.4] text-slate-text mb-2">Staff Member Overview</h3>
                    <p className="text-[16px] leading-[1.5] text-on-surface-variant">
                      Streamlined access for daily operations. Securely record face-to-face transactions, upload receipt images, and view personal daily sales logs through a dedicated mobile app, without having access to sensitive overarching business settings.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── Pricing Section ───────────────────────────────────────── */}
        <section className="bg-surface-container-lowest border-t border-border-subtle px-edge-margin pt-20 pb-8" id="pricing">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-[24px] font-[700] leading-[1.3] text-slate-text">Simple, Transparent Pricing</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Starter Card */}
              <div className="bg-white border border-border-subtle rounded-xl flex flex-col shadow-sm p-6">
                <div className="mb-8">
                  <h3 className="text-[18px] font-[700] leading-[1.4] text-[#123458] mb-4">Starter Plan (Basic)</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[36px] font-[900] leading-[1.2] tracking-[-0.02em] text-[#123458]">₱0</span>
                    <span className="text-[14px] leading-[1.5] text-on-surface-variant">/mo</span>
                  </div>
                  <p className="text-[14px] leading-[1.5] text-on-surface-variant mt-4">A small, single-location business just getting started with digital management.</p>
                </div>
                <ul className="space-y-4 mb-2">
                  <li className="flex items-center text-[14px] leading-[1.5] text-on-surface-variant">
                    <span className="material-symbols-outlined text-tertiary mr-3 text-[18px]">check</span>Manage 1 Business Location
                  </li>
                  <li className="flex items-center text-[14px] leading-[1.5] text-on-surface-variant">
                    <span className="material-symbols-outlined text-tertiary mr-3 text-[18px]">check</span>Up to 3 Staff Accounts
                  </li>
                  <li className="flex items-center text-[14px] leading-[1.5] text-on-surface-variant">
                    <span className="material-symbols-outlined text-tertiary mr-3 text-[18px]">check</span>Dedicated Staff Mobile App
                  </li>
                  <li className="flex items-center text-[14px] leading-[1.5] text-on-surface-variant">
                    <span className="material-symbols-outlined text-tertiary mr-3 text-[18px]">check</span>Real-time Web Dashboard
                  </li>
                  <li className="flex items-center text-[14px] leading-[1.5] text-on-surface-variant">
                    <span className="material-symbols-outlined text-tertiary mr-3 text-[18px]">check</span>Download CSV Reports
                  </li>
                  <li className="flex items-center text-[14px] leading-[1.5] text-on-surface-variant">
                    <span className="material-symbols-outlined text-tertiary mr-3 text-[18px]">check</span>Send Reports via Email
                  </li>
                </ul>
              </div>
              {/* Pro Card */}
              <div className="bg-white border-2 border-[#123458] rounded-xl flex flex-col relative shadow-lg p-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-[#123458] text-white text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">Most Popular</span>
                </div>
                <div className="mb-8">
                  <h3 className="text-[18px] font-[700] leading-[1.4] text-[#123458] mb-4">Multi-Biz Pro Plan</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[36px] font-[900] leading-[1.2] tracking-[-0.02em] text-[#123458]">₱500</span>
                    <span className="text-[14px] leading-[1.5] text-on-surface-variant">/mo</span>
                  </div>
                  <p className="text-[14px] leading-[1.5] text-on-surface-variant mt-4">A scaling business owner expanding to new locations and hiring a larger team.</p>
                </div>
                <ul className="space-y-4 mb-2">
                  <li className="flex items-center text-[14px] leading-[1.5] text-slate-text font-medium">
                    <span className="material-symbols-outlined text-tertiary mr-3 text-[18px]">check</span>Unlimited Business Locations
                  </li>
                  <li className="flex items-center text-[14px] leading-[1.5] text-slate-text font-medium">
                    <span className="material-symbols-outlined text-tertiary mr-3 text-[18px]">check</span>Unlimited Staff Accounts
                  </li>
                  <li className="flex items-center text-[14px] leading-[1.5] text-slate-text font-medium">
                    <span className="material-symbols-outlined text-tertiary mr-3 text-[18px]">check</span>Dedicated Staff Mobile App
                  </li>
                  <li className="flex items-center text-[14px] leading-[1.5] text-slate-text font-medium">
                    <span className="material-symbols-outlined text-tertiary mr-3 text-[18px]">check</span>Real-time Web Dashboard
                  </li>
                  <li className="flex items-center text-[14px] leading-[1.5] text-slate-text font-medium">
                    <span className="material-symbols-outlined text-tertiary mr-3 text-[18px]">check</span>Download CSV Reports
                  </li>
                  <li className="flex items-center text-[14px] leading-[1.5] text-slate-text font-medium">
                    <span className="material-symbols-outlined text-tertiary mr-3 text-[18px]">check</span>Send Reports via Email
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer className="bg-surface-container text-secondary border-t border-outline-variant w-full py-section-gap">
        <div className="flex flex-col items-center justify-center w-full px-edge-margin max-w-[1200px] mx-auto text-center space-y-stack-base">
          <div className="mb-8">
            <h2 className="text-[18px] font-[700] leading-[1.4] text-slate-text mb-4">Ready to organize your business?</h2>
            <Link className="inline-block bg-primary text-on-primary px-6 py-2 rounded text-[14px] font-[600] hover:bg-primary-container hover:text-on-primary-container transition-colors" to="/register">
              Create Account
            </Link>
          </div>
          <Link to="/" className="text-[18px] font-[600] text-on-surface tracking-tight mb-4 block">Multi-Biz</Link>
          <div className="flex flex-wrap justify-center gap-6 mb-6">
            <a className="text-[12px] font-[500] leading-[1.2] tracking-[0.01em] text-slate-muted hover:text-on-surface transition-all duration-200 ease-in-out" href="#">Privacy Policy</a>
            <a className="text-[12px] font-[500] leading-[1.2] tracking-[0.01em] text-slate-muted hover:text-on-surface transition-all duration-200 ease-in-out" href="#">Terms of Service</a>
            <a className="text-[12px] font-[500] leading-[1.2] tracking-[0.01em] text-slate-muted hover:text-on-surface transition-all duration-200 ease-in-out" href="#">Contact Support</a>
            <a className="text-[12px] font-[500] leading-[1.2] tracking-[0.01em] text-slate-muted hover:text-on-surface transition-all duration-200 ease-in-out" href="#">System Status</a>
          </div>
          <p className="text-[14px] leading-[1.5] text-slate-muted mt-8">
            © {new Date().getFullYear()} Multi-Biz Management System
          </p>
        </div>
      </footer>
    </div>
  );
}
