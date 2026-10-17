import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Mail, 
  MessageSquare, 
  Plus, 
  TrendingUp, 
  CheckCircle, 
  Users, 
  Target, 
  Sparkles,
  DollarSign
} from 'lucide-react';
import { api } from '../api';

export default function CampaignsView() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [sendingId, setSendingId] = useState(null);

  const [newCamp, setNewCamp] = useState({
    name: '',
    channel: 'ইমেইল (Email)',
    target_segment: 'ভিআইপি ক্রেতা (VIP Shoppers)',
    subject: '',
    content: 'প্রিয় {first_name}, আমাদের বিশেষ অফারে উপভোগ করুন ২০% ছাড় ভাউচার কোড: {coupon_code}!',
    coupon_code: 'VIPCLUB25'
  });
  const [saving, setSaving] = useState(false);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await api.getCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.createCampaign(newCamp);
      setShowCreate(false);
      setNewCamp({
        name: '',
        channel: 'ইমেইল (Email)',
        target_segment: 'ভিআইপি ক্রেতা (VIP Shoppers)',
        subject: '',
        content: 'প্রিয় {first_name}, আমাদের বিশেষ অফারে উপভোগ করুন ২০% ছাড় ভাউচার কোড: {coupon_code}!',
        coupon_code: 'VIPCLUB25'
      });
      loadCampaigns();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (id) => {
    try {
      setSendingId(id);
      await api.sendCampaign(id);
      loadCampaigns();
    } catch (err) {
      alert(err.message);
    } finally {
      setSendingId(null);
    }
  };

  const segments = [
    { name: 'ভিআইপি ক্রেতা (VIP)', desc: '৫০,০০০+ টাকা কেনাকাটা করা শীর্ষ ক্রেতা', size: '১২৪ জন সক্রিয়' },
    { name: 'ঝুঁকিপূর্ণ গ্রাহক (Churn)', desc: '৬০ দিনের বেশি সময় স্টোরে আসেননি', size: '৬৮ জন গ্রাহক' },
    { name: 'উচ্চ এলটিভি গ্রাহক', desc: 'নিয়মিত ও উচ্চ বাস্কেট ভ্যালু ক্রেতাবৃন্দ', size: '২১৫ জন গ্রাহক' },
    { name: 'গ্রোসারি ও ফ্রেশপ্রেমী', desc: 'খাঁটি মুদিপণ্য ও অর্গানিক নিয়মিত ক্রেতা', size: '৮৫০ জন নিয়মিত' },
    { name: '৩০ দিন নিষ্ক্রিয় গ্রাহক', desc: 'পুনরায় আকৃষ্ট করার উপযোগী গ্রাহকদল', size: '৪৬০ জন গ্রাহক' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Panel */}
      <div className="glass-panel" style={{ 
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(99, 102, 241, 0.1) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--secondary)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <Target size={16} /> টার্গেটেড গ্রাহক যোগাযোগ
            </div>
            <h2 style={{ fontSize: '1.5rem', margin: '0.35rem 0' }}>মার্কেটিং ক্যাম্পেইন ও আরএফএম গ্রাহক সেগমেন্টেশন</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              গ্রাহকের কেনাকাটার ফ্রিকোয়েন্সি ও মূল্যের ভিত্তিতে এসএমএস এবং ইমেইল প্রচারণার স্বয়ংক্রিয় ব্লাস্ট।
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> নতুন ক্যাম্পেইন তৈরি করুন
          </button>
        </div>
      </div>

      {/* RFM Cohorts Quick Bar */}
      <div>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>স্বয়ংক্রিয় আরএফএম সেগমেন্ট গ্রুপসমূহ</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {segments.map((seg) => (
            <div key={seg.name} className="glass-panel" style={{ padding: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{seg.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.5rem' }}>{seg.desc}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {seg.size}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="glass-panel" style={{ padding: 0 }}>
        <div className="data-table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ক্যাম্পেইনের নাম ও বিষয়</th>
                <th>মাধ্যম</th>
                <th>টার্গেট সেগমেন্ট</th>
                <th>প্রাপক সংখ্যা</th>
                <th>ওপেন / ক্লিক হার</th>
                <th>রূপান্তর (কনভার্সন)</th>
                <th>অর্জিত বিক্রয়</th>
                <th style={{ textAlign: 'right' }}>স্ট্যাটাস / অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    মার্কেটিং ক্যাম্পেইন লোড হচ্ছে...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    এখনো কোনো ক্যাম্পেইন তৈরি করা হয়নি।
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        বিষয়: {c.subject}
                      </div>
                    </td>

                    <td>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.35rem', 
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: c.channel === 'SMS' ? '#06b6d4' : '#a855f7'
                      }}>
                        {c.channel === 'SMS' ? <MessageSquare size={13} /> : <Mail size={13} />}
                        {c.channel}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {c.target_segment}
                      </span>
                    </td>

                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {c.audience_count > 0 ? `${c.audience_count} জন প্রাপক` : '—'}
                    </td>

                    <td>
                      {c.status === 'Sent' ? (
                        <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ color: 'var(--success)', fontWeight: 700 }}>{c.open_rate}%</span> / {c.click_rate}%
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>পাঠানো হয়নি</span>
                      )}
                    </td>

                    <td>
                      {c.status === 'Sent' ? (
                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                          {c.conversion_rate}%
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>

                    <td>
                      {c.status === 'Sent' ? (
                        <span style={{ fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
                          ৳{c.revenue_generated?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      {c.status === 'Sent' ? (
                        <span className="status-pill status-low">
                          প্রেরিত ({c.sent_at?.split(' ')[0]})
                        </span>
                      ) : (
                        <button 
                          className="btn btn-primary btn-sm"
                          disabled={sendingId === c.id}
                          onClick={() => handleSend(c.id)}
                        >
                          <Send size={13} />
                          {sendingId === c.id ? 'প্রেরণ চলছে...' : 'ব্লাস্ট পাঠান'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-card" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>নতুন মার্কেটিং ক্যাম্পেইন তৈরি</h2>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowCreate(false)}>✕</button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">ক্যাম্পেইনের নাম *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="যেমন: পহেলা বৈশাখ মেগা অফার ও ডাবল পয়েন্ট"
                    value={newCamp.name}
                    onChange={(e) => setNewCamp({ ...newCamp, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">প্রচারণা মাধ্যম *</label>
                    <select 
                      className="form-control"
                      value={newCamp.channel}
                      onChange={(e) => setNewCamp({ ...newCamp, channel: e.target.value })}
                    >
                      <option value="Email">ইমেইল নিউজলেটার (Email)</option>
                      <option value="SMS">এসএমএস বার্তা (SMS)</option>
                      <option value="Omnichannel">ওমনিচ্যানেল (ইমেইল + এসএমএস)</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">টার্গেট গ্রাহক সেগমেন্ট *</label>
                    <select 
                      className="form-control"
                      value={newCamp.target_segment}
                      onChange={(e) => setNewCamp({ ...newCamp, target_segment: e.target.value })}
                    >
                      <option value="VIP Shoppers">ভিআইপি ক্রেতা (VIP Shoppers)</option>
                      <option value="Churn Risk">ঝুঁকিপূর্ণ গ্রাহক (Churn Risk)</option>
                      <option value="High LTV">উচ্চ এলটিভি গ্রাহক (High LTV)</option>
                      <option value="Fresh Food Lovers">মুদি ও ফ্রেশপ্রেমী</option>
                      <option value="Inactive 30d">৩০ দিন নিষ্ক্রিয় গ্রাহক</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">বার্তার বিষয় / হেডার *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="যেমন: প্রিয় {first_name}, আপনার জন্য বিশেষ উপহার!"
                    value={newCamp.subject}
                    onChange={(e) => setNewCamp({ ...newCamp, subject: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">বার্তার মূল বিষয়বস্তু *</label>
                  <textarea 
                    className="form-control" 
                    rows={4} 
                    required
                    value={newCamp.content}
                    onChange={(e) => setNewCamp({ ...newCamp, content: e.target.value })}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                    গ্রাহকের নাম ডায়নামিক রাখতে <code>{'{first_name}'}</code> এবং কুপনের জন্য <code>{'{coupon_code}'}</code> ব্যবহার করুন।
                  </span>
                </div>

                <div className="input-group">
                  <label className="input-label">সংযুক্ত ভাউচার কোড (ঐচ্ছিক)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="যেমন: BOISHAKH20"
                    value={newCamp.coupon_code}
                    onChange={(e) => setNewCamp({ ...newCamp, coupon_code: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                  বাতিল
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'সংরক্ষণ হচ্ছে...' : 'ড্রাফট হিসেবে সংরক্ষণ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
