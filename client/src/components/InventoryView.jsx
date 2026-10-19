import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  Edit2,
  Trash2,
  Sliders,
  X,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Calendar,
  FolderPlus,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api';
import { 
  DEFAULT_DEPARTMENTS, 
  DEPARTMENT_CATEGORIES_BY_ID, 
  DEPARTMENT_CATEGORIES_BY_NAME 
} from '../constants/departments';

export default function InventoryView() {
  const [products, setProducts] = useState([]);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('all');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [expiryFilter, setExpiryFilter] = useState('all');
  const [expiryFrom, setExpiryFrom] = useState('');
  const [expiryTo, setExpiryTo] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [highlightedId, setHighlightedId] = useState(null);
  const [successBanner, setSuccessBanner] = useState('');

  // Fallback guaranteed active departments list
  const activeDepartments = (departments && departments.length > 0) ? departments : DEFAULT_DEPARTMENTS;

  // Custom Category toggle & text states
  const [isCustomAddCategory, setIsCustomAddCategory] = useState(false);
  const [_customAddCategory, setCustomAddCategory] = useState('');
  const [isCustomEditCategory, setIsCustomEditCategory] = useState(false);
  const [_customEditCategory, setCustomEditCategory] = useState('');

  // Add Department Modal state
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptForm, setNewDeptForm] = useState({
    name: '',
    code: '',
    description: '',
    initialCategories: ''
  });
  const [savingDept, setSavingDept] = useState(false);
  const [customDeptCategories, setCustomDeptCategories] = useState({});

  // Helper to dynamically get categories for any department
  const getCategoriesForDept = (deptId, extraCategory = '') => {
    const deptObj = activeDepartments.find(d => d.id === deptId);
    const byId = DEPARTMENT_CATEGORIES_BY_ID[deptId] || [];
    const byName = deptObj ? (DEPARTMENT_CATEGORIES_BY_NAME[deptObj.name] || []) : [];
    const fromCustom = customDeptCategories[deptId] || [];
    
    // Also extract existing categories from products that belong to this department
    const fromProducts = products
      .filter(p => p.department_id === deptId && p.category)
      .map(p => p.category.trim());

    const all = [
      ...byId,
      ...byName,
      ...fromCustom,
      ...fromProducts,
      ...(extraCategory ? [extraCategory.trim()] : [])
    ];

    const unique = Array.from(new Set(all.filter(Boolean)));
    return unique.length > 0 ? unique : ['সাধারণ ক্যাটাগরি', 'অন্যান্য'];
  };

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProd, setNewProd] = useState({
    name: '',
    barcode: '',
    department_id: '',
    category: '',
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

  const loadData = async (overrides = {}) => {
    try {
      setLoading(true);
      const targetDept = overrides.department_id !== undefined ? overrides.department_id : selectedDept;
      const targetSearch = overrides.search !== undefined ? overrides.search : search;
      const targetLow = overrides.low_stock !== undefined ? overrides.low_stock : lowStockOnly;
      const targetExp = overrides.expiry_filter !== undefined ? overrides.expiry_filter : expiryFilter;
      const targetFrom = overrides.expiry_from !== undefined ? overrides.expiry_from : (targetExp === 'custom' ? expiryFrom : '');
      const targetTo = overrides.expiry_to !== undefined ? overrides.expiry_to : (targetExp === 'custom' ? expiryTo : '');
      const targetSort = overrides.sort !== undefined ? overrides.sort : sortBy;

      const [prodsRes, deptsRes] = await Promise.allSettled([
        api.getProducts({ 
          department_id: targetDept, 
          search: targetSearch, 
          low_stock: targetLow,
          expiry_filter: targetExp,
          expiry_from: targetFrom || undefined,
          expiry_to: targetTo || undefined,
          sort: targetSort
        }),
        api.getDepartments()
      ]);

      if (prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value)) {
        setProducts(prodsRes.value);
      } else if (prodsRes.status === 'rejected') {
        console.error('Products load error:', prodsRes.reason);
      }

      if (deptsRes.status === 'fulfilled' && Array.isArray(deptsRes.value) && deptsRes.value.length > 0) {
        setDepartments(deptsRes.value);
      } else {
        setDepartments(DEFAULT_DEPARTMENTS);
      }
    } catch (err) {
      console.error('Error in loadData:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDept, search, lowStockOnly, expiryFilter, expiryFrom, expiryTo, sortBy]);

  // Quick inline stock increment
  const handleQuickStockAdjust = async (id, change) => {
    try {
      await api.updateStock(id, { change, reason: `দ্রুত +${change} রিস্টক` });
      loadData();
    } catch (err) {
      alert('স্টক সমন্বয় ব্যর্থ: ' + err.message);
    }
  };

  // Open New Product Modal with properly selected Department & Category
  const handleOpenAddModal = () => {
    const defaultDept = (selectedDept !== 'all' && selectedDept) 
      ? selectedDept 
      : (activeDepartments[0]?.id || 'dept_paper');
    const deptCats = getCategoriesForDept(defaultDept);
    const initialCategory = deptCats[0] || 'সাধারণ ক্যাটাগরি';

    setNewProd({
      name: '',
      barcode: '890' + Math.floor(100000 + Math.random() * 900000),
      department_id: defaultDept,
      category: initialCategory,
      price: '',
      cost: '',
      stock_qty: 50,
      min_threshold: 15,
      unit: 'পিস',
      has_expiry: false,
      expiry_date: ''
    });
    setIsCustomAddCategory(false);
    setCustomAddCategory('');
    setShowAddModal(true);
  };

  // When Department changes in Add Modal
  const handleNewProdDeptChange = (deptId) => {
    const deptCats = getCategoriesForDept(deptId);
    const firstCat = deptCats[0] || 'সাধারণ ক্যাটাগরি';
    setNewProd(prev => ({
      ...prev,
      department_id: deptId,
      category: firstCat
    }));
    setIsCustomAddCategory(false);
    setCustomAddCategory('');
  };

  // CREATE: New Department
  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptForm.name || !newDeptForm.name.trim()) {
      alert('অনুগ্রহ করে বিভাগের নাম লিখুন');
      return;
    }

    try {
      setSavingDept(true);
      const res = await api.createDepartment({
        name: newDeptForm.name.trim(),
        code: newDeptForm.code ? newDeptForm.code.trim() : undefined,
        description: newDeptForm.description ? newDeptForm.description.trim() : ''
      });

      // Parse initial categories
      const enteredCats = newDeptForm.initialCategories
        ? newDeptForm.initialCategories.split(',').map(c => c.trim()).filter(Boolean)
        : [];
      const catsToAdd = enteredCats.length > 0 ? enteredCats : ['সাধারণ সামগ্রী', 'অন্যান্য'];

      setCustomDeptCategories(prev => ({
        ...prev,
        [res.id]: catsToAdd
      }));

      // Update departments state
      setDepartments(prev => {
        const exists = prev.some(d => d.id === res.id);
        return exists ? prev : [...prev, res];
      });

      // If Add Product modal is open, immediately select this new department
      if (showAddModal) {
        setNewProd(prev => ({
          ...prev,
          department_id: res.id,
          category: catsToAdd[0] || 'সাধারণ স্টেশনারি'
        }));
        setIsCustomAddCategory(false);
      }

      // If Edit Product modal is open, immediately select this new department
      if (showEditModal) {
        setEditForm(prev => ({
          ...prev,
          department_id: res.id,
          category: catsToAdd[0] || 'সাধারণ স্টেশনারি'
        }));
        setIsCustomEditCategory(false);
      }

      setShowAddDeptModal(false);
      setNewDeptForm({ name: '', code: '', description: '', initialCategories: '' });
      alert(`'${res.name}' বিভাগটি সফলভাবে তৈরি হয়েছে!`);
    } catch (err) {
      alert('বিভাগ তৈরি ব্যর্থ: ' + err.message);
    } finally {
      setSavingDept(false);
    }
  };

  // CREATE: New Product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProd.department_id) {
      alert('অনুগ্রহ করে একটি বিভাগ নির্বাচন করুন');
      return;
    }
    const finalCategory = (newProd.category && newProd.category.trim()) || 'সাধারণ স্টেশনারি';
    try {
      setSaving(true);
      const created = await api.createProduct({
        ...newProd,
        category: finalCategory
      });

      // Clear filters so the newly created product is guaranteed to be visible in the table!
      setSelectedDept('all');
      setSearch('');
      setLowStockOnly(false);
      setExpiryFilter('all');
      setExpiryFrom('');
      setExpiryTo('');
      setSortBy('newest');

      setShowAddModal(false);

      // Immediately reload data with clean filters so the user sees it on top
      await loadData({
        department_id: 'all',
        search: '',
        low_stock: false,
        expiry_filter: 'all',
        sort: 'newest'
      });

      // Highlight the row so the user can easily identify it
      if (created && created.id) {
        setHighlightedId(created.id);
        setTimeout(() => setHighlightedId(null), 6000);
      }

      setSuccessBanner(`✓ নতুন পণ্য '${created.name || newProd.name}' সফলভাবে ক্যাটালগে যুক্ত হয়েছে এবং তালিকার শীর্ষে প্রদর্শিত হচ্ছে!`);
      setTimeout(() => setSuccessBanner(''), 7000);
    } catch (err) {
      alert('পণ্য যুক্ত করতে ব্যর্থ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Modal with properly selected Department & Category
  const openEditModal = (product) => {
    setEditingProduct(product);
    const deptCats = getCategoriesForDept(product.department_id, product.category);
    const isCustom = Boolean(product.category && !deptCats.includes(product.category));

    setEditForm({
      name: product.name,
      barcode: product.barcode,
      department_id: product.department_id,
      category: product.category || deptCats[0] || 'সাধারণ স্টেশনারি',
      price: product.price,
      cost: product.cost,
      stock_qty: product.stock_qty,
      min_threshold: product.min_threshold,
      unit: product.unit || 'পিস',
      has_expiry: Boolean(product.has_expiry),
      expiry_date: product.expiry_date || ''
    });
    setIsCustomEditCategory(isCustom);
    setCustomEditCategory(isCustom ? product.category : '');
    setShowEditModal(true);
  };

  // When Department changes in Edit Modal
  const handleEditFormDeptChange = (deptId) => {
    const deptCats = getCategoriesForDept(deptId);
    setEditForm(prev => ({
      ...prev,
      department_id: deptId,
      category: deptCats[0] || 'সাধারণ স্টেশনারি'
    }));
    setIsCustomEditCategory(false);
    setCustomEditCategory('');
  };

  // UPDATE: Existing Product
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editForm.department_id) {
      alert('অনুগ্রহ করে একটি বিভাগ নির্বাচন করুন');
      return;
    }
    const finalCategory = (editForm.category && editForm.category.trim()) || 'সাধারণ স্টেশনারি';
    try {
      setSaving(true);
      const updated = await api.updateProduct(editingProduct.id, {
        ...editForm,
        category: finalCategory
      });
      setShowEditModal(false);
      setEditingProduct(null);
      await loadData();

      const updatedId = updated?.id || editingProduct.id;
      setHighlightedId(updatedId);
      setTimeout(() => setHighlightedId(null), 5000);

      setSuccessBanner(`✓ পণ্য '${updated?.name || editForm.name}' সফলভাবে আপডেট করা হয়েছে!`);
      setTimeout(() => setSuccessBanner(''), 6000);
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
      <div className="glass-panel" style={{ padding: '1.5rem 1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Package size={22} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: '1.35rem', margin: 0 }}>মিজান কম্পিউটার অ্যান্ড কসমেটিকস ইনভেন্টরি ও পণ্য ক্যাটালগ (CRUD)</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
              সকল কম্পিউটার এক্সেসরিজ, কসমেটিকস ও স্টেশনারি পণ্যের নতুন এসকেইউ সংযোজন, তথ্য সম্পাদনা, ড্যামেজ সমন্বয় ও সম্পূর্ণ ইনভেন্টরি নিয়ন্ত্রণ।
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setNewDeptForm({ name: '', code: '', description: '', initialCategories: '' });
                setShowAddDeptModal(true);
              }}
            >
              <FolderPlus size={16} /> নতুন বিভাগ যুক্ত করুন
            </button>
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              <Plus size={16} /> নতুন পণ্য যুক্ত করুন
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {successBanner && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: 'var(--success)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            marginTop: '1.25rem',
            fontWeight: 600,
            fontSize: '0.88rem',
            animation: 'fadeIn 0.3s ease'
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

        {/* Filter controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginTop: '1.35rem' }}>
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
              <option value="all">সকল বিভাগ ({products.length} পণ্য)</option>
              {activeDepartments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">ক্রমানুসার (Sorting)</label>
            <div style={{ position: 'relative' }}>
              <select 
                className="form-control"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">🕒 সর্বশেষ সংযোজিত (শীর্ষে)</option>
                <option value="name">🔤 নামানুসারে (A - Z)</option>
                <option value="price_desc">💰 বিক্রয়মূল্য: বেশি থেকে কম</option>
                <option value="price_asc">🏷️ বিক্রয়মূল্য: কম থেকে বেশি</option>
                <option value="stock_asc">📦 স্টক: কম থেকে বেশি</option>
                <option value="stock_desc">📦 স্টক: বেশি থেকে কম</option>
                <option value="oldest">📅 পুরাতন সংযোজিত</option>
              </select>
            </div>
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
              style={{ justifyContent: 'flex-start', height: '38px' }}
              onClick={() => setLowStockOnly(!lowStockOnly)}
            >
              <AlertTriangle size={15} />
              <span>{lowStockOnly ? 'কম স্টক ফিল্টার্ড' : 'সকল স্টক প্রদর্শিত'}</span>
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
        <div className="data-table-container desktop-table-view" style={{ border: 'none' }}>
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
                  const isHighlighted = p.id === highlightedId;

                  return (
                    <tr 
                      key={p.id}
                      style={isHighlighted ? {
                        background: 'rgba(16, 185, 129, 0.12)',
                        borderLeft: '4px solid #10b981',
                        transition: 'background 0.5s ease'
                      } : {}}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                          {isHighlighted && (
                            <span style={{ 
                              background: '#10b981', 
                              color: '#fff', 
                              fontSize: '0.62rem', 
                              padding: '0.1rem 0.4rem', 
                              borderRadius: '999px', 
                              fontWeight: 800 
                            }}>
                              ✨ সদ্য যুক্ত / আপডেট
                            </span>
                          )}
                        </div>
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

        {/* Mobile Touch-Friendly Product Cards (Rendered on Mobile <= 768px) */}
        <div className="inventory-mobile-card-list">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              পণ্য তালিকা লোড হচ্ছে...
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              কোনো পণ্য পাওয়া যায়নি।
            </div>
          ) : (
            products.map((p) => {
              const isLow = p.stock_qty <= p.min_threshold;
              const marginPct = p.price > 0 ? (((p.price - p.cost) / p.price) * 100).toFixed(0) : 0;
              const isHighlighted = p.id === highlightedId;
              const today = new Date().toISOString().split('T')[0];
              const isExpired = p.has_expiry && p.expiry_date && p.expiry_date < today;
              const diffDays = p.has_expiry && p.expiry_date ? Math.round((new Date(p.expiry_date) - new Date(today)) / (1000 * 60 * 60 * 24)) : null;

              return (
                <div key={p.id} className={`inventory-mobile-card ${isHighlighted ? 'highlighted' : ''}`}>
                  {/* Header: Name and Category Meta */}
                  <div className="inv-card-header">
                    <div>
                      <div className="inv-card-title">
                        {p.name}
                        {isHighlighted && <span className="inv-highlight-badge">✨ নতুন</span>}
                      </div>
                      <div className="inv-card-meta">
                        <span className="inv-dept-tag">{p.department_name}</span>
                        <span className="inv-cat-tag">{p.category}</span>
                        <span className="inv-barcode-tag">#{p.barcode}</span>
                      </div>
                    </div>
                  </div>

                  {/* Alerts row: Low stock / Expiry */}
                  {(isLow || isExpired || (diffDays !== null && diffDays <= 45)) && (
                    <div className="inv-card-alerts">
                      {isLow && (
                        <span className="inv-alert-badge low-stock">
                          ⚠️ কম স্টক ({p.stock_qty} / সীমা {p.min_threshold})
                        </span>
                      )}
                      {isExpired && (
                        <span className="inv-alert-badge expired">
                          ⚠ মেয়াদোত্তীর্ণ ({p.expiry_date})
                        </span>
                      )}
                      {!isExpired && diffDays !== null && diffDays <= 45 && (
                        <span className="inv-alert-badge expiring-soon">
                          ⏳ মেয়াদ {diffDays} দিন বাকি ({p.expiry_date})
                        </span>
                      )}
                    </div>
                  )}

                  {/* 3-Column Financial & Stock Metrics */}
                  <div className="inv-card-numbers-grid">
                    <div className="inv-number-box">
                      <div className="inv-number-label">বিক্রয়মূল্য</div>
                      <div className="inv-number-val price">৳{p.price.toFixed(2)}</div>
                    </div>
                    <div className="inv-number-box">
                      <div className="inv-number-label">ক্রয় ও মার্জিন</div>
                      <div className="inv-number-val cost">
                        ৳{p.cost.toFixed(2)}
                        <span className="inv-margin-badge" style={{ color: marginPct >= 30 ? 'var(--success)' : marginPct >= 15 ? 'var(--warning)' : 'var(--danger)' }}>
                          ({marginPct}%)
                        </span>
                      </div>
                    </div>
                    <div className="inv-number-box">
                      <div className="inv-number-label">বর্তমান স্টক</div>
                      <div className={`inv-number-val stock ${isLow ? 'low' : ''}`}>
                        {p.stock_qty} {p.unit}
                      </div>
                    </div>
                  </div>

                  {/* Touch Action Buttons */}
                  <div className="inv-card-actions">
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm inv-card-btn"
                      onClick={() => openAdjustModal(p)}
                      title="স্টক সমন্বয়"
                    >
                      <Sliders size={13} style={{ color: 'var(--accent)' }} />
                      <span>স্টক সমন্বয়</span>
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm inv-card-btn quick-plus"
                      onClick={() => handleQuickStockAdjust(p.id, 10)}
                      title="দ্রুত ১০ টি রিস্টক করুন"
                    >
                      <span>+১০</span>
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm inv-card-btn"
                      onClick={() => openEditModal(p)}
                      title="তথ্য সম্পাদনা"
                    >
                      <Edit2 size={13} style={{ color: 'var(--primary)' }} />
                      <span>এডিট</span>
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm inv-card-btn delete"
                      onClick={() => openDeleteModal(p)}
                      title="মুছে ফেলুন"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* =================== MODAL 1: CREATE NEW PRODUCT =================== */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Plus size={18} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>নতুন পণ্য সংযোজন (Add Product)</h2>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div className="input-group">
                  <label className="input-label">পণ্যের নাম (বাংলা) *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="যেমন: ডেল্টা লেভার আর্চ বক্স ফাইল (A4) / নিভিয়া সফট ক্রিম ১০০মি.লি."
                    value={newProd.name}
                    onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  />
                </div>

                {/* Department & Category Side by Side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label className="input-label" style={{ margin: 0 }}>বিভাগ (Department) *</label>
                      <button 
                        type="button" 
                        onClick={() => {
                          setNewDeptForm({ name: '', code: '', description: '', initialCategories: '' });
                          setShowAddDeptModal(true);
                        }}
                        style={{ 
                          background: 'rgba(99, 102, 241, 0.1)', 
                          border: '1px solid rgba(99, 102, 241, 0.25)', 
                          color: 'var(--primary)', 
                          fontSize: '0.72rem', 
                          cursor: 'pointer', 
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                          fontWeight: 600
                        }}
                      >
                        + নতুন বিভাগ
                      </button>
                    </div>
                    <select 
                      className="form-control"
                      required
                      value={newProd.department_id || activeDepartments[0]?.id || 'dept_cosmetics'}
                      onChange={(e) => handleNewProdDeptChange(e.target.value)}
                    >
                      {activeDepartments.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label className="input-label" style={{ margin: 0 }}>ক্যাটাগরি (Category) *</label>
                      {!isCustomAddCategory ? (
                        <button 
                          type="button" 
                          onClick={() => {
                            setIsCustomAddCategory(true);
                            setCustomAddCategory('');
                            setNewProd(prev => ({ ...prev, category: '' }));
                          }}
                          style={{ 
                            background: 'rgba(99, 102, 241, 0.1)', 
                            border: '1px solid rgba(99, 102, 241, 0.25)', 
                            color: 'var(--primary)', 
                            fontSize: '0.72rem', 
                            cursor: 'pointer', 
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                            fontWeight: 600
                          }}
                        >
                          + কাস্টম ক্যাটাগরি
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          onClick={() => {
                            setIsCustomAddCategory(false);
                            const cats = getCategoriesForDept(newProd.department_id);
                            setNewProd(prev => ({ ...prev, category: cats[0] || 'সাধারণ ক্যাটাগরি' }));
                          }}
                          style={{ 
                            background: 'rgba(99, 102, 241, 0.1)', 
                            border: '1px solid rgba(99, 102, 241, 0.25)', 
                            color: 'var(--primary)', 
                            fontSize: '0.72rem', 
                            cursor: 'pointer', 
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                            fontWeight: 600
                          }}
                        >
                          তালিকা থেকে
                        </button>
                      )}
                    </div>

                    {!isCustomAddCategory ? (
                      <select 
                        className="form-control"
                        required
                        value={newProd.category}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setIsCustomAddCategory(true);
                            setCustomAddCategory('');
                            setNewProd(prev => ({ ...prev, category: '' }));
                          } else {
                            setNewProd(prev => ({ ...prev, category: e.target.value }));
                          }
                        }}
                      >
                        {getCategoriesForDept(newProd.department_id).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="__custom__">➕ নতুন কাস্টম ক্যাটাগরি লিখুন...</option>
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        className="form-control" 
                        required
                        placeholder="ক্যাটাগরির নাম লিখুন (যেমন: ড্রয়িং শিট / লোশন)"
                        value={newProd.category}
                        onChange={(e) => {
                          setCustomAddCategory(e.target.value);
                          setNewProd(prev => ({ ...prev, category: e.target.value }));
                        }}
                        autoFocus
                      />
                    )}
                  </div>
                </div>

                {/* Barcode & Unit */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label className="input-label" style={{ margin: 0 }}>বারকোড / এসকেইউ *</label>
                      <button 
                        type="button" 
                        onClick={generateRandomBarcode}
                        style={{ 
                          background: 'rgba(99, 102, 241, 0.1)', 
                          border: '1px solid rgba(99, 102, 241, 0.25)', 
                          color: 'var(--primary)', 
                          fontSize: '0.72rem', 
                          cursor: 'pointer', 
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                          fontWeight: 600
                        }}
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
                    <label className="input-label" style={{ marginBottom: '0.35rem' }}>একক (Unit) *</label>
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
                </div>

                {/* Price, Cost in 2 Columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                </div>

                {/* Initial Stock & Threshold in 2 Columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">প্রারম্ভিক মজুদ স্টক</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={newProd.stock_qty}
                      onChange={(e) => setNewProd({ ...newProd, stock_qty: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">কম স্টক অ্যালার্ট সীমা</label>
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
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.86rem', fontWeight: 600, cursor: 'pointer', margin: 0 }}>
                      <input 
                        type="checkbox"
                        checked={newProd.has_expiry}
                        onChange={(e) => setNewProd({ ...newProd, has_expiry: e.target.checked, expiry_date: e.target.checked ? (newProd.expiry_date || '') : '' })}
                        style={{ accentColor: 'var(--primary)', width: '17px', height: '17px' }}
                      />
                      <span>এই পণ্যে মেয়াদোত্তীর্ণের তারিখ (Expiry Date) প্রযোজ্য</span>
                    </label>
                    <span style={{ fontSize: '0.74rem', color: newProd.has_expiry ? 'var(--primary)' : 'var(--text-dim)', fontWeight: 600 }}>
                      {newProd.has_expiry ? 'তারিখ প্রযোজ্য' : 'প্রযোজ্য নয় (Not Applicable)'}
                    </span>
                  </div>

                  {newProd.has_expiry ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '0.85rem', alignItems: 'center', marginTop: '0.25rem' }}>
                      <input 
                        type="date"
                        className="form-control"
                        required={newProd.has_expiry}
                        value={newProd.expiry_date}
                        onChange={(e) => setNewProd({ ...newProd, expiry_date: e.target.value })}
                      />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        কসমেটিকস, ক্রিম, লোশন, আঠা বা কালির মেয়াদ
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      🔒 স্টেশনারি বা দীর্ঘমেয়াদী সামগ্রীতে মেয়াদ প্রয়োজন না হলে এটি বন্ধ রাখুন।
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
          <div className="modal-card" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Edit2 size={18} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>পণ্য ও মূল্য সম্পাদনা (Edit Product)</h2>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowEditModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
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

                {/* Department & Category Side by Side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label className="input-label" style={{ margin: 0 }}>বিভাগ (Department) *</label>
                      <button 
                        type="button" 
                        onClick={() => {
                          setNewDeptForm({ name: '', code: '', description: '', initialCategories: '' });
                          setShowAddDeptModal(true);
                        }}
                        style={{ 
                          background: 'rgba(99, 102, 241, 0.1)', 
                          border: '1px solid rgba(99, 102, 241, 0.25)', 
                          color: 'var(--primary)', 
                          fontSize: '0.72rem', 
                          cursor: 'pointer', 
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                          fontWeight: 600
                        }}
                      >
                        + নতুন বিভাগ
                      </button>
                    </div>
                    <select 
                      className="form-control"
                      required
                      value={editForm.department_id}
                      onChange={(e) => handleEditFormDeptChange(e.target.value)}
                    >
                      {activeDepartments.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label className="input-label" style={{ margin: 0 }}>ক্যাটাগরি (Category) *</label>
                      {!isCustomEditCategory ? (
                        <button 
                          type="button" 
                          onClick={() => {
                            setIsCustomEditCategory(true);
                            setCustomEditCategory('');
                            setEditForm(prev => ({ ...prev, category: '' }));
                          }}
                          style={{ 
                            background: 'rgba(99, 102, 241, 0.1)', 
                            border: '1px solid rgba(99, 102, 241, 0.25)', 
                            color: 'var(--primary)', 
                            fontSize: '0.72rem', 
                            cursor: 'pointer', 
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                            fontWeight: 600
                          }}
                        >
                          + কাস্টম ক্যাটাগরি
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          onClick={() => {
                            setIsCustomEditCategory(false);
                            const cats = getCategoriesForDept(editForm.department_id, editingProduct?.category);
                            setEditForm(prev => ({ ...prev, category: cats[0] || 'সাধারণ ক্যাটাগরি' }));
                          }}
                          style={{ 
                            background: 'rgba(99, 102, 241, 0.1)', 
                            border: '1px solid rgba(99, 102, 241, 0.25)', 
                            color: 'var(--primary)', 
                            fontSize: '0.72rem', 
                            cursor: 'pointer', 
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                            fontWeight: 600
                          }}
                        >
                          তালিকা থেকে
                        </button>
                      )}
                    </div>

                    {!isCustomEditCategory ? (
                      <select 
                        className="form-control"
                        required
                        value={editForm.category}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setIsCustomEditCategory(true);
                            setCustomEditCategory('');
                            setEditForm(prev => ({ ...prev, category: '' }));
                          } else {
                            setEditForm(prev => ({ ...prev, category: e.target.value }));
                          }
                        }}
                      >
                        {getCategoriesForDept(editForm.department_id, editingProduct?.category).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="__custom__">➕ নতুন কাস্টম ক্যাটাগরি লিখুন...</option>
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        className="form-control" 
                        required
                        placeholder="ক্যাটাগরির নাম লিখুন (যেমন: ড্রয়িং শিট / লোশন)"
                        value={editForm.category}
                        onChange={(e) => {
                          setCustomEditCategory(e.target.value);
                          setEditForm(prev => ({ ...prev, category: e.target.value }));
                        }}
                        autoFocus
                      />
                    )}
                  </div>
                </div>

                {/* Barcode & Unit */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label" style={{ marginBottom: '0.35rem' }}>বারকোড / এসকেইউ *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={editForm.barcode}
                      onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" style={{ marginBottom: '0.35rem' }}>একক (Unit) *</label>
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
                </div>

                {/* Price, Cost in 2 Columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                </div>

                {/* Current Stock & Threshold in 2 Columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">বর্তমান মজুদ স্টক</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={editForm.stock_qty}
                      onChange={(e) => setEditForm({ ...editForm, stock_qty: e.target.value })}
                    />
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
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.86rem', fontWeight: 600, cursor: 'pointer', margin: 0 }}>
                      <input 
                        type="checkbox"
                        checked={editForm.has_expiry}
                        onChange={(e) => setEditForm({ ...editForm, has_expiry: e.target.checked, expiry_date: e.target.checked ? (editForm.expiry_date || '') : '' })}
                        style={{ accentColor: 'var(--primary)', width: '17px', height: '17px' }}
                      />
                      <span>এই পণ্যে মেয়াদোত্তীর্ণের তারিখ (Expiry Date) প্রযোজ্য</span>
                    </label>
                    <span style={{ fontSize: '0.74rem', color: editForm.has_expiry ? 'var(--primary)' : 'var(--text-dim)', fontWeight: 600 }}>
                      {editForm.has_expiry ? 'তারিখ প্রযোজ্য' : 'প্রযোজ্য নয় (Not Applicable)'}
                    </span>
                  </div>

                  {editForm.has_expiry ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '0.85rem', alignItems: 'center', marginTop: '0.25rem' }}>
                      <input 
                        type="date"
                        className="form-control"
                        required={editForm.has_expiry}
                        value={editForm.expiry_date}
                        onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })}
                      />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        মেয়াদ উত্তীর্ণের তারিখ নির্ধারণ করুন
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      🔒 স্টেশনারি বা সাধারণ সামগ্রীতে মেয়াদ প্রযোজ্য না হলে বন্ধ রাখুন।
                    </div>
                  )}
                </div>

                {/* Profit Margin Preview Box */}
                {parseFloat(editForm.price) > 0 && parseFloat(editForm.cost) >= 0 && (
                  <div style={{ 
                    background: 'var(--bg-app)', 
                    padding: '0.85rem 1.15rem', 
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.86rem'
                  }}>
                    <span>একক প্রতি আনুমানিক লাভ: <strong>৳{(parseFloat(editForm.price) - parseFloat(editForm.cost || 0)).toFixed(2)}</strong></span>
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
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Sliders size={18} style={{ color: 'var(--accent)' }} />
                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>ইনভেন্টরি স্টক সমন্বয় (Stock Adjustment)</h2>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowAdjustModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleExecuteStockAdjust}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div style={{ background: 'var(--bg-app)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.96rem' }}>{adjustingProduct.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                    বর্তমান স্টক: <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{adjustingProduct.stock_qty} {adjustingProduct.unit}</strong> | বারকোড: {adjustingProduct.barcode}
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ marginBottom: '0.45rem' }}>সমন্বয়ের ধরণ নির্বাচন করুন *</label>
                  <div className="stock-adjust-btn-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${adjustType === 'add' ? 'btn-success' : 'btn-secondary'}`}
                      style={{ justifyContent: 'center', fontSize: '0.82rem', padding: '0.55rem 0.75rem' }}
                      onClick={() => setAdjustType('add')}
                    >
                      <ArrowUpRight size={14} /> স্টক বৃদ্ধি (+)
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${adjustType === 'remove' ? 'btn-danger' : 'btn-secondary'}`}
                      style={{ justifyContent: 'center', fontSize: '0.82rem', padding: '0.55rem 0.75rem' }}
                      onClick={() => setAdjustType('remove')}
                    >
                      <ArrowDownRight size={14} /> ড্যামেজ/হ্রাস (-)
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${adjustType === 'set' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ justifyContent: 'center', fontSize: '0.82rem', padding: '0.55rem 0.75rem' }}
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

                <div style={{ 
                  fontSize: '0.84rem', 
                  color: 'var(--text-muted)', 
                  padding: '0.75rem 1rem', 
                  background: 'var(--bg-app)', 
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}>
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
          <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--danger)' }}>
                <ShieldAlert size={20} />
                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>পণ্য মুছে ফেলার সতর্কতা</h2>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowDeleteModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.92rem', margin: 0, lineHeight: 1.5 }}>
                আপনি কি নিশ্চিতভাবে এই পণ্যটি মিজান কম্পিউটার অ্যান্ড কসমেটিকসের ক্যাটালগ থেকে মুছে ফেলতে চান?
              </p>

              <div style={{ 
                background: 'var(--danger-bg)', 
                padding: '1rem 1.25rem', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--danger-border)',
                fontSize: '0.85rem'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.94rem' }}>{deletingProduct.name}</div>
                <div style={{ color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                  বারকোড: {deletingProduct.barcode} | বর্তমান মজুদ: {deletingProduct.stock_qty} {deletingProduct.unit}
                </div>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
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

      {/* =================== MODAL 5: ADD NEW DEPARTMENT =================== */}
      {showAddDeptModal && (
        <div className="modal-overlay" onClick={() => setShowAddDeptModal(false)}>
          <div className="modal-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div className="brand-icon" style={{ width: '34px', height: '34px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FolderPlus size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>নতুন বিভাগ সংযোজন (Add Department)</h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>ইনভেন্টরি ক্যাটালগ ও পিওএস-এর জন্য নতুন পণ্য বিভাগ তৈরি করুন</p>
                </div>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowAddDeptModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div className="input-group">
                  <label className="input-label">বিভাগের নাম (Department Name) *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="যেমন: কম্পিউটার ও আইটি সামগ্রী, উপহার ও খেলনা..."
                    value={newDeptForm.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewDeptForm(prev => {
                        const englishChars = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                        const suggestedCode = englishChars.length >= 3 ? englishChars.substring(0, 4) : prev.code;
                        return { ...prev, name: val, code: prev.code ? prev.code : suggestedCode };
                      });
                    }}
                  />
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="input-label">বিভাগ কোড (Department Code)</label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>যেমন: ITAC, GIFT, BOOK (ঐচ্ছিক)</span>
                  </div>
                  <input 
                    type="text" 
                    className="form-control" 
                    maxLength={6}
                    placeholder="যেমন: ITAC"
                    value={newDeptForm.code}
                    onChange={(e) => setNewDeptForm({ ...newDeptForm, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="input-label">প্রাথমিক ক্যাটাগরি তালিকা</label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>কমা (,) দিয়ে আলাদা করুন</span>
                  </div>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="যেমন: মাউস, কিবোর্ড, পেনড্রাইভ, ডাটা ক্যাবল"
                    value={newDeptForm.initialCategories}
                    onChange={(e) => setNewDeptForm({ ...newDeptForm, initialCategories: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">বিবরণ (Description)</label>
                  <textarea 
                    className="form-control" 
                    rows={2}
                    placeholder="বিভাগের সংক্ষিপ্ত পরিচিতি..."
                    value={newDeptForm.description}
                    onChange={(e) => setNewDeptForm({ ...newDeptForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddDeptModal(false)}>
                  বাতিল
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingDept}>
                  <Plus size={15} /> {savingDept ? 'সংরক্ষণ হচ্ছে...' : 'বিভাগ তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
