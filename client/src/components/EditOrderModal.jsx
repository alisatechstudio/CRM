import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Trash2, 
  Plus, 
  Minus, 
  AlertTriangle, 
  CheckCircle, 
  ShoppingBag, 
  CreditCard, 
  User, 
  Clock, 
  DollarSign,
  Package,
  ArrowRight,
  RefreshCw,
  Search
} from 'lucide-react';
import { api } from '../api';

export default function EditOrderModal({ orderId, onClose, onUpdated, onDeleted }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState(null);

  // Original Order & Reference Data
  const [order, setOrder] = useState(null);
  const [products, setProducts] = useState([]);

  // Form State
  const [items, setItems] = useState([]);
  const [manualDiscount, setManualDiscount] = useState(0);
  const [manualDiscountReason, setManualDiscountReason] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('নগদ (Cash)');
  const [cashierName, setCashierName] = useState('মিজানুর রহমান');
  const [status, setStatus] = useState('Completed');

  // Product Selector Popover / Drawer State
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);
  const [customItem, setCustomItem] = useState({ name: '', price: '', qty: 1, deptName: 'সাধারণ স্টেশনারি' });

  // Load Order and Inventory Products
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [ord, prodList] = await Promise.all([
          api.getOrderById(orderId),
          api.getProducts({ limit: 200 })
        ]);

        if (!isMounted) return;

        setOrder(ord);
        setProducts(prodList || []);

        // Initialize form fields
        setItems((ord.items || []).map(it => ({
          id: it.id,
          product_id: it.product_id || null,
          product_name: it.product_name,
          department_name: it.department_name || 'সাধারণ স্টেশনারি',
          unit_price: it.unit_price || 0,
          quantity: it.quantity || 1,
          total_price: (it.unit_price || 0) * (it.quantity || 1)
        })));

        setManualDiscount(ord.manual_discount || 0);
        setManualDiscountReason(ord.manual_discount_reason || '');
        setPaidAmount(ord.paid_amount !== undefined ? String(ord.paid_amount) : String(ord.total));
        setPaymentMethod(ord.payment_method || 'নগদ (Cash)');
        setCashierName(ord.cashier_name || 'মিজানুর রহমান');
        setStatus(ord.status || 'Completed');
      } catch (err) {
        if (isMounted) setError(err.message || 'অর্ডারের তথ্য লোড করতে সমস্যা হয়েছে');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (orderId) loadData();
    return () => { isMounted = false; };
  }, [orderId]);

  // Financial Calculations
  const calculatedSubtotal = items.reduce((acc, it) => acc + (it.unit_price * it.quantity), 0);
  const couponDiscount = order?.discount_amount || 0;
  const pointsDiscount = order?.points_discount || 0;
  const numManualDiscount = Math.max(0, parseFloat(manualDiscount) || 0);
  const totalDiscount = Math.min(calculatedSubtotal, numManualDiscount + couponDiscount + pointsDiscount);
  const calculatedTotal = Math.max(0, Number((calculatedSubtotal - totalDiscount).toFixed(2)));

  const parsedPaid = paidAmount === '' ? calculatedTotal : (parseFloat(paidAmount) || 0);
  const calculatedDue = parsedPaid < calculatedTotal ? Number((calculatedTotal - parsedPaid).toFixed(2)) : 0;
  const calculatedChange = parsedPaid > calculatedTotal ? Number((parsedPaid - calculatedTotal).toFixed(2)) : 0;
  const derivedPaymentStatus = calculatedDue === 0 ? 'Paid' : (parsedPaid > 0 ? 'Partial' : 'Due');

  // Item Handlers
  const handleQuantityChange = (index, delta) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      const newQty = Math.max(1, item.quantity + delta);
      item.quantity = newQty;
      item.total_price = Number((item.unit_price * newQty).toFixed(2));
      updated[index] = item;
      return updated;
    });
  };

  const handleSetQuantity = (index, val) => {
    const q = parseInt(val, 10);
    if (isNaN(q) || q < 1) return;
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      item.quantity = q;
      item.total_price = Number((item.unit_price * q).toFixed(2));
      updated[index] = item;
      return updated;
    });
  };

  const handlePriceChange = (index, val) => {
    const p = parseFloat(val);
    if (isNaN(p) || p < 0) return;
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      item.unit_price = p;
      item.total_price = Number((p * item.quantity).toFixed(2));
      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      alert('অর্ডারে কমপক্ষে একটি পণ্য থাকা আবশ্যক!');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddProductFromList = (prod) => {
    setItems(prev => {
      // Check if product already exists in items
      const existingIdx = prev.findIndex(it => it.product_id === prod.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const item = { ...updated[existingIdx] };
        item.quantity += 1;
        item.total_price = Number((item.unit_price * item.quantity).toFixed(2));
        updated[existingIdx] = item;
        return updated;
      }

      // Add new item
      return [
        ...prev,
        {
          id: `item_${Date.now()}_${prev.length + 1}`,
          product_id: prod.id,
          product_name: prod.name,
          department_name: prod.department_name || prod.category || 'সাধারণ স্টেশনারি',
          unit_price: prod.price || 0,
          quantity: 1,
          total_price: prod.price || 0
        }
      ];
    });
    setShowProductPicker(false);
  };

  const handleAddCustomItem = (e) => {
    e.preventDefault();
    if (!customItem.name.trim()) return;
    const price = parseFloat(customItem.price) || 0;
    const qty = parseInt(customItem.qty, 10) || 1;

    setItems(prev => [
      ...prev,
      {
        id: `item_manual_${Date.now()}`,
        product_id: null,
        product_name: customItem.name.trim(),
        department_name: customItem.deptName || 'সাধারণ স্টেশনারি',
        unit_price: price,
        quantity: qty,
        total_price: Number((price * qty).toFixed(2))
      }
    ]);

    setCustomItem({ name: '', price: '', qty: 1, deptName: 'সাধারণ স্টেশনারি' });
    setShowCustomItemForm(false);
  };

  // Submit Update
  const handleSave = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      setError('অর্ডারে কমপক্ষে একটি পণ্য থাকা আবশ্যক');
      return;
    }

    if (calculatedDue > 0 && !order.customer_id) {
      setError('বাকি বিক্রির জন্য গ্রাহক/মেম্বার থাকা আবশ্যক');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        items,
        manual_discount: numManualDiscount,
        manual_discount_reason: manualDiscountReason,
        paid_amount: parsedPaid,
        payment_method: paymentMethod,
        cashier_name: cashierName,
        status
      };

      const res = await api.updateOrder(order.id, payload);
      if (onUpdated) onUpdated(res.order || res);
      onClose();
    } catch (err) {
      setError(err.message || 'অর্ডার আপডেট করতে ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  // Submit Delete
  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      await api.deleteOrder(order.id);
      if (onDeleted) onDeleted(order.id);
      onClose();
    } catch (err) {
      setError(err.message || 'অর্ডার মুছে ফেলতে ব্যর্থ হয়েছে');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  // Filtered products for search
  const filteredProducts = products.filter(p => {
    if (!productSearch) return true;
    const s = productSearch.toLowerCase();
    return (
      p.name?.toLowerCase().includes(s) ||
      p.barcode?.includes(s) ||
      p.category?.toLowerCase().includes(s)
    );
  }).slice(0, 15);

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-card" style={{ maxWidth: '480px', padding: '2.5rem', textAlign: 'center' }}>
          <RefreshCw className="spin" size={32} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>চালানের তথ্য লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="modal-overlay">
        <div className="modal-card" style={{ maxWidth: '440px', padding: '2rem', textAlign: 'center' }}>
          <AlertTriangle size={36} style={{ color: 'var(--danger)', margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>লোড ব্যর্থ হয়েছে</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</p>
          <button className="btn btn-secondary" onClick={onClose}>বন্ধ করুন</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '780px', width: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: 'var(--radius-md)', 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
              color: 'var(--primary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShoppingBag size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                  চালান এডিট / আপডেট #{order.order_number}
                </h3>
                <span className="status-pill" style={{ 
                  background: order.payment_status === 'Paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: order.payment_status === 'Paid' ? 'var(--success)' : 'var(--danger)',
                  fontSize: '0.72rem'
                }}>
                  {order.payment_status === 'Paid' ? 'পরিশোধিত' : (order.payment_status === 'Partial' ? 'আংশিক বাকি' : 'বাকি')}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                <Clock size={12} />
                <span>তারিখ: {order.created_at || order.dhaka_date}</span>
                <span>•</span>
                <span>কাস্টমার: {order.first_name ? `${order.first_name} ${order.last_name}` : 'সাধারণ খুচরা ক্রেতা'}</span>
              </div>
            </div>
          </div>

          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.25rem' }}>
          {error && (
            <div style={{ 
              padding: '0.75rem 1rem', 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(239, 68, 68, 0.12)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              color: 'var(--danger)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* SECTION 1: ITEMS LIST */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Package size={15} style={{ color: 'var(--primary)' }} />
                <span>চালানের পণ্য তালিকা ({items.length}টি)</span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setShowProductPicker(!showProductPicker);
                    setShowCustomItemForm(false);
                  }}
                  style={{ fontSize: '0.78rem' }}
                >
                  <Plus size={14} /> স্টক পণ্য যোগ
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setShowCustomItemForm(!showCustomItemForm);
                    setShowProductPicker(false);
                  }}
                  style={{ fontSize: '0.78rem' }}
                >
                  <Plus size={14} /> কাস্টম পণ্য
                </button>
              </div>
            </div>

            {/* Picker for existing products */}
            {showProductPicker && (
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                marginBottom: '1rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                  <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="text"
                    className="input"
                    placeholder="পণ্য বা বারকোড খুঁজুন..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
                    autoFocus
                  />
                </div>
                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {filteredProducts.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.75rem' }}>
                      কোনো পণ্য পাওয়া যায়নি
                    </div>
                  ) : (
                    filteredProducts.map(p => (
                      <div 
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.45rem 0.65rem',
                          background: 'var(--bg-app)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          transition: 'background var(--transition-fast)'
                        }}
                        onClick={() => handleAddProductFromList(p)}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            মজুদ: {p.stock_qty} {p.unit || 'পিস'} • {p.category || 'স্টেশনারি'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>৳{p.price?.toFixed(2)}</span>
                          <button type="button" className="btn btn-primary btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                            যোগ
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Custom Item Form */}
            {showCustomItemForm && (
              <form onSubmit={handleAddCustomItem} style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                marginBottom: '1rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr)) 80px',
                gap: '0.5rem',
                alignItems: 'flex-end'
              }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>পণ্যের নাম</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="যেমন: টাইপিং বা প্রিন্ট সেবা"
                    value={customItem.name}
                    onChange={e => setCustomItem(prev => ({ ...prev, name: e.target.value }))}
                    required
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>একক মূল্য (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    placeholder="0.00"
                    value={customItem.price}
                    onChange={e => setCustomItem(prev => ({ ...prev, price: e.target.value }))}
                    required
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>পরিমাণ</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={customItem.qty}
                    onChange={e => setCustomItem(prev => ({ ...prev, qty: e.target.value }))}
                    required
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm" style={{ height: '36px', fontSize: '0.78rem' }}>
                  যোগ করুন
                </button>
              </form>
            )}

            {/* Items Table */}
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(160px, 1fr) 110px 120px 90px 40px',
                padding: '0.5rem 0.75rem',
                background: 'var(--bg-app)',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--text-dim)',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                <span>পণ্য ও বিভাগ</span>
                <span style={{ textAlign: 'right' }}>একক দর</span>
                <span style={{ textAlign: 'center' }}>পরিমাণ</span>
                <span style={{ textAlign: 'right' }}>মোট টাকা</span>
                <span />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {items.map((it, idx) => (
                  <div 
                    key={it.id || idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(160px, 1fr) 110px 120px 90px 40px',
                      alignItems: 'center',
                      padding: '0.55rem 0.75rem',
                      borderBottom: idx < items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      fontSize: '0.82rem',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, wordBreak: 'break-word' }}>{it.product_name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {it.department_name} {!it.product_id && '(কাস্টম পণ্য)'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        className="input"
                        value={it.unit_price}
                        onChange={e => handlePriceChange(idx, e.target.value)}
                        style={{ width: '90px', padding: '0.25rem 0.45rem', fontSize: '0.8rem', textAlign: 'right', display: 'inline-block' }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-icon"
                        style={{ width: '26px', height: '26px', padding: 0 }}
                        onClick={() => handleQuantityChange(idx, -1)}
                        title="পরিমাণ কমান"
                      >
                        <Minus size={12} />
                      </button>
                      <input
                        type="number"
                        min="1"
                        className="input"
                        value={it.quantity}
                        onChange={e => handleSetQuantity(idx, e.target.value)}
                        style={{ width: '48px', padding: '0.25rem 0.2rem', textAlign: 'center', fontSize: '0.8rem' }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-icon"
                        style={{ width: '26px', height: '26px', padding: 0 }}
                        onClick={() => handleQuantityChange(idx, 1)}
                        title="পরিমাণ বাড়ান"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      ৳{(it.unit_price * it.quantity).toFixed(2)}
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-danger btn-icon"
                        style={{ width: '26px', height: '26px', padding: 0 }}
                        onClick={() => handleRemoveItem(idx)}
                        title="আইটেমটি বাদ দিন"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: TOTALS & DISCOUNT */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            {/* Financial Summary Box */}
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: '1rem'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <DollarSign size={15} style={{ color: 'var(--success)' }} />
                <span>বিল ও ডিসকাউন্ট সমন্বয়</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>পণ্যের সাবটোটাল:</span>
                  <span style={{ fontWeight: 600 }}>৳{calculatedSubtotal.toFixed(2)}</span>
                </div>

                {couponDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                    <span>কুপন ছাড়:</span>
                    <span>-৳{couponDiscount.toFixed(2)}</span>
                  </div>
                )}

                {pointsDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4f46e5' }}>
                    <span>পয়েন্ট ছাড়:</span>
                    <span>-৳{pointsDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>ম্যানুয়াল বিশেষ ছাড় (৳):</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="input"
                    value={manualDiscount}
                    onChange={e => setManualDiscount(e.target.value)}
                    style={{ width: '100px', padding: '0.25rem 0.5rem', textAlign: 'right', fontSize: '0.82rem' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ছাড়ের কারণ:</span>
                  <input
                    type="text"
                    className="input"
                    placeholder="যেমন: নিয়মিত ক্রেতা / ফ্রেন্ডলি অফার"
                    value={manualDiscountReason}
                    onChange={e => setManualDiscountReason(e.target.value)}
                    style={{ width: '170px', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  />
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  borderTop: '1px solid var(--border-subtle)', 
                  paddingTop: '0.65rem', 
                  marginTop: '0.35rem',
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  color: 'var(--text-main)'
                }}>
                  <span>সর্বমোট প্রদেয় বিল:</span>
                  <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>৳{calculatedTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment & Settlement Box */}
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: '1rem'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CreditCard size={15} style={{ color: 'var(--primary)' }} />
                <span>পরিশোধ ও বাকি সমন্বয়</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.82rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>জমা / পরিশোধ (টাকা):</label>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.15rem 0.4rem', fontSize: '0.68rem' }}
                        onClick={() => setPaidAmount(String(calculatedTotal))}
                      >
                        ফুল পেইড
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.15rem 0.4rem', fontSize: '0.68rem', color: 'var(--danger)' }}
                        onClick={() => setPaidAmount('0')}
                      >
                        সম্পূর্ণ বাকি
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value)}
                    style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.15rem' }}>
                  <div style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: calculatedDue > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-app)',
                    border: `1px solid ${calculatedDue > 0 ? 'rgba(239, 68, 68, 0.25)' : 'var(--border-subtle)'}`
                  }}>
                    <div style={{ fontSize: '0.7rem', color: calculatedDue > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>বাকি (Due):</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: calculatedDue > 0 ? 'var(--danger)' : 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                      ৳{calculatedDue.toFixed(2)}
                    </div>
                  </div>

                  <div style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: calculatedChange > 0 ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-app)',
                    border: `1px solid ${calculatedChange > 0 ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)'}`
                  }}>
                    <div style={{ fontSize: '0.7rem', color: calculatedChange > 0 ? 'var(--success)' : 'var(--text-muted)' }}>ফেরত (Change):</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: calculatedChange > 0 ? 'var(--success)' : 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                      ৳{calculatedChange.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>পেমেন্ট মাধ্যম</label>
                    <select
                      className="input"
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                    >
                      <option value="নগদ (Cash)">নগদ (Cash)</option>
                      <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
                      <option value="নগদ/বিকাশ">নগদ/বিকাশ (স্প্লিট)</option>
                      <option value="রকেট (Rocket)">রকেট (Rocket)</option>
                      <option value="ব্যাংক কার্ড (Card)">ব্যাংক কার্ড (Card)</option>
                      <option value="অন্যান্য">অন্যান্য</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>অর্ডার স্ট্যাটাস</label>
                    <select
                      className="input"
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                    >
                      <option value="Completed">সম্পন্ন (Completed)</option>
                      <option value="Cancelled">বাতিল (Cancelled)</option>
                      <option value="Refunded">রিফান্ড (Refunded)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>ক্যাশিয়ারের নাম</label>
                  <input
                    type="text"
                    className="input"
                    value={cashierName}
                    onChange={e => setCashierName(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: SYSTEM AUDIT & INTEGRITY NOTE */}
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
            fontSize: '0.78rem',
            color: 'var(--text-main)'
          }}>
            <CheckCircle size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '0.15rem' }}>স্বয়ংক্রিয় স্টক ও হিসাব সমন্বয়:</strong>
              অর্ডার আপডেট করলে পণ্যের পরিমাণের ব্যবধান অনুযায়ী ইনভেন্টরি স্টক সমন্বয় হবে। ক্রেতার ক্ষেত্রে অর্জিত পয়েন্ট ও বাকি খাতার হিসাব স্বয়ংক্রিয়ভাবে আপডেট হবে।
            </div>
          </div>

          {/* Delete Confirmation Warning Box */}
          {showDeleteConfirm && (
            <div style={{
              marginTop: '1.25rem',
              padding: '1.1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1.5px solid var(--danger)',
              color: 'var(--danger)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.45rem' }}>
                <AlertTriangle size={18} />
                <span>আপনি কি নিশ্চিত যে চালান #{order.order_number} মুছে ফেলতে চান?</span>
              </div>
              <ul style={{ fontSize: '0.8rem', margin: '0.35rem 0 0.85rem 1.25rem', padding: 0, lineHeight: 1.6 }}>
                <li>এই চালানের সব পণ্যের স্টক ইনভেন্টরিতে পুনরায় ফেরত যাবে।</li>
                {order.due_amount > 0 && <li>চালানের বাকি ৳{order.due_amount.toFixed(2)} গ্রাহকের বাকি খাতা থেকে বাদ দেওয়া হবে।</li>}
                {order.earned_points > 0 && <li>এই চালানের অর্জিত {order.earned_points} পয়েন্ট বাতিল করা হবে।</li>}
                <li>এই সিদ্ধান্তটি আর পরিবর্তন করা যাবে না।</li>
              </ul>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  না, রাখুন
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger btn-sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'মুছছি...' : 'হ্যাঁ, অর্ডার মুছে ফেলুন'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {!showDeleteConfirm && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving || deleting}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Trash2 size={15} /> মুছে ফেলুন
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={saving || deleting}
            >
              বন্ধ করুন
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={saving || deleting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Save size={16} /> {saving ? 'সংরক্ষণ হচ্ছে...' : 'আপডেট সংরক্ষণ করুন'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
