import React, { useState, useEffect } from 'react';
import { 
  LifeBuoy, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  MessageSquare,
  Star,
  User,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../api';
import { DEFAULT_DEPARTMENTS } from '../constants/departments';

export default function TicketsView({ onSelectCustomer }) {
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [loading, setLoading] = useState(true);

  const activeDepartments = (departments && departments.length > 0) ? departments : DEFAULT_DEPARTMENTS;

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // New ticket modal
  const [showCreate, setShowCreate] = useState(false);
  const [newTicket, setNewTicket] = useState({
    customer_id: '',
    subject: '',
    department: 'খাতা, ডায়েরি ও কাগজ সামগ্রী',
    type: 'Return/Exchange',
    priority: 'Medium',
    details: '',
    assigned_to: 'মারকুস তানভীর'
  });
  const [saving, setSaving] = useState(false);

  // Resolve modal
  const [resolveTicket, setResolveTicket] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [csatScore, setCsatScore] = useState(5);
  const [resolving, setResolving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tktsRes, custsRes, deptsRes] = await Promise.allSettled([
        api.getTickets({ status: statusFilter, priority: priorityFilter, department: departmentFilter }),
        api.getCustomers(),
        api.getDepartments()
      ]);

      if (tktsRes.status === 'fulfilled' && Array.isArray(tktsRes.value)) {
        setTickets(tktsRes.value);
      }
      if (custsRes.status === 'fulfilled' && Array.isArray(custsRes.value)) {
        setCustomers(custsRes.value);
        if (custsRes.value.length > 0 && !newTicket.customer_id) {
          setNewTicket(prev => ({ ...prev, customer_id: custsRes.value[0].id }));
        }
      }
      if (deptsRes.status === 'fulfilled' && Array.isArray(deptsRes.value) && deptsRes.value.length > 0) {
        setDepartments(deptsRes.value);
      } else {
        setDepartments(DEFAULT_DEPARTMENTS);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, priorityFilter, departmentFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.createTicket(newTicket);
      setShowCreate(false);
      setNewTicket({
        customer_id: customers[0]?.id || '',
        subject: '',
        department: 'পোশাক ও লাইফস্টাইল',
        type: 'Return/Exchange',
        priority: 'Medium',
        details: '',
        assigned_to: 'মারকুস তানভীর'
      });
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolveTicket) return;

    try {
      setResolving(true);
      await api.updateTicket(resolveTicket.id, {
        status: 'Resolved',
        resolution_notes: resolutionNotes,
        csat_score: csatScore
      });
      setResolveTicket(null);
      setResolutionNotes('');
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setResolving(false);
    }
  };

  const statusTranslations = {
    'Open': 'উন্মুক্ত',
    'In Progress': 'চলমান',
    'Resolved': 'মীমাংসিত'
  };

  const priorityTranslations = {
    'Urgent': 'জরুরি',
    'High': 'উচ্চ',
    'Medium': 'মাঝারি',
    'Low': 'সাধারণ'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Panel */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', margin: 0 }}>গ্রাহক সেবা ও রিটার্ন</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              গ্রাহক অভিযোগ, রিটার্ন ও সেবা পর্যবেক্ষণ।
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> + নতুন টিকিট
          </button>
        </div>

        {/* Filter controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1.25rem' }}>
          <div className="input-group">
            <label className="input-label">স্ট্যাটাস</label>
            <select 
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">সকল স্ট্যাটাস</option>
              <option value="Open">উন্মুক্ত</option>
              <option value="In Progress">চলমান</option>
              <option value="Resolved">মীমাংসিত</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">অগ্রাধিকার</label>
            <select 
              className="form-control"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">সকল অগ্রাধিকার</option>
              <option value="Urgent">জরুরি</option>
              <option value="High">উচ্চ</option>
              <option value="Medium">মাঝারি</option>
              <option value="Low">সাধারণ</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">বিভাগ</label>
            <select 
              className="form-control"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="All">সকল বিভাগ</option>
              {activeDepartments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            সার্ভিস ডেস্ক টিকিট লোড হচ্ছে...
          </div>
        ) : tickets.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            এই ফিল্টারে কোনো টিকিট নেই।
          </div>
        ) : (
          tickets.map((t) => (
            <div 
              key={t.id} 
              className="glass-panel" 
              style={{ 
                padding: '1.25rem',
                borderLeft: `4px solid ${
                  t.priority === 'Urgent' ? 'var(--danger)' :
                  t.priority === 'High' ? 'var(--warning)' : 'var(--primary)'
                }`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.85rem', color: 'var(--primary)' }}>
                      {t.ticket_number}
                    </span>
                    <h3 style={{ fontSize: '1rem', margin: 0 }}>{t.subject}</h3>
                    <span className={`status-pill status-${t.status === 'Resolved' ? 'low' : t.status === 'In Progress' ? 'medium' : 'high'}`}>
                      {t.status === 'Resolved' ? 'মীমাংসিত' : t.status === 'In Progress' ? 'চলমান' : 'উন্মুক্ত'}
                    </span>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 700, 
                      padding: '0.15rem 0.5rem', 
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface-elevated)',
                      color: t.priority === 'Urgent' || t.priority === 'High' ? 'var(--danger)' : 'var(--text-dim)'
                    }}>
                      {priorityTranslations[t.priority] || t.priority}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span><strong style={{ color: 'var(--text-main)' }}>{t.department}</strong></span>
                    <span>•</span>
                    <span>ধরন: {t.type}</span>
                    <span>•</span>
                    <span>তারিখ: {t.created_at}</span>
                    <span>•</span>
                    <span>দায়িত্বপ্রাপ্ত: {t.assigned_to || 'সার্ভিস ডেস্ক'}</span>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', marginTop: '0.65rem', lineHeight: 1.5 }}>
                    {t.details}
                  </p>

                  {t.resolution_notes && (
                    <div style={{ 
                      marginTop: '0.75rem', 
                      padding: '0.5rem 0.75rem', 
                      background: 'rgba(16, 185, 129, 0.08)', 
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      color: 'var(--success)'
                    }}>
                      <strong>সমাধান:</strong> {t.resolution_notes}
                      {t.csat_score && (
                        <span style={{ marginLeft: '0.75rem', fontWeight: 700 }}>
                          • রেটিং: {'★'.repeat(t.csat_score)} ({t.csat_score}/৫)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', flexShrink: 0 }}>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSelectCustomer(t.customer_id)}
                  >
                    <User size={13} /> {t.first_name} {t.last_name}
                  </button>

                  {t.status !== 'Resolved' && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => setResolveTicket(t)}
                    >
                      <CheckCircle size={14} /> সমাধান
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolve Ticket Modal */}
      {resolveTicket && (
        <div className="modal-overlay" onClick={() => setResolveTicket(null)}>
          <div className="modal-card" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>টিকিট সমাধান</h2>
              <button className="btn btn-secondary btn-icon" onClick={() => setResolveTicket(null)}>✕</button>
            </div>

            <form onSubmit={handleResolve} className="modal-form" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: 0, overflowY: 'auto' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{resolveTicket.ticket_number} - {resolveTicket.subject}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>গ্রাহক: {resolveTicket.first_name} {resolveTicket.last_name}</div>
                </div>

                <div className="input-group">
                  <label className="input-label">সমাধান নোট *</label>
                  <textarea 
                    className="form-control"
                    rows={4}
                    required
                    placeholder="গৃহীত পদক্ষেপ বা সমাধান নোট..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">গ্রাহক রেটিং</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <button 
                        key={stars}
                        type="button"
                        className={`btn btn-sm ${csatScore === stars ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setCsatScore(stars)}
                      >
                        ★ {stars}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setResolveTicket(null)}>
                  বাতিল
                </button>
                <button type="submit" className="btn btn-success" disabled={resolving}>
                  {resolving ? 'সংরক্ষণ...' : 'সম্পন্ন করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-card" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>নতুন সার্ভিস টিকিট</h2>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowCreate(false)}>✕</button>
            </div>

            <form onSubmit={handleCreate} className="modal-form" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: 0, overflowY: 'auto' }}>
                <div className="input-group">
                  <label className="input-label">গ্রাহক *</label>
                  <select 
                    className="form-control"
                    value={newTicket.customer_id}
                    onChange={(e) => setNewTicket({ ...newTicket, customer_id: e.target.value })}
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name} ({c.card_number}) - {c.tier}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">বিষয় *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="সমস্যার সারসংক্ষেপ..."
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  />
                </div>

                <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">বিভাগ *</label>
                    <select 
                      className="form-control"
                      value={newTicket.department}
                      onChange={(e) => setNewTicket({ ...newTicket, department: e.target.value })}
                    >
                      {activeDepartments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">ধরন *</label>
                    <select 
                      className="form-control"
                      value={newTicket.type}
                      onChange={(e) => setNewTicket({ ...newTicket, type: e.target.value })}
                    >
                      <option value="Return/Exchange">রিটার্ন / এক্সচেঞ্জ</option>
                      <option value="Complaint">অভিযোগ</option>
                      <option value="Inquiry">অনুসন্ধান</option>
                      <option value="Loyalty Issue">পয়েন্ট সংক্রান্ত</option>
                      <option value="Feedback">মতামত</option>
                    </select>
                  </div>
                </div>

                <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">অগ্রাধিকার</label>
                    <select 
                      className="form-control"
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    >
                      <option value="Low">সাধারণ</option>
                      <option value="Medium">মাঝারি</option>
                      <option value="High">উচ্চ</option>
                      <option value="Urgent">জরুরি</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">দায়িত্বপ্রাপ্ত</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={newTicket.assigned_to}
                      onChange={(e) => setNewTicket({ ...newTicket, assigned_to: e.target.value })}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">বিবরণ *</label>
                  <textarea 
                    className="form-control"
                    rows={4}
                    required
                    placeholder="সমস্যার বিস্তারিত বিবরণ..."
                    value={newTicket.details}
                    onChange={(e) => setNewTicket({ ...newTicket, details: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                  বাতিল
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
