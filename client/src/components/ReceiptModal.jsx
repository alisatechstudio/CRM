import React, { useState, useEffect } from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';
import { api } from '../api';

export default function ReceiptModal({ orderId, onClose }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      api.getOrderById(orderId)
        .then(setOrder)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  if (!order && loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-card" style={{ maxWidth: '380px', padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>রসিদ লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '440px', width: '95vw', background: 'var(--bg-app)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 700 }}>
            <CheckCircle size={18} /> অর্ডার সফলভাবে সম্পন্ন
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Printable Thermal Receipt Box */}
          <div className="thermal-receipt" id="printable-receipt">
            <div className="thermal-receipt-center">
              <div style={{ fontWeight: 900, fontSize: '1.3rem', letterSpacing: '0.02em' }}>
                মিজান স্টেশনারি
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#374151', letterSpacing: '0.08em' }}>
                MIJAN STATIONARY & GENERAL STORE
              </div>
              <div style={{ fontSize: '0.82rem', marginTop: '0.25rem', fontWeight: 600, color: '#1f2937' }}>
                {order.store_location || 'চন্ডিপুর পুরান বাজার, নড়িয়া, শরীয়তপুর'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                মোবাইল: {order.store_phone || '+৮৮০ ১৭১১-২১০২০৩'}
              </div>
            </div>

            <div className="thermal-divider" />

            <div style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>চালান নং: {order.order_number}</span>
              <span>{order.created_at?.split(' ')[0]}</span>
            </div>
            <div style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>ক্যাশিয়ার: {order.cashier_name}</span>
              <span>{order.created_at?.split(' ')[1]}</span>
            </div>

            {order.first_name && (
              <div style={{ fontSize: '0.78rem', marginTop: '0.35rem', background: '#f3f4f6', padding: '0.4rem', borderRadius: '4px' }}>
                <div>মেম্বার: <strong>{order.first_name} {order.last_name}</strong> ({order.tier})</div>
                <div>কার্ড নং: {order.card_number}</div>
              </div>
            )}

            <div className="thermal-divider" />

            {/* Line Items */}
            <div style={{ fontSize: '0.8rem' }}>
              {order.items?.map((it, idx) => (
                <div key={idx} style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 'bold' }}>{it.product_name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#374151' }}>
                    <span>{it.quantity} x ৳{it.unit_price.toFixed(2)}</span>
                    <span style={{ fontWeight: 'bold' }}>৳{it.total_price.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="thermal-divider" />

            {/* Financial Totals */}
            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>উপমোট:</span>
                <span>৳{order.subtotal?.toFixed(2)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                  <span>প্রোমো ভাউচার ছাড়:</span>
                  <span>-৳{order.discount_amount?.toFixed(2)}</span>
                </div>
              )}
              {order.manual_discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b45309' }}>
                  <span>ম্যানুয়াল ছাড় {order.manual_discount_reason ? `(${order.manual_discount_reason})` : ''}:</span>
                  <span>-৳{order.manual_discount?.toFixed(2)}</span>
                </div>
              )}
              {order.points_discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4f46e5' }}>
                  <span>লয়্যালটি পয়েন্ট ছাড় ({order.points_redeemed} পয়েন্ট):</span>
                  <span>-৳{order.points_discount?.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>সরকারি ভ্যাট (৮%):</span>
                <span>৳{order.tax?.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1rem', marginTop: '0.35rem', borderTop: '1px solid #111', paddingTop: '0.35rem' }}>
                <span>সর্বমোট পরিশোধিত:</span>
                <span>৳{order.total?.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#4b5563' }}>
                <span>পেমেন্ট মাধ্যম:</span>
                <span>{order.payment_method}</span>
              </div>
            </div>

            <div className="thermal-divider" />

            <div className="thermal-receipt-center" style={{ fontSize: '0.75rem', color: '#374151' }}>
              <div style={{ fontWeight: 700 }}>মিজান স্টেশনারিতে কেনাকাটার জন্য আন্তরিক ধন্যবাদ!</div>
              <div>রসিদসহ ১৫ দিনের মধ্যে অক্ষত পণ্য পরিবর্তনযোগ্য।</div>
              <div style={{ marginTop: '0.5rem', fontFamily: 'monospace', fontSize: '0.7rem', letterSpacing: '0.2em' }}>
                * |||||| | ||||| |||| || ||| *
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            বন্ধ করুন
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> রসিদ প্রিন্ট করুন
          </button>
        </div>
      </div>
    </div>
  );
}
