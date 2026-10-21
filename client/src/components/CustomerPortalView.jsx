import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Phone, 
  CreditCard, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Printer, 
  X, 
  FileText, 
  ArrowLeft, 
  Lock, 
  Sparkles, 
  Award, 
  MessageSquare, 
  Copy, 
  Check, 
  Sun, 
  Moon, 
  ChevronRight,
  RefreshCw,
  Wallet,
  Receipt
} from 'lucide-react';
import { api } from '../api';
import { sendToWhatsApp } from '../utils/whatsapp';

export default function CustomerPortalView({ onExitToStaff, initialPhone = '' }) {
  const [identifier, setIdentifier] = useState(initialPhone || (() => localStorage.getItem('crm_portal_phone') || ''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'dues' | 'loyalty'
  
  // Modals
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const [copiedField, setCopiedField] = useState('');

  // Auto-search if initialPhone was provided
  useEffect(() => {
    if (initialPhone && initialPhone.trim()) {
      handleLookup(initialPhone.trim());
    } else {
      const saved = localStorage.getItem('crm_portal_phone');
      if (saved && saved.trim()) {
        handleLookup(saved.trim());
      }
    }
  }, [initialPhone]);

  const handleLookup = async (lookupId) => {
    const idToSearch = (lookupId !== undefined ? lookupId : identifier).trim();
    if (!idToSearch) {
      setError('অনুগ্রহ করে আপনার মোবাইল নম্বর বা মেম্বার কার্ড নম্বর লিখুন');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.customerPortalLookup(idToSearch);
      if (res && res.success) {
        setData(res);
        localStorage.setItem('crm_portal_phone', idToSearch);
      } else {
        setError(res.error || 'তথ্য খুঁজে পাওয়া যায়নি');
      }
    } catch (err) {
      setError(err.message || 'গ্রাহক তথ্য পাওয়া যায়নি। নম্বরটি সঠিক কিনা যাচাই করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleWhatsAppContact = () => {
    if (!data?.customer) return;
    const due = data.customer.due_balance || 0;
    const msg = `আসসালামু আলাইকুম, আমি ${data.customer.first_name} ${data.customer.last_name || ''} (কার্ড: ${data.customer.card_number})।\nমিজান কম্পিউটার অ্যান্ড কসমেটিকস-এ আমার বর্তমান বকেয়া বাকি ৳${due.toFixed(2)}।\nআমি এটি পরিশোধ সংক্রান্ত তথ্য জানতে চাই।`;
    sendToWhatsApp({ phone: data.store?.phone || '01309965422', message: msg });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-app)',
      color: 'var(--text-main)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Navbar */}
      <header style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0.85rem 1.25rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          {/* Logo / Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
            }}>
              <ShoppingBag size={18} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, letterSpacing: '-0.01em', color: 'var(--text-main)' }}>
                মিজান কম্পিউটার অ্যান্ড কসমেটিকস
              </h1>
              <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700 }}>
                গ্রাহক সেলফ-সার্ভিস পোর্টাল
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <a
              href="tel:+8801309965422"
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
            >
              <Phone size={13} />
              <span className="hidden-mobile">কল করুন</span>
            </a>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onExitToStaff}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700 }}
              title="দোকানের ক্যাশিয়ার বা অ্যাডমিন লগইন"
            >
              <Lock size={13} />
              <span>স্টাফ লগইন</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '1.25rem 1rem 3rem', maxWidth: '900px', width: '100%', margin: '0 auto' }}>
        {/* Lookup Box (shown at top or when no data) */}
        {!data && (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-md)',
            marginTop: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <Receipt size={28} />
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 900, margin: '0 0 0.5rem' }}>
              আপনার বাকি ও অর্ডারের হিসাব দেখুন
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 auto 1.5rem', maxWidth: '520px', lineHeight: 1.5 }}>
              দোকানের সকল ক্যাশ মেমো, পূর্বের কেনাকাটার বিস্তারিত তালিকা এবং বর্তমান বকেয়া বাকি সরাসরি আপনার মোবাইল থেকেই দেখতে পারবেন।
            </p>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup();
              }}
              style={{ maxWidth: '440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
            >
              <div style={{ position: 'relative' }}>
                <Phone 
                  size={16} 
                  style={{ 
                    position: 'absolute', 
                    left: '0.9rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: 'var(--text-muted)' 
                  }} 
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="আপনার ১১ সংখ্যার মোবাইল নম্বর (উদাঃ 017...)"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setError('');
                  }}
                  style={{
                    paddingLeft: '2.5rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    height: '46px'
                  }}
                  autoFocus
                />
                {identifier && (
                  <button
                    type="button"
                    onClick={() => setIdentifier('')}
                    style={{
                      position: 'absolute',
                      right: '0.8rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {error && (
                <div style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--danger)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  textAlign: 'left'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  height: '46px',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>লোড হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    <span>হিসাব দেখুন</span>
                  </>
                )}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              দোকানের ঠিকানা: চন্ডিপুর পুরান বাজার, নড়িয়া, শরীয়তপুর • হেল্পলাইন: +880 1309-965422
            </div>
          </div>
        )}

        {/* Customer Data View */}
        {data && data.customer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Top Bar with Re-search link */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`status-pill status-${(data.customer.tier || 'bronze').toLowerCase()}`} style={{ fontWeight: 800 }}>
                  {data.customer.tier} মেম্বার
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  কার্ড: {data.customer.card_number}
                </span>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setData(null);
                  setError('');
                }}
                style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <ArrowLeft size={13} />
                <span>অন্য নম্বর খুঁজুন</span>
              </button>
            </div>

            {/* Profile Greeting Ribbon */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>সম্মানিত গ্রাহক,</div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, margin: '0.15rem 0 0.35rem' }}>
                  {data.customer.first_name} {data.customer.last_name}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span>📞 {data.customer.phone}</span>
                  <span>•</span>
                  <span>যোগদান: {data.customer.join_date || '২০২৬'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={handleWhatsAppContact}
                  style={{
                    background: '#25D366',
                    borderColor: '#25D366',
                    color: '#ffffff',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.78rem'
                  }}
                >
                  <MessageSquare size={14} />
                  <span>WhatsApp সাহায্য</span>
                </button>
              </div>
            </div>

            {/* Financial Highlights KPI Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '0.85rem'
            }}>
              {/* Due Balance Card (Top Priority) */}
              <div style={{
                background: (data.customer.due_balance > 0) 
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.05))' 
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.05))',
                border: `1px solid ${(data.customer.due_balance > 0) ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div>
                  <div style={{ 
                    fontSize: '0.78rem', 
                    fontWeight: 700, 
                    color: (data.customer.due_balance > 0) ? 'var(--danger)' : 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>{data.customer.due_balance > 0 ? '⚠️ মোট বকেয়া বাকি' : '✅ বকেয়া স্ট্যাটাস'}</span>
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      background: (data.customer.due_balance > 0) ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      fontWeight: 800
                    }}>
                      {data.customer.due_balance > 0 ? 'পরিশোধ বাকি' : 'পরিশোধিত'}
                    </span>
                  </div>

                  <div style={{
                    fontSize: '1.85rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-mono)',
                    color: (data.customer.due_balance > 0) ? 'var(--danger)' : 'var(--success)',
                    marginTop: '0.35rem'
                  }}>
                    ৳{Number(data.customer.due_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                    {data.customer.due_balance > 0 
                      ? 'দোকানে এসে বা বিকাশ/নগদে পরিশোধ করতে পারেন' 
                      : 'আপনার কোনো বকেয়া বাকি নেই। ধন্যবাদ!'}
                  </div>
                </div>

                {data.customer.due_balance > 0 && (
                  <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => setShowPaymentInfo(true)}
                      style={{
                        flex: 1,
                        background: 'var(--danger)',
                        borderColor: 'var(--danger)',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Wallet size={13} />
                      <span>বিকাশ/নগদে পরিশোধ</span>
                    </button>

                    <a
                      href="tel:+8801309965422"
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      title="দোকানে সরাসরি কল করুন"
                    >
                      <Phone size={13} />
                    </a>
                  </div>
                )}
              </div>

              {/* Loyalty Points Card */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Award size={14} />
                    <span>জমানো রিওয়ার্ড পয়েন্ট</span>
                  </div>

                  <div style={{
                    fontSize: '1.85rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--primary)',
                    marginTop: '0.35rem'
                  }}>
                    {Number(data.customer.points_balance || 0).toLocaleString()} pt
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700, marginTop: '0.2rem' }}>
                    = ৳{Number(data.customer.points_balance || 0).toLocaleString()} ছাড়ের সমতুল্য
                  </div>
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                  দোকানে পরবর্তী কেনাকাটায় এই পয়েন্ট ব্যবহার করে সরাসরি ক্যাশ ডিসকাউন্ট পাবেন।
                </div>
              </div>

              {/* Lifetime Purchases Card */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    সর্বমোট কেনাকাটা
                  </div>

                  <div style={{
                    fontSize: '1.85rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-main)',
                    marginTop: '0.35rem'
                  }}>
                    ৳{Number(data.customer.total_spent || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                    মোট {data.customer.visit_count || 0} বার কেনাকাটা করেছেন
                  </div>
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                  সর্বশেষ ভিজিট: {data.customer.last_visit || 'তথ্য নেই'}
                </div>
              </div>
            </div>

            {/* Portal Tabs Navigation */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-subtle)',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.2rem'
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                style={{
                  padding: '0.65rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'orders' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                  color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <Receipt size={15} />
                <span>সকল চালান ও রসিদ ({data.orders?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('dues')}
                style={{
                  padding: '0.65rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'dues' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                  color: activeTab === 'dues' ? 'var(--primary)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <FileText size={15} />
                <span>বাকি ও জমার খতিয়ান ({data.dueTransactions?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('loyalty')}
                style={{
                  padding: '0.65rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'loyalty' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                  color: activeTab === 'loyalty' ? 'var(--primary)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <Sparkles size={15} />
                <span>মেম্বারশিপ সুবিধা</span>
              </button>
            </div>

            {/* TAB 1: ORDERS & RECEIPTS */}
            {activeTab === 'orders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {(!data.orders || data.orders.length === 0) ? (
                  <div style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '2.5rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)'
                  }}>
                    কোনো পূর্বের অর্ডার পাওয়া যায়নি
                  </div>
                ) : (
                  data.orders.map((ord) => {
                    const isDue = ord.due_amount > 0;
                    return (
                      <div
                        key={ord.id}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem 1.15rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.65rem',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        {/* Header: Order Number, Date, Status */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span>চালান #{ord.order_number}</span>
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '0.1rem 0.4rem',
                                borderRadius: 'var(--radius-sm)',
                                background: isDue ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                color: isDue ? 'var(--danger)' : 'var(--success)',
                                fontWeight: 800
                              }}>
                                {isDue ? `বাকি: ৳${ord.due_amount.toFixed(0)}` : 'পরিশোধিত'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                              {ord.dhaka_date} {ord.dhaka_time ? `• ${ord.dhaka_time}` : ''} • মাধ্যম: {ord.payment_method}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedReceiptOrder(ord)}
                            style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Receipt size={13} />
                            <span>রসিদ দেখুন</span>
                          </button>
                        </div>

                        {/* Items list preview */}
                        <div style={{
                          background: 'var(--bg-app)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.65rem 0.85rem',
                          fontSize: '0.78rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem'
                        }}>
                          {ord.items?.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                                {it.product_name || it.name} ({it.quantity || it.qty}x)
                              </span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                                ৳{(it.total_price || (it.quantity * it.unit_price) || 0).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Financial breakdown line */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.82rem',
                          borderTop: '1px solid var(--border-subtle)',
                          paddingTop: '0.5rem',
                          flexWrap: 'wrap',
                          gap: '0.5rem'
                        }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>মোট বিল: </span>
                            <span style={{ fontWeight: 900, fontFamily: 'var(--font-mono)' }}>৳{ord.total?.toFixed(2)}</span>
                            {((ord.discount_amount || 0) + (ord.manual_discount || 0) + (ord.points_discount || 0)) > 0 && (
                              <span style={{ color: 'var(--success)', fontSize: '0.72rem', marginLeft: '0.4rem' }}>
                                (ছাড়: ৳{((ord.discount_amount || 0) + (ord.manual_discount || 0) + (ord.points_discount || 0)).toFixed(2)})
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>জমা: <strong>৳{ord.paid_amount?.toFixed(2)}</strong></span>
                            {isDue && (
                              <span style={{ color: 'var(--danger)', fontWeight: 800 }}>বাকি: ৳{ord.due_amount?.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: DUES & PAYMENT LEDGER */}
            {activeTab === 'dues' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(!data.dueTransactions || data.dueTransactions.length === 0) ? (
                  <div style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '2.5rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)'
                  }}>
                    কোনো বাকি লেনদেন বা জমার খতিয়ান নেই
                  </div>
                ) : (
                  data.dueTransactions.map((tx, idx) => {
                    const isPayment = tx.type === 'Payment_Collected' || tx.type === 'Paid' || tx.amount < 0;
                    return (
                      <div
                        key={tx.id || idx}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.85rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '0.12rem 0.45rem',
                              borderRadius: 'var(--radius-sm)',
                              background: isPayment ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: isPayment ? 'var(--success)' : 'var(--danger)'
                            }}>
                              {isPayment ? 'জমা / পরিশোধ' : 'নতুন চালান বাকি'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                              {tx.date || tx.createdAt?.split(' ')[0] || ''}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            {tx.notes || (isPayment ? 'বকেয়া পরিশোধ' : 'পণ্য ক্রয়ে বাকি')} • মাধ্যম: {tx.payment_method || 'নগদ'}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontSize: '0.98rem',
                            fontWeight: 900,
                            fontFamily: 'var(--font-mono)',
                            color: isPayment ? 'var(--success)' : 'var(--danger)'
                          }}>
                            {isPayment ? '-' : '+'}৳{Math.abs(tx.amount || 0).toFixed(2)}
                          </div>
                          {tx.remaining_due !== undefined && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>
                              অবশিষ্ট বাকি: ৳{Number(tx.remaining_due).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 3: MEMBERSHIP & REWARDS */}
            {activeTab === 'loyalty' && (
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 0.35rem' }}>
                    মেম্বারশিপ সুবিধা ও নিয়মাবলী
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
                    মিজান কম্পিউটার অ্যান্ড কসমেটিকস-এর সম্মানিত মেম্বার হিসেবে আপনি প্রতিটি ক্রয়ে পয়েন্ট অর্জন করেন যা পরবর্তী কেনাকাটায় নগদ টাকার সমপরিমাণ ছাড় হিসেবে ব্যবহারযোগ্য।
                  </p>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.85rem'
                }}>
                  <div style={{ padding: '0.85rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--primary)' }}>১. পয়েন্ট অর্জনের নিয়ম</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                      প্রতি ১০০ টাকার কেনাকাটায় ১ পয়েন্ট। সিলভার, গোল্ড ও ভিআইপি লেভেলে পয়েন্ট গুণিতক আকারে বৃদ্ধি পায়।
                    </div>
                  </div>

                  <div style={{ padding: '0.85rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--success)' }}>২. পয়েন্ট রিডিম / ছাড়</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                      ১ পয়েন্ট = ১ টাকা। কেনাকাটার সময় ক্যাশিয়ারকে বললে সরাসরি আপনার বিল থেকে পয়েন্ট ছাড় করিয়ে দেওয়া হবে।
                    </div>
                  </div>

                  <div style={{ padding: '0.85rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-main)' }}>৩. বকেয়া পরিশোধের নিয়ম</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                      বাকি থাকা বিলগুলো দোকানে এসে সরাসরি বা বিকাশ/নগদে পরিশোধ করে নিশ্চিন্তে কেনাকাটা বজায় রাখুন।
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: BKASH / NAGAD PAYMENT INSTRUCTIONS */}
      {showPaymentInfo && (
        <div className="modal-overlay" onClick={() => setShowPaymentInfo(false)}>
          <div 
            className="modal-card" 
            style={{ maxWidth: '440px', background: 'var(--bg-app)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1rem' }}>
                <Wallet size={18} style={{ color: 'var(--primary)' }} />
                <span>বিকাশ / নগদে বাকি পরিশোধ</span>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowPaymentInfo(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                দোকানের নিচের বিকাশ বা নগদ নম্বরে সেন্ড মানি (Send Money) করে আপনার বকেয়া পরিশোধ করতে পারেন:
              </div>

              {/* bKash Box */}
              <div style={{
                background: '#e2136e15',
                border: '1px solid #e2136e40',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#e2136e', fontSize: '0.85rem' }}>বিকাশ (Personal / Send Money)</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                    01309-965422
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopy('01309965422', 'bkash')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem' }}
                >
                  {copiedField === 'bkash' ? <Check size={12} color="green" /> : <Copy size={12} />}
                  <span>{copiedField === 'bkash' ? 'কপি হয়েছে' : 'নম্বর কপি'}</span>
                </button>
              </div>

              {/* Nagad Box */}
              <div style={{
                background: '#f7941d15',
                border: '1px solid #f7941d40',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#f7941d', fontSize: '0.85rem' }}>নগদ (Personal / Send Money)</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                    01309-965422
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopy('01309965422', 'nagad')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem' }}
                >
                  {copiedField === 'nagad' ? <Check size={12} color="green" /> : <Copy size={12} />}
                  <span>{copiedField === 'nagad' ? 'কপি হয়েছে' : 'নম্বর কপি'}</span>
                </button>
              </div>

              <div style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem',
                fontSize: '0.75rem',
                color: 'var(--text-dim)',
                lineHeight: 1.45
              }}>
                💡 <strong>টাকা পাঠানোর সময়:</strong> রেফারেন্সে আপনার মেম্বার কার্ড নং (<strong>{data?.customer?.card_number}</strong>) বা মোবাইল নম্বর লিখুন এবং টাকা পাঠানো শেষে WhatsApp এ জানান।
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={handleWhatsAppContact}
                style={{
                  background: '#25D366',
                  borderColor: '#25D366',
                  color: '#ffffff',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <MessageSquare size={14} />
                <span>WhatsApp এ জানান</span>
              </button>

              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPaymentInfo(false)}>
                বন্ধ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: THERMAL DIGITAL RECEIPT POPUP */}
      {selectedReceiptOrder && (
        <div className="modal-overlay" onClick={() => setSelectedReceiptOrder(null)}>
          <div 
            className="modal-card" 
            style={{ maxWidth: '420px', background: 'var(--bg-app)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <span style={{ fontWeight: 800 }}>ক্যাশ মেমো / রসিদ</span>
              <button className="btn btn-secondary btn-icon" onClick={() => setSelectedReceiptOrder(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="thermal-receipt" id="printable-portal-receipt">
                <div className="thermal-receipt-center">
                  <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>
                    {data.store?.name || 'মিজান কম্পিউটার অ্যান্ড কসমেটিকস'}
                  </div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#374151' }}>
                    {data.store?.subName || 'MIJAN COMPUTER & COSMETICS'}
                  </div>
                  <div style={{ fontSize: '0.78rem', marginTop: '0.2rem', color: '#1f2937' }}>
                    {data.store?.location}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                    মোবাইল: {data.store?.phone}
                  </div>
                </div>

                <div className="thermal-divider" />

                <div style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>চালান নং: {selectedReceiptOrder.order_number}</span>
                  <span>{selectedReceiptOrder.dhaka_date}</span>
                </div>
                <div style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>গ্রাহক: {data.customer.first_name} {data.customer.last_name}</span>
                  <span>{selectedReceiptOrder.dhaka_time}</span>
                </div>

                <div className="thermal-divider" />

                <div style={{ fontSize: '0.8rem' }}>
                  {selectedReceiptOrder.items?.map((it, idx) => (
                    <div key={idx} style={{ marginBottom: '0.45rem' }}>
                      <div style={{ fontWeight: 'bold' }}>{it.product_name || it.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#374151' }}>
                        <span>{it.quantity || it.qty} x ৳{Number(it.unit_price || 0).toFixed(2)}</span>
                        <span style={{ fontWeight: 'bold' }}>৳{Number(it.total_price || (it.quantity * it.unit_price) || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="thermal-divider" />

                <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>সাবটোটাল:</span>
                    <span>৳{Number(selectedReceiptOrder.subtotal || selectedReceiptOrder.total || 0).toFixed(2)}</span>
                  </div>
                  {selectedReceiptOrder.discount_amount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                      <span>ভাউচার ছাড়:</span>
                      <span>-৳{Number(selectedReceiptOrder.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  {selectedReceiptOrder.manual_discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b45309' }}>
                      <span>বিশেষ ছাড়:</span>
                      <span>-৳{Number(selectedReceiptOrder.manual_discount).toFixed(2)}</span>
                    </div>
                  )}
                  {selectedReceiptOrder.points_discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4f46e5' }}>
                      <span>পয়েন্ট ছাড়:</span>
                      <span>-৳{Number(selectedReceiptOrder.points_discount).toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1rem', marginTop: '0.25rem', borderTop: '1px solid #111', paddingTop: '0.25rem' }}>
                    <span>মোট বিল:</span>
                    <span>৳{Number(selectedReceiptOrder.total || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>জমা / পরিশোধ:</span>
                    <span>৳{Number(selectedReceiptOrder.paid_amount || 0).toFixed(2)}</span>
                  </div>
                  {selectedReceiptOrder.due_amount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 800, color: '#dc2626' }}>
                      <span>বাকি (Due):</span>
                      <span>৳{Number(selectedReceiptOrder.due_amount).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="thermal-divider" />

                <div className="thermal-receipt-center" style={{ fontSize: '0.72rem', color: '#4b5563' }}>
                  <div>কেনাকাটার জন্য আন্তরিক ধন্যবাদ!</div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedReceiptOrder(null)}>
                বন্ধ
              </button>
              <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={15} />
                <span>প্রিন্ট</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
