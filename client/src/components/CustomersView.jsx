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
  ArrowUpDown,
  Edit2,
  Trash2,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  X,
  ShieldAlert,
  Award,
  Users
} from 'lucide-react';
import { api } from '../api';

const DEFAULT_DEPARTMENTS = [
  'খাতা, ডায়েরি ও কাগজ সামগ্রী',
  'কলম, পেন্সিল ও মার্কার',
  'আর্ট, ক্রাফট ও ড্রয়িং',
  'অফিস সাপ্লাই ও ফাইল ফোল্ডার',
  'ক্যালকুলেটর, জ্যামিতি ও ব্যাগ',
  'স্কিনকেয়ার ও প্রসাধন সামগ্রী',
  'হেয়ারকেয়ার ও পারফিউম',
  'সাধারণ স্টেশনারি'
];

export default function CustomersView({ onSelectCustomer, onOpenNewCustomer }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('All');
  const [churnFilter, setChurnFilter] = useState('All');
  const [dueFilter, setDueFilter] = useState('All');
  const [sortBy, setSortBy] = useState('total_spent');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [departments, setDepartments] = useState([]);

  // Highlight & Notifications
  const [highlightedId, setHighlightedId] = useState(null);
  const [successBanner, setSuccessBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');

  // CREATE Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birthday: '',
    tier: 'Bronze',
    preferred_department: 'খাতা, ডায়েরি ও কাগজ সামগ্রী',
    notes: '',
    tags: ['নতুন মেম্বার']
  });
  const [createTagInput, setCreateTagInput] = useState('');

  // EDIT Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    card_number: '',
    tier: 'Bronze',
    birthday: '',
    preferred_department: 'খাতা, ডায়েরি ও কাগজ সামগ্রী',
    churn_risk: 'Low',
    notes: '',
    tags: []
  });
  const [editTagInput, setEditTagInput] = useState('');

  // DELETE Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [forceDelete, setForceDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load Departments for select dropdowns
  useEffect(() => {
    api.getDepartments()
      .then(depts => {
        if (Array.isArray(depts) && depts.length > 0) {
          setDepartments(depts.map(d => d.name));
        }
      })
      .catch(() => {});
  }, []);

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

  const departmentOptions = Array.from(new Set([...departments, ...DEFAULT_DEPARTMENTS]));

  // =================== CREATE CUSTOMER ===================
  const openCreateModal = () => {
    setCreateForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      birthday: '',
      tier: 'Bronze',
      preferred_department: departmentOptions[0] || 'খাতা, ডায়েরি ও কাগজ সামগ্রী',
      notes: '',
      tags: ['নতুন মেম্বার']
    });
    setCreateTagInput('');
    setShowCreateModal(true);
  };

  const handleAddCreateTag = (e) => {
    if (e.key === 'Enter' && createTagInput.trim()) {
      e.preventDefault();
      const trimmed = createTagInput.trim();
      if (!createForm.tags.includes(trimmed)) {
        setCreateForm(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
      }
      setCreateTagInput('');
    }
  };

  const handleRemoveCreateTag = (tag) => {
    setCreateForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.first_name.trim() || !createForm.last_name.trim() || !createForm.phone.trim()) {
      alert('নাম এবং ফোন নম্বর প্রদান করা আবশ্যক');
      return;
    }

    try {
      setCreating(true);
      const created = await api.createCustomer(createForm);
      setShowCreateModal(false);
      await loadCustomers();
      setHighlightedId(created.id);
      setTimeout(() => setHighlightedId(null), 5000);
      setSuccessBanner(`✓ নতুন গ্রাহক '${created.first_name} ${created.last_name}' সফলভাবে নিবন্ধিত হয়েছে!`);
      setTimeout(() => setSuccessBanner(''), 6000);
    } catch (err) {
      alert('গ্রাহক নিবন্ধন ব্যর্থ: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  // =================== EDIT CUSTOMER ===================
  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setEditForm({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      card_number: customer.card_number || '',
      tier: customer.tier || 'Bronze',
      birthday: customer.birthday || '',
      preferred_department: customer.preferred_department || departmentOptions[0],
      churn_risk: customer.churn_risk || 'Low',
      notes: customer.notes || '',
      tags: Array.isArray(customer.tags) ? [...customer.tags] : []
    });
    setEditTagInput('');
    setShowEditModal(true);
  };

  const handleAddEditTag = (e) => {
    if (e.key === 'Enter' && editTagInput.trim()) {
      e.preventDefault();
      const trimmed = editTagInput.trim();
      if (!editForm.tags.includes(trimmed)) {
        setEditForm(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
      }
      setEditTagInput('');
    }
  };

  const handleRemoveEditTag = (tag) => {
    setEditForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCustomer) return;
    if (!editForm.first_name.trim() || !editForm.last_name.trim() || !editForm.phone.trim()) {
      alert('নাম এবং ফোন নম্বর প্রদান করা আবশ্যক');
      return;
    }

    try {
      setSavingEdit(true);
      const updated = await api.updateCustomer(editingCustomer.id, editForm);
      
      // Update locally
      setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, ...updated } : c));
      setShowEditModal(false);
      setEditingCustomer(null);

      setHighlightedId(editingCustomer.id);
      setTimeout(() => setHighlightedId(null), 5000);
      setSuccessBanner(`✓ গ্রাহক '${editForm.first_name} ${editForm.last_name}' এর তথ্য সফলভাবে আপডেট হয়েছে!`);
      setTimeout(() => setSuccessBanner(''), 6000);
    } catch (err) {
      alert('গ্রাহকের তথ্য আপডেট ব্যর্থ: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // =================== DELETE CUSTOMER ===================
  const openDeleteModal = (customer) => {
    setDeletingCustomer(customer);
    setForceDelete(false);
    setShowDeleteModal(true);
  };

  const handleDeleteSubmit = async () => {
    if (!deletingCustomer) return;
    try {
      setDeleting(true);
      await api.deleteCustomer(deletingCustomer.id, forceDelete);
      
      // Remove locally
      setCustomers(prev => prev.filter(c => c.id !== deletingCustomer.id));
      setShowDeleteModal(false);
      const deletedName = `${deletingCustomer.first_name} ${deletingCustomer.last_name}`;
      setDeletingCustomer(null);

      setSuccessBanner(`✓ গ্রাহক '${deletedName}' এর রেকর্ড সফলভাবে মুছে ফেলা হয়েছে!`);
      setTimeout(() => setSuccessBanner(''), 6000);
    } catch (err) {
      alert('গ্রাহক মোছা ব্যর্থ: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Fast Summary Stats
  const totalDueCustomers = customers.filter(c => c.due_balance > 0).length;
  const totalDuesSum = customers.reduce((sum, c) => sum + (c.due_balance || 0), 0);
  const vipCount = customers.filter(c => c.tier === 'VIP' || c.tier === 'Platinum').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header with Search and Filters */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className="brand-icon" style={{ width: '30px', height: '30px' }}>
                <Users size={16} />
              </div>
              <h2 style={{ fontSize: '1.35rem', margin: 0 }}>কাস্টমার তালিকা</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem', marginBottom: 0 }}>
              গ্রাহক নিবন্ধন, তথ্য পরিবর্তন, প্রোফাইল ও ডিলিট (CRUD) পরিচালনা করুন।
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <UserPlus size={16} />
              <span>+ নতুন গ্রাহক</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>মোট গ্রাহক:</span>
            <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{customers.length}</strong>
          </div>
          <span style={{ color: 'var(--border-subtle)' }}>•</span>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>বকেয়া বাকি গ্রাহক:</span>
            <strong style={{ color: totalDueCustomers > 0 ? 'var(--danger)' : 'var(--success)', fontFamily: 'var(--font-mono)' }}>
              {totalDueCustomers} জন (৳{totalDuesSum.toLocaleString('en-US', { minimumFractionDigits: 0 })})
            </strong>
          </div>
          <span style={{ color: 'var(--border-subtle)' }}>•</span>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>প্রিমিয়াম মেম্বার:</span>
            <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{vipCount} জন</strong>
          </div>
        </div>

        {/* Success Banner */}
        {successBanner && (
          <div style={{
            background: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            color: 'var(--success)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            marginTop: '1.25rem',
            fontWeight: 600,
            fontSize: '0.88rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{successBanner}</span>
            </div>
            <button 
              onClick={() => setSuccessBanner('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--success)', cursor: 'pointer', padding: '0.2rem' }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Filter Controls Row */}
        <div className="customer-filters-grid" style={{ marginTop: '1.25rem' }}>
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
              <option value="VIP">ভিআইপি (VIP)</option>
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
                <th>যোগাযোগ ও কার্ড</th>
                <th>টিয়ার</th>
                <th>পয়েন্ট</th>
                <th>মোট ক্রয়</th>
                <th>ভিজিট</th>
                <th>ঝুঁকি</th>
                <th style={{ textAlign: 'right', minWidth: '200px' }}>অ্যাকশন (CRUD)</th>
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
                customers.map((c) => {
                  const isHighlighted = highlightedId === c.id;
                  return (
                    <tr 
                      key={c.id}
                      style={isHighlighted ? {
                        background: 'rgba(16, 185, 129, 0.12)',
                        borderLeft: '4px solid #10b981',
                        transition: 'background 0.5s ease'
                      } : {}}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <button 
                            type="button" 
                            style={{ 
                              background: 'transparent', 
                              border: 'none', 
                              padding: 0, 
                              textAlign: 'left', 
                              fontWeight: 700, 
                              fontSize: '0.95rem', 
                              color: 'var(--text-primary)',
                              cursor: 'pointer' 
                            }}
                            onClick={() => onSelectCustomer(c.id)}
                            title="বিস্তারিত প্রোফাইল দেখুন"
                          >
                            {c.first_name} {c.last_name}
                          </button>
                          {isHighlighted && (
                            <span style={{ 
                              background: '#10b981', 
                              color: '#fff', 
                              fontSize: '0.62rem', 
                              padding: '0.1rem 0.4rem', 
                              borderRadius: '999px', 
                              fontWeight: 800 
                            }}>
                              ✨ আপডেট
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
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
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          {/* READ: Profile */}
                          <button 
                            className="btn btn-secondary btn-sm"
                            title="প্রোফাইল ও বিস্তারিত লেনদেন দেখুন"
                            onClick={() => onSelectCustomer(c.id)}
                            style={{ padding: '0.35rem 0.6rem' }}
                          >
                            <Eye size={13} />
                            <span>প্রোফাইল</span>
                          </button>

                          {/* UPDATE: Edit Customer */}
                          <button 
                            className="btn btn-secondary btn-sm"
                            title="তথ্য সম্পাদন করুন"
                            onClick={() => openEditModal(c)}
                            style={{ padding: '0.35rem 0.6rem', color: 'var(--primary)' }}
                          >
                            <Edit2 size={13} />
                            <span>এডিট</span>
                          </button>

                          {/* DELETE: Remove Customer */}
                          <button 
                            className="btn btn-secondary btn-sm btn-icon"
                            title="মুছে ফেলুন"
                            onClick={() => openDeleteModal(c)}
                            style={{ color: 'var(--danger)', padding: '0.35rem 0.5rem' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
                    <div className="cust-card-name" onClick={() => onSelectCustomer(c.id)} style={{ cursor: 'pointer' }}>
                      {c.first_name} {c.last_name}
                    </div>
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

                {/* Mobile CRUD Action Buttons Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.85rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.45rem' }}
                    onClick={() => onSelectCustomer(c.id)}
                  >
                    <Eye size={14} />
                    <span>প্রোফাইল</span>
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: 'var(--primary)', padding: '0.45rem' }}
                    onClick={() => openEditModal(c)}
                  >
                    <Edit2 size={14} />
                    <span>এডিট</span>
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm btn-icon"
                    title="মুছে ফেলুন"
                    style={{ color: 'var(--danger)', padding: '0.45rem 0.65rem' }}
                    onClick={() => openDeleteModal(c)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* =================== CREATE CUSTOMER MODAL =================== */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <div className="brand-icon" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
                  <UserPlus size={16} />
                </div>
                <h2 style={{ fontSize: '1.15rem', margin: 0, wordBreak: 'break-word' }}>নতুন গ্রাহক নিবন্ধন (Create)</h2>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowCreateModal(false)} style={{ flexShrink: 0 }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="modal-form" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: 0, overflowY: 'auto' }}>
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
                  <span>নতুন গ্রাহক ব্রোঞ্জ কার্ড ও <strong>১০ পয়েন্ট ওয়েলকাম বোনাস</strong> পাবেন।</span>
                </div>

                <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">প্রথম নাম *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      placeholder="আরিফুল"
                      value={createForm.first_name}
                      onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">শেষ নাম *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      placeholder="ইসলাম"
                      value={createForm.last_name}
                      onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">ফোন নম্বর *</label>
                    <input 
                      type="tel" 
                      className="form-control" 
                      required 
                      placeholder="০১৭xxxxxxxx"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">ইমেইল (ঐচ্ছিক)</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      placeholder="email@example.com"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">পছন্দের বিভাগ</label>
                    <select 
                      className="form-control"
                      value={createForm.preferred_department}
                      onChange={(e) => setCreateForm({ ...createForm, preferred_department: e.target.value })}
                    >
                      {departmentOptions.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">জন্মতারিখ</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={createForm.birthday}
                      onChange={(e) => setCreateForm({ ...createForm, birthday: e.target.value })}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">ট্যাগ (Tags)</label>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                    {createForm.tags.map(t => (
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
                          onClick={() => handleRemoveCreateTag(t)}
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
                    placeholder="ট্যাগ লিখে Enter চাপুন..."
                    value={createTagInput}
                    onChange={(e) => setCreateTagInput(e.target.value)}
                    onKeyDown={handleAddCreateTag}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">নোট বা মন্তব্য</label>
                  <textarea 
                    className="form-control" 
                    rows={2} 
                    placeholder="বিশেষ নোট বা ঠিকানা..."
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  বাতিল
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================== EDIT CUSTOMER MODAL =================== */}
      {showEditModal && editingCustomer && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-card" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <div className="brand-icon" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
                  <Edit2 size={16} />
                </div>
                <h2 style={{ fontSize: '1.15rem', margin: 0, wordBreak: 'break-word' }}>
                  গ্রাহক তথ্য সম্পাদনা (Edit Customer)
                </h2>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowEditModal(false)} style={{ flexShrink: 0 }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="modal-form" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: 0, overflowY: 'auto' }}>
                <div style={{ 
                  background: 'var(--bg-surface-elevated)', 
                  padding: '0.65rem 0.9rem', 
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  fontSize: '0.8rem' 
                }}>
                  <div>
                    কার্ড নং: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{editingCustomer.card_number}</strong>
                  </div>
                  <div>
                    মোট ক্রয়: <strong>৳{editingCustomer.total_spent?.toLocaleString()}</strong>
                  </div>
                  {editingCustomer.due_balance > 0 && (
                    <div style={{ color: 'var(--danger)', fontWeight: 700 }}>
                      বাকি: ৳{editingCustomer.due_balance.toFixed(2)}
                    </div>
                  )}
                </div>

                <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">প্রথম নাম *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">শেষ নাম *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">ফোন নম্বর *</label>
                    <input 
                      type="tel" 
                      className="form-control" 
                      required 
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">ইমেইল (ঐচ্ছিক)</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      placeholder="email@example.com"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">টিয়ার (Membership Tier)</label>
                    <select 
                      className="form-control"
                      value={editForm.tier}
                      onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                    >
                      <option value="Bronze">ব্রোঞ্জ (Bronze)</option>
                      <option value="Silver">সিলভার (Silver)</option>
                      <option value="Gold">গোল্ড (Gold)</option>
                      <option value="Platinum">প্ল্যাটিনাম (Platinum)</option>
                      <option value="VIP">ভিআইপি (VIP)</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">ঝুঁকির মাত্রা (Churn Risk)</label>
                    <select 
                      className="form-control"
                      value={editForm.churn_risk}
                      onChange={(e) => setEditForm({ ...editForm, churn_risk: e.target.value })}
                    >
                      <option value="Low">কম ঝুঁকি (Low)</option>
                      <option value="Medium">মাঝারি ঝুঁকি (Medium)</option>
                      <option value="High">উচ্চ ঝুঁকি (High)</option>
                    </select>
                  </div>
                </div>

                <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">পছন্দের বিভাগ</label>
                    <select 
                      className="form-control"
                      value={editForm.preferred_department}
                      onChange={(e) => setEditForm({ ...editForm, preferred_department: e.target.value })}
                    >
                      {departmentOptions.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">জন্মতারিখ</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={editForm.birthday || ''}
                      onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">ট্যাগ (Tags)</label>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                    {editForm.tags.map(t => (
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
                          onClick={() => handleRemoveEditTag(t)}
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
                    placeholder="ট্যাগ লিখে Enter চাপুন..."
                    value={editTagInput}
                    onChange={(e) => setEditTagInput(e.target.value)}
                    onKeyDown={handleAddEditTag}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">নোট বা মন্তব্য</label>
                  <textarea 
                    className="form-control" 
                    rows={2} 
                    placeholder="বিশেষ তথ্য বা নোট..."
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  বাতিল
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                  {savingEdit ? 'আপডেট হচ্ছে...' : 'আপডেট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================== DELETE CONFIRMATION MODAL =================== */}
      {showDeleteModal && deletingCustomer && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--danger)', flex: 1, minWidth: 0 }}>
                <ShieldAlert size={20} style={{ flexShrink: 0 }} />
                <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700, wordBreak: 'break-word', minWidth: 0 }}>
                  গ্রাহক মুছে ফেলা (Delete Customer)
                </h2>
              </div>
              <button className="btn btn-secondary btn-icon" style={{ flexShrink: 0 }} onClick={() => setShowDeleteModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <p style={{ fontSize: '0.92rem', margin: 0, lineHeight: 1.5 }}>
                আপনি কি নিশ্চিতভাবে এই গ্রাহকের রেকর্ড মুছে ফেলতে চান?
              </p>

              <div style={{ 
                background: 'var(--danger-bg)', 
                padding: '1rem 1.25rem', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--danger-border)',
                fontSize: '0.85rem'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.98rem' }}>
                  {deletingCustomer.first_name} {deletingCustomer.last_name}
                </div>
                <div style={{ color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                  কার্ড: <span style={{ fontFamily: 'var(--font-mono)' }}>{deletingCustomer.card_number}</span> | ফোন: {deletingCustomer.phone}
                </div>
                <div style={{ color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                  টিয়ার: <span className={`tier-badge tier-${deletingCustomer.tier}`}>{deletingCustomer.tier}</span> | পয়েন্ট: {deletingCustomer.points_balance}
                </div>
              </div>

              {deletingCustomer.due_balance > 0 ? (
                <div style={{ 
                  background: 'rgba(239, 68, 68, 0.12)', 
                  border: '1px solid #ef4444', 
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  fontSize: '0.82rem',
                  color: '#ef4444'
                }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                    <AlertTriangle size={16} />
                    <span>সতর্কবার্তা: অপরিশোধিত বাকি রয়েছে!</span>
                  </div>
                  <div>
                    এই গ্রাহকের বর্তমানে <strong>৳{deletingCustomer.due_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> বকেয়া বাকি রয়েছে। বকেয়া আদায় না করে মুছে ফেললে বাকি হিসাবে গরমিল হতে পারে।
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.6rem', cursor: 'pointer', fontWeight: 600 }}>
                    <input 
                      type="checkbox" 
                      checked={forceDelete} 
                      onChange={(e) => setForceDelete(e.target.checked)} 
                    />
                    <span>বকেয়া থাকা সত্ত্বেও গ্রাহক মুছে ফেলতে চাই (Force Delete)</span>
                  </label>
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  নোট: গ্রাহক মুছে ফেললে তার অর্জিত পয়েন্ট ও মেম্বারশিপ অ্যাকাউন্ট স্থায়ীভাবে মুছে যাবে।
                </p>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                বাতিল
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                disabled={deleting || (deletingCustomer.due_balance > 0 && !forceDelete)}
                onClick={handleDeleteSubmit}
              >
                {deleting ? 'মুছছি...' : 'মুছে ফেলুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
