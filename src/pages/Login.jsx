import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { authApi } from '../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await authApi.login({ email, password });
            const { tokens, user } = res.data;

            if (user.role !== 'super_admin') {
                setError('Access denied. This dashboard is for Super Admins only.');
                setLoading(false);
                return;
            }

            localStorage.setItem('accessToken', tokens.accessToken);
            localStorage.setItem('refreshToken', tokens.refreshToken);
            localStorage.setItem('streamToken', tokens.streamToken || '');
            localStorage.setItem('userRole', user.role);
            localStorage.setItem('user', JSON.stringify(user));

            navigate('/dashboard/applications');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-bg-pattern" />
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                className="login-card"
            >
                <div className="login-header">
                    <motion.div
                        className="login-icon"
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <ShieldCheck size={32} />
                    </motion.div>
                    <h1>Super Admin</h1>
                    <p>Platform Management Dashboard</p>
                </div>

                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="login-error">
                        <AlertCircle size={16} />
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="form-field">
                        <label htmlFor="login-email">Email Address</label>
                        <div className="field-input-wrap">
                            <Mail size={18} />
                            <input id="login-email" type="email" placeholder="admin@platform.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
                        </div>
                    </div>
                    <div className="form-field">
                        <label htmlFor="login-password">Password</label>
                        <div className="field-input-wrap">
                            <Lock size={18} />
                            <input id="login-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                    </div>
                    <motion.button type="submit" className="login-btn" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        {loading ? 'Authenticating...' : <><span>Sign In</span> <ArrowRight size={18} /></>}
                    </motion.button>
                </form>

                <div className="login-footer-text">
                    <ShieldCheck size={14} />
                    <span>Secured access · Super Admin only</span>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
