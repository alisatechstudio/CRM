import React from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function DashboardView({ analytics, onSelectCustomer, onOpenReceipt }) {
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

  const { kpis, deptSales = [], tierDistribution = [], topSpenders = [], recentOrders = [], ticketSummary = {} } = analytics;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Welcome Banner */}
      <div className="glass-panel" style={{ 
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.08) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 1.75rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Sparkles size={14} /> মিজান স্টেশনারি • সেলস ও সিআরএম ইন্টেলিজেন্স
          </div>
          <h1 style={{ fontSize: '1.6rem', margin: '0.25rem 0' }}>মিজান স্টেশনারি (Mijan Stationary) সামগ্রিক পারফরম্যান্স</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            শিক্ষা ও অফিস সামগ্রী, খাতা-কলম, ড্রয়িং সামগ্রী ও সায়েন্টিফিক ক্যালকুলেটরের লাইভ সেলস ও কাস্টমার ট্র্যাকিং।
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ 
            textAlign: 'right', 
            padding: '0.5rem 1rem', 
            background: 'var(--bg-surface)', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>সিএসএটি সন্তুষ্টি</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)' }}>
              ★ {ticketSummary.avgCsat || '4.8'} / ৫.০
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        {/* Gross Revenue */}
        <div className="kpi-card" style={{ '--card-accent': '#6366f1', '--card-bg-accent': 'rgba(99, 102, 241, 0.12)' }}>
          <div>
            <div className="kpi-title">মোট স্টোর বিক্রয়</div>
            <div className="kpi-value">৳{kpis.totalRevenue?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="kpi-trend" style={{ color: 'var(--success)' }}>
              <TrendingUp size={13} /> {kpis.totalOrders} টি চেকআউট সম্পন্ন
            </div>
          </div>
          <div className="kpi-icon-wrap">
            <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>৳</span>
          </div>
        </div>

        {/* Average Basket Size */}
        <div className="kpi-card" style={{ '--card-accent': '#06b6d4', '--card-bg-accent': 'rgba(6, 182, 212, 0.12)' }}>
          <div>
            <div className="kpi-title">গড় বাস্কেট মূল্য</div>
            <div className="kpi-value">৳{kpis.avgBasketSize?.toFixed(2)}</div>
            <div className="kpi-trend" style={{ color: 'var(--text-muted)' }}>
              মোট ছাড় প্রদান: ৳{kpis.totalDiscountsGiven?.toFixed(2)}
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.12)' }}>
            <ShoppingBag size={22} />
          </div>
        </div>

        {/* Loyalty Members */}
        <div className="kpi-card" style={{ '--card-accent': '#ec4899', '--card-bg-accent': 'rgba(236, 72, 153, 0.12)' }}>
          <div>
            <div className="kpi-title">নিবন্ধিত সিআরএম মেম্বার</div>
            <div className="kpi-value">{kpis.totalCustomers} জন</div>
            <div className="kpi-trend" style={{ color: '#ec4899' }}>
              <Award size={13} /> {kpis.totalPointsLiability?.toLocaleString()} পয়েন্ট দায়বদ্ধতা
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ color: '#ec4899', background: 'rgba(236, 72, 153, 0.12)' }}>
            <Users size={22} />
          </div>
        </div>

        {/* Churn Risk Alert */}
        <div className="kpi-card" style={{ '--card-accent': '#f59e0b', '--card-bg-accent': 'rgba(245, 158, 11, 0.12)' }}>
          <div>
            <div className="kpi-title">ঝুঁকিপূর্ণ গ্রাহক (অনুপস্থিত)</div>
            <div className="kpi-value" style={{ color: kpis.churnAtRiskCount > 0 ? '#f59e0b' : 'inherit' }}>
              {kpis.churnAtRiskCount} জন
            </div>
            <div className="kpi-trend" style={{ color: 'var(--text-dim)' }}>
              <AlertTriangle size={13} style={{ color: '#f59e0b' }} /> বিশেষ অফার যোগ্য
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)' }}>
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* 2-Column: Department Sales & Loyalty Tiers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
        {/* Department Revenue Breakdown */}
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>বিভাগ ভিত্তিক বিক্রয় বিশ্লেষণ</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ডিপার্টমেন্ট অনুযায়ী বিক্রয় ও রাজস্ব অংশীদারিত্ব</p>
            </div>
            <span className="btn btn-secondary btn-sm" style={{ pointerEvents: 'none' }}>
              সকল বিভাগ
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {deptSales.map((dept, idx) => {
              const maxRev = deptSales.length > 0 ? deptSales[0].revenue || 1 : 1;
              const pct = Math.min(100, Math.round((dept.revenue / maxRev) * 100));
              
              const colors = ['#6366f1', '#ec4899', '#06b6d4', '#f59e0b', '#10b981'];
              const color = colors[idx % colors.length];

              return (
                <div key={dept.department_name} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
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
            })}
          </div>
        </div>

        {/* Loyalty Tier Distribution */}
        <div className="glass-panel">
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0 }}>গ্রাহক টিয়ার বণ্টন অনুপাত</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>লয়্যালটি মেম্বারশিপের স্তর বিন্যাস</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                  padding: '0.65rem 0.85rem',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span className={`tier-badge tier-${t.tier}`}>{t.tier}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{tierLabels[t.tier] || t.tier}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {t.count} জন ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2-Column: Top VIP Spenders & Recent Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Top VIP Spenders */}
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>শীর্ষ ভিআইপি ক্রেতাবৃন্দ</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>সর্বোচ্চ লাইফটাইম ভ্যালু (এলটিভি) গ্রাহক</p>
            </div>
          </div>

          <div className="data-table-container">
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
                {topSpenders.map((cust) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>সাম্প্রতিক পিওএস ক্যাশ লেনদেন</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>লাইভ চেকআউট ও রসিদ প্রবাহ</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentOrders.map((ord) => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
