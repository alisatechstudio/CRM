import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  UserCheck, 
  Phone, 
  Mail, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  Eye, 
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { api } from '../api';

export default function CustomersView({ onSelectCustomer, onOpenNewCustomer }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('All');
  const [churnFilter, setChurnFilter] = useState('All');
  const [sortBy, setSortBy] = useState('total_spent');
  const [sortOrder, setSortOrder] = useState('DESC');

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers({
        search,
        tier: tierFilter,
        churn_risk: churnFilter,
        sort_by: sortBy,
        order: sortOrder
      });
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search, tierFilter, churnFilter, sortBy, sortOrder]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header with Search and Filters */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', margin: 0 }}>কাস্টমার ৩৬০° মেম্বার ডিরেক্টরি</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              গ্রাহকের প্রোফাইল অনুসন্ধান, লাইফটাইম ভ্যালু (এলটিভি) ও লয়্যালটি আরএফএম বিশ্লেষণ।
            </p>
          </div>

          <button className="btn btn-primary" onClick={onOpenNewCustomer}>
            + নতুন মেম্বার যুক্ত করুন
          </button>
        </div>

        {/* Filter Controls Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '1rem', marginTop: '1.25rem' }}>
          {/* Search Box */}
          <div className="input-group">
            <label className="input-label">গ্রাহক অনুসন্ধান</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                style={{ width: '100%', paddingLeft: '2.4rem' }}
                placeholder="নাম, ফোন নম্বর, কার্ড # বা ইমেইল..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search 
                size={16} 
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} 
              />
            </div>
          </div>

          {/* Tier Filter */}
          <div className="input-group">
            <label className="input-label">লয়্যালটি টিয়ার</label>
            <select 
              className="form-control"
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
            >
              <option value="All">সকল টিয়ার</option>
              <option value="VIP">ভিআইপি (VIP)</option>
              <option value="Platinum">প্ল্যাটিনাম (Platinum)</option>
              <option value="Gold">গোল্ড (Gold)</option>
              <option value="Silver">সিলভার (Silver)</option>
              <option value="Bronze">ব্রোঞ্জ (Bronze)</option>
            </select>
          </div>

          {/* Churn Risk Filter */}
          <div className="input-group">
            <label className="input-label">ঝুঁকির মাত্রা (Churn)</label>
            <select 
              className="form-control"
              value={churnFilter}
              onChange={(e) => setChurnFilter(e.target.value)}
            >
              <option value="All">সকল ঝুঁকির মাত্রা</option>
              <option value="Low">কম ঝুঁকি (নিয়মিত)</option>
              <option value="Medium">মাঝারি ঝুঁকি</option>
              <option value="High">উচ্চ ঝুঁকি (অনুপস্থিত)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="input-group">
            <label className="input-label">সর্ট ক্রম</label>
            <select 
              className="form-control"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="total_spent">সর্বোচ্চ কেনাকাটা (৳)</option>
              <option value="points_balance">পয়েন্ট ব্যালেন্স</option>
              <option value="visit_count">ভিজিট সংখ্যা</option>
              <option value="last_visit">সর্বশেষ স্টোর ভিজিট</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="glass-panel" style={{ padding: 0 }}>
        <div className="data-table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>গ্রাহকের নাম ও পছন্দ</th>
                <th>কার্ড ও যোগাযোগ</th>
                <th>টিয়ার</th>
                <th>পয়েন্ট ব্যালেন্স</th>
                <th>লাইফটাইম ভ্যালু (LTV)</th>
                <th>ভিজিট ও উপস্থিতি</th>
                <th>ঝুঁকির মাত্রা</th>
                <th style={{ textAlign: 'right' }}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    গ্রাহক প্রোফাইল লোড হচ্ছে...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    ফিল্টার অনুযায়ী কোনো গ্রাহক পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {c.first_name} {c.last_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        পছন্দ: {c.preferred_department}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                        {c.card_number}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {c.phone} • {c.email}
                      </div>
                    </td>

                    <td>
                      <span className={`tier-badge tier-${c.tier}`}>{c.tier}</span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>
                        {c.points_balance?.toLocaleString()} পয়েন্ট
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        লাইফটাইম: {c.lifetime_points?.toLocaleString()}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
                        ৳{c.total_spent?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        গড় ৳{(c.visit_count > 0 ? c.total_spent / c.visit_count : 0).toFixed(2)}/ভিজিট
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {c.visit_count} বার ভিজিট
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        শেষ: {c.last_visit || 'সম্প্রতি'}
                      </div>
                    </td>

                    <td>
                      <span className={`status-pill status-${c.churn_risk === 'High' ? 'high' : c.churn_risk === 'Medium' ? 'medium' : 'low'}`}>
                        ● {c.churn_risk === 'High' ? 'উচ্চ ঝুঁকি' : c.churn_risk === 'Medium' ? 'মাঝারি' : 'কম ঝুঁকি'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => onSelectCustomer(c.id)}
                      >
                        <Eye size={14} /> ৩৬০° প্রোফাইল
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
