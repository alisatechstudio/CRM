import React, { useState } from 'react';
import { X, Send, Copy, Check, Phone, MessageSquare, AlertCircle } from 'lucide-react';
import { normalizeWhatsAppNumber, formatDisplayPhone, sendToWhatsApp } from '../utils/whatsapp';

export default function WhatsAppShareModal({
  isOpen,
  onClose,
  title = 'WhatsApp এ রসিদ পাঠান',
  defaultPhone = '',
  customerName = '',
  message = '',
  onSent
}) {
  const [phone, setPhone] = useState(defaultPhone || '');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = message;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSend = () => {
    setError('');
    const trimmed = (phone || '').trim();
    const normalized = normalizeWhatsAppNumber(trimmed);

    if (trimmed && !normalized) {
      setError('অনুগ্রহ করে সঠিক মোবাইল নম্বর প্রদান করুন');
      return;
    }

    sendToWhatsApp({ phone: trimmed, message });
    if (onSent) onSent();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '480px', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#25D366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(37, 211, 102, 0.4)'
            }}>
              <MessageSquare size={17} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{title}</h3>
              {customerName && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>
                  গ্রাহক: <strong>{customerName}</strong>
                </div>
              )}
            </div>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.1rem' }}>
          {/* Phone Number Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              কাস্টমারের WhatsApp নম্বর:
            </label>
            <div style={{ position: 'relative' }}>
              <Phone 
                size={15} 
                style={{ 
                  position: 'absolute', 
                  left: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-muted)' 
                }} 
              />
              <input
                type="tel"
                className="form-control"
                placeholder="যেমন: 01700-000000"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError('');
                }}
                style={{
                  paddingLeft: '2.25rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.92rem',
                  fontWeight: 600
                }}
                autoFocus={!defaultPhone}
              />
            </div>
            {error ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                <AlertCircle size={13} />
                <span>{error}</span>
              </div>
            ) : (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
                নম্বর খালি রাখলে সরাসরি WhatsApp ওপেন হবে এবং আপনি যে কাউকে সিলেক্ট করে পাঠাতে পারবেন।
              </div>
            )}
          </div>

          {/* Message Preview Box */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                মেসেজ প্রিভিউ (যা কাস্টমার পাবেন):
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopy}
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                {copied ? (
                  <>
                    <Check size={12} style={{ color: 'var(--success)' }} />
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>কপি হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>কপি করুন</span>
                  </>
                )}
              </button>
            </div>

            <pre style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem',
              fontSize: '0.75rem',
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '180px',
              overflowY: 'auto',
              color: 'var(--text-main)',
              margin: 0,
              fontFamily: 'inherit'
            }}>
              {message}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            বাতিল
          </button>

          <button
            type="button"
            className="btn"
            onClick={handleSend}
            style={{
              background: '#25D366',
              borderColor: '#25D366',
              color: '#ffffff',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 2px 8px rgba(37, 211, 102, 0.35)'
            }}
          >
            <Send size={15} />
            <span>WhatsApp এ পাঠান</span>
          </button>
        </div>
      </div>
    </div>
  );
}
