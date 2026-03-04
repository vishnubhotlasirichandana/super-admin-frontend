import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Filter, ChevronLeft, ChevronRight, Eye, CheckCircle2, PauseCircle, XCircle,
    StickyNote, SendHorizonal, ArrowLeft, Building2, GraduationCap, Clock, Mail, Globe, X, AlertCircle, RefreshCw
} from 'lucide-react';
import { adminApi } from '../../services/api';
import { useToast } from '../../components/Toast';

const STATUS_COLORS = {
    pending: { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
    verified: { bg: '#d1fae5', text: '#065f46', border: '#34d399' },
    on_hold: { bg: '#fef9c3', text: '#854d0e', border: '#facc15' },
    rejected: { bg: '#fee2e2', text: '#991b1b', border: '#f87171' },
};

const StatusBadge = ({ status }) => {
    const c = STATUS_COLORS[status] || { bg: '#f1f5f9', text: '#475569', border: '#94a3b8' };
    return (
        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: c.bg, color: c.text, border: `1px solid ${c.border}`, textTransform: 'capitalize' }}>
            {status?.replace('_', ' ')}
        </span>
    );
};

/* ──────────────────────────────────────── */
/* MAIN COMPONENT                         */
/* ──────────────────────────────────────── */
const Applications = () => {
    const toast = useToast();
    const [type, setType] = useState('company');
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null); // detail view
    const [modal, setModal] = useState(null); // action modal

    const limit = 12;

    const fetchApps = useCallback(async () => {
        setLoading(true);
        try {
            const params = { type, page, limit, sort: '-createdAt' };
            if (status) params.status = status;
            if (search) params.q = search;
            const res = await adminApi.listApplications(params);
            setData(res.data.data || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load applications');
        } finally {
            setLoading(false);
        }
    }, [type, status, search, page, toast]);

    useEffect(() => { fetchApps(); }, [fetchApps]);

    const openDetail = async (id) => {
        try {
            const res = await adminApi.getApplication(id, type);
            setSelected(res.data.data);
        } catch (err) {
            toast.error('Failed to load application details');
        }
    };

    const totalPages = Math.ceil(total / limit);

    /* ── LIST VIEW ── */
    if (selected) {
        return <DetailView app={selected} type={type} onBack={() => { setSelected(null); fetchApps(); }} toast={toast} />;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="module-page">
            <style>{`
                @media (max-width: 640px) {
                    .action-grid { grid-template-columns: 1fr !important; }
                    .detail-fields { grid-template-columns: 1fr !important; }
                }
            `}</style>
            <div className="module-header">
                <div>
                    <h1>Application Management</h1>
                    <p className="module-subtitle">Review and manage company & university registrations</p>
                </div>
            </div>

            {/* Tabs + Filters */}
            <div className="app-toolbar">
                <div className="app-tabs">
                    <button className={`app-tab ${type === 'company' ? 'active' : ''}`} onClick={() => { setType('company'); setPage(1); setSelected(null); }}>
                        <Building2 size={16} /> Companies
                    </button>
                    <button className={`app-tab ${type === 'university' ? 'active' : ''}`} onClick={() => { setType('university'); setPage(1); setSelected(null); }}>
                        <GraduationCap size={16} /> Universities
                    </button>
                </div>
                <div className="app-filters">
                    <div className="filter-input-wrap">
                        <Search size={16} />
                        <input placeholder="Search name, email, country…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <div className="filter-select-wrap">
                        <Filter size={16} />
                        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="on_hold">On Hold</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="data-table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Country</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="table-empty">Loading…</td></tr>
                        ) : data.length === 0 ? (
                            <tr><td colSpan={6} className="table-empty">No applications found</td></tr>
                        ) : data.map((app) => (
                            <tr key={app._id} className="table-row-hover">
                                <td className="cell-bold">{app.officialName || app.name || '—'}</td>
                                <td>{app.companyEmail || app.representative?.email || '—'}</td>
                                <td>{app.country || '—'}</td>
                                <td><StatusBadge status={app.status} /></td>
                                <td className="cell-muted">{new Date(app.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button className="btn-icon" title="View Details" onClick={() => openDetail(app._id)}>
                                        <Eye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="pg-btn"><ChevronLeft size={16} /></button>
                    <span className="pg-info">Page {page} of {totalPages} ({total} total)</span>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="pg-btn"><ChevronRight size={16} /></button>
                </div>
            )}
        </motion.div>
    );
};

/* ──────────────────────────────────────── */
/* DETAIL VIEW                            */
/* ──────────────────────────────────────── */
const DetailView = ({ app, type, onBack, toast }) => {
    const [modal, setModal] = useState(null);

    const actions = [
        { key: 'approve', label: 'Approve', icon: CheckCircle2, color: '#059669', desc: 'Approve and activate user account' },
        { key: 'hold', label: 'Put On Hold', icon: PauseCircle, color: '#d97706', desc: 'Hold pending further review' },
        { key: 'reject', label: 'Reject', icon: XCircle, color: '#dc2626', desc: 'Reject this application' },
        { key: 'note', label: 'Add Note', icon: StickyNote, color: '#3b82f6', desc: 'Add an internal admin note' },
        { key: 'resend', label: 'Resend Email', icon: SendHorizonal, color: '#8b5cf6', desc: 'Resend a decision email' },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="module-page">
            <button className="btn-back" onClick={onBack}><ArrowLeft size={18} /> Back to List</button>

            <div className="detail-grid">
                {/* Left: Application Data */}
                <div className="detail-card">
                    <div className="detail-card-header">
                        <h2>{app.officialName || app.name || 'Application'}</h2>
                        <StatusBadge status={app.status} />
                    </div>

                    <div className="detail-fields">
                        {app.officialName && <Field label="Official Name" value={app.officialName} />}
                        {app.name && <Field label="Name" value={app.name} />}
                        {app.companyEmail && <Field label="Email" value={app.companyEmail} icon={<Mail size={14} />} />}
                        {app.representative?.email && <Field label="Rep. Email" value={app.representative.email} icon={<Mail size={14} />} />}
                        {app.representative?.name && <Field label="Rep. Name" value={app.representative.name} />}
                        {app.representative?.role && <Field label="Rep. Role" value={app.representative.role} />}
                        {app.country && <Field label="Country" value={app.country} icon={<Globe size={14} />} />}
                        {app.website && <Field label="Website" value={app.website} />}
                        {app.domain && <Field label="Domain" value={app.domain} />}
                        {app.companyNumber && <Field label="Company Number" value={app.companyNumber} />}
                        {app.industry && <Field label="Industry" value={app.industry} />}
                        {app.verificationMethod && <Field label="Verification" value={app.verificationMethod} />}
                        {app.createdAt && <Field label="Created" value={new Date(app.createdAt).toLocaleString()} icon={<Clock size={14} />} />}
                    </div>

                    {/* Actions */}
                    <div className="detail-actions">
                        <h3>Actions</h3>
                        <div className="action-grid">
                            {actions.map((a) => (
                                <button key={a.key} className="action-btn" style={{ '--action-color': a.color }} onClick={() => setModal(a.key)}>
                                    <a.icon size={18} />
                                    <div>
                                        <span className="action-label">{a.label}</span>
                                        <span className="action-desc">{a.desc}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Audit Trail */}
                <div className="detail-card audit-card">
                    <h3>Audit Trail</h3>
                    <div className="audit-list">
                        {(!app.recentLogs || app.recentLogs.length === 0) ? (
                            <p className="empty-text">No audit records yet.</p>
                        ) : app.recentLogs.map((log, i) => (
                            <div key={log._id || i} className="audit-entry">
                                <div className="audit-entry-top">
                                    <span className="audit-action">{log.actionType?.replace('_', ' ')}</span>
                                    <span className="audit-time">{new Date(log.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="audit-actor">{log.actorEmail} ({log.actorRole})</div>
                                {log.details && (
                                    <div className="audit-details">
                                        {log.details.reason && <span>Reason: {log.details.reason}</span>}
                                        {log.details.note && <span>Note: {log.details.note}</span>}
                                        {log.details.message && <span>Message: {log.details.message}</span>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Action Modals */}
            <AnimatePresence>
                {modal === 'approve' && <ApproveModal app={app} type={type} onClose={() => setModal(null)} toast={toast} onDone={onBack} />}
                {modal === 'hold' && <HoldModal app={app} type={type} onClose={() => setModal(null)} toast={toast} onDone={onBack} />}
                {modal === 'reject' && <RejectModal app={app} type={type} onClose={() => setModal(null)} toast={toast} onDone={onBack} />}
                {modal === 'note' && <NoteModal app={app} type={type} onClose={() => setModal(null)} toast={toast} onDone={onBack} />}
                {modal === 'resend' && <ResendModal app={app} type={type} onClose={() => setModal(null)} toast={toast} />}
            </AnimatePresence>
        </motion.div>
    );
};

const Field = ({ label, value, icon }) => (
    <div className="detail-field">
        <span className="field-label">{icon}{label}</span>
        <span className="field-value">{value}</span>
    </div>
);

/* ──────────────────────────────────────── */
/* ACTION MODALS                          */
/* ──────────────────────────────────────── */
const ModalShell = ({ title, onClose, children, danger }) => (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="modal-box" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()}>
            <div className={`modal-header ${danger ? 'modal-header-danger' : ''}`}>
                <h3>{title}</h3>
                <button className="modal-close" onClick={onClose}><X size={18} /></button>
            </div>
            {children}
        </motion.div>
    </motion.div>
);

const ApproveModal = ({ app, type, onClose, toast, onDone }) => {
    const [message, setMessage] = useState('');
    const [url, setUrl] = useState('');
    const [notify, setNotify] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await adminApi.approve(app._id, { type, message, onboardingUrl: url, notify });
            toast.success('Application approved successfully');
            onClose();
            onDone();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to approve');
        } finally { setLoading(false); }
    };

    return (
        <ModalShell title="Approve Application" onClose={onClose}>
            <div className="modal-body">
                <p className="modal-info">Approving will activate the associated user account and enable login.</p>
                <div className="modal-field">
                    <label>Message (optional)</label>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Welcome message…" rows={3} />
                </div>
                <div className="modal-field">
                    <label>Onboarding URL (optional)</label>
                    <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
                </div>
                <label className="modal-check">
                    <input type="checkbox" checked={notify} onChange={() => setNotify(!notify)} />
                    <span>Send notification email</span>
                </label>
            </div>
            <div className="modal-footer">
                <button className="btn-cancel" onClick={onClose}>Cancel</button>
                <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Approving…' : 'Approve'}
                </button>
            </div>
        </ModalShell>
    );
};

const HoldModal = ({ app, type, onClose, toast, onDone }) => {
    const [reason, setReason] = useState('');
    const [expected, setExpected] = useState('');
    const [notify, setNotify] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) { toast.warning('Reason is required'); return; }
        if (reason.length > 2000) { toast.warning('Reason must be under 2000 characters'); return; }
        setLoading(true);
        try {
            await adminApi.hold(app._id, { type, reason, expectedAction: expected, notify });
            toast.success('Application placed on hold');
            onClose();
            onDone();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setLoading(false); }
    };

    return (
        <ModalShell title="Put On Hold" onClose={onClose}>
            <div className="modal-body">
                <div className="modal-field">
                    <label>Reason *</label>
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for hold…" rows={3} maxLength={2000} />
                    <span className="char-count">{reason.length} / 2000</span>
                </div>
                <div className="modal-field">
                    <label>Expected Action (optional)</label>
                    <input value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="What the applicant should do…" />
                </div>
                <label className="modal-check">
                    <input type="checkbox" checked={notify} onChange={() => setNotify(!notify)} />
                    <span>Send notification email</span>
                </label>
            </div>
            <div className="modal-footer">
                <button className="btn-cancel" onClick={onClose}>Cancel</button>
                <button className="btn-warning" onClick={handleSubmit} disabled={loading}>{loading ? 'Saving…' : 'Put On Hold'}</button>
            </div>
        </ModalShell>
    );
};

const RejectModal = ({ app, type, onClose, toast, onDone }) => {
    const [reason, setReason] = useState('');
    const [notify, setNotify] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) { toast.warning('Reason is required'); return; }
        if (reason.length > 2000) { toast.warning('Reason must be under 2000 characters'); return; }
        setLoading(true);
        try {
            await adminApi.reject(app._id, { type, reason, notify });
            toast.success('Application rejected');
            onClose();
            onDone();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setLoading(false); }
    };

    return (
        <ModalShell title="Reject Application" onClose={onClose} danger>
            <div className="modal-body">
                <div className="modal-warn"><AlertCircle size={16} /> This is a destructive action and cannot be easily undone.</div>
                <div className="modal-field">
                    <label>Reason *</label>
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection…" rows={3} maxLength={2000} />
                    <span className="char-count">{reason.length} / 2000</span>
                </div>
                <label className="modal-check">
                    <input type="checkbox" checked={notify} onChange={() => setNotify(!notify)} />
                    <span>Send rejection email</span>
                </label>
            </div>
            <div className="modal-footer">
                <button className="btn-cancel" onClick={onClose}>Cancel</button>
                <button className="btn-danger" onClick={handleSubmit} disabled={loading}>{loading ? 'Rejecting…' : 'Reject Application'}</button>
            </div>
        </ModalShell>
    );
};

const NoteModal = ({ app, type, onClose, toast, onDone }) => {
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!note.trim()) { toast.warning('Note is required'); return; }
        setLoading(true);
        try {
            await adminApi.addNote(app._id, { type, note });
            toast.success('Note added');
            onClose();
            onDone();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setLoading(false); }
    };

    return (
        <ModalShell title="Add Internal Note" onClose={onClose}>
            <div className="modal-body">
                <div className="modal-field">
                    <label>Note</label>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write your internal note…" rows={4} />
                </div>
            </div>
            <div className="modal-footer">
                <button className="btn-cancel" onClick={onClose}>Cancel</button>
                <button className="btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Saving…' : 'Add Note'}</button>
            </div>
        </ModalShell>
    );
};

const ResendModal = ({ app, type, onClose, toast }) => {
    const [actionType, setActionType] = useState('approve');
    const [reason, setReason] = useState('');
    const [force, setForce] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await adminApi.resendDecision(app._id, { type, actionType, reason, force });
            toast.success('Decision email resent');
            onClose();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to resend'); }
        finally { setLoading(false); }
    };

    return (
        <ModalShell title="Resend Decision Email" onClose={onClose}>
            <div className="modal-body">
                <div className="modal-field">
                    <label>Decision Type</label>
                    <select value={actionType} onChange={(e) => setActionType(e.target.value)}>
                        <option value="approve">Approve</option>
                        <option value="hold">Hold</option>
                        <option value="reject">Reject</option>
                    </select>
                </div>
                {(actionType === 'hold' || actionType === 'reject') && (
                    <div className="modal-field">
                        <label>Reason</label>
                        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Reason to include in email…" />
                    </div>
                )}
                <label className="modal-check">
                    <input type="checkbox" checked={force} onChange={() => setForce(!force)} />
                    <span>Force resend (bypass idempotency)</span>
                </label>
            </div>
            <div className="modal-footer">
                <button className="btn-cancel" onClick={onClose}>Cancel</button>
                <button className="btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Sending…' : 'Resend Email'}</button>
            </div>
        </ModalShell>
    );
};

export default Applications;