import React, { useState, useEffect } from 'react';
import { api } from './api';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import DashboardView from './components/DashboardView';
import POSView from './components/POSView';
import CustomersView from './components/CustomersView';
import CustomerDetailModal from './components/CustomerDetailModal';
import ReceiptModal from './components/ReceiptModal';
import InventoryView from './components/InventoryView';
import LoyaltyView from './components/LoyaltyView';
import CampaignsView from './components/CampaignsView';
import TicketsView from './components/TicketsView';
import DueManagementView from './components/DueManagementView';
import NewCustomerModal from './components/NewCustomerModal';
import PinLockScreen from './components/PinLockScreen';
import MobileBottomNav from './components/MobileBottomNav';
import InstallPwaModal from './components/InstallPwaModal';
import OrdersView from './components/OrdersView';
import CustomerPortalView from './components/CustomerPortalView';

export default function App() {
  const [isCustomerPortal, setIsCustomerPortal] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('portal') === 'true' || urlParams.has('phone') || urlParams.has('card') || window.location.hash === '#portal';
  });

  const [portalInitialPhone, setPortalInitialPhone] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('phone') || urlParams.get('card') || '';
  });

  const [isLocked, setIsLocked] = useState(() => {
    return !sessionStorage.getItem('crm_unlocked');
  });

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('crm_theme') || 'light';
  });
  const [stores, setStores] = useState([]);
  const [activeStore, setActiveStore] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Modals state
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);

  // Set theme on root and persist preference
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('crm_theme', theme);
  }, [theme]);

  // Initial load
  const loadInitialData = async () => {
    try {
      const [sts, an] = await Promise.all([
        api.getStores(),
        api.getAnalytics()
      ]);
      setStores(sts);
      if (sts.length > 0 && !activeStore) {
        setActiveStore(sts[0]);
      }
      setAnalytics(an);
    } catch (err) {
      console.error('Failed to load initial data', err);
    }
  };

  useEffect(() => {
    if (!isLocked) {
      loadInitialData();
    }
  }, [isLocked]);

  const handleUnlock = () => {
    sessionStorage.setItem('crm_unlocked', 'true');
    setIsLocked(false);
  };

  const handleLock = () => {
    sessionStorage.removeItem('crm_unlocked');
    setIsLocked(true);
  };

  const refreshAnalytics = async (params = {}) => {
    try {
      const an = await api.getAnalytics(params);
      setAnalytics(an);
    } catch (err) {
      console.error(err);
    }
  };

  if (isCustomerPortal) {
    return (
      <CustomerPortalView
        initialPhone={portalInitialPhone}
        onExitToStaff={() => {
          setIsCustomerPortal(false);
          const url = new URL(window.location.href);
          url.searchParams.delete('portal');
          url.searchParams.delete('phone');
          url.searchParams.delete('card');
          window.history.replaceState({}, '', url.pathname);
        }}
      />
    );
  }

  return (
    <div className="app-container">
      {isLocked && (
        <PinLockScreen 
          onUnlock={handleUnlock} 
          onOpenCustomerPortal={() => setIsCustomerPortal(true)}
        />
      )}

      {/* Navigation Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          setMobileSidebarOpen(false);
        }}
        theme={theme}
        setTheme={setTheme}
        stores={stores}
        activeStore={activeStore}
        setActiveStore={setActiveStore}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onOpenInstallModal={() => setShowInstallModal(true)}
        onOpenCustomerPortal={() => setIsCustomerPortal(true)}
      />

      {/* Main App Canvas */}
      <div className="main-wrapper">
        <TopNav 
          currentTab={currentTab}
          activeStore={activeStore}
          onOpenNewCustomer={() => setShowNewCustomerModal(true)}
          onQuickPOS={() => {
            setCurrentTab('pos');
            setMobileSidebarOpen(false);
          }}
          onLockApp={handleLock}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onOpenInstallModal={() => setShowInstallModal(true)}
        />

        <main className="content-body">
          {currentTab === 'dashboard' && (
            <DashboardView 
              analytics={analytics}
              onSelectCustomer={(id) => setSelectedCustomerId(id)}
              onRefreshAnalytics={refreshAnalytics}
              onNavigateToOrders={() => setCurrentTab('orders')}
            />
          )}

          {currentTab === 'pos' && (
            <POSView 
              activeStore={activeStore}
              onOpenReceipt={(orderId) => {
                setSelectedReceiptId(orderId);
                refreshAnalytics();
              }}
              onOpenNewCustomer={() => setShowNewCustomerModal(true)}
            />
          )}

          {currentTab === 'orders' && (
            <OrdersView 
              onOpenReceipt={(orderId) => setSelectedReceiptId(orderId)}
              onRefreshAnalytics={refreshAnalytics}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersView 
              onSelectCustomer={(id) => setSelectedCustomerId(id)}
              onOpenNewCustomer={() => setShowNewCustomerModal(true)}
            />
          )}

          {currentTab === 'dues' && (
            <DueManagementView 
              onSelectCustomer={(id) => setSelectedCustomerId(id)}
              onOpenReceipt={(orderId) => setSelectedReceiptId(orderId)}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryView />
          )}

          {currentTab === 'loyalty' && (
            <LoyaltyView />
          )}

          {currentTab === 'campaigns' && (
            <CampaignsView />
          )}

          {currentTab === 'tickets' && (
            <TicketsView 
              onSelectCustomer={(id) => setSelectedCustomerId(id)}
            />
          )}

          {/* Small Footer */}
          <footer className="app-small-footer">
            <div className="footer-left">
              <span>© {new Date().getFullYear()} মিজান কম্পিউটার অ্যান্ড কসমেটিকস</span>
              <span className="footer-dot">•</span>
              <span>CRM & POS সিস্টেম</span>
            </div>
            <div className="footer-right">
              Developed by: <span className="dev-credit">Alisa Tech Studio</span>
            </div>
          </footer>
        </main>
      </div>

      {/* Modals */}
      {selectedCustomerId && (
        <CustomerDetailModal 
          customerId={selectedCustomerId}
          onClose={() => {
            setSelectedCustomerId(null);
            refreshAnalytics();
          }}
          onOpenReceipt={(ordId) => setSelectedReceiptId(ordId)}
        />
      )}

      {selectedReceiptId && (
        <ReceiptModal 
          orderId={selectedReceiptId}
          onClose={() => setSelectedReceiptId(null)}
          onOrderUpdated={refreshAnalytics}
          onOrderDeleted={() => {
            setSelectedReceiptId(null);
            refreshAnalytics();
          }}
        />
      )}

      {showNewCustomerModal && (
        <NewCustomerModal 
          onClose={() => setShowNewCustomerModal(false)}
          onCreated={(newCust) => {
            refreshAnalytics();
            setSelectedCustomerId(newCust.id);
          }}
        />
      )}

      {/* PWA App Install Modal */}
      {showInstallModal && (
        <InstallPwaModal 
          onClose={() => setShowInstallModal(false)} 
        />
      )}

      {/* Mobile App Bottom Navigation Bar */}
      <MobileBottomNav 
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          setMobileSidebarOpen(false);
        }}
        onToggleMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />
    </div>
  );
}
