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
  DollarSign,
  Trash2,
  Tag,
  Radio,
  X
} from 'lucide-react';
import { api } from '../api';

export default function CampaignsView() {
  const [campaigns, setCampaigns] = useState([]);
  const [segments, setSegments] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [newCamp, setNewCamp] = useState({
    name: '',
    channel: 'SMS',
    target_segment: '',
    subject: '',
    content: 'প্রিয় {first_name}, মিজান কম্পিউটার অ্যান্ড কসমেটিকসের বিশেষ অফারে উপভোগ করুন আকর্ষণীয় ছাড়! কুপন কোড: {coupon_code}',
    coupon_code: ''
  });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campsRes, segsRes, coupsRes] = await Promise.allSettled([
        api.getCampaigns(),
        api.getCampaignSegments(),
        api.getCoupons()
      ]);

      if (campsRes.status === 'fulfilled' && Array.isArray(campsRes.value)) {
        setCampaigns(campsRes.value);
      }
      if (segsRes.status === 'fulfilled' && Array.isArray(segsRes.value)) {
        setSegments(segsRes.value);
        if (segsRes.value.length > 0 && !newCamp.target_segment) {
          setNewCamp(prev => ({ ...prev, target_segment: segsRes.value[0].name }));
        }
      }
      if (coupsRes.status === 'fulfilled' && Array.isArray(coupsRes.value)) {
        setCoupons(coupsRes.value.filter(cp => cp.is_active));
      }
    } catch (err) {
      console.error('Failed to load campaigns data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = (initialSegment = '') => {
    const defaultSegment = initialSegment || (segments[0]?.name || 'সকল নিবন্ধিত সদস্য (All Members)');
    const defaultCoupon = coupons[0]?.code || '';
    setNewCamp({
      name: '',
      channel: 'SMS',
      target_segment: defaultSegment,
      subject: '',
      content: 'প্রিয় {first_name}, মিজান কম্পিউটার অ্যান্ড কসমেটিকসের বিশেষ অফারে উপভোগ করুন আকর্ষণীয় ছাড়! কুপন কোড: {coupon_code}',
      coupon_code: defaultCoupon
    });
    setShowCreate(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCamp.name.trim() || !newCamp.subject.trim() || !newCamp.content.trim()) {
      alert('অনুগ্রহ করে ক্যাম্পেইনের নাম, বিষয় ও মূল বার্তা প্রদান করুন');
      return;
    }
    try {
      setSaving(true);
      await api.createCampaign({
        ...newCamp,
        target_segment: newCamp.target_segment || (segments[0]?.name || 'সকল নিবন্ধিত সদস্য (All Members)')
      });
      setShowCreate(false);
      loadData();
    } catch (err) {
      alert('ক্যাম্পেইন তৈরি ব্যর্থ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (id) => {
    if (!confirm('আপনি কি এই ক্যাম্পেইনটি নির্বাচিত গ্রাহকদের নিকট প্রেরণ করতে চান?')) {
      return;
    }
    try {
      setSendingId(id);
      await api.sendCampaign(id);
      loadData();
    } catch (err) {
      alert('ক্যাম্পেইন প্রেরণ ব্যর্থ: ' + err.message);
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই ক্যাম্পেইনটি মুছে ফেলতে চান?')) {
      return;
    }
    try {
      setDeletingId(id);
      await api.deleteCampaign(id);
      loadData();
    } catch (err) {
      alert('ক্যাম্পেইন মুছে ফেলা ব্যর্থ: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Real-time Database KPI Calculations
  const totalCampaigns = campaigns.length;
  const sentCampaigns = campaigns.filter(c => c.status === 'Sent');
  const sentCount = sentCampaigns.length;
  const totalAudienceReached = sentCampaigns.reduce((sum, c) => sum + (c.audience_count || 0), 0);
  const totalRevenueGenerated = sentCampaigns.reduce((sum, c) => sum + (c.revenue_generated || 0), 0);
  const avgOpenRate = sentCount > 0 ? (sentCampaigns.reduce((sum, c) => sum + (c.open_rate || 0), 0) / sentCount).toFixed(1) : '0';
  const avgConversionRate = sentCount > 0 ? (sentCampaigns.reduce((sum, c) => sum + (c.conversion_rate || 0), 0) / sentCount).toFixed(1) : '0';

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
              <Target size={16} /> টার্গেটেড ওমনিচ্যানেল যোগাযোগ
            </div>
            <h2 style={{ fontSize: '1.5rem', margin: '0.35rem 0' }}>মার্কেটিং ক্যাম্পেইন ও আরএফএম গ্রাহক সেগমেন্টেশন</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              ডাটাবেসের গ্রাহক প্রোফাইল, লয়্যালটি স্কোর ও কেনাকাটার হিসেব অনুযায়ী স্বয়ংক্রিয় প্রচারণা ও বিক্রয় বৃদ্ধি।
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => handleOpenCreateModal()}>
            <Plus size={16} /> নতুন ক্যাম্পেইন তৈরি করুন
          </button>
        </div>
      </div>

      {/* KPI Stats Overview from Database */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Radio size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>মোট ক্যাম্পেইন (DB)</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{totalCampaigns} টি</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{sentCount} টি প্রেরিত / {totalCampaigns - sentCount} ড্রাফট</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ক্যাম্পেইন অর্জিত বিক্রয়</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>
              ৳{totalRevenueGenerated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>গড় রূপান্তর: {avgConversionRate}%</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>মোট রিচড গ্রাহক</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{totalAudienceReached} জন</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>গড় ওপেন হার: {avgOpenRate}%</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>সক্রিয় কুপন ভাউচার</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{coupons.length} টি</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>প্রচারণায় সংযুক্তযোগ্য</div>
          </div>
        </div>
      </div>

      {/* Dynamic Database Driven RFM Cohorts */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>স্বয়ংক্রিয় আরএফএম সেগমেন্ট গ্রুপসমূহ (লাইভ ডাটাবেস)</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>যেকোনো সেগমেন্টে ক্লিক করে সরাসরি ক্যাম্পেইন তৈরি করুন</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))', gap: '1rem' }}>
          {segments.map((seg) => (
            <div 
              key={seg.id} 
              className="glass-panel" 
              style={{ 
                padding: '1.1rem', 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onClick={() => handleOpenCreateModal(seg.name)}
              title="এই সেগমেন্টের গ্রাহকদের জন্য নতুন ক্যাম্পেইন তৈরি করুন"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>{seg.name}</div>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.4, minHeight: '34px' }}>
                {seg.desc}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{seg.criteria}</span>
                <span style={{ fontSize: '0.95rem', color: 'var(--secondary)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {seg.count} জন সদস্য
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="glass-panel" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.05rem', margin: 0 }}>মার্কেটিং ক্যাম্পেইন তালিকা ({campaigns.length} টি)</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>MongoDB ডাটাবেস থেকে রিয়েল-টাইম লোডকৃত</span>
        </div>
        <div className="data-table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ক্যাম্পেইনের নাম ও বিষয়</th>
                <th>মাধ্যম</th>
                <th>টার্গেট সেগমেন্ট</th>
                <th>সংযুক্ত ভাউচার</th>
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
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    মার্কেটিং ক্যাম্পেইন লোড হচ্ছে...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    এখনো কোনো ক্যাম্পেইন তৈরি করা হয়নি। নতুন ক্যাম্পেইন তৈরি করুন।
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
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
                        color: c.channel === 'SMS' ? '#06b6d4' : c.channel === 'Email' ? '#a855f7' : '#10b981'
                      }}>
                        {c.channel === 'SMS' ? <MessageSquare size={13} /> : c.channel === 'Email' ? <Mail size={13} /> : <Radio size={13} />}
                        {c.channel}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {c.target_segment}
                      </span>
                    </td>

                    <td>
                      {c.coupon_code ? (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.25rem', 
                          fontSize: '0.75rem', 
                          fontFamily: 'var(--font-mono)', 
                          color: 'var(--primary)',
                          background: 'rgba(99, 102, 241, 0.1)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          <Tag size={11} /> {c.coupon_code}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>

                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {c.status === 'Sent' ? `${c.audience_count} জন প্রাপক` : 'ড্রাফট (অপ্রেরিত)'}
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
                          ৳{c.revenue_generated?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {c.status === 'Sent' ? (
                          <span className="status-pill status-low">
                            <CheckCircle size={12} /> প্রেরিত ({c.sent_at ? c.sent_at.split(' ')[0] : 'সম্পন্ন'})
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

                        <button 
                          className="btn btn-secondary btn-icon btn-sm"
                          disabled={deletingId === c.id}
                          onClick={() => handleDelete(c.id)}
                          title="ক্যাম্পেইন মুছে ফেলুন"
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
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
          <div className="modal-card" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                <Target size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <h2 style={{ fontSize: '1.15rem', margin: 0, wordBreak: 'break-word', minWidth: 0 }}>নতুন মার্কেটিং ক্যাম্পেইন তৈরি (Database Driven)</h2>
              </div>
              <button className="btn btn-secondary btn-icon" style={{ flexShrink: 0 }} onClick={() => setShowCreate(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="modal-form" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: 0, overflowY: 'auto' }}>
                <div className="input-group">
                  <label className="input-label">ক্যাম্পেইনের নাম *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="যেমন: এইচএসসি ও ভর্তি প্রস্তুতি স্পেশাল অফার"
                    value={newCamp.name}
                    onChange={(e) => setNewCamp({ ...newCamp, name: e.target.value })}
                  />
                </div>

                <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">প্রচারণা মাধ্যম *</label>
                    <select 
                      className="form-control"
                      value={newCamp.channel}
                      onChange={(e) => setNewCamp({ ...newCamp, channel: e.target.value })}
                    >
                      <option value="SMS">এসএমএস বার্তা (SMS)</option>
                      <option value="Email">ইমেইল নিউজলেটার (Email)</option>
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
                      {segments.map(seg => (
                        <option key={seg.id} value={seg.name}>
                          {seg.name} ({seg.count} জন প্রাপক)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">বার্তার বিষয় / হেডার *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="যেমন: প্রিয় {first_name}, খাতা-কলমে বিশেষ ছাড়!"
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
                  <label className="input-label">সংযুক্ত ভাউচার কোড (ডাটাবেস কুপন তালিকা)</label>
                  <select 
                    className="form-control"
                    value={newCamp.coupon_code}
                    onChange={(e) => setNewCamp({ ...newCamp, coupon_code: e.target.value })}
                  >
                    <option value="">কোনো কুপন সংযুক্ত নয়</option>
                    {coupons.map(cp => (
                      <option key={cp.code} value={cp.code}>
                        {cp.code} — {cp.title} ({cp.discount_type === 'percentage' ? `${cp.discount_value}% ছাড়` : `৳${cp.discount_value} ছাড়`})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                  বাতিল
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Plus size={15} /> {saving ? 'সংরক্ষণ হচ্ছে...' : 'ড্রাফট হিসেবে সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
