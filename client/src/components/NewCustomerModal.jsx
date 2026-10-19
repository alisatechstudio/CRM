import React, { useState } from 'react';
import { X, UserPlus, Sparkles, Award } from 'lucide-react';
import { api } from '../api';

export default function NewCustomerModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birthday: '',
    preferred_department: 'খাতা, ডায়েরি ও কাগজ সামগ্রী',
    notes: '',
    tags: ['নতুন মেম্বার']
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const created = await api.createCustomer(formData);
      onCreated(created);
      onClose();
    } catch (err) {
      alert('সদস্য নিবন্ধন ব্যর্থ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <div className="brand-icon" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
              <UserPlus size={16} />
            </div>
            <h2 style={{ fontSize: '1.15rem', margin: 0, wordBreak: 'break-word' }}>মিজান মেম্বার নিবন্ধন ফরম</h2>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose} style={{ flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.08) 100%)', 
              padding: '0.75rem 1rem', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Award size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span>নতুন সদস্যরা স্বয়ংক্রিয়ভাবে একটি <strong>ব্রোঞ্জ লয়্যালটি কার্ড</strong> এবং <strong>৫০ ওয়েলকাম বোনাস পয়েন্ট</strong> পাবেন।</span>
            </div>

            <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">নামের প্রথম অংশ *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="যেমন: ড. আরিফুল"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">নামের শেষ অংশ *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="যেমন: ইসলাম"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">ইমেইল ঠিকানা *</label>
                <input 
                  type="email" 
                  className="form-control" 
                  required 
                  placeholder="ariful.islam@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">মোবাইল ফোন নম্বর *</label>
                <input 
                  type="tel" 
                  className="form-control" 
                  required 
                  placeholder="+৮৮০ ১৭১১-২৩৪৫৬৭"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">পছন্দের স্টেশনারি বিভাগ</label>
                <select 
                  className="form-control"
                  value={formData.preferred_department}
                  onChange={(e) => setFormData({ ...formData, preferred_department: e.target.value })}
                >
                  <option value="খাতা, ডায়েরি ও কাগজ সামগ্রী">খাতা, ডায়েরি ও কাগজ সামগ্রী</option>
                  <option value="কলম, পেন্সিল ও মার্কার">কলম, পেন্সিল ও মার্কার</option>
                  <option value="আর্ট, ক্রাফট ও ড্রয়িং">আর্ট, ক্রাফট ও ড্রয়িং</option>
                  <option value="অফিস সাপ্লাই ও ফাইল ফোল্ডার">অফিস সাপ্লাই ও ফাইল ফোল্ডার</option>
                  <option value="ক্যালকুলেটর, জ্যামিতি ও ব্যাগ">ক্যালকুলেটর, জ্যামিতি ও ব্যাগ</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">জন্মতারিখ (বিশেষ অফারের জন্য)</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={formData.birthday}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">গ্রাহক পারসোনা ট্যাগ</label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                {formData.tags.map(t => (
                  <span key={t} style={{ 
                    padding: '0.2rem 0.5rem', 
                    background: 'var(--bg-surface-elevated)', 
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}>
                    #{t}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveTag(t)}
                      style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
              <input 
                type="text" 
                className="form-control" 
                placeholder="ট্যাগ লিখে এন্টার চাপুন (যেমন: বিশ্ববিদ্যালয় শিক্ষক, করপোরেট ক্লায়েন্ট)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
            </div>

            <div className="input-group">
              <label className="input-label">প্রাথমিক নোট ও পছন্দ</label>
              <textarea 
                className="form-control" 
                rows={2} 
                placeholder="গ্রাহকের বিশেষ পছন্দ, প্রিয় ব্র্যান্ড, প্রতিষ্ঠানের নাম ইত্যাদি..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              বাতিল
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'নিবন্ধন হচ্ছে...' : 'নিবন্ধন ও সদস্য কার্ড তৈরি'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
