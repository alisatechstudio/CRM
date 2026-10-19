import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  Package, 
  Award, 
  Send, 
  LifeBuoy, 
  Store, 
  Sun, 
  Moon, 
  Sparkles,
  X,
  Download,
  Phone
} from 'lucide-react';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  theme, 
  setTheme, 
  stores = [], 
  activeStore, 
  setActiveStore,
  isOpen = false,
  onClose,
  onOpenInstallModal
}) {
  const navItems = [
    { id: 'dashboard', label: 'এক্সিকিউটিভ ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'pos', label: 'পিওএস ক্যাশ কাউন্টার', icon: ShoppingCart },
    { id: 'customers', label: 'কাস্টমার ৩৬০° সিআরএম', icon: Users },
    { id: 'inventory', label: 'ডিপার্টমেন্ট ইনভেন্টরি', icon: Package },
    { id: 'loyalty', label: 'লয়্যালটি ও রিওয়ার্ডস', icon: Award },
    { id: 'campaigns', label: 'মার্কেটিং ক্যাম্পেইন', icon: Send },
    { id: 'tickets', label: 'কাস্টমার সার্ভিস ও রিটার্ন', icon: LifeBuoy }
  ];

  const handleNavClick = (tabId) => {
    setCurrentTab(tabId);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
            <div className="brand-icon">
              <Sparkles size={20} />
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div className="brand-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                মিজান কম্পিউটার
              </div>
              <div className="brand-sub">Mijan Computer & Cosmetics</div>
            </div>
          </div>

          {/* Close button on mobile drawer */}
          <button 
            type="button" 
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="মেনু বন্ধ করুন"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="nav-menu">
          <div className="nav-label">দৈনন্দিন পরিচালনা</div>
          {navItems.slice(0, 3).map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="nav-label">ব্যবস্থাপনা ও প্রবৃদ্ধি</div>
          {navItems.slice(3).map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with Store Selector and Actions */}
        <div className="sidebar-footer">
          {/* Single Store Card */}
          <div style={{
            background: 'var(--bg-app)',
            padding: '0.65rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
              <Store size={14} /> {activeStore?.name || 'মিজান কম্পিউটার অ্যান্ড কসমেটিকস'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {activeStore?.location || 'চন্ডিপুর পুরান বাজার, নড়িয়া, শরীয়তপুর'}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
              কোড: {activeStore?.code || 'MJN-NR01'} • শাখা: প্রধান আউটলেট
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--primary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
              <Phone size={11} /> {activeStore?.phone || '+880 1309-965422'}
            </div>
          </div>

          <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <button 
              type="button"
              className="btn btn-secondary btn-sm" 
              style={{ 
                width: '100%', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(139, 92, 246, 0.12) 100%)',
                borderColor: 'rgba(99, 102, 241, 0.35)',
                color: '#a5b4fc',
                fontWeight: 600
              }}
              title="মোবাইল বা কম্পিউটারে অ্যাপ হিসেবে ইনস্টল করুন"
              onClick={() => {
                if (onClose) onClose();
                if (onOpenInstallModal) onOpenInstallModal();
              }}
            >
              <Download size={15} />
              <span>অ্যাপ ইনস্টল করুন</span>
            </button>

            <button 
              type="button"
              className="btn btn-secondary btn-sm" 
              style={{ width: '100%', justifyContent: 'center' }}
              title="থিম পরিবর্তন করুন"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span>{theme === 'dark' ? 'লাইট মোড' : 'ডার্ক মোড'}</span>
            </button>

            <div className="sidebar-credit">
              Developed by: <span>Alisa Tech Studio</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
