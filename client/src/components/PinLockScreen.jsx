import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldCheck, Delete, KeyRound, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function PinLockScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);

  // Change PIN modal state
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [changeMsg, setChangeMsg] = useState({ text: '', type: '' });
  const [isChanging, setIsChanging] = useState(false);

  const handleDigit = (digit) => {
    if (isVerifying || isSuccess) return;
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        verify(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (isVerifying || isSuccess) return;
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    if (isVerifying || isSuccess) return;
    setPin('');
    setError('');
  };

  const verify = async (pinToVerify) => {
    setIsVerifying(true);
    setError('');
    try {
      // Primary backend validation
      const res = await api.verifyPin(pinToVerify);
      if (res && res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onUnlock();
        }, 500);
      } else {
        triggerError('ভুল পিন কোড! আবার চেষ্টা করুন।');
      }
    } catch (err) {
      // Fallback to 0000 if network or server error
      if (pinToVerify === '0000') {
        setIsSuccess(true);
        setTimeout(() => {
          onUnlock();
        }, 500);
      } else {
        triggerError(err.message || 'ভুল পিন কোড! আবার চেষ্টা করুন।');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const triggerError = (msg) => {
    setError(msg);
    setPin('');
    const card = document.getElementById('pin-card');
    if (card) {
      card.classList.add('shake-anim');
      setTimeout(() => card.classList.remove('shake-anim'), 600);
    }
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showChangePin) return;
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isVerifying, isSuccess, showChangePin]);

  const handleChangePinSubmit = async (e) => {
    e.preventDefault();
    if (!oldPin || !newPin) {
      setChangeMsg({ text: 'সকল ফিল্ড পূরণ করুন', type: 'error' });
      return;
    }
    if (newPin.length < 4) {
      setChangeMsg({ text: 'নতুন পিন কমপক্ষে ৪ ডিজিটের হতে হবে', type: 'error' });
      return;
    }
    if (newPin !== confirmPin) {
      setChangeMsg({ text: 'নতুন পিন ও নিশ্চিতকরণ পিন মিলছে না', type: 'error' });
      return;
    }

    setIsChanging(true);
    setChangeMsg({ text: '', type: '' });
    try {
      const res = await api.changePin(oldPin, newPin);
      setChangeMsg({ text: res.message || 'পিন সফলভাবে পরিবর্তন হয়েছে!', type: 'success' });
      setTimeout(() => {
        setShowChangePin(false);
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
        setChangeMsg({ text: '', type: '' });
      }, 1500);
    } catch (err) {
      setChangeMsg({ text: err.message || 'পিন পরিবর্তন ব্যর্থ হয়েছে। বর্তমান পিন যাচাই করুন।', type: 'error' });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="pin-lock-overlay">
      <div className="pin-lock-card" id="pin-card">
        {/* Brand Header */}
        <div className="pin-lock-header">
          <div className="pin-icon-wrapper">
            {isSuccess ? (
              <Unlock size={32} className="text-emerald-400" />
            ) : (
              <Lock size={32} className="text-indigo-400" />
            )}
          </div>
          <h1 className="pin-brand-title">মিজান স্টেশনারি</h1>
          <p className="pin-brand-subtitle">চন্ডিপুর পুরান বাজার, নড়িয়া, শরীয়তপুর</p>
          <div className="pin-system-badge">
            <ShieldCheck size={14} />
            <span>সুরক্ষিত সিআরএম ও পিওএস সিস্টেম</span>
          </div>
        </div>

        {/* PIN Indicators */}
        <div className="pin-indicators-container">
          <p className="pin-prompt-text">
            {isSuccess ? 'স্বাগতম! আনলক হচ্ছে...' : 'প্রবেশ করতে ৪-ডিজিট পিন দিন'}
          </p>

          <div className="pin-dots-wrapper">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`pin-dot ${isFilled ? 'filled' : ''} ${error ? 'error' : ''} ${isSuccess ? 'success' : ''}`}
                >
                  {isFilled && <span className="pin-dot-glow"></span>}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="pin-error-banner">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div className="pin-success-banner">
              <CheckCircle2 size={15} />
              <span>সঠিক পিন! লোড হচ্ছে...</span>
            </div>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="pin-keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              className="keypad-btn"
              onClick={() => handleDigit(String(num))}
              disabled={isVerifying || isSuccess}
            >
              <span className="keypad-num">{num}</span>
            </button>
          ))}

          <button
            type="button"
            className="keypad-btn keypad-fn"
            onClick={handleClear}
            disabled={isVerifying || isSuccess}
            title="সব মুছুন (Clear)"
          >
            <span>C</span>
          </button>

          <button
            type="button"
            className="keypad-btn"
            onClick={() => handleDigit('0')}
            disabled={isVerifying || isSuccess}
          >
            <span className="keypad-num">0</span>
          </button>

          <button
            type="button"
            className="keypad-btn keypad-fn"
            onClick={handleBackspace}
            disabled={isVerifying || isSuccess}
            title="ব্যাকস্পেস (Backspace)"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Change PIN Link */}
        <div className="pin-footer-actions">
          <button
            type="button"
            className="pin-link-btn"
            onClick={() => setShowChangePin(true)}
          >
            <KeyRound size={14} />
            <span>পিন পরিবর্তন করুন</span>
          </button>
        </div>
      </div>

      {/* Change PIN Modal */}
      {showChangePin && (
        <div className="pin-modal-overlay">
          <div className="pin-modal-content">
            <div className="pin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>সিকিউরিটি পিন পরিবর্তন</h3>
              </div>
              <button 
                className="close-modal-btn" 
                onClick={() => setShowChangePin(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePinSubmit} className="pin-modal-body">
              {changeMsg.text && (
                <div className={`pin-banner ${changeMsg.type}`}>
                  {changeMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  <span>{changeMsg.text}</span>
                </div>
              )}

              <div className="form-group">
                <label>বর্তমান পিন (Old PIN):</label>
                <input
                  type="password"
                  maxLength={6}
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="বর্তমান পিন কোড"
                  required
                  className="pin-input-field"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>নতুন পিন (New 4-digit PIN):</label>
                <input
                  type="password"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="নতুন ৪-ডিজিট পিন দিন"
                  required
                  className="pin-input-field"
                />
              </div>

              <div className="form-group">
                <label>নতুন পিন নিশ্চিত করুন (Confirm PIN):</label>
                <input
                  type="password"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="নতুন পিন পুনরায় দিন"
                  required
                  className="pin-input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary w-full"
                  onClick={() => setShowChangePin(false)}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={isChanging}
                >
                  {isChanging ? 'আপডেট হচ্ছে...' : 'পিন সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
