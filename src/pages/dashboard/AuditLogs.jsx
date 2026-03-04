import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ScrollText, Search, Filter, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
    Calendar, User, Activity
} from 'lucide-react';
import { auditApi } from '../../services/api';
import { useToast } from '../../components/Toast';

const AuditLogs = () => {
    const toast = useToast();
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [filters, setFilters] = useState({
        actorEmail: '', actionType: '', targetType: '', dateFrom: '', dateTo: ''
    });
    const limit = 20;

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit };
            if (filters.actorEmail) params.actorEmail = filters.actorEmail;
            if (filters.actionType) params.actionType = filters.actionType;
            if (filters.targetType) params.targetType = filters.targetType;
            if (filters.dateFrom) params.dateFrom = filters.dateFrom;
            if (filters.dateTo) params.dateTo = filters.dateTo;
            const res = await auditApi.listLogs(params);
            setData(res.data.data || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            toast.error('Failed to load audit logs');
        } finally { setLoading(false); }
    }, [page, filters, toast]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const handleFilterChange = (field) => (e) => {
        setFilters(prev => ({ ...prev, [field]: e.target.value }));
        setPage(1);
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="module-page">
            <div className="module-header">
                <div>
                    <h1>System Audit Logs</h1>
                    <p className="module-subtitle">Compliance tracking for all administrative actions</p>
                </div>
                <div className="header-badge">
                    <ScrollText size={16} />
                    <span>{total} Records</span>
                </div>
            </div>

            {/* Filters */}
            <div className="audit-filters">
                <div className="filter-input-wrap">
                    <User size={16} />
                    <input placeholder="Actor Email" value={filters.actorEmail} onChange={handleFilterChange('actorEmail')} />
                </div>
                <div className="filter-input-wrap">
                    <Activity size={16} />
                    <input placeholder="Action Type" value={filters.actionType} onChange={handleFilterChange('actionType')} />
                </div>
                <div className="filter-select-wrap">
                    <Filter size={16} />
                    <select value={filters.targetType} onChange={handleFilterChange('targetType')}>
                        <option value="">All Targets</option>
                        <option value="company">Company</option>
                        <option value="university">University</option>
                        <option value="system">System</option>
                    </select>
                </div>
                <div className="filter-input-wrap">
                    <Calendar size={16} />
                    <input type="date" value={filters.dateFrom} onChange={handleFilterChange('dateFrom')} title="From Date" />
                </div>
                <div className="filter-input-wrap">
                    <Calendar size={16} />
                    <input type="date" value={filters.dateTo} onChange={handleFilterChange('dateTo')} title="To Date" />
                </div>
            </div>

            {/* Table */}
            <div className="data-table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: 30 }}></th>
                            <th>Timestamp</th>
                            <th>Actor Email</th>
                            <th>Actor Role</th>
                            <th>Action Type</th>
                            <th>Target Type</th>
                            <th>Target ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="table-empty">Loading…</td></tr>
                        ) : data.length === 0 ? (
                            <tr><td colSpan={7} className="table-empty">No audit logs found</td></tr>
                        ) : data.map((log) => (
                            <React.Fragment key={log._id}>
                                <tr className="table-row-hover" onClick={() => setExpanded(expanded === log._id ? null : log._id)} style={{ cursor: 'pointer' }}>
                                    <td>
                                        {expanded === log._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </td>
                                    <td className="cell-muted">{new Date(log.createdAt).toLocaleString()}</td>
                                    <td className="cell-bold">{log.actorEmail}</td>
                                    <td><span className="role-badge">{log.actorRole}</span></td>
                                    <td><span className="action-type-badge">{log.actionType}</span></td>
                                    <td style={{ textTransform: 'capitalize' }}>{log.targetType}</td>
                                    <td className="cell-mono">{log.targetId}</td>
                                </tr>
                                <AnimatePresence>
                                    {expanded === log._id && (
                                        <motion.tr
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="expanded-row"
                                        >
                                            <td colSpan={7}>
                                                <div className="expanded-content">
                                                    <div className="expanded-section">
                                                        <h4>Details Payload</h4>
                                                        <pre className="json-block">{JSON.stringify(log.details, null, 2) || 'null'}</pre>
                                                    </div>
                                                    <div className="expanded-meta">
                                                        {log.ip && <span><strong>IP:</strong> {log.ip}</span>}
                                                        {log.userAgent && <span><strong>User-Agent:</strong> {log.userAgent}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )}
                                </AnimatePresence>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

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

export default AuditLogs;
