import React, { useState } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Award, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  ArrowUpRight, 
  Sparkles,
  ChevronRight,
  Calendar,
  Filter,
  Receipt,
  Plus,
  Trash2,
  PieChart,
  Package,
  X,
  CreditCard,
  FileText
} from 'lucide-react';
import { api } from '../api';

const EXPENSE_CATEGORIES = [
  'দোকান ভাড়া',
  'স্টাফ বেতন ও বোনাস',
  'বিদ্যুৎ ও ইউটিলিটি বিল',
  'পণ্য পরিবহন ও কুরিয়ার',
  'প্যাকেজিং ও শপিং ব্যাগ',
  'চা-নাস্তা ও আপ্যায়ন',
  'দোকান মেরামত ও রক্ষণাবেক্ষণ',
  'বিজ্ঞাপন ও বিপণন',
  'অন্যান্য বিবিধ খরচ'
];

const CATEGORY_COLORS = {
  'দোকান ভাড়া': '#6366f1',
  'স্টাফ বেতন ও বোনাস': '#8b5cf6',
  'বিদ্যুৎ ও ইউটিলিটি বিল': '#f59e0b',
  'পণ্য পরিবহন ও কুরিয়ার': '#06b6d4',
  'প্যাকেজিং ও শপিং ব্যাগ': '#10b981',
  'চা-নাস্তা ও আপ্যায়ন': '#ec4899',
  'দোকান মেরামত ও রক্ষণাবেক্ষণ': '#64748b',
  'বিজ্ঞাপন ও বিপণন': '#3b82f6',
  'অন্যান্য বিবিধ খরচ': '#a855f7'
};

const PAYMENT_METHODS = [
  'নগদ (Cash)',
  'বিকাশ (bKash)',
  'নগদ / রকেট',
  'ব্যাংক ট্রান্সফার'
];

