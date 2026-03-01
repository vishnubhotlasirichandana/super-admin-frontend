import React, { useState, useEffect, useMemo } from 'react';
import { Chat, Channel, Window, ChannelHeader, MessageList, MessageInput, Thread, ChannelList, useCreateChatClient } from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import { motion } from 'framer-motion';
import { MessageSquare, Search, ShieldCheck } from 'lucide-react';

const apiKey = import.meta.env.VITE_STREAM_API_KEY || '';

const ChatInterface = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const streamToken = localStorage.getItem('streamToken');
    const userStr = localStorage.getItem('user');

    const user = useMemo(() => {
        if (!userStr) return null;
        try { return JSON.parse(userStr); } catch { return null; }
    }, [userStr]);

    const client = useCreateChatClient({
        apiKey,
        tokenOrProvider: streamToken || undefined,
        userData: user ? {
            id: user.id || 'unknown',
            name: user.email || 'Super Admin',
            role: 'admin',
            custom: { badge: 'Platform Admin' }
        } : { id: 'guest' },
    });

    const filters = useMemo(() => {
        const f = { type: 'messaging' };
        if (searchQuery.trim()) {
            f.name = { $autocomplete: searchQuery };
        }
        return f;
    }, [searchQuery]);

    const sort = useMemo(() => [{ last_message_at: -1 }], []);

    if (!streamToken || !apiKey) {
        return (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="module-page">
                <div className="module-header">
                    <div>
                        <h1>Chat Access</h1>
                        <p className="module-subtitle">Stream Chat credentials not configured</p>
                    </div>
                </div>
                <div className="empty-state">
                    <MessageSquare size={48} />
                    <p>Stream token not found. Please log in again.</p>
                </div>
            </motion.div>
        );
    }

    if (!client) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="module-page">
                <div className="empty-state"><p>Connecting to chat service…</p></div>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="module-page chat-module">
            <Chat client={client} theme="str-chat__theme-light">
                <div className="chat-layout">
                    <div className="chat-sidebar">
                        <div className="chat-sidebar-header">
                            <h3><ShieldCheck size={18} /> Channels</h3>
                            <div className="chat-search">
                                <Search size={14} />
                                <input placeholder="Search channels…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                        </div>
                        <ChannelList filters={filters} sort={sort} showChannelSearch={false} />
                    </div>
                    <div className="chat-main">
                        <Channel>
                            <Window>
                                <ChannelHeader />
                                <MessageList />
                                <MessageInput />
                            </Window>
                            <Thread />
                        </Channel>
                    </div>
                </div>
            </Chat>
        </motion.div>
    );
};

export default ChatInterface;
