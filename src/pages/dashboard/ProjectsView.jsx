import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, Search, Users, Clock, Building2, GraduationCap } from 'lucide-react';
import { projectApi } from '../../services/api';
import { useToast } from '../../components/Toast';

const STATUS_COLORS = {
    open: { bg: '#d1fae5', text: '#065f46', border: '#34d399' },
    completed: { bg: '#dbeafe', text: '#1e40af', border: '#60a5fa' },
    cancelled: { bg: '#fee2e2', text: '#991b1b', border: '#f87171' },
    filled: { bg: '#fef9c3', text: '#854d0e', border: '#facc15' },
};

const ProjectsView = () => {
    const toast = useToast();
    const [projects, setProjects] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            try {
                const res = await projectApi.adminListAll();
                setProjects(res.data.data || []);
                setFiltered(res.data.data || []);
            } catch (err) {
                toast.error('Failed to load projects');
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [toast]);

    useEffect(() => {
        if (!search.trim()) {
            setFiltered(projects);
        } else {
            const q = search.toLowerCase();
            setFiltered(projects.filter(p =>
                p.title?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q) ||
                p.postedByModel?.toLowerCase().includes(q)
            ));
        }
    }, [search, projects]);

    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="module-page">
            <div className="module-header">
                <div>
                    <h1>Global Project Oversight</h1>
                    <p className="module-subtitle">Monitor all platform projects across companies and universities</p>
                </div>
                <div className="header-badge">
                    <FolderKanban size={16} />
                    <span>{projects.length} Total Projects</span>
                </div>
            </div>

            <div className="app-toolbar" style={{ justifyContent: 'flex-end' }}>
                <div className="filter-input-wrap">
                    <Search size={16} />
                    <input placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="data-table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Project Title</th>
                            <th>Author Type</th>
                            <th>Status</th>
                            <th>Duration</th>
                            <th>Max Students</th>
                            <th>Filled / Available</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="table-empty">Loading projects…</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={6} className="table-empty">No projects found</td></tr>
                        ) : filtered.map((p) => {
                            const accepted = p.acceptedStudents?.length || 0;
                            const max = p.maxStudentsRequired || 0;
                            const available = Math.max(0, max - accepted);
                            const authorType = p.postedByModel === 'Company' ? 'Company' : 'University';
                            const sc = STATUS_COLORS[p.status] || { bg: '#f1f5f9', text: '#475569', border: '#94a3b8' };
                            return (
                                <tr key={p._id} className="table-row-hover">
                                    <td className="cell-bold">{p.title}</td>
                                    <td>
                                        <span className="author-badge">
                                            {authorType === 'Company' ? <Building2 size={14} /> : <GraduationCap size={14} />}
                                            {authorType}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, textTransform: 'capitalize' }}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td><Clock size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />{p.durationInWeeks}w</td>
                                    <td><Users size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />{max}</td>
                                    <td>
                                        <span className="slot-indicator">
                                            <span className="slot-filled">{accepted}</span>
                                            <span className="slot-sep">/</span>
                                            <span className="slot-available">{available} avail</span>
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default ProjectsView;
