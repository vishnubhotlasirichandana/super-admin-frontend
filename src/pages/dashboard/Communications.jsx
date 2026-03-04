import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Mail, Send, ChevronLeft, ChevronRight, RefreshCw, Search, Filter,
    CheckCircle2, XCircle, Clock, AlertCircle, Bell
} from 'lucide-react';
import { notifApi } from '../../services/api';
import { useToast } from '../../components/Toast';

const Communications = () => {
    const [tab, setTab] = useState('emails');

    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="module-page">
            <div className="module-header">
                <div>
                    <h1>Communications</h1>
                    <p className="module-subtitle">Monitor email dispatches and broadcast notifications</p>
                </div>
            </div>

            <div className="comm-tabs">
                <button className={`comm-tab ${tab === 'emails' ? 'active' : ''}`} onClick={() => setTab('emails')}>
                    <Mail size={16} /> Email Monitor
                </button>
                <button className={`comm-tab ${tab === 'broadcast' ? 'active' : ''}`} onClick={() => setTab('broadcast')}>
                    <Bell size={16} /> Broadcast Notification
                </button>
            </div>

            {tab === 'emails' ? <EmailMonitor /> : <NotificationBroadcaster />}
        </motion.div>
    );
};

/* ── EMAIL SENDS MONITOR ── */
const EmailMonitor = () => {
    const toast = useToast();
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const limit = 20;

    const fetchEmails = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit };
            if (statusFilter) params.status = statusFilter;
            const res = await notifApi.getEmailSends(params);
            setData(res.data.data || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            toast.error('Failed to load email sends');
        } finally { setLoading(false); }
    }, [page, statusFilter, toast]);

    useEffect(() => { fetchEmails(); }, [fetchEmails]);

    const handleResend = async (id) => {
        try {
            await notifApi.resendEmail(id);
            toast.success('Email requeued successfully');
            fetchEmails();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resend');
        }
    };

    const totalPages = Math.ceil(total / limit);

    const statusIcon = (s) => {
        if (s === 'sent') return <CheckCircle2 size={14} style={{ color: '#059669' }} />;
        if (s === 'failed') return <XCircle size={14} style={{ color: '#dc2626' }} />;
        return <Clock size={14} style={{ color: '#d97706' }} />;
    };

    return (
        <div>
            <div className="app-toolbar" style={{ justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <div className="filter-select-wrap">
                    <Filter size={16} />
                    <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                        <option value="">All Statuses</option>
                        <option value="queued">Queued</option>
                        <option value="sent">Sent</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
            </div>

            <div className="data-table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Recipient</th>
                            <th>Template</th>
                            <th>Subject</th>
                            <th>Status</th>
                            <th>Attempts</th>
                            <th>Timestamp</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="table-empty">Loading…</td></tr>
                        ) : data.length === 0 ? (
                            <tr><td colSpan={7} className="table-empty">No email records found</td></tr>
                        ) : data.map((row) => (
                            <tr key={row._id} className="table-row-hover">
                                <td className="cell-bold">{row.to}</td>
                                <td>{row.templateName || '—'}</td>
                                <td>{row.subject}</td>
                                <td>
                                    <span className={`status-chip status-${row.status}`}>
                                        {statusIcon(row.status)} {row.status}
                                    </span>
                                </td>
                                <td>{row.attempts}</td>
                                <td className="cell-muted">{new Date(row.createdAt).toLocaleString()}</td>
                                <td>
                                    {row.status === 'failed' && (
                                        <button className="btn-icon btn-resend" title="Force Resend" onClick={() => handleResend(row._id)}>
                                            <RefreshCw size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="pg-btn"><ChevronLeft size={16} /></button>
                    <span className="pg-info">Page {page} of {totalPages}</span>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="pg-btn"><ChevronRight size={16} /></button>
                </div>
            )}
        </div>
    );
};

/* ── NOTIFICATION BROADCASTER ── */
const NotificationBroadcaster = () => {
    const toast = useToast();
    const [form, setForm] = useState({ userRef: '', type: 'admin_broadcast', title: '', body: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.userRef || !form.title || !form.body) {
            toast.warning('All fields are required');
            return;
        }
        setLoading(true);
        try {
            await notifApi.createNotification(form);
            toast.success('Notification sent successfully');
            setForm({ userRef: '', type: 'admin_broadcast', title: '', body: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send notification');
        } finally { setLoading(false); }
    };

    return (
        <div className="broadcast-form-wrap">
            <form onSubmit={handleSubmit} className="broadcast-form">
                <div className="modal-field">
                    <label>Target User ID *</label>
                    <input value={form.userRef} onChange={handleChange('userRef')} placeholder="User ObjectId…" required />
                </div>
                <div className="modal-field">
                    <label>Notification Type</label>
                    <select value={form.type} onChange={handleChange('type')}>
                        <option value="admin_broadcast">Admin Broadcast</option>
                        <option value="system_alert">System Alert</option>
                        <option value="info">Info</option>
                    </select>
                </div>
                <div className="modal-field">
                    <label>Title *</label>
                    <input value={form.title} onChange={handleChange('title')} placeholder="Notification title…" required />
                </div>
                <div className="modal-field">
                    <label>Body *</label>
                    <textarea value={form.body} onChange={handleChange('body')} placeholder="Notification message…" rows={4} required />
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8 }}>
                    <Send size={16} /> {loading ? 'Sending…' : 'Send Notification'}
                </button>
            </form>
        </div>
    );
};

export default Communications;
