"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    User,
    Mail,
    Lock,
    History,
    ShieldCheck,
    LogOut,
    Activity,
    CheckCircle2,
    XCircle,
    Fingerprint,
    Calendar,
    Globe,
    ArrowLeft
} from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ProfilePage() {
    const router = useRouter();
    const { user, updateUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
    const [loginHistory, setLoginHistory] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
        }
    }, [user]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`${apiUrl}/users/login-history`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await res.json();
                if (data.success) setLoginHistory(data.data);
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetchHistory();
    }, [apiUrl]);

    const handleUpdateDetails = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setUpdating(true);

        try {
            const res = await fetch(`${apiUrl}/auth/update-details`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name, email })
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Profile details updated successfully' });
                updateUser({ name, email });
            } else {
                setMessage({ type: 'error', text: data.error || 'Update failed' });
            }
        } catch (err) { setMessage({ type: 'error', text: 'Connection failed' }); }
        setUpdating(false);
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (passwords.next.length < 6) return setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
        if (passwords.next !== passwords.confirm) return setMessage({ type: 'error', text: 'New passwords do not match' });

        setUpdating(true);
        try {
            const res = await fetch(`${apiUrl}/auth/update-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    currentPassword: passwords.current,
                    newPassword: passwords.next
                })
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Password updated successfully' });
                setPasswords({ current: '', next: '', confirm: '' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Update failed' });
            }
        } catch (err) { setMessage({ type: 'error', text: 'Connection failed' }); }
        setUpdating(false);
    };

    return (
        <div className="p-6 max-w-6xl pt-20 mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white hover:scale-110 transition-all flex items-center justify-center p-0"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight">Personal Settings</h1>
                        <p className="text-white/40 text-sm mt-2 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#8ec6e1]" />
                            Manage your account identity and security preferences
                        </p>
                    </div>
                </div>
            </div>

            {message.text && (
                <div className={cn(
                    "p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-2",
                    message.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                )}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    <p className="font-bold">{message.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Information */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-[#002b3d]/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-[#8ec6e1]/20 flex items-center justify-center text-[#8ec6e1]">
                                <User className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white">Personal Information</h2>
                                <p className="text-white/40 text-sm">Update your public profile details</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateDetails} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-[#8ec6e1] uppercase tracking-widest flex items-center gap-2">
                                        <User className="w-3 h-3" /> Full Name
                                    </label>
                                    <Input
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl px-5 text-lg font-bold text-white focus:bg-white/10 transition-all"
                                        placeholder="Your Name"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-[#8ec6e1] uppercase tracking-widest flex items-center gap-2">
                                        <Mail className="w-3 h-3" /> Email Address
                                    </label>
                                    <Input
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        type="email"
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl px-5 text-lg font-bold text-white focus:bg-white/10 transition-all"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={updating}
                                    className="h-14 px-8 bg-white hover:bg-white/90 text-[#002b3d] font-black rounded-2xl shadow-xl transition-all active:scale-95"
                                >
                                    {updating ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-[#002b3d]/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                                <Lock className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white">Security & Password</h2>
                                <p className="text-white/40 text-sm">Keep your account secure with a strong password</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdatePassword} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                                    Current Password
                                </label>
                                <Input
                                    type="password"
                                    value={passwords.current}
                                    onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                    className="h-14 bg-white/5 border-white/10 rounded-2xl px-5 text-lg font-bold text-white focus:bg-white/10 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                                        New Password
                                    </label>
                                    <Input
                                        type="password"
                                        value={passwords.next}
                                        onChange={e => setPasswords({ ...passwords, next: e.target.value })}
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl px-5 text-lg font-bold text-white focus:bg-white/10 transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                                        Confirm Password
                                    </label>
                                    <Input
                                        type="password"
                                        value={passwords.confirm}
                                        onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl px-5 text-lg font-bold text-white focus:bg-white/10 transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={updating}
                                    className="h-14 px-8 bg-purple-500 hover:bg-purple-600 text-white font-black rounded-2xl shadow-xl shadow-purple-500/20 transition-all active:scale-95"
                                >
                                    {updating ? "Updating..." : "Update Password"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-8">
                    <div className="bg-gradient-to-br from-[#005477] to-[#002b3d] p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <ShieldCheck className="w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-6">
                                <Fingerprint className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Account Status</h3>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-black uppercase tracking-wider">
                                <CheckCircle2 className="w-3 h-3" /> Verified Account
                            </div>
                            <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white/40">Role</span>
                                    <span className="text-white font-bold">{user?.role}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white/40">Joined</span>
                                    <span className="text-white font-bold">{new Date(user?.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#002b3d]/30 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <History className="w-5 h-5 text-[#8ec6e1]" />
                            <h3 className="text-xl font-bold text-white">Recent Logins</h3>
                        </div>

                        <div className="space-y-4">
                            {loading ? (
                                <div className="animate-pulse space-y-4">
                                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl" />)}
                                </div>
                            ) : loginHistory.length === 0 ? (
                                <p className="text-white/20 text-center py-4 text-sm italic">No history available</p>
                            ) : (
                                loginHistory.map((log, i) => (
                                    <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2 text-xs font-black text-[#8ec6e1] uppercase tracking-tighter">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(log.timestamp).toLocaleDateString()}
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest",
                                                log.status === 'SUCCESS' ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                                            )}>
                                                {log.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-white/60 font-medium">
                                            <Globe className="w-3.5 h-3.5 opacity-40" />
                                            {log.ip || 'Local Device'}
                                        </div>
                                        <div className="text-[10px] text-white/30 mt-1">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
