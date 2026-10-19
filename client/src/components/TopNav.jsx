import React from 'react';
import { UserPlus, ShoppingBag, ShieldCheck, MapPin, Lock } from 'lucide-react';

export default function TopNav({ 
  currentTab, 
  activeStore, 
  onOpenNewCustomer, 
  onQuickPOS,
  onLockApp
}) {
  const titles = {
    dashboard: 'এক্সিকিউটিভ বিআই ড্যাশবোর্ড ও রিটেইল অ্যানালিটিক্স',
    pos: 'পয়েন্ট অব সেল (পিওএস) ও ক্যাশ রেজিস্টার',
    customers: 'কাস্টমার ৩৬০° প্রোফাইল ও ডিরেক্টরি',
    inventory: 'ডিপার্টমেন্টাল ক্যাটালগ ও লাইভ স্টক ট্র্যাকিং',
    loyalty: 'লয়্যালটি রিওয়ার্ডস প্রোগ্রাম ও টিয়ার পলিসি',
    campaigns: 'ওমনিচ্যানেল বিপণন ও গ্রাহক সেগমেন্টেশন',
    tickets: 'গ্রাহক সেবা ও পণ্য এক্সচেঞ্জ ডেস্ক'
  };

  return (
    <header className="top-navbar">
      <div>
        <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>
          {titles[currentTab] || 'ডিপার্টমেন্টাল স্টোর সিআরএম'}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <MapPin size={13} style={{ color: 'var(--primary)' }} />
          <span>{activeStore?.name || 'মিজান কম্পিউটার অ্যান্ড কসমেটিকস'} • {activeStore?.location || 'চন্ডিপুর পুরান বাজার, নড়িয়া, শরীয়তপুর'}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {currentTab !== 'pos' && (
          <button className="btn btn-secondary btn-sm" onClick={onQuickPOS}>
            <ShoppingBag size={15} style={{ color: 'var(--secondary)' }} />
            <span>পিওএস শুরু করুন</span>
          </button>
        )}

        <button className="btn btn-primary btn-sm" onClick={onOpenNewCustomer}>
          <UserPlus size={15} />
          <span>নতুন মেম্বার যুক্ত করুন</span>
        </button>

        <button 
          className="btn btn-secondary btn-sm" 
          onClick={onLockApp} 
          title="অ্যাপ্লিকেশন লক করুন"
          style={{ 
            color: '#f87171', 
            borderColor: 'rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.08)' 
          }}
        >
          <Lock size={14} />
          <span>লক করুন</span>
        </button>

        {/* Staff / Manager Tag */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.6rem', 
          padding: '0.35rem 0.75rem',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)',
          marginLeft: '0.5rem'
        }}>
          <div style={{ 
            width: '28px', 
            height: '28px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #6366f1, #a855f7)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.75rem'
          }}>
            মি
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>মিজানুর রহমান</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <ShieldCheck size={11} style={{ color: 'var(--success)' }} /> স্বত্বাধিকারী ও ব্যবস্থাপক
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
