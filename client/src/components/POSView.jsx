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
  AlertCircle,
  Package,
  PackagePlus,
  Sparkles
} from 'lucide-react';
import { api } from '../api';
import { DEFAULT_DEPARTMENTS } from '../constants/departments';

const MANUAL_PRESETS = [
  { label: '📄 ফটোকপি', name: 'ফটোকপি (A4)', price: 3, unit: 'পাতা', dept: 'ফটোকপি ও কম্পিউটার সার্ভিস' },
  { label: '🖨️ প্রিন্ট (কালো)', name: 'কম্পিউটার প্রিন্ট (কালো)', price: 5, unit: 'পাতা', dept: 'ফটোকপি ও কম্পিউটার সার্ভিস' },
  { label: '🎨 কালার প্রিন্ট', name: 'কালার প্রিন্ট', price: 15, unit: 'পাতা', dept: 'ফটোকপি ও কম্পিউটার সার্ভিস' },
  { label: '📑 লেমিনেশন', name: 'লেমিনেশন (A4)', price: 20, unit: 'পাতা', dept: 'ফটোকপি ও কম্পিউটার সার্ভিস' },
  { label: '✏️ স্টেশনারি', name: 'কাস্টম স্টেশনারি সামগ্রী', price: '', unit: 'পিস', dept: 'খাতা, ডায়েরি ও কাগজ সামগ্রী' },
  { label: '💄 কসমেটিকস', name: 'কসমেটিকস প্রসাধন সামগ্রী', price: '', unit: 'পিস', dept: 'স্কিনকেয়ার ও প্রসাধন সামগ্রী' },
  { label: '🛠️ সার্ভিস/অন্যান্য', name: 'সার্ভিস চার্জ / মেরামত', price: '', unit: 'সেট', dept: 'সাধারণ স্টেশনারি' }
];

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
  const [mobilePane, setMobilePane] = useState('catalog'); // 'catalog' | 'cart' on mobile

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

  // Due & partial payment state
  const [paymentMode, setPaymentMode] = useState('full'); // 'full' | 'partial' | 'due'
  const [paidAmountInput, setPaidAmountInput] = useState('');

  // Manual product modal state (for non-inventory items)
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: '',
    price: '',
    quantity: 1,
    unit: 'পিস',
    department_name: 'সাধারণ স্টেশনারি',
    category: 'কাস্টম ও সার্ভিস সামগ্রী',
    barcode: '',
    save_to_inventory: false
  });
  const [savingManualProduct, setSavingManualProduct] = useState(false);

  // Open manual product modal
  const openManualProductModal = (initialName = '') => {
    const defaultDept = activeDepartments[0]?.name || 'সাধারণ স্টেশনারি';
    setManualForm({
      name: initialName || '',
      price: '',
      quantity: 1,
      unit: 'পিস',
      department_name: defaultDept,
      category: 'কাস্টম ও সার্ভিস সামগ্রী',
      barcode: '',
      save_to_inventory: false
    });
    setShowManualModal(true);
  };

  // Add manual product to cart
  const handleAddManualProductToCart = async (e) => {
    e.preventDefault();
    const trimmedName = manualForm.name.trim();
    const parsedPrice = parseFloat(manualForm.price);
    const parsedQty = parseInt(manualForm.quantity, 10);

    if (!trimmedName) {
      alert('অনুগ্রহ করে পণ্যের নাম প্রদান করুন');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert('সঠিক বিক্রয়মূল্য (৳) দিন');
      return;
    }
    if (isNaN(parsedQty) || parsedQty <= 0) {
      alert('সঠিক পরিমাণ দিন');
      return;
    }

    setSavingManualProduct(true);
    try {
      const customId = 'manual_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

      // Optionally save to inventory catalog
      if (manualForm.save_to_inventory) {
        try {
          const matchedDept = activeDepartments.find(d => d.name === manualForm.department_name) || activeDepartments[0];
          await api.createProduct({
            name: trimmedName,
            department_id: matchedDept?.id || 'dept_1',
            category: manualForm.category || 'কাস্টম ও সার্ভিস সামগ্রী',
            price: parsedPrice,
            cost: Number((parsedPrice * 0.7).toFixed(2)),
            stock_qty: parsedQty,
            min_threshold: 5,
            unit: manualForm.unit || 'পিস',
            barcode: manualForm.barcode ? manualForm.barcode.trim() : ('890' + Math.floor(100000 + Math.random() * 900000))
          });
          loadData(); // reload catalog
        } catch (saveErr) {
          console.warn('Could not save manual item to catalog:', saveErr);
        }
      }

      const manualCartItem = {
        id: customId,
        productId: customId,
        name: trimmedName,
        price: parsedPrice,
        quantity: parsedQty,
        unit: manualForm.unit || 'পিস',
        department_name: manualForm.department_name || 'সাধারণ স্টেশনারি',
        department_code: 'MNL',
        category: manualForm.category || 'কাস্টম পণ্য',
        barcode: manualForm.barcode ? manualForm.barcode.trim() : '',
        is_manual: true,
        stock_qty: 999999
      };

      setCart(prev => {
        const existingIdx = prev.findIndex(item => item.is_manual && item.name.toLowerCase() === trimmedName.toLowerCase() && item.price === parsedPrice);
        if (existingIdx >= 0) {
          return prev.map((item, idx) => idx === existingIdx ? { ...item, quantity: item.quantity + parsedQty } : item);
        }
        return [...prev, manualCartItem];
      });

      setShowManualModal(false);
    } catch (err) {
      alert('কার্টে যোগ ব্যর্থ: ' + err.message);
    } finally {
      setSavingManualProduct(false);
    }
  };

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
        if (delta > 0 && !item.is_manual && item.stock_qty !== undefined && item.quantity >= item.stock_qty) {
          alert(`স্টকে আর মাত্র ${item.stock_qty} টি পণ্য রয়েছে!`);
          return item;
        }
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
    setPaymentMode('full');
    setPaidAmountInput('');
    setMobilePane('catalog');
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
  const tax = 0;
  const finalTotal = Number(taxableAmount.toFixed(2));

  // Due & payment calculation
  const currentPaidAmount = paymentMode === 'due'
    ? 0
    : paymentMode === 'partial'
      ? (paidAmountInput === '' ? 0 : Math.max(0, parseFloat(paidAmountInput) || 0))
      : finalTotal;

  const calculatedDue = Math.max(0, Number((finalTotal - currentPaidAmount).toFixed(2)));
  const calculatedChange = Math.max(0, Number((currentPaidAmount - finalTotal).toFixed(2)));

  // Potential points to earn
  let tierMultiplier = 1.0;
  if (selectedCustomer?.tier === 'Silver') tierMultiplier = 1.25;
  else if (selectedCustomer?.tier === 'Gold') tierMultiplier = 1.5;
  else if (selectedCustomer?.tier === 'Platinum') tierMultiplier = 1.75;
  else if (selectedCustomer?.tier === 'VIP') tierMultiplier = 2.0;
  const potentialPointsEarned = Math.round(Math.floor(finalTotal / 100) * tierMultiplier); // প্রতি ১০০ টাকায় ১ পয়েন্ট

  // Checkout process
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (calculatedDue > 0 && !selectedCustomer) {
      alert('বাকি বিক্রির জন্য গ্রাহক/মেম্বার নির্বাচন করা আবশ্যক!');
      return;
    }

    try {
      setProcessing(true);
      const payload = {
        customer_id: selectedCustomer ? selectedCustomer.id : null,
        store_id: activeStore?.id || 'store_1',
        cashier_name: 'মিজানুর রহমান',
        items: cart.map(c => ({ 
          id: c.id, 
          productId: c.id, 
          product_id: c.id,
          name: c.name,
          price: c.price,
          unit_price: c.price,
          unitPrice: c.price,
          qty: c.quantity, 
          quantity: c.quantity,
          department_name: c.department_name,
          is_manual: !!c.is_manual,
          barcode: c.barcode || ''
        })),
        coupon_code: appliedCoupon ? appliedCoupon.coupon.code : null,
        manual_discount_type: manualDiscountType === 'percent' ? 'percentage' : 'fixed',
        manual_discount_value: manualDiscount > 0 ? parsedManualVal : 0,
        manual_discount_amount: manualDiscount,
        manual_discount_reason: manualDiscount > 0 ? manualDiscountReason : '',
        points_to_redeem: pointsDiscount,
        payment_method: paymentMode === 'due' ? 'বাকি (Due)' : paymentMethod,
        paid_amount: currentPaidAmount
      };

      const result = await api.checkout(payload);
      clearCart();
      setMobilePane('catalog');
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
      {/* Mobile Pane Switcher (Phone / Tablet <= 1024px) */}
      <div className="pos-mobile-pane-switcher">
        <button 
          type="button" 
          className={`pos-mobile-pane-tab ${mobilePane === 'catalog' ? 'active' : ''}`}
          onClick={() => setMobilePane('catalog')}
        >
          <Package size={16} />
          <span>ক্যাটালগ ({products.length})</span>
        </button>
        <button 
          type="button" 
          className={`pos-mobile-pane-tab ${mobilePane === 'cart' ? 'active' : ''}`}
          onClick={() => setMobilePane('cart')}
        >
          <ShoppingBag size={16} />
          <span>কার্ট ({cart.reduce((s, it) => s + it.quantity, 0)})</span>
          {cart.length > 0 && (
            <span className="pos-tab-price-badge">৳{finalTotal.toFixed(0)}</span>
          )}
        </button>
      </div>

      {/* LEFT: Product Catalog & Fast Department Tabs */}
      <div className={`pos-catalog-panel ${mobilePane !== 'catalog' ? 'pos-pane-hidden-mobile' : ''}`}>
        {/* Search & Scan Header */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <input
              type="text"
              className="form-control"
              style={{ width: '100%', paddingLeft: '2.4rem' }}
              placeholder="পণ্য বা বারকোড খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search 
              size={16} 
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} 
            />
          </div>

          <button 
            type="button"
            className="btn btn-secondary" 
            title="ইনভেন্টরিতে না থাকা পণ্য সরাসরি কার্টে লিখুন"
            onClick={() => openManualProductModal(searchTerm)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
          >
            <PackagePlus size={16} style={{ color: 'var(--primary)' }} />
            <span>+ ম্যানুয়াল পণ্য</span>
          </button>

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
            <span>স্ক্যান</span>
          </button>
        </div>

        {/* Department Filter Tabs */}
        <div className="pos-dept-tabs">
          <button
            className={`pos-dept-tab ${selectedDept === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedDept('all')}
          >
            সব বিভাগ
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
              লোড হচ্ছে...
            </div>
          ) : products.length === 0 ? (
            <div style={{ 
              gridColumn: '1/-1', 
              textAlign: 'center', 
              padding: '3rem 1.5rem', 
              background: 'var(--bg-surface-elevated)', 
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Package size={36} style={{ color: 'var(--text-dim)', opacity: 0.6 }} />
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
                  {searchTerm ? `'${searchTerm}' দিয়ে ইনভেন্টরিতে কোনো পণ্য পাওয়া যায়নি` : 'কোনো পণ্য পাওয়া যায়নি'}
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  ইনভেন্টরি তালিকায় না থাকলেও সরাসরি ম্যানুয়ালি নাম ও মূল্য লিখে কার্টে বিক্রি করতে পারবেন।
                </p>
              </div>
              <button 
                type="button" 
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}
                onClick={() => openManualProductModal(searchTerm)}
              >
                <PackagePlus size={16} />
                <span>{searchTerm ? `'${searchTerm}' কার্টে ম্যানুয়াল পণ্য যোগ করুন` : '+ ম্যানুয়াল পণ্য কার্টে যোগ করুন'}</span>
              </button>
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
      <div className={`pos-cart-panel ${mobilePane !== 'cart' ? 'pos-pane-hidden-mobile' : ''}`}>
        {/* Mobile Back-to-Catalog Return Banner */}
        <div className="pos-mobile-back-to-catalog">
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', fontWeight: 700 }}
            onClick={() => setMobilePane('catalog')}
          >
            ← ক্যাটালগে ফিরে যান
          </button>
        </div>

        {/* Cart Header & Customer Lookup */}
        <div className="pos-cart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1rem', margin: 0 }}>ক্যাশ রেজিস্টার</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => openManualProductModal()}
              title="ইনভেন্টরি ছাড়া ম্যানুয়াল পণ্য কার্টে যোগ করুন"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', padding: '0.3rem 0.55rem' }}
            >
              <PackagePlus size={13} />
              <span>+ ম্যানুয়াল</span>
            </button>
            {cart.length > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={clearCart} title="কার্ট খালি করুন">
                রিসেট
              </button>
            )}
          </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                    {selectedCustomer.points_balance?.toLocaleString()} পয়েন্ট ({tierMultiplier}x রেট)
                  </span>
                  {(selectedCustomer.due_balance > 0) && (
                    <span style={{ 
                      fontSize: '0.7rem', 
                      background: 'rgba(239, 68, 68, 0.15)', 
                      color: 'var(--danger)', 
                      padding: '0.1rem 0.4rem', 
                      borderRadius: 'var(--radius-sm)', 
                      fontWeight: 700 
                    }}>
                      পূর্বের বাকি: ৳{selectedCustomer.due_balance.toFixed(2)}
                    </span>
                  )}
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
                    placeholder="গ্রাহক খুঁজুন (ফোন / নাম)..."
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
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            {cust.card_number} • {cust.phone}
                            {cust.due_balance > 0 && (
                              <span style={{ color: 'var(--danger)', fontWeight: 700, marginLeft: '0.35rem' }}>
                                (বাকি ৳{cust.due_balance.toFixed(0)})
                              </span>
                            )}
                          </div>
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

        {/* Cart Item Rows */}
        <div className="pos-cart-items">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <ShoppingBag size={32} style={{ color: 'var(--text-dim)', opacity: 0.45, marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>কার্ট খালি</p>
              <p style={{ fontSize: '0.78rem', margin: '0.3rem 0 0.85rem' }}>ক্যাটালগ থেকে নির্বাচন করুন অথবা সরাসরি ম্যানুয়াল পণ্য যোগ করুন</p>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => openManualProductModal()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
              >
                <PackagePlus size={14} />
                <span>+ ম্যানুয়াল পণ্য যোগ করুন</span>
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="pos-cart-item">
                <div style={{ flex: 1, minWidth: 0, marginRight: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.name}</span>
                    {item.is_manual && (
                      <span style={{ 
                        fontSize: '0.62rem', 
                        padding: '0.1rem 0.35rem', 
                        borderRadius: 'var(--radius-sm)', 
                        background: 'rgba(59, 130, 246, 0.15)', 
                        color: 'var(--primary)', 
                        fontWeight: 700 
                      }}>
                        ম্যানুয়াল
                      </span>
                    )}
                  </div>
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
              placeholder="ভাউচার কোড"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary btn-sm">
              যোগ
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
                <span>ম্যানুয়াল ছাড়</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {manualDiscount > 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                    -৳{manualDiscount.toFixed(2)}
                  </span>
                )}
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  {showManualDiscount ? '▲ বন্ধ' : '▼ ছাড়'}
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
                    টাকা (৳)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${manualDiscountType === 'percent' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, fontSize: '0.72rem', padding: '0.25rem' }}
                    onClick={() => setManualDiscountType('percent')}
                  >
                    শতাংশ (%)
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
                      <option value="নিয়মিত কাস্টমার বিশেষ ছাড়">নিয়মিত গ্রাহক ছাড়</option>
                      <option value="ম্যানেজার স্পেশাল ডিসকাউন্ট">ম্যানেজার বিশেষ ছাড়</option>
                      <option value="স্টেশনারি বাল্ক/পাইকারি সুবিধা">বাল্ক ক্রয় সুবিধা</option>
                      <option value="ছাত্র ও শিক্ষক শিক্ষা সহায়তা">শিক্ষা সহায়তা</option>
                      <option value="প্যাকেজিং হালকা ত্রুটি সমন্বয়">প্যাকেজিং ত্রুটি সমন্বয়</option>
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
                <span>পয়েন্ট রিডিম</span>
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
              <span>সাবটোটাল</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>৳{subtotal.toFixed(2)}</span>
            </div>
            {couponDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                <span>কুপন ছাড়</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>-৳{couponDiscount.toFixed(2)}</span>
              </div>
            )}
            {manualDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent)' }}>
                <span>ম্যানুয়াল ছাড়</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>-৳{manualDiscount.toFixed(2)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)' }}>
                <span>পয়েন্ট ছাড় ({pointsToRedeem})</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>-৳{pointsDiscount.toFixed(2)}</span>
              </div>
            )}

          </div>

          {/* Net Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.65rem', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>মোট প্রদেয় বিল</span>
            <span style={{ fontWeight: 800, fontSize: '1.4rem', fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
              ৳{finalTotal.toFixed(2)}
            </span>
          </div>

          {selectedCustomer && (
            <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginBottom: '0.75rem', textAlign: 'center' }}>
              ★ অর্জিত পয়েন্ট: +{potentialPointsEarned}
            </div>
          )}

          {/* Payment & Due Options */}
          <div style={{
            background: 'var(--bg-app)',
            borderRadius: 'var(--radius-sm)',
            border: calculatedDue > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
            padding: '0.65rem',
            marginBottom: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>পরিশোধের ধরন</span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${paymentMode === 'full' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem' }}
                  onClick={() => {
                    setPaymentMode('full');
                    setPaidAmountInput('');
                  }}
                >
                  পূর্ণ পরিশোধ
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${paymentMode === 'partial' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem' }}
                  onClick={() => {
                    setPaymentMode('partial');
                    if (!paidAmountInput) setPaidAmountInput(String(Math.floor(finalTotal / 2)));
                  }}
                >
                  আংশিক জমা
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${paymentMode === 'due' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ 
                    fontSize: '0.7rem', 
                    padding: '0.2rem 0.45rem',
                    color: paymentMode === 'due' ? '#fff' : 'var(--danger)',
                    borderColor: 'rgba(239, 68, 68, 0.4)'
                  }}
                  onClick={() => {
                    setPaymentMode('due');
                    setPaidAmountInput('0');
                  }}
                >
                  সম্পূর্ণ বাকি
                </button>
              </div>
            </div>

            {/* Custom Paid Amount input for partial payment */}
            {paymentMode === 'partial' && (
              <div style={{ marginTop: '0.45rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', minWidth: '70px' }}>জমা টাকা (৳):</label>
                  <input
                    type="number"
                    min="0"
                    max={finalTotal}
                    step="1"
                    className="form-control"
                    style={{ flex: 1, fontSize: '0.85rem', fontWeight: 700, padding: '0.3rem 0.5rem' }}
                    placeholder="গ্রাহক কত টাকা দিল..."
                    value={paidAmountInput}
                    onChange={(e) => setPaidAmountInput(e.target.value)}
                  />
                </div>
                {/* Quick preset chips */}
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                  {[100, 200, 500, 1000].filter(v => v < finalTotal).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}
                      onClick={() => setPaidAmountInput(String(amt))}
                    >
                      ৳{amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}
                    onClick={() => setPaidAmountInput(String(Math.floor(finalTotal / 2)))}
                  >
                    অর্ধেক (৳{Math.floor(finalTotal / 2)})
                  </button>
                </div>
              </div>
            )}

            {/* Calculated Due / Change Alerts */}
            {calculatedDue > 0 && (
              <div style={{ 
                marginTop: '0.5rem', 
                background: 'rgba(239, 68, 68, 0.12)', 
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '0.4rem 0.6rem', 
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                color: 'var(--danger)',
                fontWeight: 700,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>বাকি থাকবে (Due):</span>
                <span style={{ fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>৳{calculatedDue.toFixed(2)}</span>
              </div>
            )}

            {calculatedDue > 0 && !selectedCustomer && (
              <div style={{ 
                fontSize: '0.72rem', 
                color: 'var(--danger)', 
                marginTop: '0.35rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem' 
              }}>
                <AlertCircle size={12} /> বাকি বিক্রির জন্য উপরে গ্রাহক/মেম্বার সিলেক্ট করুন
              </div>
            )}

            {calculatedChange > 0 && (
              <div style={{ 
                marginTop: '0.45rem', 
                background: 'rgba(16, 185, 129, 0.12)', 
                padding: '0.35rem 0.6rem', 
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                color: 'var(--success)',
                fontWeight: 700,
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>ফেরত (Change):</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>৳{calculatedChange.toFixed(2)}</span>
              </div>
            )}
          </div>

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
            className={`btn ${calculatedDue > 0 ? (paymentMode === 'due' ? 'btn-primary' : 'btn-primary') : 'btn-success'}`}
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
            disabled={cart.length === 0 || processing || (calculatedDue > 0 && !selectedCustomer)}
            onClick={handleCheckout}
          >
            {processing 
              ? 'প্রক্রিয়াকরণ...' 
              : paymentMode === 'due' 
                ? `সম্পূর্ণ বাকি বিক্রি: ৳${finalTotal.toFixed(2)}`
                : calculatedDue > 0
                  ? `জমা: ৳${currentPaidAmount.toFixed(2)} (বাকি: ৳${calculatedDue.toFixed(2)})`
                  : `পরিশোধ: ৳${finalTotal.toFixed(2)}`}
          </button>
        </div>
      </div>

      {/* Mobile Floating Cart Summary Pill */}
      {cart.length > 0 && mobilePane === 'catalog' && (
        <button 
          type="button" 
          className="mobile-floating-cart-pill"
          onClick={() => {
            setMobilePane('cart');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={18} />
            <span>{cart.reduce((s, it) => s + it.quantity, 0)} পণ্য • ৳{finalTotal.toFixed(2)}</span>
          </div>
          <span style={{ fontWeight: 800 }}>পরিশোধ ➔</span>
        </button>
      )}

      {/* Manual Product Input Modal (for non-inventory items) */}
      {showManualModal && (
        <div className="modal-overlay" onClick={() => !savingManualProduct && setShowManualModal(false)}>
          <div 
            className="modal-card" 
            style={{ maxWidth: '560px', width: '94%' }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="brand-icon" style={{ width: '30px', height: '30px', flexShrink: 0 }}>
                  <PackagePlus size={16} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', margin: 0 }}>ম্যানুয়াল পণ্য কার্টে যোগ করুন</h2>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    ইনভেন্টরিতে স্টক বা এন্ট্রি না থাকলেও সরাসরি কাস্টম পণ্য বিক্রি করুন
                  </p>
                </div>
              </div>
              <button 
                type="button"
                className="btn btn-secondary btn-icon" 
                onClick={() => setShowManualModal(false)}
                disabled={savingManualProduct}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddManualProductToCart} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                
                {/* Quick Presets */}
                <div>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                    <Sparkles size={13} style={{ color: 'var(--primary)' }} />
                    <span>কুইক প্রিসেট (এক ক্লিকে নির্বাচন করুন):</span>
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {MANUAL_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)' }}
                        onClick={() => {
                          setManualForm(prev => ({
                            ...prev,
                            name: preset.name,
                            price: preset.price !== '' ? preset.price : prev.price,
                            unit: preset.unit || prev.unit,
                            department_name: preset.dept || prev.department_name
                          }));
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Name */}
                <div className="input-group">
                  <label className="input-label">পণ্যের নাম / বিবরণ *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="যেমন: ফটোকপি (A4), কাস্টম স্টেশনারি, সার্ভিস ইত্যাদি"
                    value={manualForm.name}
                    onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                {/* Price and Quantity */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="input-group">
                    <label className="input-label">বিক্রয়মূল্য (৳) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="0.00"
                      step="any"
                      min="0.01"
                      value={manualForm.price}
                      onChange={(e) => setManualForm({ ...manualForm, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">পরিমাণ (Quantity) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="1"
                      value={manualForm.quantity}
                      onChange={(e) => setManualForm({ ...manualForm, quantity: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Unit and Department */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="input-group">
                    <label className="input-label">একক (Unit)</label>
                    <select 
                      className="form-control"
                      value={manualForm.unit}
                      onChange={(e) => setManualForm({ ...manualForm, unit: e.target.value })}
                    >
                      <option value="পিস">পিস (Pcs)</option>
                      <option value="পাতা">পাতা (Pages)</option>
                      <option value="কেজি">কেজি (Kg)</option>
                      <option value="গ্রাম">গ্রাম (gm)</option>
                      <option value="প্যাকেট">প্যাকেট (Pkt)</option>
                      <option value="ডজন">ডজন (Dozen)</option>
                      <option value="বক্স">বক্স (Box)</option>
                      <option value="সেট">সেট (Set)</option>
                      <option value="রোল">রোল (Roll)</option>
                      <option value="লিটার">লিটার (Ltr)</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">বিভাগ (Department)</label>
                    <select 
                      className="form-control"
                      value={manualForm.department_name}
                      onChange={(e) => setManualForm({ ...manualForm, department_name: e.target.value })}
                    >
                      {activeDepartments.map(d => (
                        <option key={d.id || d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Optional Barcode */}
                <div className="input-group">
                  <label className="input-label">বারকোড (ঐচ্ছিক)</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="বারকোড থাকলে লিখুন বা স্ক্যান করুন"
                      value={manualForm.barcode}
                      onChange={(e) => setManualForm({ ...manualForm, barcode: e.target.value })}
                      style={{ paddingLeft: '2rem' }}
                    />
                    <Barcode size={15} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  </div>
                </div>

                {/* Save to permanent catalog toggle */}
                <div style={{ 
                  background: 'var(--bg-surface-elevated)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '0.65rem 0.85rem' 
                }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                    <input 
                      type="checkbox" 
                      checked={manualForm.save_to_inventory}
                      onChange={(e) => setManualForm({ ...manualForm, save_to_inventory: e.target.checked })}
                      style={{ marginTop: '0.2rem', accentColor: 'var(--primary)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                        ভবিষ্যতের জন্য ইনভেন্টরি তালিকায় সংরক্ষণ করুন
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        টিক দিলে এই পণ্যটি স্থায়ীভাবে ইনভেন্টরিতে ক্যাটালগভুক্ত হবে যেন পরবর্তীতে সার্চে পাওয়া যায়।
                      </div>
                    </div>
                  </label>
                </div>

                {/* Live Line Total Calculation Banner */}
                {parseFloat(manualForm.price) > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.55rem 0.85rem', 
                    background: 'rgba(59, 130, 246, 0.08)', 
                    border: '1px solid rgba(59, 130, 246, 0.25)', 
                    borderRadius: 'var(--radius-md)' 
                  }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>
                      কার্টে মোট যোগ হবে:
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>
                      ৳{((parseFloat(manualForm.price) || 0) * (parseInt(manualForm.quantity, 10) || 1)).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowManualModal(false)}
                  disabled={savingManualProduct}
                >
                  বাতিল
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={savingManualProduct || !manualForm.name.trim() || !parseFloat(manualForm.price)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <PackagePlus size={15} />
                  <span>{savingManualProduct ? 'সংরক্ষণ ও যোগ হচ্ছে...' : 'কার্টে যোগ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
