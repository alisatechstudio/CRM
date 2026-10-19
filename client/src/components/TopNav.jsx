import React from 'react';
import { UserPlus, ShoppingBag, ShieldCheck, MapPin, Lock, Menu, Sparkles, Download } from 'lucide-react';

export default function TopNav({ 
  currentTab, 
  activeStore, 
  onOpenNewCustomer, 
  onQuickPOS,
  onLockApp,
  onOpenMobileMenu,
  onOpenInstallModal
}) {
  const titles = {
    dashboard: 'এক্সিকিউটিভ বিআই ড্যাশবোর্ড',
    pos: 'পয়েন্ট অব সেল (পিওএস)',
    customers: 'কাস্টমার ৩৬০° সিআরএম',
    inventory: 'ডিপার্টমেন্টাল ইনভেন্টরি',
    loyalty: 'লয়্যালটি ও রিওয়ার্ডস',
    campaigns: 'মার্কেটিং ক্যাম্পেইন',
    tickets: 'কাস্টমার সার্ভিস ও রিটার্ন'
  };

  return (
    <header className="top-navbar">
      {/* Left side: Hamburger (Mobile) + Title / Store info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={onOpenMobileMenu}
          aria-label="মেনু খুলুন"
        >
          <Menu size={20} />
        </button>

        <div style={{ minWidth: 0 }}>
          <h2 className="top-nav-title">
            {titles[currentTab] || 'মিজান কম্পিউটার অ্যান্ড কসমেটিকস'}
          </h2>
          <div className="top-nav-subtitle">
            <MapPin size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeStore?.location || 'চন্ডিপুর পুরান বাজার, নড়িয়া'} • 📞 {activeStore?.phone || '+880 1309-965422'}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Action Buttons & Staff Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
        {/* Desktop POS shortcut */}
        {currentTab !== 'pos' && (
          <button className="btn btn-secondary btn-sm desktop-only-btn" onClick={onQuickPOS}>
            <ShoppingBag size={15} style={{ color: 'var(--secondary)' }} />
            <span>পিওএস</span>
          </button>
        )}

        {/* Install PWA Button (Mobile & Desktop) */}
        <button 
          className="btn btn-sm top-nav-action-btn install-pwa-btn" 
          onClick={onOpenInstallModal}
          title="মোবাইল বা কম্পিউটারে অ্যাপ হিসেবে ইনস্টল করুন"
        >
          <Download size={14} />
          <span className="desktop-btn-text">অ্যাপ ইনস্টল</span>
        </button>

        {/* New Member Button (Icon on mobile, text on desktop) */}
        <button 
          className="btn btn-primary btn-sm top-nav-action-btn" 
          onClick={onOpenNewCustomer}
          title="নতুন কাস্টমার নিবন্ধন"
        >
          <UserPlus size={15} />
          <span className="desktop-btn-text">নতুন মেম্বার</span>
        </button>

        {/* Lock App Button */}
        <button 
          className="btn btn-secondary btn-sm top-nav-action-btn lock-btn" 
          onClick={onLockApp} 
          title="অ্যাপ্লিকেশন লক করুন"
        >
          <Lock size={14} />
          <span className="desktop-btn-text">লক</span>
        </button>

        {/* Staff / Manager Avatar Pill */}
        <div className="staff-pill" title="মিজানুর রহমান (ব্যবস্থাপক)">
          <div className="staff-avatar">
            মি
          </div>
          <div className="staff-info">
            <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>মিজানুর রহমান</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <ShieldCheck size={11} style={{ color: 'var(--success)' }} /> ম্যানেজার
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
