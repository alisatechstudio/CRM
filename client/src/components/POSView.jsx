import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Barcode, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  UserPlus, 
  X, 
  Tag, 
  ShoppingBag,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';
import { DEFAULT_DEPARTMENTS } from '../constants/departments';

export default function POSView({ activeStore, onOpenReceipt, onOpenNewCustomer }) {
  const [products, setProducts] = useState([]);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeDepartments = (departments && departments.length > 0) ? departments : DEFAULT_DEPARTMENTS;

  // Filter states
  const [selectedDept, setSelectedDept] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Cart state
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Discounts state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('কার্ড (Card)');
  const [processing, setProcessing] = useState(false);

  // Manual discount state
  const [showManualDiscount, setShowManualDiscount] = useState(false);
  const [manualDiscountType, setManualDiscountType] = useState('fixed'); // 'fixed' (৳) or 'percent' (%)
  const [manualDiscountValue, setManualDiscountValue] = useState('');
  const [manualDiscountReason, setManualDiscountReason] = useState('নিয়মিত কাস্টমার বিশেষ ছাড়');

  useEffect(() => {
    loadData();
  }, [selectedDept, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodsRes, deptsRes, custsRes] = await Promise.allSettled([
        api.getProducts({ department_id: selectedDept, search: searchTerm }),
        api.getDepartments(),
        api.getCustomers()
      ]);

      if (prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value)) {
        setProducts(prodsRes.value);
      }
      if (deptsRes.status === 'fulfilled' && Array.isArray(deptsRes.value) && deptsRes.value.length > 0) {
        setDepartments(deptsRes.value);
      } else {
        setDepartments(DEFAULT_DEPARTMENTS);
      }
      if (custsRes.status === 'fulfilled' && Array.isArray(custsRes.value)) {
        setCustomers(custsRes.value);
      }
    } catch (err) {
      console.error('POS load error', err);
    } finally {
      setLoading(false);
    }
  };

  // Add product to cart
  const addToCart = (product) => {
    if (product.stock_qty <= 0) {
      alert('দুঃখিত, এই পণ্যটির স্টক বর্তমানে শেষ!');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_qty) {
          alert(`স্টকে আর মাত্র ${product.stock_qty} টি পণ্য রয়েছে!`);
          return prev;
        }
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // Update item quantity
  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setCouponCode('');
    setPointsToRedeem(0);
    setSelectedCustomer(null);
    setManualDiscountValue('');
    setShowManualDiscount(false);
  };

  // Calculation helpers
  const subtotal = cart.reduce((sum, it) => sum + (it.price * it.quantity), 0);

  // Validate coupon
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCode.trim()) return;

    try {
      const result = await api.validateCoupon({
        code: couponCode,
        cart_subtotal: subtotal,
        customer_tier: selectedCustomer ? selectedCustomer.tier : 'Bronze'
      });

      if (result.valid) {
        setAppliedCoupon(result);
        setCouponError('');
      }
    } catch (err) {
      setCouponError(err.message);
      setAppliedCoupon(null);
    }
  };

  const couponDiscount = appliedCoupon ? appliedCoupon.estimatedDiscount : 0;

  // Manual discount calculation
  const parsedManualVal = parseFloat(manualDiscountValue || 0);
  let manualDiscount = 0;
  if (parsedManualVal > 0) {
    if (manualDiscountType === 'percent') {
      manualDiscount = (subtotal * parsedManualVal) / 100;
    } else {
      manualDiscount = parsedManualVal;
    }
    const maxAllowedManual = Math.max(0, subtotal - couponDiscount);
    if (manualDiscount > maxAllowedManual) {
      manualDiscount = maxAllowedManual;
    }
  }
  manualDiscount = Number(manualDiscount.toFixed(2));
  
  // Points discount (1 pt = ৳1.00)
  const maxRedeemablePoints = selectedCustomer ? Math.min(selectedCustomer.points_balance, Math.floor(subtotal - couponDiscount - manualDiscount)) : 0;
  const pointsDiscount = Math.min(pointsToRedeem, maxRedeemablePoints);

  const taxableAmount = Math.max(0, subtotal - couponDiscount - manualDiscount - pointsDiscount);
  const tax = Number((taxableAmount * 0.08).toFixed(2));
  const finalTotal = Number((taxableAmount + tax).toFixed(2));

  // Potential points to earn
  let tierMultiplier = 1.0;
  if (selectedCustomer?.tier === 'Silver') tierMultiplier = 1.25;
  else if (selectedCustomer?.tier === 'Gold') tierMultiplier = 1.5;
  else if (selectedCustomer?.tier === 'Platinum') tierMultiplier = 1.75;
  else if (selectedCustomer?.tier === 'VIP') tierMultiplier = 2.0;
  const potentialPointsEarned = Math.round(finalTotal * 0.1 * tierMultiplier); // 10% base points

  // Checkout process
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      setProcessing(true);
      const payload = {
        customer_id: selectedCustomer ? selectedCustomer.id : null,
        store_id: activeStore?.id || 'store_1',
        cashier_name: 'মিজানুর রহমান',
        items: cart.map(c => ({ id: c.id, quantity: c.quantity })),
        coupon_code: appliedCoupon ? appliedCoupon.coupon.code : null,
        manual_discount_type: manualDiscountType === 'percent' ? 'percentage' : 'fixed',
        manual_discount_value: manualDiscount > 0 ? parsedManualVal : 0,
        manual_discount_amount: manualDiscount,
        manual_discount_reason: manualDiscount > 0 ? manualDiscountReason : '',
        points_to_redeem: pointsDiscount,
        payment_method: paymentMethod
      };

      const result = await api.checkout(payload);
      clearCart();
      loadData(); // reload product stock
      onOpenReceipt(result.orderId);
    } catch (err) {
      alert('চেকআউট ব্যর্থ হয়েছে: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="pos-layout">
      {/* LEFT: Product Catalog & Fast Department Tabs */}
      <div className="pos-catalog-panel">
        {/* Search & Scan Header */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="form-control"
              style={{ width: '100%', paddingLeft: '2.4rem' }}
              placeholder="পণ্য খুঁজুন বা বারকোড স্ক্যান করুন (যেমন: 890100101)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search 
              size={16} 
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} 
            />
          </div>

          <button 
            className="btn btn-secondary" 
            title="বারকোড স্ক্যানার সিমুলেট করুন"
            onClick={() => {
              if (products.length > 0) {
                const randomProd = products[Math.floor(Math.random() * products.length)];
                addToCart(randomProd);
              }
            }}
          >
            <Barcode size={18} />
            <span>বারকোড স্ক্যান</span>
          </button>
        </div>

        {/* Department Filter Tabs */}
        <div className="pos-dept-tabs">
          <button
            className={`pos-dept-tab ${selectedDept === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedDept('all')}
          >
            সকল বিভাগ
          </button>
          {activeDepartments.map((dept) => (
            <button
              key={dept.id}
              className={`pos-dept-tab ${selectedDept === dept.id ? 'active' : ''}`}
              onClick={() => setSelectedDept(dept.id)}
            >
              {dept.name}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="pos-grid">
          {loading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              পণ্য তালিকা লোড হচ্ছে...
            </div>
          ) : products.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              এই ক্যাটাগরিতে কোনো পণ্য পাওয়া যায়নি।
            </div>
          ) : (
            products.map((p) => {
              const isLowStock = p.stock_qty <= p.min_threshold;
              const isOutOfStock = p.stock_qty <= 0;

              return (
                <div 
                  key={p.id}
                  className="pos-product-card"
                  onClick={() => addToCart(p)}
                  style={{ opacity: isOutOfStock ? 0.6 : 1 }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                        {p.department_code}
                      </span>
                      <span style={{ 
                        fontSize: '0.68rem', 
                        padding: '0.15rem 0.4rem', 
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 600,
                        background: isOutOfStock ? 'var(--danger-bg)' : isLowStock ? 'var(--warning-bg)' : 'var(--bg-surface-elevated)',
                        color: isOutOfStock ? 'var(--danger)' : isLowStock ? 'var(--warning)' : 'var(--text-dim)'
                      }}>
                        {isOutOfStock ? 'স্টক শেষ' : `${p.stock_qty} ${p.unit}`}
                      </span>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.3, marginBottom: '0.5rem' }}>
                      {p.name}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                      ৳{p.price.toFixed(2)}
                    </div>
                    <button className="btn btn-primary btn-sm btn-icon" style={{ width: '28px', height: '28px' }}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Active Cart, Loyalty Lookup, Discounts & Checkout */}
      <div className="pos-cart-panel">
        {/* Cart Header & Customer Lookup */}
        <div className="pos-cart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1rem', margin: 0 }}>সক্রিয় ক্যাশ রেজিস্টার</h3>
          </div>
          {cart.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={clearCart} title="কার্ট খালি করুন">
              খালি করুন
            </button>
          )}
        </div>

        {/* Customer Attachment Box */}
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
          {selectedCustomer ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </span>
                  <span className={`tier-badge tier-${selectedCustomer.tier}`}>
                    {selectedCustomer.tier}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                  {selectedCustomer.points_balance?.toLocaleString()} পয়েন্ট উপলব্ধ ({tierMultiplier}x রেট)
                </div>
              </div>
              <button 
                className="btn btn-secondary btn-icon" 
                style={{ width: '28px', height: '28px' }}
                onClick={() => {
                  setSelectedCustomer(null);
                  setPointsToRedeem(0);
                }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.8rem', paddingLeft: '2rem' }}
                    placeholder="মেম্বার যুক্ত করুন (নাম, ফোন বা কার্ড #)..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                  />
                  <User size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                </div>
                <button 
                  className="btn btn-secondary btn-sm" 
                  title="নতুন মেম্বার নিবন্ধন"
                  onClick={onOpenNewCustomer}
                >
                  <UserPlus size={14} />
                </button>
              </div>

              {/* Customer search suggestions dropdown */}
              {showCustomerDropdown && customerSearch.trim().length > 0 && (
                <div style={{ 
                  position: 'absolute', 
                  top: '105%', 
                  left: 0, 
                  right: 0, 
                  background: 'var(--bg-sidebar)', 
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  zIndex: 20,
                  boxShadow: 'var(--shadow-md)'
                }}>
                  {customers
                    .filter(c => 
                      c.first_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                      c.last_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                      c.phone.includes(customerSearch) ||
                      c.card_number.toLowerCase().includes(customerSearch.toLowerCase())
                    )
                    .slice(0, 5)
                    .map(cust => (
                      <div 
                        key={cust.id}
                        style={{ 
                          padding: '0.5rem 0.75rem', 
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.8rem'
                        }}
                        onClick={() => {
                          setSelectedCustomer(cust);
                          setShowCustomerDropdown(false);
                          setCustomerSearch('');
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{cust.first_name} {cust.last_name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{cust.card_number} • {cust.phone}</div>
                        </div>
                        <span className={`tier-badge tier-${cust.tier}`} style={{ fontSize: '0.65rem' }}>
                          {cust.tier}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Line Items */}
        <div className="pos-cart-items">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <p style={{ fontWeight: 600 }}>কার্ট বর্তমানে খালি</p>
              <p style={{ fontSize: '0.78rem', marginTop: '0.35rem' }}>ক্যাটালগ থেকে পণ্য নির্বাচন করে চেকআউট শুরু করুন।</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="pos-cart-item">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    ৳{item.price.toFixed(2)} প্রতি {item.unit || 'পিস'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <button 
                    className="btn btn-secondary btn-icon" 
                    style={{ width: '24px', height: '24px' }}
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <Minus size={12} />
                  </button>
                  <span style={{ fontWeight: 700, minWidth: '18px', textAlign: 'center', fontSize: '0.85rem' }}>
                    {item.quantity}
                  </span>
                  <button 
                    className="btn btn-secondary btn-icon" 
                    style={{ width: '24px', height: '24px' }}
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <div style={{ minWidth: '58px', textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}>
                  ৳{(item.price * item.quantity).toFixed(2)}
                </div>

                <button 
                  className="btn btn-secondary btn-icon" 
                  style={{ width: '24px', height: '24px', marginLeft: '0.35rem', color: 'var(--danger)' }}
                  onClick={() => removeFromCart(item.id)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totals & Discounts Summary */}
        <div className="pos-cart-totals">
          {/* Coupon Code Input */}
          <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <input 
              type="text"
              className="form-control"
              style={{ flex: 1, fontSize: '0.8rem', textTransform: 'uppercase' }}
              placeholder="প্রোমো / ভাউচার কোড"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary btn-sm">
              প্রয়োগ
            </button>
          </form>

          {couponError && (
            <div style={{ fontSize: '0.72rem', color: 'var(--danger)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <AlertCircle size={12} /> {couponError}
            </div>
          )}

          {appliedCoupon && (
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--success)', 
              background: 'var(--success-bg)',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>কুপন {appliedCoupon.coupon.code}: -৳{couponDiscount.toFixed(2)} ছাড়</span>
              <button 
                onClick={() => setAppliedCoupon(null)}
                style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Manual Cashier Discount Panel */}
          <div style={{
            background: 'var(--bg-app)',
            borderRadius: 'var(--radius-sm)',
            border: manualDiscount > 0 ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
            padding: '0.5rem 0.65rem',
            marginBottom: '0.75rem'
          }}>
            <div 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => setShowManualDiscount(!showManualDiscount)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 600 }}>
                <Tag size={13} style={{ color: 'var(--accent)' }} />
                <span>ম্যানুয়াল ক্যাশিয়ার ছাড় (Manual Discount)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {manualDiscount > 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                    -৳{manualDiscount.toFixed(2)}
                  </span>
                )}
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  {showManualDiscount ? '▲ গোপন করুন' : '▼ প্রয়োগ করুন'}
                </span>
              </div>
            </div>

            {showManualDiscount && (
              <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Type toggle */}
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${manualDiscountType === 'fixed' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, fontSize: '0.72rem', padding: '0.25rem' }}
                    onClick={() => setManualDiscountType('fixed')}
                  >
                    টাকার অংকে (৳ BDT)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${manualDiscountType === 'percent' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, fontSize: '0.72rem', padding: '0.25rem' }}
                    onClick={() => setManualDiscountType('percent')}
                  >
                    শতাংশে (% Percent)
                  </button>
                </div>

                {/* Quick preset chips */}
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                  {(manualDiscountType === 'fixed' ? [20, 50, 100, 200] : [5, 10, 15, 20]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ 
                        fontSize: '0.7rem', 
                        padding: '0.2rem 0.45rem',
                        border: parsedManualVal === val ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                        color: parsedManualVal === val ? 'var(--primary)' : 'inherit',
                        fontWeight: parsedManualVal === val ? 700 : 400
                      }}
                      onClick={() => setManualDiscountValue(String(val))}
                    >
                      {manualDiscountType === 'fixed' ? `৳${val}` : `${val}%`}
                    </button>
                  ))}
                  {manualDiscount > 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem', color: 'var(--danger)' }}
                      onClick={() => setManualDiscountValue('')}
                    >
                      রিসেট
                    </button>
                  )}
                </div>

                {/* Input & Reason */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '0.4rem' }}>
                  <div>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="form-control"
                      style={{ width: '100%', fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                      placeholder={manualDiscountType === 'fixed' ? 'যেমন: ৫০.০০' : 'যেমন: ১০%'}
                      value={manualDiscountValue}
                      onChange={(e) => setManualDiscountValue(e.target.value)}
                    />
                  </div>
                  <div>
                    <select
                      className="form-control"
                      style={{ width: '100%', fontSize: '0.75rem', padding: '0.35rem 0.4rem' }}
                      value={manualDiscountReason}
                      onChange={(e) => setManualDiscountReason(e.target.value)}
                    >
                      <option value="নিয়মিত কাস্টমার বিশেষ ছাড়">নিয়মিত ক্রেতা বিশেষ সম্মাননা</option>
                      <option value="ম্যানেজার স্পেশাল ডিসকাউন্ট">ম্যানেজার স্পেশাল ডিসকাউন্ট</option>
                      <option value="স্টেশনারি বাল্ক/পাইকারি সুবিধা">পাইকারি ও বাল্ক ক্রয় সুবিধা</option>
                      <option value="ছাত্র ও শিক্ষক শিক্ষা সহায়তা">ছাত্র/শিক্ষক শিক্ষা সহায়তা</option>
                      <option value="প্যাকেজিং হালকা ত্রুটি সমন্বয়">প্যাকেজিং ত্রুটি/স্ক্র্যাচ সমন্বয়</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Points Redemption Slider (If customer attached) */}
          {selectedCustomer && maxRedeemablePoints > 0 && (
            <div style={{ 
              background: 'var(--bg-app)', 
              padding: '0.5rem 0.75rem', 
              borderRadius: 'var(--radius-sm)', 
              marginBottom: '0.75rem',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                <span>লয়্যালটি পয়েন্ট রিডিম</span>
                <span style={{ color: 'var(--primary)' }}>
                  {pointsToRedeem} পয়েন্ট (-৳{pointsDiscount.toFixed(2)})
                </span>
              </div>
              <input 
                type="range"
                min="0"
                max={maxRedeemablePoints}
                step="50"
                value={pointsToRedeem}
                onChange={(e) => setPointsToRedeem(parseInt(e.target.value, 10))}
                style={{ width: '100%', marginTop: '0.25rem', accentColor: 'var(--primary)' }}
              />
            </div>
          )}

          {/* Itemized Math */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.82rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>উপমোট (Subtotal)</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>৳{subtotal.toFixed(2)}</span>
            </div>
            {couponDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                <span>কুপন ভাউচার ছাড়</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>-৳{couponDiscount.toFixed(2)}</span>
              </div>
            )}
            {manualDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent)' }}>
                <span>ম্যানুয়াল ছাড় ({manualDiscountReason})</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>-৳{manualDiscount.toFixed(2)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)' }}>
                <span>পয়েন্ট ক্যাশব্যাক ছাড় ({pointsToRedeem} পয়েন্ট)</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>-৳{pointsDiscount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>সরকারি ভ্যাট/ট্যাক্স (৮%)</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>৳{tax.toFixed(2)}</span>
            </div>
          </div>

          {/* Net Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.65rem', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>সর্বমোট প্রদেয় বিল</span>
            <span style={{ fontWeight: 800, fontSize: '1.4rem', fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
              ৳{finalTotal.toFixed(2)}
            </span>
          </div>

          {selectedCustomer && (
            <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginBottom: '0.75rem', textAlign: 'center' }}>
              ★ এই ক্রয়ে সদস্য পাবেন +{potentialPointsEarned} লয়্যালটি পয়েন্ট
            </div>
          )}

          {/* Payment Method Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.35rem', marginBottom: '0.75rem' }}>
            {['কার্ড (Card)', 'নগদ ক্যাশ', 'বিকাশ / নগদ', 'স্প্লিট বিল'].map((m) => (
              <button 
                key={m}
                type="button"
                className={`btn btn-sm ${paymentMethod === m ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.2rem' }}
                onClick={() => setPaymentMethod(m)}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Pay Button */}
          <button 
            className="btn btn-success" 
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
            disabled={cart.length === 0 || processing}
            onClick={handleCheckout}
          >
            {processing ? 'চেকআউট প্রক্রিয়াকরণ চলছে...' : `পরিশোধ সম্পন্ন করুন ৳${finalTotal.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
