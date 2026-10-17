import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  TrendingUp, 
  Barcode, 
  CheckCircle2, 
  Edit2,
  Trash2,
  Sliders,
  RefreshCw,
  X,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { api } from '../api';

export default function InventoryView() {
  const [products, setProducts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('all');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [expiryFilter, setExpiryFilter] = useState('all');
  const [expiryFrom, setExpiryFrom] = useState('');
  const [expiryTo, setExpiryTo] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProd, setNewProd] = useState({
    name: '',
    barcode: '',
    department_id: '',
    category: 'অফিস ও স্কুল স্টেশনারি',
    price: '',
    cost: '',
    stock_qty: 50,
    min_threshold: 15,
    unit: 'পিস',
    has_expiry: false,
    expiry_date: ''
  });

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    barcode: '',
    department_id: '',
    category: '',
    price: '',
    cost: '',
    stock_qty: '',
    min_threshold: '',
    unit: 'পিস',
    has_expiry: false,
    expiry_date: ''
  });

  // Stock Adjustment Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [adjustType, setAdjustType] = useState('add'); // 'add', 'remove', 'set'
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustReason, setAdjustReason] = useState('নতুন কার্টন / রিম চালান গ্রহণ');

  // Delete Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [prods, depts] = await Promise.all([
        api.getProducts({ 
          department_id: selectedDept, 
          search, 
          low_stock: lowStockOnly,
          expiry_filter: expiryFilter,
          expiry_from: expiryFilter === 'custom' ? expiryFrom : undefined,
          expiry_to: expiryFilter === 'custom' ? expiryTo : undefined
        }),
        api.getDepartments()
      ]);
      setProducts(prods);
      setDepartments(depts);
      if (depts.length > 0 && !newProd.department_id) {
        setNewProd(prev => ({ ...prev, department_id: depts[0].id }));
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDept, search, lowStockOnly, expiryFilter, expiryFrom, expiryTo]);

  // Quick inline stock increment
  const handleQuickStockAdjust = async (id, change) => {
    try {
      await api.updateStock(id, { change, reason: `দ্রুত +${change} রিস্টক` });
      loadData();
    } catch (err) {
      alert('স্টক সমন্বয় ব্যর্থ: ' + err.message);
    }
  };

  // CREATE: New Product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.createProduct(newProd);
      setShowAddModal(false);
      setNewProd({
        name: '',
        barcode: '',
        department_id: departments[0]?.id || '',
        category: 'অফিস ও স্কুল স্টেশনারি',
        price: '',
        cost: '',
        stock_qty: 50,
        min_threshold: 15,
        unit: 'পিস',
        has_expiry: false,
        expiry_date: ''
      });
      loadData();
    } catch (err) {
      alert('পণ্য যুক্ত করতে ব্যর্থ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      barcode: product.barcode,
      department_id: product.department_id,
      category: product.category,
      price: product.price,
      cost: product.cost,
      stock_qty: product.stock_qty,
      min_threshold: product.min_threshold,
      unit: product.unit || 'পিস',
      has_expiry: Boolean(product.has_expiry),
      expiry_date: product.expiry_date || ''
    });
    setShowEditModal(true);
  };

  // UPDATE: Existing Product
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      setSaving(true);
      await api.updateProduct(editingProduct.id, editForm);
      setShowEditModal(false);
      setEditingProduct(null);
      loadData();
    } catch (err) {
      alert('পণ্য আপডেট ব্যর্থ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Open Adjust Modal
  const openAdjustModal = (product) => {
    setAdjustingProduct(product);
    setAdjustType('add');
    setAdjustQty(10);
    setAdjustReason('নতুন কার্টন / রিম চালান গ্রহণ');
    setShowAdjustModal(true);
  };

  // EXECUTE: Stock Adjustment
  const handleExecuteStockAdjust = async (e) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    try {
      setSaving(true);
      const qty = parseInt(adjustQty, 10);
      if (isNaN(qty) || qty <= 0) {
        alert('সঠিক সংখ্যা প্রদান করুন');
        return;
      }

      let payload = { reason: adjustReason };
      if (adjustType === 'add') {
        payload.change = qty;
      } else if (adjustType === 'remove') {
        payload.change = -qty;
      } else if (adjustType === 'set') {
        payload.new_qty = qty;
      }

      await api.updateStock(adjustingProduct.id, payload);
      setShowAdjustModal(false);
      setAdjustingProduct(null);
      loadData();
    } catch (err) {
      alert('স্টক সমন্বয় ব্যর্থ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (product) => {
    setDeletingProduct(product);
    setShowDeleteModal(true);
  };

  // DELETE: Remove Product
  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      setSaving(true);
      await api.deleteProduct(deletingProduct.id);
      setShowDeleteModal(false);
      setDeletingProduct(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Quick Barcode Generator
  const generateRandomBarcode = () => {
    const code = '890' + Math.floor(100000 + Math.random() * 900000);
    setNewProd(prev => ({ ...prev, barcode: code }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Panel */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Package size={22} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: '1.35rem', margin: 0 }}>মিজান স্টেশনারি ইনভেন্টরি ও পণ্য ক্যাটালগ (CRUD)</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              সকল স্টেশনারি ও অফিস সরঞ্জামের নতুন এসকেইউ সংযোজন, তথ্য সম্পাদনা, ড্যামেজ সমন্বয় ও সম্পূর্ণ ইনভেন্টরি নিয়ন্ত্রণ।
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> নতুন স্টেশনারি পণ্য যুক্ত করুন
          </button>
        </div>

        {/* Filter controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1.2fr 1fr', gap: '1rem', marginTop: '1.25rem' }}>
          <div className="input-group">
            <label className="input-label">এসকেইউ বা বারকোড খুঁজুন</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text"
                className="form-control"
                style={{ width: '100%', paddingLeft: '2.4rem' }}
                placeholder="যেমন: বসুন্ধরা A4, ম্যাটাডোর, ক্যালকুলেটর..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">বিভাগ নির্বাচন করুন</label>
            <select 
              className="form-control"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="all">সকল বিভাগ</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">মেয়াদ ফিল্টার (Date Filter)</label>
            <select 
              className="form-control"
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
            >
              <option value="all">সকল মেয়াদ স্থিতি</option>
              <option value="expiring_30">⏳ দ্রুত মেয়াদ শেষ (৩০ দিন)</option>
              <option value="expiring_60">⏳ ৬০ দিনের মধ্যে শেষ</option>
              <option value="expiring_90">⏳ ৯০ দিনের মধ্যে শেষ</option>
              <option value="expired">⚠ ইতিমধ্যে মেয়াদোত্তীর্ণ</option>
              <option value="has_expiry">✓ মেয়াদ প্রযোজ্য পণ্যসমূহ</option>
              <option value="no_expiry">🔒 প্রযোজ্য নয় (N/A)</option>
              <option value="custom">📅 কাস্টম তারিখ রেঞ্জ (Custom)...</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">ইনভেন্টরি স্থিতি</label>
            <button 
              type="button"
              className={`btn ${lowStockOnly ? 'btn-danger' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start' }}
              onClick={() => setLowStockOnly(!lowStockOnly)}
            >
              <AlertTriangle size={15} />
              <span>{lowStockOnly ? 'শুধুমাত্র কম স্টক' : 'সকল স্টক প্রদর্শিত'}</span>
            </button>
          </div>
        </div>

        {/* Custom Expiry Date Range Inputs */}
        {expiryFilter === 'custom' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginTop: '0.85rem',
            padding: '0.65rem 1rem',
            background: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.82rem' }}>
              <Calendar size={15} /> কাস্টম মেয়াদ ফিল্টার:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>শুরু:</label>
              <input 
                type="date" 
                className="form-control" 
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.82rem' }}
                value={expiryFrom}
                onChange={(e) => setExpiryFrom(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>শেষ:</label>
              <input 
                type="date" 
                className="form-control" 
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.82rem' }}
                value={expiryTo}
                onChange={(e) => setExpiryTo(e.target.value)}
              />
            </div>
            {(expiryFrom || expiryTo) && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                onClick={() => { setExpiryFrom(''); setExpiryTo(''); }}
              >
                <X size={12} /> ক্লিয়ার
              </button>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>
              মোট ফিল্টার্ড পণ্য: {products.length} টি
            </span>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="glass-panel" style={{ padding: 0 }}>
        <div className="data-table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>পণ্যের নাম ও বারকোড</th>
                <th>বিভাগ</th>
                <th>ক্যাটাগরি</th>
                <th>বিক্রয় মূল্য (৳)</th>
                <th>ক্রয়মূল্য (৳)</th>
                <th>লাভের মার্জিন</th>
                <th>বর্তমান স্টক</th>
                <th>মেয়াদ (Expiry Date)</th>
                <th style={{ textAlign: 'right' }}>কার্যক্রম (CRUD Actions)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    পণ্য তালিকা লোড হচ্ছে...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    কোনো পণ্য পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.stock_qty <= p.min_threshold;
                  const marginPct = p.price > 0 ? (((p.price - p.cost) / p.price) * 100).toFixed(0) : 0;

                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          বারকোড: {p.barcode}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
                          {p.department_name}
                        </span>
                      </td>

                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {p.category}
                      </td>

                      <td style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
                        ৳{p.price.toFixed(2)}
                      </td>

                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                        ৳{p.cost.toFixed(2)}
                      </td>

                      <td>
                        <span style={{ 
                          fontSize: '0.78rem', 
                          fontWeight: 700, 
                          color: marginPct >= 30 ? 'var(--success)' : marginPct >= 15 ? 'var(--warning)' : 'var(--danger)' 
                        }}>
                          {marginPct}%
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ 
                            fontWeight: 800, 
                            fontFamily: 'var(--font-mono)',
                            color: isLow ? 'var(--danger)' : 'var(--text-main)',
                            fontSize: '0.95rem'
                          }}>
                            {p.stock_qty} {p.unit}
                          </span>
                          {isLow && (
                            <span style={{ 
                              fontSize: '0.68rem', 
                              padding: '0.1rem 0.4rem', 
                              borderRadius: 'var(--radius-sm)', 
                              background: 'var(--danger-bg)', 
                              color: 'var(--danger)',
                              fontWeight: 700
                            }}>
                              কম স্টক (সীমা {p.min_threshold})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Expiry Date Column */}
                      <td>
                        {p.has_expiry && p.expiry_date ? (
                          <div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700 }}>
                              {p.expiry_date}
                            </div>
                            {(() => {
                              const today = new Date().toISOString().split('T')[0];
                              const isExpired = p.expiry_date < today;
                              const diffDays = Math.round((new Date(p.expiry_date) - new Date(today)) / (1000 * 60 * 60 * 24));
                              if (isExpired) {
                                return (
                                  <span style={{ fontSize: '0.68rem', color: 'var(--danger)', fontWeight: 700 }}>
                                    ⚠ মেয়াদোত্তীর্ণ
                                  </span>
                                );
                              } else if (diffDays <= 45) {
                                return (
                                  <span style={{ fontSize: '0.68rem', color: 'var(--warning)', fontWeight: 700 }}>
                                    ⏳ {diffDays} দিন বাকি
                                  </span>
                                );
                              }
                              return (
                                <span style={{ fontSize: '0.68rem', color: 'var(--success)' }}>
                                  ✓ মেয়াদ সক্রিয়
                                </span>
                              );
                            })()}
                          </div>
                        ) : (
                          <span style={{ 
                            fontSize: '0.72rem', 
                            color: 'var(--text-dim)', 
                            background: 'var(--bg-app)', 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            whiteSpace: 'nowrap'
                          }}>
                            প্রযোজ্য নয় (N/A)
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          {/* Edit Button */}
                          <button 
                            className="btn btn-secondary btn-sm"
                            title="পণ্য ও মূল্য সম্পাদনা করুন"
                            onClick={() => openEditModal(p)}
                            style={{ padding: '0.35rem 0.6rem' }}
                          >
                            <Edit2 size={13} style={{ color: 'var(--primary)' }} />
                            <span>সম্পাদনা</span>
                          </button>

                          {/* Stock Adjust Button */}
                          <button 
                            className="btn btn-secondary btn-sm"
                            title="ইনভেন্টরি চালান বা ড্যামেজ সমন্বয় করুন"
                            onClick={() => openAdjustModal(p)}
                            style={{ padding: '0.35rem 0.6rem' }}
                          >
                            <Sliders size={13} style={{ color: 'var(--accent)' }} />
                            <span>স্টক ইন/আউট</span>
                          </button>

                          {/* Quick +10 */}
                          <button 
                            className="btn btn-secondary btn-sm"
                            title="দ্রুত ১০ টি রিস্টক করুন"
                            onClick={() => handleQuickStockAdjust(p.id, 10)}
                            style={{ padding: '0.35rem 0.5rem', fontWeight: 700 }}
                          >
                            +১০
                          </button>

                          {/* Delete Button */}
                          <button 
                            className="btn btn-secondary btn-sm btn-icon"
                            title="পণ্যটি মুছে ফেলুন"
                            onClick={() => openDeleteModal(p)}
                            style={{ width: '28px', height: '28px', color: 'var(--danger)' }}
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
      </div>

      {/* =================== MODAL 1: CREATE NEW PRODUCT =================== */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={18} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>নতুন স্টেশনারি পণ্য সংযোজন</h2>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">পণ্যের নাম (বাংলা) *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="যেমন: ডেল্টা লেভার আর্চ বক্স ফাইল (A4)"
                    value={newProd.name}
                    onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="input-label">বারকোড / এসকেইউ *</label>
                      <button 
                        type="button" 
                        onClick={generateRandomBarcode}
                        style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                      >
                        স্বয়ংক্রিয় তৈরি
                      </button>
                    </div>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      placeholder="যেমন: 890100201"
                      value={newProd.barcode}
                      onChange={(e) => setNewProd({ ...newProd, barcode: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">বিভাগ *</label>
                    <select 
                      className="form-control"
                      value={newProd.department_id}
                      onChange={(e) => setNewProd({ ...newProd, department_id: e.target.value })}
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">বিক্রয় মূল্য (৳) *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-control" 
                      required 
                      placeholder="180.00"
                      value={newProd.price}
                      onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">ক্রয়মূল্য (৳) *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-control" 
                      required
                      placeholder="135.00"
                      value={newProd.cost}
                      onChange={(e) => setNewProd({ ...newProd, cost: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">প্রারম্ভিক স্টক</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={newProd.stock_qty}
                      onChange={(e) => setNewProd({ ...newProd, stock_qty: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">ক্যাটাগরি</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="যেমন: ফাইল ও ফোল্ডার"
                      value={newProd.category}
                      onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">একক (Unit)</label>
                    <select 
                      className="form-control"
                      value={newProd.unit}
                      onChange={(e) => setNewProd({ ...newProd, unit: e.target.value })}
                    >
                      <option value="পিস">পিস (pcs)</option>
                      <option value="প্যাকেট">প্যাকেট (pack)</option>
                      <option value="রিম">রিম (ream)</option>
                      <option value="বক্স">বক্স (box)</option>
                      <option value="ডজন">ডজন (dozen)</option>
                      <option value="সেট">সেট (set)</option>
                      <option value="রোল">রোল (roll)</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">কম স্টক সীমা</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={newProd.min_threshold}
                      onChange={(e) => setNewProd({ ...newProd, min_threshold: e.target.value })}
                    />
                  </div>
                </div>

                {/* Expiry Date Section */}
                <div style={{
                  background: 'var(--bg-app)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', margin: 0 }}>
                      <input 
                        type="checkbox"
                        checked={newProd.has_expiry}
                        onChange={(e) => setNewProd({ ...newProd, has_expiry: e.target.checked, expiry_date: e.target.checked ? (newProd.expiry_date || '') : '' })}
                        style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                      />
                      <span>এই পণ্যে মেয়াদোত্তীর্ণের তারিখ (Expiry Date) প্রযোজ্য</span>
                    </label>
                    <span style={{ fontSize: '0.72rem', color: newProd.has_expiry ? 'var(--primary)' : 'var(--text-dim)', fontWeight: 600 }}>
                      {newProd.has_expiry ? 'তারিখ প্রযোজ্য' : 'প্রযোজ্য নয় (Not Applicable)'}
                    </span>
                  </div>

                  {newProd.has_expiry ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem' }}>
                      <input 
                        type="date"
                        className="form-control"
                        required={newProd.has_expiry}
                        value={newProd.expiry_date}
                        onChange={(e) => setNewProd({ ...newProd, expiry_date: e.target.value })}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        আঠা, পেইন্ট, কালি বা ডায়েরির মতো পণ্যের মেয়াদ
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      🔒 খাতা, কাগজ, কলম, ফাইল বা জ্যামিতি সামগ্রীতে কোনো মেয়াদ প্রযোজ্য নয় (Not Applicable)।
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  বাতিল
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'সংরক্ষণ হচ্ছে...' : 'ক্যাটালগে যুক্ত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================== MODAL 2: EDIT PRODUCT (UPDATE) =================== */}
      {showEditModal && editingProduct && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-card" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={18} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>পণ্য ও মূল্য সম্পাদনা</h2>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowEditModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">পণ্যের নাম *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">বারকোড / এসকেইউ *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={editForm.barcode}
                      onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">বিভাগ *</label>
                    <select 
                      className="form-control"
                      value={editForm.department_id}
                      onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">বিক্রয় মূল্য (৳) *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-control" 
                      required 
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">ক্রয়মূল্য (৳)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-control" 
                      value={editForm.cost}
                      onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">বর্তমান মজুদ স্টক</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={editForm.stock_qty}
                      onChange={(e) => setEditForm({ ...editForm, stock_qty: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">ক্যাটাগরি</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">একক (Unit)</label>
                    <select 
                      className="form-control"
                      value={editForm.unit}
                      onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    >
                      <option value="পিস">পিস (pcs)</option>
                      <option value="প্যাকেট">প্যাকেট (pack)</option>
                      <option value="রিম">রিম (ream)</option>
                      <option value="বক্স">বক্স (box)</option>
                      <option value="ডজন">ডজন (dozen)</option>
                      <option value="সেট">সেট (set)</option>
                      <option value="রোল">রোল (roll)</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">কম স্টক অ্যালার্ট সীমা</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={editForm.min_threshold}
                      onChange={(e) => setEditForm({ ...editForm, min_threshold: e.target.value })}
                    />
                  </div>
                </div>

                {/* Expiry Date Section in Edit Modal */}
                <div style={{
                  background: 'var(--bg-app)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', margin: 0 }}>
                      <input 
                        type="checkbox"
                        checked={editForm.has_expiry}
                        onChange={(e) => setEditForm({ ...editForm, has_expiry: e.target.checked, expiry_date: e.target.checked ? (editForm.expiry_date || '') : '' })}
                        style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                      />
                      <span>এই পণ্যে মেয়াদোত্তীর্ণের তারিখ (Expiry Date) প্রযোজ্য</span>
                    </label>
                    <span style={{ fontSize: '0.72rem', color: editForm.has_expiry ? 'var(--primary)' : 'var(--text-dim)', fontWeight: 600 }}>
                      {editForm.has_expiry ? 'তারিখ প্রযোজ্য' : 'প্রযোজ্য নয় (Not Applicable)'}
                    </span>
                  </div>

                  {editForm.has_expiry ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem' }}>
                      <input 
                        type="date"
                        className="form-control"
                        required={editForm.has_expiry}
                        value={editForm.expiry_date}
                        onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        মেয়াদ উত্তীর্ণের তারিখ নির্ধারণ করুন
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      🔒 খাতা, কাগজ, কলম বা সাধারণ সামগ্রীতে মেয়াদ প্রযোজ্য নয় (Not Applicable)।
                    </div>
                  )}
                </div>

                {/* Profit Margin Preview Box */}
                {parseFloat(editForm.price) > 0 && parseFloat(editForm.cost) >= 0 && (
                  <div style={{ 
                    background: 'var(--bg-app)', 
                    padding: '0.65rem 0.85rem', 
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.82rem'
                  }}>
                    <span>একক প্রতি লাভ: <strong>৳{(parseFloat(editForm.price) - parseFloat(editForm.cost || 0)).toFixed(2)}</strong></span>
                    <span>লাভের শতকরা হার (মার্জিন): <strong style={{ color: 'var(--success)' }}>
                      {(((parseFloat(editForm.price) - parseFloat(editForm.cost || 0)) / parseFloat(editForm.price)) * 100).toFixed(1)}%
                    </strong></span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  বাতিল
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'আপডেট হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================== MODAL 3: STOCK ADJUSTMENT =================== */}
      {showAdjustModal && adjustingProduct && (
        <div className="modal-overlay" onClick={() => setShowAdjustModal(false)}>
          <div className="modal-card" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={18} style={{ color: 'var(--accent)' }} />
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>ইনভেন্টরি স্টক সমন্বয়</h2>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowAdjustModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleExecuteStockAdjust}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-app)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{adjustingProduct.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                    বর্তমান স্টক: <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{adjustingProduct.stock_qty} {adjustingProduct.unit}</strong> | বারকোড: {adjustingProduct.barcode}
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">সমন্বয়ের ধরণ নির্বাচন করুন *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${adjustType === 'add' ? 'btn-success' : 'btn-secondary'}`}
                      style={{ justifyContent: 'center', fontSize: '0.78rem' }}
                      onClick={() => setAdjustType('add')}
                    >
                      <ArrowUpRight size={14} /> স্টক বৃদ্ধি (+)
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${adjustType === 'remove' ? 'btn-danger' : 'btn-secondary'}`}
                      style={{ justifyContent: 'center', fontSize: '0.78rem' }}
                      onClick={() => setAdjustType('remove')}
                    >
                      <ArrowDownRight size={14} /> ড্যামেজ/হ্রাস (-)
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${adjustType === 'set' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ justifyContent: 'center', fontSize: '0.78rem' }}
                      onClick={() => setAdjustType('set')}
                    >
                      সরাসরি সেট
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    {adjustType === 'add' ? 'যোগ করার পরিমাণ (Quantity to Add)' : adjustType === 'remove' ? 'কর্তন করার পরিমাণ (Quantity to Deduct)' : 'নতুন মোট স্টক সংখ্যা (Set Exact Count)'} *
                  </label>
                  <input 
                    type="number"
                    min="1"
                    className="form-control"
                    required
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">সমন্বয়ের কারণ / নোট *</label>
                  <select 
                    className="form-control"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                  >
                    <option value="নতুন কার্টন / রিম চালান গ্রহণ">নতুন কার্টন / রিম চালান গ্রহণ</option>
                    <option value="পাইকারি সরবরাহকারী থেকে ডেলিভারি">পাইকারি সরবরাহকারী থেকে ডেলিভারি</option>
                    <option value="কাগজ বা কালিতে ত্রুটি / ড্যামেজ রাইট-অফ">কাগজ বা কালিতে ত্রুটি / ড্যামেজ রাইট-অফ</option>
                    <option value="দোকানের শেলফে প্রদর্শনী ঘাটতি সংশোধন">দোকানের শেলফে প্রদর্শনী ঘাটতি সংশোধন</option>
                    <option value="মাসিক ফিজিক্যাল অডিট সংশোধন">মাসিক ফিজিক্যাল অডিট সংশোধন</option>
                    <option value="কাস্টমার রিটার্ন ইনভেন্টরি রি-অ্যাড">কাস্টমার রিটার্ন ইনভেন্টরি রি-অ্যাড</option>
                  </select>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  সমন্বয়ের পর প্রত্যাশিত নতুন স্টক হবে:{' '}
                  <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                    {adjustType === 'add' ? adjustingProduct.stock_qty + parseInt(adjustQty || 0, 10) :
                     adjustType === 'remove' ? Math.max(0, adjustingProduct.stock_qty - parseInt(adjustQty || 0, 10)) :
                     parseInt(adjustQty || 0, 10)} {adjustingProduct.unit}
                  </strong>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>
                  বাতিল
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'প্রক্রিয়াকরণ হচ্ছে...' : 'স্টক আপডেট সম্পন্ন করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================== MODAL 4: DELETE PRODUCT CONFIRMATION =================== */}
      {showDeleteModal && deletingProduct && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
                <ShieldAlert size={20} />
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>পণ্য মুছে ফেলার সতর্কতা</h2>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowDeleteModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                আপনি কি নিশ্চিতভাবে এই পণ্যটি মিজান স্টেশনারির ক্যাটালগ থেকে মুছে ফেলতে চান?
              </p>

              <div style={{ 
                background: 'var(--danger-bg)', 
                padding: '0.75rem', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid var(--danger-border)',
                fontSize: '0.82rem'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--danger)' }}>{deletingProduct.name}</div>
                <div style={{ color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                  বারকোড: {deletingProduct.barcode} | বর্তমান মজুদ: {deletingProduct.stock_qty} {deletingProduct.unit}
                </div>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                দ্রষ্টব্য: যদি এই পণ্যের অধীনে পূর্বে কোনো বিক্রয় চালান (অর্ডার) তৈরি হয়ে থাকে, তবে হিসাবের ভারসাম্য রক্ষার্থে এটি মুছে ফেলা যাবে না। সেক্ষেত্রে স্টক ০ করে সংরক্ষণ করতে পারেন।
              </p>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                বাতিল করুন
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                disabled={saving}
                onClick={handleDeleteProduct}
              >
                {saving ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, পণ্যটি মুছে ফেলুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
