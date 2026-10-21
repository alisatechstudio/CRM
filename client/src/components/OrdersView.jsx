import React, { useState, useEffect, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Calendar, 
  Filter, 
  Eye, 
  Edit2, 
  Trash2, 
  Printer, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  ShoppingBag, 
  DollarSign, 
  User, 
  CreditCard, 
  RefreshCw,
  TrendingUp,
  FileText,
  MessageSquare
} from 'lucide-react';
import { api } from '../api';
import EditOrderModal from './EditOrderModal';
import DeleteOrderModal from './DeleteOrderModal';
import WhatsAppShareModal from './WhatsAppShareModal';
import { buildWhatsAppReceiptText } from '../utils/whatsapp';

export default function OrdersView({ onOpenReceipt, onRefreshAnalytics }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all'); // 'today', 'yesterday', '7days', 'month', 'all'

  // Modals
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [whatsAppOrder, setWhatsAppOrder] = useState(null);

  // Load Orders
  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = { limit: 150 };

      // Date filter calculation
      const today = new Date().toISOString().split('T')[0];
      if (periodFilter === 'today') {
        params.start_date = today;
        params.end_date = today;
      } else if (periodFilter === 'yesterday') {
        const yd = new Date();
        yd.setDate(yd.getDate() - 1);
        const ydStr = yd.toISOString().split('T')[0];
        params.start_date = ydStr;
        params.end_date = ydStr;
      } else if (periodFilter === '7days') {
        const d7 = new Date();
        d7.setDate(d7.getDate() - 7);
        params.start_date = d7.toISOString().split('T')[0];
        params.end_date = today;
      } else if (periodFilter === 'month') {
        params.start_date = today.substring(0, 7) + '-01';
        params.end_date = today;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (paymentStatusFilter !== 'all') {
        params.payment_status = paymentStatusFilter;
      }

      if (paymentMethodFilter !== 'all') {
        params.payment_method = paymentMethodFilter;
      }

      const data = await api.getOrders(params);
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [periodFilter, paymentStatusFilter, paymentMethodFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Calculations for KPI Cards
  const kpis = useMemo(() => {
    let totalSales = 0;
    let totalCollected = 0;
    let totalDue = 0;

    for (const o of orders) {
      totalSales += (o.total || 0);
      totalCollected += (o.paid_amount !== undefined ? o.paid_amount : o.total);
      totalDue += (o.due_amount || 0);
    }

    return {
      count: orders.length,
      totalSales: Number(totalSales.toFixed(2)),
      totalCollected: Number(totalCollected.toFixed(2)),
      totalDue: Number(totalDue.toFixed(2))
    };
  }, [orders]);

  const handleOrderUpdated = () => {
    loadOrders();
    if (onRefreshAnalytics) onRefreshAnalytics();
  };

  const handleOrderDeleted = () => {
    loadOrders();
    if (onRefreshAnalytics) onRefreshAnalytics();
  };

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* View Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Receipt className="text-primary" size={24} />
            <span>বিক্রয় ও চালান ব্যবস্থাপনা</span>
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            দোকানের সকল বিক্রয় রসিদ দেখুন, এডিট / আপডেট করুন, প্রিন্ট করুন বা ডিলিট করুন
          </p>
        </div>

        <button 
          className="btn btn-secondary btn-sm"
          onClick={loadOrders}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.85rem'
      }}>
        <div style={{
          background: 'var(--bg-surface)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>মোট চালান সংখ্যা</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '0.25rem', color: 'var(--text-main)' }}>
            {kpis.count} টি
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>ফিল্টার অনুযায়ী চালান</div>
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>সর্বমোট বিক্রয় মূল্য</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '0.25rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
            ৳{kpis.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>মোট বিক্রয় পরিমাণ</div>
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>নগদ / পরিশোধিত আদায়</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '0.25rem', color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
            ৳{kpis.totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>ক্যাশ ও অনলাইন পেমেন্ট</div>
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>বাকি বিক্রির পরিমাণ</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '0.25rem', color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
            ৳{kpis.totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>অনাদায়ী বাকি টাকা</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: 'var(--bg-surface)',
        padding: '0.85rem 1rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="input"
              placeholder="চালান নং (ORD-...), কাস্টমারের নাম বা ফোন..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.4rem', fontSize: '0.85rem' }}
            />
          </div>

          {/* Period Quick Filter Buttons */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'সব চালান' },
              { id: 'today', label: 'আজ' },
              { id: 'yesterday', label: 'গতকাল' },
              { id: '7days', label: 'বিগত ৭ দিন' },
              { id: 'month', label: 'চলতি মাস' }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                className={`btn btn-sm ${periodFilter === p.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                onClick={() => setPeriodFilter(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>পেমেন্ট অবস্থা:</span>
            <select
              className="input"
              value={paymentStatusFilter}
              onChange={e => setPaymentStatusFilter(e.target.value)}
              style={{ fontSize: '0.78rem', padding: '0.25rem 0.5rem', width: 'auto' }}
            >
              <option value="all">সকল অবস্থা</option>
              <option value="Paid">পরিশোধিত (Paid)</option>
              <option value="Partial">আংশিক বাকি (Partial)</option>
              <option value="Due">সম্পূর্ণ বাকি (Due)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>মাধ্যম:</span>
            <select
              className="input"
              value={paymentMethodFilter}
              onChange={e => setPaymentMethodFilter(e.target.value)}
              style={{ fontSize: '0.78rem', padding: '0.25rem 0.5rem', width: 'auto' }}
            >
              <option value="all">সকল মাধ্যম</option>
              <option value="নগদ (Cash)">নগদ (Cash)</option>
              <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
              <option value="নগদ/বিকাশ">নগদ/বিকাশ (স্প্লিট)</option>
              <option value="রকেট (Rocket)">রকেট (Rocket)</option>
              <option value="ব্যাংক কার্ড (Card)">ব্যাংক কার্ড (Card)</option>
            </select>
          </div>

          <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            মোট প্রাপ্ত: <strong style={{ color: 'var(--text-main)' }}>{orders.length}</strong> টি চালান
          </div>
        </div>
      </div>

      {/* Orders List / Table */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw className="spin" size={30} style={{ color: 'var(--primary)', margin: '0 auto 0.75rem' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>চালান তালিকা লোড হচ্ছে...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <Receipt size={42} style={{ color: 'var(--text-dim)', margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.35rem' }}>কোনো চালান পাওয়া যায়নি</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
              আপনার ফিল্টার অনুযায়ী কোনো বিক্রয় চালান পাওয়া যায়নি। ভিন্ন ফিল্টার বা সার্চ দিয়ে চেষ্টা করুন।
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 700 }}>
                  <th style={{ padding: '0.75rem 1rem' }}>চালান নম্বর</th>
                  <th style={{ padding: '0.75rem 1rem' }}>তারিখ ও সময়</th>
                  <th style={{ padding: '0.75rem 1rem' }}>গ্রাহক / মেম্বার</th>
                  <th style={{ padding: '0.75rem 1rem' }}>পণ্যের সারাংশ</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>মোট বিল</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>পরিশোধ / বাকি</th>
                  <th style={{ padding: '0.75rem 1rem' }}>মাধ্যম ও ক্যাশিয়ার</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord, idx) => {
                  const isPaid = !ord.payment_status || ord.payment_status === 'Paid';
                  const isPartial = ord.payment_status === 'Partial';
                  const isDue = ord.payment_status === 'Due';
                  const customerName = ord.customer_first_name 
                    ? `${ord.customer_first_name} ${ord.customer_last_name}` 
                    : (ord.first_name ? `${ord.first_name} ${ord.last_name}` : 'সাধারণ খুচরা ক্রেতা');

                  return (
                    <tr 
                      key={ord.id}
                      style={{ 
                        borderBottom: idx < orders.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        transition: 'background var(--transition-fast)'
                      }}
                      className="table-row-hover"
                    >
                      {/* Invoice No */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                          {ord.order_number}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>
                          ID: {ord.id}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600 }}>
                          {ord.created_at ? ord.created_at.split(' ')[0] : ''}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>
                          {ord.created_at ? ord.created_at.split(' ').slice(1).join(' ') : ''}
                        </div>
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>{customerName}</span>
                          {ord.customer_card && (
                            <span style={{ fontSize: '0.68rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.1rem 0.35rem', borderRadius: 'var(--radius-sm)' }}>
                              মেম্বার
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                          {ord.customer_phone || (ord.customer_card ? `কার্ড: ${ord.customer_card}` : 'খুচরা গ্রাহক')}
                        </div>
                      </td>

                      {/* Items Preview */}
                      <td style={{ padding: '0.75rem 1rem', maxWidth: '220px' }}>
                        <div style={{ 
                          fontSize: '0.78rem', 
                          color: 'var(--text-muted)', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }}>
                          {ord.items && ord.items.length > 0 
                            ? ord.items.map(it => `${it.product_name} (${it.quantity}x)`).join(', ')
                            : 'কোনো পণ্য নেই'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>
                          মোট {ord.items?.length || 0} টি আইটেম
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>
                          ৳{ord.total?.toFixed(2)}
                        </div>
                        {((ord.manual_discount || 0) + (ord.discount_amount || 0) + (ord.points_discount || 0)) > 0 && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--success)' }}>
                            ছাড়: ৳{((ord.manual_discount || 0) + (ord.discount_amount || 0) + (ord.points_discount || 0)).toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Payment Status Pill */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {isPaid && (
                          <span className="status-pill" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', fontSize: '0.72rem' }}>
                            পরিশোধিত
                          </span>
                        )}
                        {isPartial && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center' }}>
                            <span className="status-pill" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', fontSize: '0.7rem' }}>
                              জমা: ৳{(ord.paid_amount || 0).toFixed(0)}
                            </span>
                            <span className="status-pill" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', fontSize: '0.7rem' }}>
                              বাকি: ৳{(ord.due_amount || 0).toFixed(0)}
                            </span>
                          </div>
                        )}
                        {isDue && (
                          <span className="status-pill" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', fontSize: '0.72rem' }}>
                            সম্পূর্ণ বাকি: ৳{(ord.due_amount || ord.total || 0).toFixed(0)}
                          </span>
                        )}
                      </td>

                      {/* Payment Method & Cashier */}
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {ord.payment_method || 'নগদ'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>
                          ক্যাশিয়ার: {ord.cashier_name || 'মিজানুর রহমান'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => onOpenReceipt(ord.id)}
                            title="রসিদ দেখুন ও প্রিন্ট করুন"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
                          >
                            <Eye size={13} /> রসিদ
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm btn-icon"
                            onClick={() => setWhatsAppOrder(ord)}
                            title="WhatsApp এ রসিদ পাঠান"
                            style={{ width: '30px', height: '30px', padding: 0, color: '#25D366' }}
                          >
                            <MessageSquare size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm btn-icon"
                            onClick={() => setEditingOrderId(ord.id)}
                            title="চালান এডিট / আপডেট করুন"
                            style={{ width: '30px', height: '30px', padding: 0 }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm btn-icon"
                            onClick={() => setDeletingOrder(ord)}
                            title="চালান মুছে ফেলুন"
                            style={{ width: '30px', height: '30px', padding: 0 }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WhatsApp Share Modal */}
      {whatsAppOrder && (
        <WhatsAppShareModal
          isOpen={!!whatsAppOrder}
          onClose={() => setWhatsAppOrder(null)}
          title={`WhatsApp এ চালান #${whatsAppOrder.order_number} পাঠান`}
          defaultPhone={whatsAppOrder.customer_phone || ''}
          customerName={
            whatsAppOrder.customer_first_name 
              ? `${whatsAppOrder.customer_first_name} ${whatsAppOrder.customer_last_name || ''}`.trim()
              : (whatsAppOrder.first_name ? `${whatsAppOrder.first_name} ${whatsAppOrder.last_name || ''}`.trim() : '')
          }
          message={buildWhatsAppReceiptText(whatsAppOrder)}
        />
      )}

      {/* Edit Order Modal */}
      {editingOrderId && (
        <EditOrderModal
          orderId={editingOrderId}
          onClose={() => setEditingOrderId(null)}
          onUpdated={handleOrderUpdated}
          onDeleted={handleOrderDeleted}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingOrder && (
        <DeleteOrderModal
          order={deletingOrder}
          onClose={() => setDeletingOrder(null)}
          onDeleted={handleOrderDeleted}
        />
      )}
    </div>
  );
}
