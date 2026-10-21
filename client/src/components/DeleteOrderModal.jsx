import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, CheckCircle } from 'lucide-react';
import { api } from '../api';

export default function DeleteOrderModal({ order, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!order) return null;

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      await api.deleteOrder(order.id);
      if (onDeleted) onDeleted(order.id);
      onClose();
    } catch (err) {
      setError(err.message || 'অর্ডার মুছে ফেলতে ব্যর্থ হয়েছে');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '480px' }} 
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontWeight: 800 }}>
            <AlertTriangle size={20} />
            <span>অর্ডার মুছে ফেলার নিশ্চিতকরণ</span>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem' }}>
          {error && (
            <div style={{ 
              padding: '0.65rem 0.85rem', 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(239, 68, 68, 0.12)', 
              color: 'var(--danger)',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', margin: '0 0 0.5rem', lineHeight: 1.5 }}>
              আপনি কি নিশ্চিত যে চালান <strong style={{ color: 'var(--primary)' }}>#{order.order_number}</strong> মুছে ফেলতে চান?
            </p>
            <div style={{
              background: 'var(--bg-app)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.82rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>গ্রাহকের নাম:</span>
                <span style={{ fontWeight: 600 }}>{order.customer_first_name ? `${order.customer_first_name} ${order.customer_last_name}` : (order.first_name ? `${order.first_name} ${order.last_name}` : 'সাধারণ খুচরা ক্রেতা')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>মোট বিল:</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>৳{order.total?.toFixed(2)}</span>
              </div>
              {order.due_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                  <span>বাকি টাকার পরিমাণ:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>৳{order.due_amount?.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem',
            fontSize: '0.78rem',
            color: 'var(--text-main)',
            lineHeight: 1.5
          }}>
            <strong style={{ display: 'block', color: 'var(--warning)', marginBottom: '0.2rem' }}>
              সিস্টেম প্রভাব ও হিসাব সমন্বয়:
            </strong>
            <ul style={{ margin: 0, paddingLeft: '1.15rem' }}>
              <li>এই চালানের সব পণ্যের পরিমাণ ইনভেন্টরি স্টকে ফেরত যোগ হবে।</li>
              {order.due_amount > 0 && <li>গ্রাহকের বাকি খাতা থেকে বাকি টাকা স্বয়ংক্রিয়ভাবে বাদ যাবে।</li>}
              {order.earned_points > 0 && <li>অর্জিত পয়েন্ট গ্রাহকের অ্যাকাউন্ট থেকে বাদ যাবে।</li>}
            </ul>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={deleting}
          >
            বাতিল
          </button>
          <button 
            type="button" 
            className="btn btn-danger" 
            onClick={handleDelete}
            disabled={deleting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Trash2 size={15} /> {deleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, ডিলিট করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
