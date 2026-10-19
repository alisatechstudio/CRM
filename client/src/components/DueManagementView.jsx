import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Phone, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Receipt, 
  Eye, 
  Plus, 
  UserCheck, 
  Calendar,
  RefreshCw,
  X
} from 'lucide-react';
import { api } from '../api';

export default function DueManagementView({ onSelectCustomer, onOpenReceipt }) {
  const [data, setData] = useState({
    totalDue: 0,
    customersWithDueCount: 0,
    todayCollected: 0,
    customers: [],
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('debtors'); // 'debtors' | 'transactions'
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('due'); // 'due' | 'all' | 'cleared'

  // Modal State for Due Collection
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedCustomerForCollect, setSelectedCustomerForCollect] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMethod, setCollectMethod] = useState('নগদ (Cash)');
  const [collectNotes, setCollectNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  const loadDuesData = async () => {
    try {
      setLoading(true);
      const res = await api.getDues({
        search,
        filter: filterStatus
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load dues data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDuesData();
  }, [search, filterStatus]);

  const handleOpenCollect = (customer = null) => {
    setSelectedCustomerForCollect(customer);
    setCollectAmount(customer && customer.due_balance > 0 ? String(customer.due_balance) : '');
    setCollectMethod('নগদ (Cash)');
    setCollectNotes('');
    setShowCollectModal(true);
  };

  const handleSubmitCollect = async (e) => {
    e.preventDefault();
    if (!selectedCustomerForCollect) {
      alert('অনুগ্রহ করে গ্রাহক নির্বাচন করুন');
      return;
    }
    const amt = parseFloat(collectAmount);
    if (!amt || amt <= 0) {
      alert('সঠিক পরিশোধের পরিমাণ (টাকা) দিন');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.collectDue({
        customer_id: selectedCustomerForCollect.id,
        amount: amt,
        payment_method: collectMethod,
        notes: collectNotes
      });

      setFeedbackMessage({
        type: 'success',
        text: res.message || 'বাকি আদায় সফল হয়েছে'
      });
      setShowCollectModal(false);
      setSelectedCustomerForCollect(null);
      setCollectAmount('');
      setCollectNotes('');
      await loadDuesData();

      setTimeout(() => {
        setFeedbackMessage(null);
      }, 5000);
    } catch (err) {
      alert('বাকি আদায় ব্যর্থ: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Feedback Alert */}
      {feedbackMessage && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: feedbackMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${feedbackMessage.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          color: feedbackMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 600
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} />
            <span>{feedbackMessage.text}</span>
          </div>
          <button 
            type="button" 
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            onClick={() => setFeedbackMessage(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header and Quick Stats */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={24} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: '1.35rem', margin: 0 }}>বাকি খাতা ও দেনা-পাওনা</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem', margin: 0 }}>
              গ্রাহকদের বকেয়া বাকি হিসাব, কিস্তি আদায় ও লেনদেন খতিয়ান।
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={loadDuesData}
              title="রিফ্রেশ করুন"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>রিফ্রেশ</span>
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => handleOpenCollect(null)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} />
              <span>বাকি আদায় গ্রহণ</span>
            </button>
          </div>
        </div>

        {/* 3 KPI Banner Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '1rem', 
          marginTop: '1.25rem' 
        }}>
          {/* KPI 1: Total Outstanding Due */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem'
          }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--danger)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              মোট বকেয়া বাকি
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--danger)', margin: '0.25rem 0' }}>
              ৳{(data.totalDue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              দোকানের সর্বমোট প্রাপ্য বাকি
            </div>
          </div>

          {/* KPI 2: Customers with Due */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem'
          }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              বাকি থাকা গ্রাহক
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', margin: '0.25rem 0' }}>
              {data.customersWithDueCount || 0} <span style={{ fontSize: '1rem', fontWeight: 500 }}>জন</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              বর্তমানে যাদের দেনা আছে
            </div>
          </div>

          {/* KPI 3: Today's Collected Dues */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem'
          }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              আজ আদায়কৃত বাকি
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--success)', margin: '0.25rem 0' }}>
              ৳{(data.todayCollected || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              আজ নগদ/অনলাইনে আদায়
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="glass-panel" style={{ padding: '0.5rem 1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className={`btn btn-sm ${activeTab === 'debtors' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('debtors')}
          >
            <UserCheck size={14} />
            <span>গ্রাহকদের বাকি তালিকা ({data.customers?.length || 0})</span>
          </button>
          <button 
            type="button"
            className={`btn btn-sm ${activeTab === 'transactions' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('transactions')}
          >
            <Receipt size={14} />
            <span>বাকি ও আদায় লেনদেন খতিয়ান ({data.recentTransactions?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DEBTORS LIST */}
      {activeTab === 'debtors' && (
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px' }}>
              <input
                type="text"
                className="form-control"
                style={{ width: '100%', paddingLeft: '2.4rem' }}
                placeholder="গ্রাহকের নাম, ফোন বা কার্ড নম্বর দিয়ে খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search 
                size={16} 
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>ফিল্টার:</span>
              <select
                className="form-control"
                style={{ width: 'auto' }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="due">শুধু যাদের বাকি আছে (Due &gt; 0)</option>
                <option value="all">সব গ্রাহক (All Customers)</option>
                <option value="cleared">বাকি পরিশোধিত (Cleared)</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              লোড হচ্ছে...
            </div>
          ) : data.customers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              কোনো তথ্য পাওয়া যায়নি।
            </div>
          ) : (
            <>
              {/* Desktop View Table */}
              <div className="data-table-container desktop-table-view">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>গ্রাহকের নাম ও কার্ড</th>
                      <th>ফোন নম্বর</th>
                      <th>টিয়ার</th>
                      <th>মোট কেনাকাটা</th>
                      <th>সর্বশেষ ভিজিট</th>
                      <th>বকেয়া বাকি</th>
                      <th style={{ textAlign: 'right' }}>পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.customers.map((c) => {
                      const hasDue = (c.due_balance || 0) > 0;
                      return (
                        <tr key={c.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                              {c.first_name} {c.last_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                              {c.card_number}
                            </div>
                          </td>
                          <td style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                            {c.phone || '-'}
                          </td>
                          <td>
                            <span className={`status-pill status-${(c.tier || 'bronze').toLowerCase()}`}>
                              {c.tier || 'Bronze'}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            ৳{(c.total_spent || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                            {c.last_visit ? c.last_visit.split(' ')[0] : '-'}
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              fontWeight: 800,
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.9rem',
                              background: hasDue ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                              color: hasDue ? 'var(--danger)' : 'var(--success)'
                            }}>
                              ৳{(c.due_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                              {hasDue && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  style={{ background: 'var(--danger)', borderColor: 'var(--danger)', fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                                  onClick={() => handleOpenCollect(c)}
                                >
                                  আদায়
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                                onClick={() => onSelectCustomer(c.id)}
                              >
                                প্রোফাইল
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="customer-mobile-card-list">
                {data.customers.map((c) => {
                  const hasDue = (c.due_balance || 0) > 0;
                  return (
                    <div 
                      key={c.id}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-surface)',
                        border: `1px solid ${hasDue ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                            {c.first_name} {c.last_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            {c.card_number} • 📞 {c.phone || 'ফোন নেই'}
                          </div>
                        </div>
                        <span className={`status-pill status-${(c.tier || 'bronze').toLowerCase()}`}>
                          {c.tier || 'Bronze'}
                        </span>
                      </div>

                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: hasDue ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)'
                      }}>
                        <span style={{ fontSize: '0.8rem', color: hasDue ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                          বকেয়া বাকি:
                        </span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: hasDue ? 'var(--danger)' : 'var(--success)' }}>
                          ৳{(c.due_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {hasDue && (
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            style={{ flex: 1, background: 'var(--danger)', borderColor: 'var(--danger)' }}
                            onClick={() => handleOpenCollect(c)}
                          >
                            আদায় করুন
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          style={{ flex: 1 }}
                          onClick={() => onSelectCustomer(c.id)}
                        >
                          প্রোফাইল ও খতিয়ান
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: AUDIT LEDGER TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>সর্বশেষ বাকি ও আদায় খতিয়ান</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              সর্বশেষ ৪০ টি ট্রানজেকশন
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              লোড হচ্ছে...
            </div>
          ) : data.recentTransactions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              কোনো বাকি বা আদায় ট্রানজেকশন পাওয়া যায়নি।
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>তারিখ ও সময়</th>
                    <th>গ্রাহকের নাম ও কার্ড</th>
                    <th>ধরন</th>
                    <th>পরিমাণ</th>
                    <th>পূর্বের বাকি</th>
                    <th>অবশিষ্ট বাকি</th>
                    <th>পেমেন্ট মেথড ও নোট</th>
                    <th>অর্ডারের রসিদ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTransactions.map((tx) => {
                    const isNewDue = tx.type === 'New_Due';
                    return (
                      <tr key={tx.id}>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                          {tx.date}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {tx.customer_name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            {tx.customer_card} {tx.customer_phone ? `• ${tx.customer_phone}` : ''}
                          </div>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: isNewDue ? 'var(--danger)' : 'var(--success)'
                          }}>
                            {isNewDue ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
                            {isNewDue ? 'বাকি সৃষ্টি' : 'বকেয়া আদায়'}
                          </span>
                        </td>
                        <td style={{
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.95rem',
                          color: isNewDue ? 'var(--danger)' : 'var(--success)'
                        }}>
                          {isNewDue ? `+৳${tx.amount.toFixed(2)}` : `-৳${tx.amount.toFixed(2)}`}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                          ৳{(tx.previous_due || 0).toFixed(2)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700 }}>
                          ৳{(tx.remaining_due || 0).toFixed(2)}
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <div>{tx.payment_method || '-'}</div>
                          {tx.notes && <div style={{ color: 'var(--text-dim)' }}>{tx.notes}</div>}
                        </td>
                        <td>
                          {tx.order_id ? (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                              onClick={() => onOpenReceipt(tx.order_id)}
                            >
                              রসিদ
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* QUICK COLLECT DUE MODAL */}
      {showCollectModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '480px', width: '95%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={18} style={{ color: 'var(--primary)' }} />
                <h3 className="modal-title">বকেয়া বাকি আদায় গ্রহণ</h3>
              </div>
              <button 
                type="button" 
                className="modal-close" 
                onClick={() => setShowCollectModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitCollect} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Customer selection if not preselected */}
              <div>
                <label className="input-label">গ্রাহক নির্বাচন *</label>
                {selectedCustomerForCollect ? (
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        {selectedCustomerForCollect.first_name} {selectedCustomerForCollect.last_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        কার্ড: {selectedCustomerForCollect.card_number} • 📞 {selectedCustomerForCollect.phone || 'ফোন নেই'}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem' }}
                      onClick={() => setSelectedCustomerForCollect(null)}
                    >
                      পরিবর্তন
                    </button>
                  </div>
                ) : (
                  <select
                    className="form-control"
                    onChange={(e) => {
                      const cust = data.customers.find(c => c.id === e.target.value);
                      if (cust) {
                        setSelectedCustomerForCollect(cust);
                        setCollectAmount(cust.due_balance > 0 ? String(cust.due_balance) : '');
                      }
                    }}
                    defaultValue=""
                    required
                  >
                    <option value="" disabled>-- বাকি থাকা গ্রাহক নির্বাচন করুন --</option>
                    {data.customers.filter(c => (c.due_balance || 0) > 0).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name} (বাকি: ৳{c.due_balance.toFixed(2)}) - {c.phone || c.card_number}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Due Balance Status */}
              {selectedCustomerForCollect && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 600 }}>
                    বর্তমান মোট বাকি:
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--danger)' }}>
                    ৳{(selectedCustomerForCollect.due_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {/* Amount input */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className="input-label" style={{ margin: 0 }}>পরিশোধের পরিমাণ (টাকা) *</label>
                  {selectedCustomerForCollect && selectedCustomerForCollect.due_balance > 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}
                      onClick={() => setCollectAmount(String(selectedCustomerForCollect.due_balance))}
                    >
                      সম্পূর্ণ বাকি নির্বাচন
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedCustomerForCollect ? selectedCustomerForCollect.due_balance : undefined}
                  className="form-control"
                  placeholder="টাকার পরিমাণ লিখুন"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  required
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem' }}
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="input-label">পেমেন্ট মেথড</label>
                <select
                  className="form-control"
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value)}
                >
                  <option value="নগদ (Cash)">নগদ (Cash)</option>
                  <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
                  <option value="নগদ (Nagad)">নগদ (Nagad)</option>
                  <option value="রকেট (Rocket)">রকেট (Rocket)</option>
                  <option value="ব্যাংক / কার্ড (Bank/Card)">ব্যাংক / কার্ড (Bank/Card)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="input-label">নোট / মন্তব্য (ঐচ্ছিক)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="উদাঃ বাকি পরিশোধ / ১ম কিস্তি"
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                />
              </div>

              {/* Modal Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCollectModal(false)}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || !selectedCustomerForCollect || !collectAmount || parseFloat(collectAmount) <= 0}
                >
                  {isSubmitting ? 'জমা হচ্ছে...' : 'জমা নিশ্চিত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
