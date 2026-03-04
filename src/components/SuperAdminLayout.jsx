import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardList, FolderKanban, MessageSquare, Mail, ScrollText,
    LogOut, Menu, X, ShieldCheck, Gauge
} from 'lucide-react';
import { authApi } from '../services/api';

const SuperAdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [rateLimit, setRateLimit] = useState({ remaining: null, limit: null });
    const navigate = useNavigate();

    const user = (() => {
        try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    })();

    useEffect(() => {
        const handler = (e) => setRateLimit(e.detail);
        window.addEventListener('ratelimit-update', handler);
        return () => window.removeEventListener('ratelimit-update', handler);
    }, []);

    const handleLogout = async () => {
        try { await authApi.logout(localStorage.getItem('refreshToken')); } catch (e) { /* ignore */ }
        localStorage.clear();
        navigate('/login');
    };

    const navItems = [
        { to: '/dashboard/applications', icon: ClipboardList, label: 'Applications' },
        { to: '/dashboard/projects', icon: FolderKanban, label: 'Projects' },
        { to: '/dashboard/chat', icon: MessageSquare, label: 'Chat' },
        { to: '/dashboard/communications', icon: Mail, label: 'Communications' },
        { to: '/dashboard/audit-logs', icon: ScrollText, label: 'Audit Logs' },
    ];

    return (
        <div className="sa-layout">
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`sa-sidebar ${sidebarOpen ? '' : 'collapsed'}`}
            >
                <div className="sa-sidebar-header">
                    <ShieldCheck size={28} className="sa-logo-icon" />
                    {sidebarOpen && (
                        <span className="sa-logo-text">
                            Super<span className="accent">Admin</span>
                        </span>
                    )}
                    <button className="sa-mobile-close" onClick={() => setSidebarOpen(false)}>
                        <X size={18} />
                    </button>
                </div>

                <nav className="sa-sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `sa-nav-link ${isActive ? 'active' : ''}`}
                        >
                            <item.icon size={20} />
                            {sidebarOpen && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="sa-sidebar-footer">
                    {rateLimit.remaining !== null && sidebarOpen && (
                        <div className="sa-rate-limit">
                            <Gauge size={14} />
                            <span>{rateLimit.remaining} / {rateLimit.limit || 300} requests remaining</span>
                        </div>
                    )}
                    <button className="sa-nav-link sa-logout-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </motion.aside>

            <main className="sa-main">
                <motion.header
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.05 }}
                    className="sa-topbar"
                >
                    <button className="sa-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <Menu size={22} />
                    </button>
                    <div className="sa-topbar-right">
                        <div className="sa-user-info">
                            <span className="sa-user-name">{user?.email || 'Super Admin'}</span>
                            <span className="sa-user-role">Platform Administrator</span>
                        </div>
                        <div className="sa-avatar">SA</div>
                    </div>
                </motion.header>

                <div className="sa-content">
                    <AnimatePresence mode="wait">
                        <Outlet />
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default SuperAdminLayout;
