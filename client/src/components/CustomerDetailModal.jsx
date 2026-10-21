import React, { useState, useEffect } from 'react';
import { 
  X, 
  Award, 
  Calendar, 
  Phone, 
  Mail, 
  ShoppingBag, 
  Clock, 
  Tag, 
  Edit3, 
  PlusCircle, 
  Sparkles,
  FileText,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  MessageSquare
} from 'lucide-react';
import { api } from '../api';
import EditOrderModal from './EditOrderModal';
import DeleteOrderModal from './DeleteOrderModal';
import WhatsAppShareModal from './WhatsAppShareModal';
import { buildWhatsAppReceiptText, buildWhatsAppDueStatementText } from '../utils/whatsapp';

export default function CustomerDetailModal({ customerId, onClose, onOpenReceipt }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('purchases');
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [whatsAppOrder, setWhatsAppOrder] = useState(null);
  const [whatsAppDueCustomer, setWhatsAppDueCustomer] = useState(null);
  
  // Points adjust state
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('গ্রাহক সৌজন্য / প্রমোশনাল পয়েন্ট');
  const [adjusting, setAdjusting] = useState(false);

  // Due collection state
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMethod, setCollectMethod] = useState('নগদ (Cash)');
  const [collectNotes, setCollectNotes] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [showCollectForm, setShowCollectForm] = useState(false);

  // Edit notes state
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const data = await api.getCustomerById(customerId);
      setCustomer(data);
      setNotes(data.notes || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) fetchCustomer();
  }, [customerId]);

  const handleAdjustPoints = async (e) => {
    e.preventDefault();
    const pts = parseInt(adjustAmount, 10);
    if (!pts) return;

    try {
      setAdjusting(true);
      await api.adjustPoints(customerId, { points: pts, reason: adjustReason });
      setAdjustAmount('');
      fetchCustomer();
    } catch (err) {
      alert(err.message);
    } finally {
      setAdjusting(false);
    }
  };

  const handleCollectDue = async (e) => {
    e.preventDefault();
    const amt = parseFloat(collectAmount);
    if (!amt || amt <= 0) {
      alert('সঠিক পরিশোধের পরিমাণ (টাকা) দিন');
      return;
    }

    try {
      setCollecting(true);
      await api.collectDue({
        customer_id: customer.id,
        amount: amt,
        payment_method: collectMethod,
        notes: collectNotes
      });
      setCollectAmount('');
      setCollectNotes('');
      setShowCollectForm(false);
      await fetchCustomer();
    } catch (err) {
      alert('বাকি আদায় ব্যর্থ: ' + err.message);
    } finally {
      setCollecting(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      await api.updateCustomer(customerId, { notes });
      fetchCustomer();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  if (!customer && loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '820px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <span className={`tier-badge tier-${customer.tier}`} style={{ flexShrink: 0 }}>{customer.tier}</span>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0, wordBreak: 'break-word' }}>
                {customer.first_name} {customer.last_name}
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {customer.card_number} • {customer.phone}{customer.email ? ` • ${customer.email}` : ''} • যোগদান: {customer.join_date}
              </div>
            </div>
          </div>

          <button className="btn btn-secondary btn-icon" onClick={onClose} style={{ flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {/* RFM Intelligence Ribbon */}
          <div className="rfm-modal-grid">
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                সর্বশেষ ভিজিট
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {customer.daysSinceLastVisit} দিন
              </div>
              <div style={{ fontSize: '0.72rem', color: customer.daysSinceLastVisit > 30 ? 'var(--warning)' : 'var(--success)' }}>
                {customer.daysSinceLastVisit > 30 ? 'ঝুঁকিপূর্ণ' : 'সক্রিয়'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                মোট ভিজিট
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {customer.visit_count} বার
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                গড় ৳{(customer.aov).toFixed(2)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                মোট ক্রয়
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                ৳{customer.total_spent?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                মোট খরচ
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                পয়েন্ট ব্যালেন্স
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                {customer.points_balance?.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                ৳{(customer.points_balance).toFixed(2)} সমমূল্য
              </div>
            </div>

            <div style={{ background: (customer.due_balance > 0) ? 'rgba(239, 68, 68, 0.08)' : undefined }}>
              <div style={{ fontSize: '0.75rem', color: (customer.due_balance > 0) ? 'var(--danger)' : 'var(--text-dim)', fontWeight: 600 }}>
                বকেয়া বাকি
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: (customer.due_balance > 0) ? 'var(--danger)' : 'var(--text-main)' }}>
                ৳{(customer.due_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.72rem', color: (customer.due_balance > 0) ? 'var(--danger)' : 'var(--success)', marginTop: '0.15rem' }}>
                {customer.due_balance > 0 ? (
                  <button 
                    type="button" 
                    className="btn btn-sm btn-primary" 
                    style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: 'var(--danger)', borderColor: 'var(--danger)' }}
                    onClick={() => {
                      setActiveTab('dues');
                      setShowCollectForm(true);
                      setCollectAmount(String(customer.due_balance));
                    }}
                  >
                    আদায় করুন
                  </button>
                ) : 'বাকি নেই'}
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="modal-subnav-tabs">
            <button 
              className={`btn btn-sm ${activeTab === 'purchases' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('purchases')}
            >
              <ShoppingBag size={14} /> ক্রয় ({customer.orders?.length || 0})
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'dues' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('dues')}
              style={{ color: customer.due_balance > 0 ? 'var(--danger)' : undefined, fontWeight: customer.due_balance > 0 ? 700 : undefined }}
            >
              <BookOpen size={14} /> বাকি খাতা {customer.due_balance > 0 ? `(৳${customer.due_balance.toFixed(0)})` : ''}
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'loyalty' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('loyalty')}
            >
              <Award size={14} /> পয়েন্ট ({customer.loyalty?.length || 0})
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'tickets' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('tickets')}
            >
              <FileText size={14} /> টিকেট ({customer.tickets?.length || 0})
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'preferences' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('preferences')}
            >
              <Tag size={14} /> নোটস
            </button>
          </div>

          {/* TAB 1: PURCHASES */}
          {activeTab === 'purchases' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {customer.orders?.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                  কোনো ক্রয়ের ইতিহাস নেই।
                </p>
              ) : (
                customer.orders.map((ord) => (
                  <div key={ord.id} style={{ 
                    padding: '0.85rem 1rem', 
                    background: 'var(--bg-surface)', 
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', wordBreak: 'break-word', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span>{ord.order_number} • মোট ৳{ord.total.toFixed(2)}</span>
                        {ord.payment_status === 'Due' && (
                          <span className="status-pill" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', fontSize: '0.7rem' }}>
                            বাকি: ৳{(ord.due_amount || 0).toFixed(2)}
                          </span>
                        )}
                        {ord.payment_status === 'Partial' && (
                          <span className="status-pill" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', fontSize: '0.7rem' }}>
                            জমা: ৳{(ord.paid_amount || 0).toFixed(2)} • বাকি: ৳{(ord.due_amount || 0).toFixed(2)}
                          </span>
                        )}
                        {(!ord.payment_status || ord.payment_status === 'Paid') && (
                          <span className="status-pill" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', fontSize: '0.7rem' }}>
                            পরিশোধিত
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {ord.created_at} • {ord.store_name} • {ord.payment_method}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', wordBreak: 'break-word' }}>
                        {ord.items?.map(it => `${it.product_name} (${it.quantity}x)`).join(', ')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexShrink: 0 }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => onOpenReceipt(ord.id)}
                        title="রসিদ দেখুন"
                      >
                        রসিদ
                      </button>
                      <button 
                        type="button"
                        className="btn btn-secondary btn-sm btn-icon"
                        onClick={() => setWhatsAppOrder({
                          ...ord,
                          first_name: customer.first_name,
                          last_name: customer.last_name,
                          phone: customer.phone,
                          card_number: customer.card_number,
                          customer_due_balance: customer.due_balance
                        })}
                        title="WhatsApp এ এই রসিদ পাঠান"
                        style={{ width: '30px', height: '30px', padding: 0, color: '#25D366' }}
                      >
                        <MessageSquare size={13} />
                      </button>
                      <button 
                        type="button"
                        className="btn btn-secondary btn-sm btn-icon"
                        onClick={() => setEditingOrderId(ord.id)}
                        title="অর্ডার এডিট / আপডেট করুন"
                        style={{ width: '30px', height: '30px', padding: 0 }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        type="button"
                        className="btn btn-danger btn-sm btn-icon"
                        onClick={() => setDeletingOrder(ord)}
                        title="অর্ডার মুছে ফেলুন"
                        style={{ width: '30px', height: '30px', padding: 0 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: DUES / BAKI KHATA */}
          {activeTab === 'dues' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Due Balance Card & Action Banner */}
              <div style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: (customer.due_balance > 0) ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                border: `1px solid ${(customer.due_balance > 0) ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                    বর্তমান মোট বকেয়া বাকি
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: (customer.due_balance > 0) ? 'var(--danger)' : 'var(--success)' }}>
                    ৳{(customer.due_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {customer.due_balance > 0 ? 'এই গ্রাহকের নিকট দোকান বকেয়া পাওনা রয়েছে' : 'কোনো বকেয়া বা দেনা নেই'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {customer.due_balance > 0 && (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
                        onClick={() => {
                          setShowCollectForm(!showCollectForm);
                          if (!collectAmount) setCollectAmount(String(customer.due_balance));
                        }}
                      >
                        {showCollectForm ? 'ফর্ম লুকান' : 'বাকি আদায় / পরিশোধ'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          background: '#25D366',
                          borderColor: '#25D366',
                          color: '#ffffff',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.8rem',
                          padding: '0.3rem 0.65rem'
                        }}
                        onClick={() => setWhatsAppDueCustomer(customer)}
                        title="WhatsApp এ বকেয়া তাগাদা পাঠান"
                      >
                        <MessageSquare size={13} /> WhatsApp তাগাদা
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Due Collection Form */}
              {showCollectForm && (
                <form onSubmit={handleCollectDue} style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>বকেয়া জমা / কিস্তি আদায় ফরম</span>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm" 
                      style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}
                      onClick={() => setCollectAmount(String(customer.due_balance))}
                    >
                      সম্পূর্ণ বাকি (৳{customer.due_balance}) নির্বাচন
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    <div>
                      <label className="input-label">জমার পরিমাণ (টাকা) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={customer.due_balance}
                        className="form-control"
                        placeholder="টাকার পরিমাণ লিখুন"
                        value={collectAmount}
                        onChange={(e) => setCollectAmount(e.target.value)}
                        required
                        style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                      />
                    </div>
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
                    <div>
                      <label className="input-label">নোট / মন্তব্য (ঐচ্ছিক)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="উদাঃ বাকি পরিশোধ / কিস্তি জমা"
                        value={collectNotes}
                        onChange={(e) => setCollectNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowCollectForm(false)}
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={collecting || !collectAmount || parseFloat(collectAmount) <= 0}
                    >
                      {collecting ? 'জমা হচ্ছে...' : 'জমা নিশ্চিত করুন'}
                    </button>
                  </div>
                </form>
              )}

              {/* Transactions History Ledger */}
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                বাকি লেনদেন ও আদায়ের ইতিহাস ({customer.dueTransactions?.length || 0})
              </div>

              {(!customer.dueTransactions || customer.dueTransactions.length === 0) ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                  কোনো বাকি লেনদেন পাওয়া যায়নি।
                </p>
              ) : (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>তারিখ</th>
                        <th>ধরন</th>
                        <th>পরিমাণ</th>
                        <th>পূর্বের বাকি</th>
                        <th>অবশিষ্ট বাকি</th>
                        <th>মেথড / নোট</th>
                        <th>অর্ডারের রসিদ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.dueTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                            {tx.date}
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: tx.type === 'New_Due' ? 'var(--danger)' : 'var(--success)'
                            }}>
                              {tx.type === 'New_Due' ? 'বাকি সৃষ্টি' : 'বকেয়া পরিশোধ'}
                            </span>
                          </td>
                          <td style={{
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                            color: tx.type === 'New_Due' ? 'var(--danger)' : 'var(--success)'
                          }}>
                            {tx.type === 'New_Due' ? `+৳${tx.amount.toFixed(2)}` : `-৳${tx.amount.toFixed(2)}`}
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
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}
                                onClick={() => onOpenReceipt(tx.order_id)}
                              >
                                রসিদ দেখুন
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LOYALTY LEDGER */}
          {activeTab === 'loyalty' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Quick Adjust Widget */}
              <form onSubmit={handleAdjustPoints} className="modal-quick-adjust-form" style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 2fr auto', 
                gap: '0.5rem',
                background: 'var(--bg-surface)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}>
                <input 
                  type="number"
                  className="form-control"
                  placeholder="+/- পয়েন্ট"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  required
                />
                <input 
                  type="text"
                  className="form-control"
                  placeholder="কারণ (বোনাস, সমন্বয়...)"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={adjusting}>
                  {adjusting ? 'সংরক্ষণ...' : 'যোগ করুন'}
                </button>
              </form>

              {/* Transactions List */}
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>তারিখ</th>
                      <th>ধরন</th>
                      <th>পয়েন্ট</th>
                      <th>ব্যালেন্স</th>
                      <th>বিবরণ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.loyalty?.map((tx) => (
                      <tr key={tx.id}>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                          {tx.created_at}
                        </td>
                        <td>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 700, 
                            color: tx.points > 0 ? 'var(--success)' : 'var(--danger)' 
                          }}>
                            {tx.type === 'Earned' ? 'অর্জিত' : tx.type === 'Redeemed' ? 'রিডিম' : tx.type === 'Bonus' ? 'বোনাস' : 'সমন্বয়'}
                          </span>
                        </td>
                        <td style={{ 
                          fontWeight: 700, 
                          fontFamily: 'var(--font-mono)',
                          color: tx.points > 0 ? 'var(--success)' : 'var(--danger)' 
                        }}>
                          {tx.points > 0 ? `+${tx.points}` : tx.points}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                          {tx.balance_after}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {tx.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TICKETS */}
          {activeTab === 'tickets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {customer.tickets?.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                  কোনো টিকিট নেই।
                </p>
              ) : (
                customer.tickets.map((t) => (
                  <div key={t.id} style={{ 
                    padding: '0.85rem 1rem', 
                    background: 'var(--bg-surface)', 
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        {t.ticket_number} • {t.subject}
                      </span>
                      <span className={`status-pill status-${t.status === 'Resolved' ? 'low' : 'high'}`}>
                        {t.status === 'Resolved' ? 'মীমাংসিত' : t.status === 'In Progress' ? 'চলমান' : 'উন্মুক্ত'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                      {t.department} • {t.priority} • {t.created_at}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      {t.details}
                    </div>
                    {t.resolution_notes && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.35rem', fontStyle: 'italic' }}>
                        সমাধান: {t.resolution_notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: PREFERENCES & NOTES */}
          {activeTab === 'preferences' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label">অভ্যন্তরীণ নোট</label>
                <textarea 
                  className="form-control"
                  rows={4}
                  style={{ width: '100%', resize: 'vertical', marginTop: '0.25rem' }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="গ্রাহকের পছন্দ, নোট ইত্যাদি..."
                />
                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ marginTop: '0.5rem' }}
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                >
                  {savingNotes ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}
                </button>
              </div>

              <div>
                <label className="input-label">ট্যাগ</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                  {customer.tags?.map((tg, i) => (
                    <span key={i} style={{ 
                      padding: '0.25rem 0.65rem', 
                      background: 'var(--primary-light)', 
                      color: 'var(--primary)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      #{tg}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            বন্ধ
          </button>
        </div>
      </div>

      {/* Edit Order Modal */}
      {editingOrderId && (
        <EditOrderModal
          orderId={editingOrderId}
          onClose={() => setEditingOrderId(null)}
          onUpdated={() => {
            fetchCustomer();
          }}
          onDeleted={() => {
            fetchCustomer();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingOrder && (
        <DeleteOrderModal
          order={deletingOrder}
          onClose={() => setDeletingOrder(null)}
          onDeleted={() => {
            fetchCustomer();
          }}
        />
      )}
      {/* WhatsApp Share Order Receipt Modal */}
      {whatsAppOrder && (
        <WhatsAppShareModal
          isOpen={!!whatsAppOrder}
          onClose={() => setWhatsAppOrder(null)}
          title={`WhatsApp এ চালান #${whatsAppOrder.order_number} পাঠান`}
          defaultPhone={whatsAppOrder.phone || customer?.phone || ''}
          customerName={`${customer?.first_name || ''} ${customer?.last_name || ''}`.trim()}
          message={buildWhatsAppReceiptText(whatsAppOrder)}
        />
      )}

      {/* WhatsApp Due Reminder Modal */}
      {whatsAppDueCustomer && (
        <WhatsAppShareModal
          isOpen={!!whatsAppDueCustomer}
          onClose={() => setWhatsAppDueCustomer(null)}
          title={`WhatsApp এ বকেয়া তাগাদা (${customer?.first_name || 'গ্রাহক'})`}
          defaultPhone={customer?.phone || ''}
          customerName={`${customer?.first_name || ''} ${customer?.last_name || ''}`.trim()}
          message={buildWhatsAppDueStatementText({ customer: whatsAppDueCustomer })}
        />
      )}
    </div>
  );
}
