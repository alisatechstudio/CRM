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
import NewCustomerModal from './components/NewCustomerModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [theme, setTheme] = useState('dark');
  const [stores, setStores] = useState([]);
  const [activeStore, setActiveStore] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // Modals state
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);

  // Set theme on root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
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
    loadInitialData();
  }, []);

  const refreshAnalytics = async (params = {}) => {
    try {
      const an = await api.getAnalytics(params);
      setAnalytics(an);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetData = async () => {
    if (window.confirm('আপনি কি ডাটাবেজ রিসেট করে সম্পূর্ণ বাংলা ডেমো ডেটা পুনরায় লোড করতে চান?')) {
      try {
        await api.resetData();
        await loadInitialData();
        alert('ডাটাবেজ সফলভাবে বাংলা ডেমো ডেটায় পুনঃস্থাপিত হয়েছে!');
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        theme={theme}
        setTheme={setTheme}
        stores={stores}
        activeStore={activeStore}
        setActiveStore={setActiveStore}
        onResetData={handleResetData}
      />

      {/* Main App Canvas */}
      <div className="main-wrapper">
        <TopNav 
          currentTab={currentTab}
          activeStore={activeStore}
          onOpenNewCustomer={() => setShowNewCustomerModal(true)}
          onQuickPOS={() => setCurrentTab('pos')}
        />

        <main className="content-body">
          {currentTab === 'dashboard' && (
            <DashboardView 
              analytics={analytics}
              onSelectCustomer={(id) => setSelectedCustomerId(id)}
              onOpenReceipt={(orderId) => setSelectedReceiptId(orderId)}
              onRefreshAnalytics={refreshAnalytics}
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

          {currentTab === 'customers' && (
            <CustomersView 
              onSelectCustomer={(id) => setSelectedCustomerId(id)}
              onOpenNewCustomer={() => setShowNewCustomerModal(true)}
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
    </div>
  );
}