export default function DashboardView({ analytics, onSelectCustomer, onOpenReceipt, onRefreshAnalytics }) {
  const [period, setPeriod] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Add Expense Modal state
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'দোকান ভাড়া',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'নগদ (Cash)',
    notes: ''
  });
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState('');

  if (!analytics) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <Sparkles size={32} style={{ animation: 'spin 2s linear infinite', color: 'var(--primary)' }} />
          <p style={{ marginTop: '0.75rem', fontWeight: 600 }}>এক্সিকিউটিভ অ্যানালিটিক্স লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  const { 
    kpis = {}, 
    deptSales = [], 
    tierDistribution = [], 
    topSpenders = [], 
    recentOrders = [], 
    ticketSummary = {},
    expenseBreakdown = [],
    recentExpenses = []
  } = analytics;

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom' && onRefreshAnalytics) {
      onRefreshAnalytics({ period: newPeriod });
    }
  };

  const handleCustomDateApply = () => {
    if ((fromDate || toDate) && onRefreshAnalytics) {
      onRefreshAnalytics({ from_date: fromDate, to_date: toDate });
    }
  };

  const handleCustomDateClear = () => {
    setFromDate('');
    setToDate('');
    setPeriod('all');
    if (onRefreshAnalytics) {
      onRefreshAnalytics({ period: 'all' });
    }
  };

  const handleOpenAddExpense = () => {
    setExpenseError('');
    setExpenseForm({
      title: '',
      category: 'দোকান ভাড়া',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'নগদ (Cash)',
      notes: ''
    });
    setShowAddExpenseModal(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    setExpenseError('');
    if (!expenseForm.title.trim()) {
      setExpenseError('অনুগ্রহ করে খরচের বিবরণ/শিরোনাম লিখুন');
      return;
    }
    const amt = parseFloat(expenseForm.amount);
    if (isNaN(amt) || amt <= 0) {
      setExpenseError('অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন (৳)');
      return;
    }

    try {
      setIsSubmittingExpense(true);
      await api.createExpense({
        ...expenseForm,
        title: expenseForm.title.trim(),
        amount: amt
      });
      setShowAddExpenseModal(false);
      if (onRefreshAnalytics) {
        if (period === 'custom') {
          onRefreshAnalytics({ from_date: fromDate, to_date: toDate });
        } else {
          onRefreshAnalytics({ period });
        }
      }
    } catch (err) {
      setExpenseError(err.message || 'খরচ সংরক্ষণ করতে সমস্যা হয়েছে');
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async (id, title) => {
    if (window.confirm(`আপনি কি নিশ্চিতভাবে "${title || 'এই খরচটি'}" মুছে ফেলতে চান?`)) {
      try {
        await api.deleteExpense(id);
        if (onRefreshAnalytics) {
          if (period === 'custom') {
            onRefreshAnalytics({ from_date: fromDate, to_date: toDate });
          } else {
            onRefreshAnalytics({ period });
          }
        }
      } catch (err) {
        alert('খরচ মুছে ফেলা সম্ভব হয়নি: ' + err.message);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Welcome Banner */}
      <div className="glass-panel dashboard-welcome-banner">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Sparkles size={14} /> মিজান কম্পিউটার অ্যান্ড কসমেটিকস • সেলস, ব্যয় ও প্রফিট অ্যানালিটিক্স
          </div>
          <h1 className="dashboard-main-title">মিজান কম্পিউটার অ্যান্ড কসমেটিকস (Mijan Computer & Cosmetics) সামগ্রিক পারফরম্যান্স</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            কম্পিউটার এক্সেসরিজ, কসমেটিকস, গিফট আইটেম ও স্টেশনারি পণ্যের লাইভ বিক্রয়, পরিচালন ব্যয় ও নিট মুনাফা বিশ্লেষণ।
          </p>
        </div>

        <div className="dashboard-csat-wrap">
          <div style={{ 
            textAlign: 'right', 
            padding: '0.65rem 1.15rem', 
            background: 'var(--bg-surface)', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>সিএসএটি সন্তুষ্টি</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.15rem' }}>
              ★ {ticketSummary.avgCsat || '4.8'} / ৫.০
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter Bar & Quick Expense Entry */}
      <div className="glass-panel dashboard-filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <Calendar size={18} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>হিসাব ও অ্যানালিটিক্স সময়কাল:</span>
        </div>

        <div className="dashboard-filter-pills">
          {[
            { id: 'all', label: 'সব সময় (All)' },
            { id: 'today', label: 'আজ (Today)' },
            { id: 'yesterday', label: 'গতকাল' },
            { id: 'last_7_days', label: 'বিগত ৭ দিন' },
            { id: 'last_30_days', label: 'বিগত ৩০ দিন' },
            { id: 'this_month', label: 'চলতি মাস' },
            { id: 'custom', label: 'কাস্টম তারিখ...' }
          ].map(item => (
            <button
              key={item.id}
              type="button"
              className={`btn ${period === item.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                padding: '0.35rem 0.8rem', 
                fontSize: '0.8rem', 
                height: '32px',
                border: period === item.id ? 'none' : '1px solid transparent',
                borderRadius: 'var(--radius-sm)'
              }}
              onClick={() => handlePeriodChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Quick Add Expense Action */}
        <button
          type="button"
          className="btn btn-primary"
          style={{ 
            padding: '0.45rem 1rem', 
            fontSize: '0.85rem', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.45rem',
            background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
            border: 'none',
            color: '#fff',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(244, 63, 94, 0.35)'
          }}
          onClick={handleOpenAddExpense}
        >
          <Plus size={16} /> নতুন খরচ ভাউচার
        </button>

        {period === 'custom' && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.6rem', 
            width: '100%', 
            marginTop: '0.5rem', 
            paddingTop: '0.65rem', 
            borderTop: '1px solid var(--border-subtle)', 
            flexWrap: 'wrap' 
          }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>তারিখ থেকে:</label>
            <input 
              type="date" 
              className="form-control" 
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.82rem', width: 'auto' }} 
              value={fromDate} 
              onChange={e => setFromDate(e.target.value)} 
            />
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>তারিখ পর্যন্ত:</label>
            <input 
              type="date" 
              className="form-control" 
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.82rem', width: 'auto' }} 
              value={toDate} 
              onChange={e => setToDate(e.target.value)} 
            />
            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} 
              onClick={handleCustomDateApply}
            >
              প্রয়োগ করুন
            </button>
            {(fromDate || toDate) && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }} 
                onClick={handleCustomDateClear}
              >
                রিসেট
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expanded 8-KPI Cards Grid */}
      <div className="kpi-grid">
        {/* KPI 1: Gross Revenue */}
        <div className="kpi-card" style={{ '--card-accent': '#6366f1', '--card-bg-accent': 'rgba(99, 102, 241, 0.12)' }}>
          <div>
            <div className="kpi-title">মোট বিক্রয় রাজস্ব</div>
            <div className="kpi-value">৳{(kpis.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="kpi-trend" style={{ color: 'var(--success)' }}>
              <TrendingUp size={13} /> {kpis.totalOrders || 0} টি চেকআউট অর্ডার
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ color: '#6366f1', background: 'rgba(99, 102, 241, 0.12)' }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 800 }}>৳</span>
          </div>
        </div>

        {/* KPI 2: Gross Profit */}
        <div className="kpi-card" style={{ '--card-accent': '#10b981', '--card-bg-accent': 'rgba(16, 185, 129, 0.12)' }}>
          <div>
            <div className="kpi-title">গ্রস প্রফিট (মোট লাভ)</div>
            <div className="kpi-value" style={{ color: '#10b981' }}>
              ৳{(kpis.grossProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="kpi-trend" style={{ color: '#10b981' }}>
              <TrendingUp size={13} /> মার্জিন: {kpis.grossMarginPct || 0}% (ক্রয়মূল্য বাদে)
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.12)' }}>
            <Award size={22} />
          </div>
        </div>

        {/* KPI 3: Operating Expenses */}
        <div className="kpi-card" style={{ '--card-accent': '#f43f5e', '--card-bg-accent': 'rgba(244, 63, 94, 0.12)' }}>
          <div>
            <div className="kpi-title">দোকান পরিচালন ব্যয়</div>
            <div className="kpi-value" style={{ color: '#f43f5e' }}>
              ৳{(kpis.totalExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="kpi-trend" style={{ color: 'var(--text-muted)' }}>
              <Receipt size={13} style={{ color: '#f43f5e' }} /> {expenseBreakdown.length || 0} টি খাতে নিয়মিত খরচ
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ color: '#f43f5e', background: 'rgba(244, 63, 94, 0.12)' }}>
            <Receipt size={22} />
          </div>
        </div>

        {/* KPI 4: Net Profit */}
        <div className="kpi-card" style={{ 
          '--card-accent': (kpis.netProfit >= 0) ? '#8b5cf6' : '#ef4444', 
          '--card-bg-accent': (kpis.netProfit >= 0) ? 'rgba(139, 92, 246, 0.12)' : 'rgba(239, 68, 68, 0.12)' 
        }}>
          <div>
            <div className="kpi-title">নিট মুনাফা (নেট লাভ)</div>
            <div className="kpi-value" style={{ color: (kpis.netProfit >= 0) ? '#8b5cf6' : '#ef4444' }}>
              ৳{(kpis.netProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="kpi-trend" style={{ color: (kpis.netProfit >= 0) ? 'var(--success)' : '#ef4444' }}>
              {kpis.netProfit >= 0 ? (
                <>
                  <TrendingUp size={13} /> নিট মার্জিন: {kpis.netMarginPct || 0}% (লাভজনক)
                </>
              ) : (
                <>
                  <TrendingDown size={13} /> নিট ক্ষতি: {Math.abs(kpis.netMarginPct || 0)}%
                </>
              )}
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ 
            color: (kpis.netProfit >= 0) ? '#8b5cf6' : '#ef4444', 
            background: (kpis.netProfit >= 0) ? 'rgba(139, 92, 246, 0.12)' : 'rgba(239, 68, 68, 0.12)' 
          }}>
            <Sparkles size={22} />
          </div>
        </div>

        {/* KPI 5: Average Basket Size */}
        <div className="kpi-card" style={{ '--card-accent': '#06b6d4', '--card-bg-accent': 'rgba(6, 182, 212, 0.12)' }}>
          <div>
            <div className="kpi-title">গড় বাস্কেট মূল্য (AOV)</div>
            <div className="kpi-value">৳{(kpis.avgBasketSize || 0).toFixed(2)}</div>
            <div className="kpi-trend" style={{ color: 'var(--text-muted)' }}>
              মোট ছাড় প্রদান: ৳{(kpis.totalDiscountsGiven || 0).toFixed(2)}
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.12)' }}>
            <ShoppingBag size={22} />
          </div>
        </div>

        {/* KPI 6: Total Items Sold */}
        <div className="kpi-card" style={{ '--card-accent': '#f59e0b', '--card-bg-accent': 'rgba(245, 158, 11, 0.12)' }}>
          <div>
            <div className="kpi-title">মোট বিক্রি হওয়া পণ্য</div>
            <div className="kpi-value">{kpis.totalUnitsSold || 0} টি</div>
            <div className="kpi-trend" style={{ color: 'var(--text-muted)' }}>
              <Package size={13} style={{ color: '#f59e0b' }} /> ইনভেন্টরি পণ্য সরবরাহ
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)' }}>
            <Package size={22} />
          </div>
        </div>

        {/* KPI 7: Registered CRM Members */}
        <div className="kpi-card" style={{ '--card-accent': '#ec4899', '--card-bg-accent': 'rgba(236, 72, 153, 0.12)' }}>
          <div>
            <div className="kpi-title">নিবন্ধিত সিআরএম মেম্বার</div>
            <div className="kpi-value">{kpis.totalCustomers || 0} জন</div>
            <div className="kpi-trend" style={{ color: '#ec4899' }}>
              <Award size={13} /> {(kpis.totalPointsLiability || 0).toLocaleString()} পয়েন্ট দায়বদ্ধতা
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ color: '#ec4899', background: 'rgba(236, 72, 153, 0.12)' }}>
            <Users size={22} />
          </div>
        </div>

        {/* KPI 8: Churn Risk */}
        <div className="kpi-card" style={{ '--card-accent': '#ea580c', '--card-bg-accent': 'rgba(234, 88, 12, 0.12)' }}>
          <div>
            <div className="kpi-title">ঝুঁকিপূর্ণ কাস্টমার</div>
            <div className="kpi-value" style={{ color: (kpis.churnAtRiskCount || 0) > 0 ? '#ea580c' : 'inherit' }}>
              {kpis.churnAtRiskCount || 0} জন
            </div>
            <div className="kpi-trend" style={{ color: 'var(--text-dim)' }}>
              <AlertTriangle size={13} style={{ color: '#ea580c' }} /> বিশেষ অফার যোগ্য
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ color: '#ea580c', background: 'rgba(234, 88, 12, 0.12)' }}>
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* Financial P&L Breakdown Formula Banner */}
      <div className="glass-panel dashboard-pnl-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PieChart size={18} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
            আয়-ব্যয় ও প্রফিট সমীকরণ (Financial P&L Statement):
          </span>
        </div>
        <div className="dashboard-pnl-chips">
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '0.28rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
            মোট বিক্রয়: ৳{(kpis.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ color: 'var(--text-muted)' }}>➖</span>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '0.28rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
            ক্রয়মূল্য (COGS): ৳{(kpis.totalCogs || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ color: 'var(--text-muted)' }}>🟰</span>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.28rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
            গ্রস লাভ: ৳{(kpis.grossProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ color: 'var(--text-muted)' }}>➖</span>
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', padding: '0.28rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
            দোকান খরচ: ৳{(kpis.totalExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ color: 'var(--text-muted)' }}>🟰</span>
          <div style={{ 
            background: (kpis.netProfit >= 0) ? 'rgba(139, 92, 246, 0.25)' : 'rgba(239, 68, 68, 0.25)', 
            color: (kpis.netProfit >= 0) ? '#a78bfa' : '#f87171', 
            padding: '0.3rem 0.85rem', 
            borderRadius: 'var(--radius-sm)',
            boxShadow: (kpis.netProfit >= 0) ? '0 0 12px rgba(139, 92, 246, 0.3)' : '0 0 12px rgba(239, 68, 68, 0.3)'
          }}>
            নিট মুনাফা: ৳{(kpis.netProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Expense Analysis Section: 2 Columns */}
      <div className="dashboard-grid-2col">
        {/* Left: Expense Category Breakdown */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>খাতভিত্তিক ব্যয়ের অনুপাত বিশ্লেষণ</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>দোকান পরিচালনা খরচের ক্যাটাগরিভিত্তিক বণ্টন ও শতাংশ</p>
            </div>
            <span className="badge badge-primary" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
              মোট: ৳{(kpis.totalExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.05rem', flex: 1, justifyContent: 'center' }}>
            {expenseBreakdown && expenseBreakdown.length > 0 ? (
              expenseBreakdown.map((cat) => {
                const color = CATEGORY_COLORS[cat.category] || '#6366f1';
                return (
                  <div key={cat.category} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                        <span style={{ fontWeight: 600 }}>{cat.category}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>({cat.count} টি ভাউচার)</span>
                      </div>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        ৳{cat.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        <span style={{ color: color, marginLeft: '0.5rem', fontSize: '0.78rem' }}>
                          ({cat.percentage}%)
                        </span>
                      </div>
                    </div>
                    <div style={{ 
                      height: '8px', 
                      background: 'var(--bg-surface-elevated)', 
                      borderRadius: 'var(--radius-full)', 
                      overflow: 'hidden' 
                    }}>
                      <div style={{ 
                        width: `${cat.percentage}%`, 
                        height: '100%', 
                        background: color, 
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '2.5rem', 
                color: 'var(--text-muted)', 
                fontSize: '0.85rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-subtle)',
                margin: 'auto 0'
              }}>
                <Receipt size={28} style={{ color: 'var(--text-dim)', marginBottom: '0.5rem' }} />
                <div>নির্বাচিত সময়কালের মধ্যে কোনো ব্যয়ের হিসাব পাওয়া যায়নি</div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '0.75rem' }}
                  onClick={handleOpenAddExpense}
                >
                  <Plus size={14} /> প্রথম খরচ যুক্ত করুন
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Expenses Vouchers */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>সাম্প্রতিক খরচের ভাউচারসমূহ</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>দৈনন্দিন পরিচালিত দোকান খরচের লাইভ হিসাব</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={handleOpenAddExpense}
            >
              <Plus size={14} /> নতুন এন্ট্রি
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', flex: 1, overflowY: 'auto', maxHeight: '380px' }}>
            {recentExpenses && recentExpenses.length > 0 ? (
              recentExpenses.map((exp) => {
                const color = CATEGORY_COLORS[exp.category] || '#6366f1';
                return (
                  <div 
                    key={exp.id}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      transition: 'border-color var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{exp.title}</span>
                        <span style={{ 
                          fontSize: '0.72rem', 
                          padding: '0.15rem 0.5rem', 
                          borderRadius: 'var(--radius-full)', 
                          background: `${color}18`, 
                          color: color,
                          fontWeight: 600,
                          border: `1px solid ${color}30`
                        }}>
                          {exp.category}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                        তারিখ: {exp.date} • {exp.payment_method} {exp.notes ? `• ${exp.notes}` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '0.98rem', color: '#f43f5e' }}>
                          - ৳{exp.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-icon"
                        style={{ 
                          color: 'var(--text-dim)', 
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.35rem',
                          borderRadius: 'var(--radius-sm)'
                        }}
                        title="এই খরচটি মুছে ফেলুন"
                        onClick={() => handleDeleteExpense(exp.id, exp.title)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '2.5rem', 
                color: 'var(--text-muted)', 
                fontSize: '0.85rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-subtle)',
                margin: 'auto 0'
              }}>
                এখনো কোনো খরচের ভাউচার যুক্ত করা হয়নি
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2-Column: Department Sales & Loyalty Tiers */}
      <div className="dashboard-grid-2col">
        {/* Department Revenue Breakdown */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>বিভাগ ভিত্তিক বিক্রয় বিশ্লেষণ</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>ডিপার্টমেন্ট অনুযায়ী বিক্রয় ও রাজস্ব অংশীদারিত্ব</p>
            </div>
            <span className="btn btn-secondary btn-sm" style={{ pointerEvents: 'none', fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}>
              সকল বিভাগ
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', flex: 1, justifyContent: 'center' }}>
            {(deptSales && deptSales.length > 0) ? (
              deptSales.map((dept, idx) => {
                const maxRev = deptSales[0].revenue || 1;
                const pct = Math.min(100, Math.round((dept.revenue / maxRev) * 100));
                const colors = ['#6366f1', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#8b5cf6'];
                const color = colors[idx % colors.length];

                return (
                  <div key={dept.department_name} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                      <span style={{ fontWeight: 600 }}>{dept.department_name}</span>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        ৳{dept.revenue?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        <span style={{ color: 'var(--text-dim)', fontWeight: 400, marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                          ({dept.units_sold} ইউনিট)
                        </span>
                      </span>
                    </div>
                    <div style={{ 
                      height: '8px', 
                      background: 'var(--bg-surface-elevated)', 
                      borderRadius: 'var(--radius-full)', 
                      overflow: 'hidden' 
                    }}>
                      <div style={{ 
                        width: `${pct}%`, 
                        height: '100%', 
                        background: color, 
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {[
                  { name: 'কসমেটিকস ও রূপচর্চা', color: '#ec4899' },
                  { name: 'গিফট আইটেম ও খেলনা', color: '#06b6d4' },
                  { name: 'কম্পিউটার ও ডিজিটাল সামগ্রী', color: '#6366f1' }
                ].map((dept) => (
                  <div key={dept.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                      <span style={{ fontWeight: 600 }}>{dept.name}</span>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        ৳০.০০
                        <span style={{ color: 'var(--text-dim)', fontWeight: 400, marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                          (০ ইউনিট)
                        </span>
                      </span>
                    </div>
                    <div style={{ 
                      height: '8px', 
                      background: 'var(--bg-surface-elevated)', 
                      borderRadius: 'var(--radius-full)', 
                      overflow: 'hidden' 
                    }}>
                      <div style={{ 
                        width: '0%', 
                        height: '100%', 
                        background: dept.color, 
                        borderRadius: 'var(--radius-full)' 
                      }} />
                    </div>
                  </div>
                ))}
                <div style={{ 
                  textAlign: 'center', 
                  fontSize: '0.76rem', 
                  color: 'var(--text-dim)', 
                  marginTop: '0.35rem',
                  padding: '0.45rem',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px dashed var(--border-subtle)'
                }}>
                  💡 পিওএস থেকে চেকআউট সম্পন্ন হলে বিভাগভিত্তিক বিক্রয় স্বয়ংক্রিয়ভাবে লাইভ হবে
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loyalty Tier Distribution */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>গ্রাহক টিয়ার বণ্টন অনুপাত</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>লয়্যালটি মেম্বারশিপের স্তর বিন্যাস</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, justifyContent: 'center' }}>
            {tierDistribution.map((t) => {
              const totalCust = kpis.totalCustomers || 1;
              const pct = Math.round((t.count / totalCust) * 100);

              const tierLabels = {
                VIP: 'ভিআইপি (VIP)',
                Platinum: 'প্ল্যাটিনাম (Platinum)',
                Gold: 'গোল্ড (Gold)',
                Silver: 'সিলভার (Silver)',
                Bronze: 'ব্রোঞ্জ (Bronze)'
              };

              return (
                <div key={t.tier} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span className={`tier-badge tier-${t.tier}`}>{t.tier}</span>
                    <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>{tierLabels[t.tier] || t.tier}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {t.count} জন ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2-Column: Top VIP Spenders & Recent Orders */}
      <div className="dashboard-grid-2col">
        {/* Top VIP Spenders */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>শীর্ষ ভিআইপি ক্রেতাবৃন্দ</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>সর্বোচ্চ লাইফটাইম ভ্যালু (এলটিভি) গ্রাহক</p>
            </div>
          </div>

          <div className="data-table-container" style={{ flex: 1 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>গ্রাহকের নাম</th>
                  <th>টিয়ার</th>
                  <th>মোট কেনাকাটা</th>
                  <th>পয়েন্ট</th>
                  <th>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {topSpenders.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      এখনো কোনো কেনাকাটার তথ্য পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  topSpenders.map((cust) => (
                    <tr key={cust.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{cust.first_name} {cust.last_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {cust.card_number}
                        </div>
                      </td>
                      <td>
                        <span className={`tier-badge tier-${cust.tier}`}>{cust.tier}</span>
                      </td>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        ৳{cust.total_spent?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        {cust.points_balance?.toLocaleString()}
                      </td>
                      <td>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => onSelectCustomer(cust.id)}
                        >
                          প্রোফাইল <ArrowUpRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>সাম্প্রতিক পিওএস ক্যাশ লেনদেন</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>লাইভ চেকআউট ও রসিদ প্রবাহ</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            {recentOrders.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2.5rem', 
                color: 'var(--text-muted)', 
                fontSize: '0.85rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-subtle)',
                margin: 'auto 0'
              }}>
                এখনো কোনো বিক্রয় রসিদ তৈরি হয়নি
              </div>
            ) : (
              recentOrders.map((ord) => (
                <div 
                  key={ord.id}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'border-color var(--transition-fast)'
                  }}
                  onClick={() => onOpenReceipt(ord.id)}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{ord.order_number}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {ord.store_name}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {ord.first_name ? `${ord.first_name} ${ord.last_name}` : 'সাধারণ অতিথি'} • {ord.payment_method}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
                        ৳{ord.total?.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--success)' }}>
                        সম্পন্ন
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--text-dim)' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="modal-overlay" onClick={() => !isSubmittingExpense && setShowAddExpenseModal(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flex: 1, minWidth: 0 }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: 'var(--radius-md)', 
                  background: 'rgba(244, 63, 94, 0.15)', 
                  color: '#f43f5e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Receipt size={18} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, wordBreak: 'break-word' }}>নতুন দোকান খরচ যুক্ত করুন</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-word' }}>মিজান কম্পিউটার অ্যান্ড কসমেটিকস পরিচালন ব্যয় এন্ট্রি</div>
                </div>
              </div>
              <button 
                type="button"
                className="btn-icon" 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}
                onClick={() => !isSubmittingExpense && setShowAddExpenseModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="modal-form" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: 0, overflowY: 'auto' }}>
                {expenseError && (
                  <div style={{ 
                    padding: '0.65rem 0.9rem', 
                    background: 'rgba(239, 68, 68, 0.15)', 
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#f87171',
                    fontSize: '0.82rem',
                    fontWeight: 600
                  }}>
                    {expenseError}
                  </div>
                )}

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    খরচের বিবরণ / টাইটেল <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="যেমন: চলতি মাসের দোকান ভাড়া, বিদ্যুৎ বিল, কুরিয়ার পার্সেল..."
                    value={expenseForm.title}
                    onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  />
                </div>

                <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      খরচের খাত (ক্যাটাগরি) <span style={{ color: '#f43f5e' }}>*</span>
                    </label>
                    <select
                      className="form-control"
                      value={expenseForm.category}
                      onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    >
                      {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      পরিমাণ (টাকা ৳) <span style={{ color: '#f43f5e' }}>*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      className="form-control"
                      placeholder="৳ 0.00"
                      value={expenseForm.amount}
                      onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      খরচের তারিখ
                    </label>
                    <input
                      type="date"
                      required
                      className="form-control"
                      value={expenseForm.date}
                      onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      পরিশোধের মাধ্যম
                    </label>
                    <select
                      className="form-control"
                      value={expenseForm.payment_method}
                      onChange={e => setExpenseForm({ ...expenseForm, payment_method: e.target.value })}
                    >
                      {PAYMENT_METHODS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    নোট / ভাউচার ও মেমো নম্বর (ঐচ্ছিক)
                  </label>
                  <textarea
                    rows={2}
                    className="form-control"
                    placeholder="অতিরিক্ত কোনো তথ্য বা মেমো নম্বর থাকলে এখানে লিখুন..."
                    value={expenseForm.notes}
                    onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isSubmittingExpense}
                  onClick={() => setShowAddExpenseModal(false)}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingExpense}
                  style={{
                    background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                    border: 'none',
                    fontWeight: 700
                  }}
                >
                  {isSubmittingExpense ? 'সংরক্ষণ হচ্ছে...' : 'ভাউচার সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
