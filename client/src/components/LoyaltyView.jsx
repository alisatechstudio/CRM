import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Sparkles, 
  Tag, 
  Plus, 
  Check, 
  Clock, 
  Gift, 
  Percent, 
  Layers
} from 'lucide-react';
import { api } from '../api';

export default function LoyaltyView() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    title: '',
    discount_type: 'percentage',
    discount_value: '',
    min_spend: 1500,
    max_discount: 500,
    target_tier: 'All',
    expiry_date: '2026-12-31',
    usage_limit: 200
  });
  const [saving, setSaving] = useState(false);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const data = await api.getCoupons();
      setCoupons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.createCoupon(newCoupon);
      setShowAddCoupon(false);
      setNewCoupon({
        code: '',
        title: '',
        discount_type: 'percentage',
        discount_value: '',
        min_spend: 1500,
        max_discount: 500,
        target_tier: 'All',
        expiry_date: '2026-12-31',
        usage_limit: 200
      });
      loadCoupons();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const tierMatrix = [
    {
      tier: 'ব্রোঞ্জ (Bronze)',
      threshold: '০ - ১,৪৯৯ পয়েন্ট',
      multiplier: '১.০x গুণ',
      perks: ['ডিজিটাল সদস্য কার্ড', 'মেম্বারশিপ সেল ডিসকাউন্ট', 'প্রতি ১০০ টাকা কেনাকাটায় পয়েন্ট'],
      color: '#d97706',
      badgeClass: 'tier-Bronze'
    },
    {
      tier: 'সিলভার (Silver)',
      threshold: '১,৫০০ - ৩,৪৯৯ পয়েন্ট',
      multiplier: '১.২৫x গুণ',
      perks: ['+২৫% বোনাস পয়েন্ট বুস্ট', 'ফ্রি গিফট র‍্যাপিং সুবিধা', 'জন্মদিনে ৫০০ টাকার উপহার ভাউচার'],
      color: '#94a3b8',
      badgeClass: 'tier-Silver'
    },
    {
      tier: 'গোল্ড (Gold)',
      threshold: '৩,৫০০ - ৬,৯৯৯ পয়েন্ট',
      multiplier: '১.৫০x গুণ',
      perks: ['+৫০% বোনাস পয়েন্ট বুস্ট', 'একই দিনে ফ্রি হোম ডেলিভারি', 'ত্রৈমাসিক ডাবল পয়েন্ট দিবস'],
      color: '#f59e0b',
      badgeClass: 'tier-Gold'
    },
    {
      tier: 'প্ল্যাটিনাম (Platinum)',
      threshold: '৭,০০০ - ১১,৯৯৯ পয়েন্ট',
      multiplier: '১.৭৫x গুণ',
      perks: ['+৭৫% বোনাস পয়েন্ট বুস্ট', 'আউটলেটে ফাস্ট-ট্র্যাক প্রায়োরিটি ক্যাশ কাউন্টার', 'উৎসবের এক্সক্লুসিভ কালেকশন প্রিভিউ'],
      color: '#a855f7',
      badgeClass: 'tier-Platinum'
    },
    {
      tier: 'ভিআইপি (VIP)',
      threshold: '১২,০০০+ পয়েন্ট',
      multiplier: '২.০০x দ্বিগুণ',
      perks: ['সব ক্রয়ে ২ গুণ ডাবল পয়েন্ট', 'ডেডিকেটেড ব্যক্তিগত কনসিয়ার্জ ও শপার', 'ভিআইপি লাউঞ্জে চা/কফি ও সংবর্ধনা'],
      color: '#ec4899',
      badgeClass: 'tier-VIP'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Overview Banner */}
      <div className="glass-panel" style={{ 
        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(99, 102, 241, 0.1) 100%)',
        border: '1px solid rgba(236, 72, 153, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--tier-vip)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <Award size={16} /> মিজান স্টেশনারি লয়্যালটি ফ্রেমওয়ার্ক
            </div>
            <h2 style={{ fontSize: '1.5rem', margin: '0.35rem 0' }}>মিজান স্টেশনারি লয়্যালটি রিওয়ার্ডস ও পয়েন্টস পলিসি</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              গ্রাহকের সর্বমোট কেনাকাটার ভিত্তিতে স্বয়ংক্রিয় টিয়ার অগ্রগতি, পয়েন্ট মাল্টিপ্লায়ার ও ক্যাশব্যাক রিডেম্পশন পলিসি।
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setShowAddCoupon(true)}>
            <Plus size={16} /> নতুন কুপন ভাউচার তৈরি করুন
          </button>
        </div>
      </div>

      {/* Tier Matrix Cards */}
      <div>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.85rem' }}>সদস্য টিয়ার সুবিধা ও মাল্টিপ্লায়ার ম্যাট্রিক্স</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
          {tierMatrix.map((t) => (
            <div 
              key={t.tier}
              className="glass-panel"
              style={{ 
                padding: '1.25rem',
                borderTop: `4px solid ${t.color}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className={`tier-badge ${t.badgeClass}`}>{t.tier.split(' ')[0]}</span>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: t.color, fontFamily: 'var(--font-mono)' }}>
                    {t.multiplier}
                  </span>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.85rem' }}>
                  পয়েন্ট সীমা: {t.threshold}
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {t.perks.map((p, idx) => (
                    <li key={idx} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                      <Check size={13} style={{ color: t.color, marginTop: '2px', flexShrink: 0 }} />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Coupons & Vouchers Table */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>সক্রিয় স্টোর প্রোমোশনাল ভাউচারসমূহ</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              পিওএস ক্যাশ কাউন্টারে গ্রহণযোগ্য বৈধ কুপন ডিসকাউন্ট কোড
            </p>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ভাউচার কোড</th>
                <th>ক্যাম্পেইন শিরোনাম</th>
                <th>ছাড়ের পরিমাণ</th>
                <th>সর্বনিম্ন বিল</th>
                <th>লক্ষ্যমাত্রা টিয়ার</th>
                <th>ব্যবহার সংখ্যা</th>
                <th>মেয়াদ উত্তীর্ণের তারিখ</th>
                <th>স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    ভাউচার লোড হচ্ছে...
                  </td>
                </tr>
              ) : (
                coupons.map((cp) => (
                  <tr key={cp.id}>
                    <td>
                      <span style={{ 
                        fontFamily: 'var(--font-mono)', 
                        fontWeight: 800, 
                        fontSize: '0.9rem',
                        padding: '0.2rem 0.5rem',
                        background: 'var(--bg-surface-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--primary)'
                      }}>
                        {cp.code}
                      </span>
                    </td>

                    <td style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                      {cp.title}
                    </td>

                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {cp.discount_type === 'percentage' ? `${cp.discount_value}% ছাড়` : `৳${cp.discount_value.toFixed(2)} ক্যাশব্যাক`}
                    </td>

                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                      ৳{cp.min_spend?.toFixed(2)}
                    </td>

                    <td>
                      <span className={cp.target_tier !== 'All' ? `tier-badge tier-${cp.target_tier.replace('+', '')}` : ''} style={{ fontSize: '0.75rem' }}>
                        {cp.target_tier === 'All' ? 'সকলের জন্য' : cp.target_tier}
                      </span>
                    </td>

                    <td style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                      {cp.used_count} / {cp.usage_limit} বার
                    </td>

                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {cp.expiry_date}
                    </td>

                    <td>
                      <span className="status-pill status-low">
                        সক্রিয়
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {showAddCoupon && (
        <div className="modal-overlay" onClick={() => setShowAddCoupon(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>নতুন প্রোমো ভাউচার তৈরি করুন</h2>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowAddCoupon(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateCoupon}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">ভাউচার কোড *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      placeholder="যেমন: EID25"
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">ছাড়ের ধরন *</label>
                    <select 
                      className="form-control"
                      value={newCoupon.discount_type}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                    >
                      <option value="percentage">শতকরা হার (%)</option>
                      <option value="fixed">নির্দিষ্ট টাকা (৳)</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">শিরোনাম / ক্যাম্পেইন বিবরণ *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="যেমন: ঈদ স্পেশাল ২০% ছাড় ভাউচার"
                    value={newCoupon.title}
                    onChange={(e) => setNewCoupon({ ...newCoupon, title: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">মান *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-control" 
                      required 
                      placeholder="20"
                      value={newCoupon.discount_value}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">সর্বনিম্ন বিল (৳)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={newCoupon.min_spend}
                      onChange={(e) => setNewCoupon({ ...newCoupon, min_spend: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">প্রযোজ্য টিয়ার</label>
                    <select 
                      className="form-control"
                      value={newCoupon.target_tier}
                      onChange={(e) => setNewCoupon({ ...newCoupon, target_tier: e.target.value })}
                    >
                      <option value="All">সকল গ্রাহক</option>
                      <option value="Silver+">সিলভার+</option>
                      <option value="Gold+">গোল্ড+</option>
                      <option value="Platinum+">প্ল্যাটিনাম+</option>
                      <option value="VIP">ভিআইপি মাত্র</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">মেয়াদ শেষ *</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      required
                      value={newCoupon.expiry_date}
                      onChange={(e) => setNewCoupon({ ...newCoupon, expiry_date: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">সর্বোচ্চ ব্যবহার সংখ্যা</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={newCoupon.usage_limit}
                      onChange={(e) => setNewCoupon({ ...newCoupon, usage_limit: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddCoupon(false)}>
                  বাতিল
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'তৈরি হচ্ছে...' : 'ভাউচার সক্রিয় করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
