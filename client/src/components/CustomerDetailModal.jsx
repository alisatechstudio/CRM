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
  FileText
} from 'lucide-react';
import { api } from '../api';

export default function CustomerDetailModal({ customerId, onClose, onOpenReceipt }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('purchases');
  
  // Points adjust state
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('গ্রাহক সৌজন্য / প্রমোশনাল পয়েন্ট');
  const [adjusting, setAdjusting] = useState(false);

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
          <p style={{ color: 'var(--text-muted)' }}>৩৬০° প্রোফাইল লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '820px', width: '95vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className={`tier-badge tier-${customer.tier}`}>{customer.tier}</span>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
                {customer.first_name} {customer.last_name}
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                {customer.card_number} • সদস্যভুক্তি: {customer.join_date}
              </div>
            </div>
          </div>

          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* RFM Intelligence Ribbon */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '1rem',
            background: 'var(--bg-surface)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                রিসেন্সি (দিন)
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {customer.daysSinceLastVisit} দিন
              </div>
              <div style={{ fontSize: '0.72rem', color: customer.daysSinceLastVisit > 30 ? 'var(--warning)' : 'var(--success)' }}>
                {customer.daysSinceLastVisit > 30 ? 'অনুপস্থিত ঝুঁকি' : 'সক্রিয় ক্রেতা'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                ফ্রিকোয়েন্সি (ভিজিট)
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {customer.visit_count} বার
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                গড় ৳{(customer.aov).toFixed(2)}/ভিজিট
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                লাইফটাইম ভ্যালু (LTV)
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                ৳{customer.total_spent?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                সর্বমোট কেনাকাটা
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                উপলব্ধ পয়েন্ট
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                {customer.points_balance?.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                মূল্য ৳{(customer.points_balance).toFixed(2)} ছাড় সমমূল্য
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <button 
              className={`btn btn-sm ${activeTab === 'purchases' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('purchases')}
            >
              <ShoppingBag size={14} /> ক্রয় ইতিহাস ({customer.orders?.length || 0})
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'loyalty' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('loyalty')}
            >
              <Award size={14} /> পয়েন্ট খতিয়ান ({customer.loyalty?.length || 0})
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'tickets' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('tickets')}
            >
              <FileText size={14} /> সার্ভিস ডেস্ক ({customer.tickets?.length || 0})
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'preferences' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('preferences')}
            >
              <Tag size={14} /> পছন্দ ও নোটস
            </button>
          </div>

          {/* TAB 1: PURCHASES */}
          {activeTab === 'purchases' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {customer.orders?.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                  এখনো কোনো ক্রয়ের ইতিহাস সংরক্ষিত নেই।
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
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        {ord.order_number} • বিল ৳{ord.total.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {ord.created_at} • {ord.store_name} • মাধ্যম: {ord.payment_method}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {ord.items?.map(it => `${it.product_name} (${it.quantity}x)`).join(', ')}
                      </div>
                    </div>

                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => onOpenReceipt(ord.id)}
                    >
                      রসিদ দেখুন
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: LOYALTY LEDGER */}
          {activeTab === 'loyalty' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Quick Adjust Widget */}
              <form onSubmit={handleAdjustPoints} style={{ 
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
                  placeholder="কারণ (যেমন: ভিআইপি বোনাস, রিটার্ন সমন্বয়)"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={adjusting}>
                  {adjusting ? 'সংরক্ষণ হচ্ছে...' : 'পয়েন্ট প্রয়োগ'}
                </button>
              </form>

              {/* Transactions List */}
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>তারিখ</th>
                      <th>লেনদেনের ধরন</th>
                      <th>পয়েন্ট</th>
                      <th>অবশিষ্ট ব্যালেন্স</th>
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
                  এই সদস্যের জন্য কোনো কাস্টমার সার্ভিস টিকিট নেই।
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
                      {t.department} • অগ্রাধিকার: {t.priority} • সময়: {t.created_at}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      {t.details}
                    </div>
                    {t.resolution_notes && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.35rem', fontStyle: 'italic' }}>
                        সমাধান নোট: {t.resolution_notes}
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
                <label className="input-label">স্টোর অ্যাসোসিয়েট অভ্যন্তরীণ সিআরএম নোট</label>
                <textarea 
                  className="form-control"
                  rows={4}
                  style={{ width: '100%', resize: 'vertical', marginTop: '0.25rem' }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="গ্রাহকের বিশেষ পছন্দ, প্রিয় ব্র্যান্ড, সাইজ ইত্যাদি..."
                />
                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ marginTop: '0.5rem' }}
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                >
                  {savingNotes ? 'সংরক্ষণ হচ্ছে...' : 'নোট সংরক্ষণ করুন'}
                </button>
              </div>

              <div>
                <label className="input-label">গ্রাহক পারসোনা ট্যাগ</label>
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
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
