import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package, 
  Menu
} from 'lucide-react';

export default function MobileBottomNav({ 
  currentTab, 
  setCurrentTab, 
  onToggleMenu,
  cartCount = 0
}) {
  const tabs = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'pos', label: 'পিওএস', icon: ShoppingCart, badge: cartCount },
    { id: 'customers', label: 'কাস্টমার', icon: Users },
    { id: 'inventory', label: 'ইনভেন্টরি', icon: Package },
    { id: 'more', label: 'মেনু', icon: Menu, isAction: true }
  ];

  return (
    <nav className="mobile-bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        const handleClick = () => {
          if (tab.isAction) {
            onToggleMenu();
          } else {
            setCurrentTab(tab.id);
          }
        };

        return (
          <button
            key={tab.id}
            type="button"
            className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
            onClick={handleClick}
            aria-label={tab.label}
          >
            <div className="mobile-nav-icon-wrap">
              <Icon size={20} />
              {tab.badge > 0 && (
                <span className="mobile-nav-badge">{tab.badge}</span>
              )}
            </div>
            <span className="mobile-nav-label">{tab.label}</span>
            {isActive && <span className="mobile-nav-dot" />}
          </button>
        );
      })}
    </nav>
  );
}
