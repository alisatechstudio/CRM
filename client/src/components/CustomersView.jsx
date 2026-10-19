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
  const [dueFilter, setDueFilter] = useState('All');
  const [sortBy, setSortBy] = useState('total_spent');
  const [sortOrder, setSortOrder] = useState('DESC');

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers({
        search,
        tier: tierFilter,
        churn_risk: churnFilter,
        due_filter: dueFilter === 'has_due' ? 'has_due' : dueFilter === 'no_due' ? 'no_due' : undefined,
        sort: sortBy
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
  }, [search, tierFilter, churnFilter, dueFilter, sortBy, sortOrder]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header with Search and Filters */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', margin: 0 }}>কাস্টমার তালিকা</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              গ্রাহক প্রোফাইল, পয়েন্ট ও কেনাকাটার হিসাব।
            </p>
          </div>

          <button className="btn btn-primary" onClick={onOpenNewCustomer}>
            + নতুন গ্রাহক
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="customer-filters-grid">
          {/* Search Box */}
          <div className="input-group">
            <label className="input-label">অনুসন্ধান</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                style={{ width: '100%', paddingLeft: '2.4rem' }}
                placeholder="নাম, ফোন বা কার্ড নম্বর..."
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
            <label className="input-label">টিয়ার</label>
            <select 
              className="form-control"
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
            >
              <option value="All">সব টিয়ার</option>
              <option value="VIP">ভিআইপি</option>
              <option value="Platinum">প্ল্যাটিনাম</option>
              <option value="Gold">গোল্ড</option>
              <option value="Silver">সিলভার</option>
              <option value="Bronze">ব্রোঞ্জ</option>
            </select>
          </div>

          {/* Churn Risk Filter */}
          <div className="input-group">
            <label className="input-label">ঝুঁকি</label>
            <select 
              className="form-control"
              value={churnFilter}
              onChange={(e) => setChurnFilter(e.target.value)}
            >
              <option value="All">সব ঝুঁকি</option>
              <option value="Low">কম ঝুঁকি</option>
              <option value="Medium">মাঝারি ঝুঁকি</option>
              <option value="High">উচ্চ ঝুঁকি</option>
            </select>
          </div>

          {/* Due Filter */}
          <div className="input-group">
            <label className="input-label">বকেয়া বাকি</label>
            <select 
              className="form-control"
              value={dueFilter}
              onChange={(e) => setDueFilter(e.target.value)}
            >
              <option value="All">সব কাস্টমার</option>
              <option value="has_due">বাকি আছে (Dues)</option>
              <option value="no_due">বাকি নেই (No Due)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="input-group">
            <label className="input-label">সর্ট</label>
            <select 
              className="form-control"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="total_spent">মোট ক্রয় (৳)</option>
              <option value="due_balance">বকেয়া বাকি (৳)</option>
              <option value="points_balance">পয়েন্ট</option>
              <option value="visit_count">ভিজিট</option>
              <option value="last_visit">সর্বশেষ ভিজিট</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="glass-panel" style={{ padding: 0 }}>
        <div className="data-table-container desktop-table-view" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>গ্রাহক</th>
                <th>যোগাযোগ</th>
                <th>টিয়ার</th>
                <th>পয়েন্ট</th>
                <th>মোট ক্রয়</th>
                <th>ভিজিট</th>
                <th>ঝুঁকি</th>
                <th style={{ textAlign: 'right' }}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    লোড হচ্ছে...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    কোনো গ্রাহক পাওয়া যায়নি
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
                        {c.phone}{c.email ? ` • ${c.email}` : ''}
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
                      {c.due_balance > 0 ? (
                        <div style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 700 }}>
                          বাকি: ৳{c.due_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          গড় ৳{(c.visit_count > 0 ? c.total_spent / c.visit_count : 0).toFixed(2)}/ভিজিট
                        </div>
                      )}
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
                        <Eye size={14} /> প্রোফাইল
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Touch-Friendly Customer Cards */}
        <div className="customer-mobile-card-list">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              লোড হচ্ছে...
            </div>
          ) : customers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              কোনো গ্রাহক পাওয়া যায়নি
            </div>
          ) : (
            customers.map((c) => (
              <div key={c.id} className="customer-mobile-card">
                {/* Header: Name & Badges */}
                <div className="cust-card-header">
                  <div>
                    <div className="cust-card-name">{c.first_name} {c.last_name}</div>
                    <div className="cust-card-dept">পছন্দ: {c.preferred_department}</div>
                  </div>
                  <div className="cust-card-badges">
                    <span className={`tier-badge tier-${c.tier}`}>{c.tier}</span>
                    <span className={`status-pill status-${c.churn_risk === 'High' ? 'high' : c.churn_risk === 'Medium' ? 'medium' : 'low'}`}>
                      ● {c.churn_risk === 'High' ? 'উচ্চ ঝুঁকি' : c.churn_risk === 'Medium' ? 'মাঝারি' : 'কম ঝুঁকি'}
                    </span>
                  </div>
                </div>

                {/* Contact Row: Tap to call & Card */}
                <div className="cust-card-contact-row">
                  <a href={`tel:${c.phone}`} className="cust-tel-btn" title="সরাসরি কল করুন">
                    <Phone size={13} />
                    <span>{c.phone}</span>
                  </a>
                  <span className="cust-card-num">
                    <CreditCard size={12} /> {c.card_number}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="cust-metrics-grid" style={{ gridTemplateColumns: c.due_balance > 0 ? '1fr 1fr 1fr 1fr' : undefined }}>
                  <div className="cust-metric-box">
                    <div className="cust-metric-label">মোট ক্রয়</div>
                    <div className="cust-metric-val">৳{c.total_spent?.toLocaleString('en-US', { minimumFractionDigits: 0 })}</div>
                  </div>
                  {c.due_balance > 0 && (
                    <div className="cust-metric-box" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                      <div className="cust-metric-label" style={{ color: 'var(--danger)' }}>বাকি</div>
                      <div className="cust-metric-val" style={{ color: 'var(--danger)', fontWeight: 800 }}>৳{c.due_balance.toLocaleString('en-US', { minimumFractionDigits: 0 })}</div>
                    </div>
                  )}
                  <div className="cust-metric-box">
                    <div className="cust-metric-label">পয়েন্ট</div>
                    <div className="cust-metric-val points">{c.points_balance?.toLocaleString()}</div>
                  </div>
                  <div className="cust-metric-box">
                    <div className="cust-metric-label">ভিজিট</div>
                    <div className="cust-metric-val">{c.visit_count} বার</div>
                  </div>
                </div>

                {/* Action Button */}
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm cust-view-btn"
                  onClick={() => onSelectCustomer(c.id)}
                >
                  <Eye size={15} />
                  <span>বিস্তারিত প্রোফাইল</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
