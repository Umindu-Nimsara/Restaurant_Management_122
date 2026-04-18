"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/lib/authContext';
import {
    FileDown,
    Plus,
    Shield,
    User,
    Mail,
    Lock,
    Activity,
    Fingerprint,
    AlertCircle,
    UserCircle2,
    CheckCircle2,
    XCircle,
    Trash2,
    KeyRound
} from 'lucide-react';
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminUserManagement() {
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('users'); // 'users' or 'logs'
    const [showForm, setShowForm] = useState(false);
    const [pinModal, setPinModal] = useState({ open: false, userId: null, pin: '' });
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'WAITER' });
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${apiUrl}/users`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (data.success) setUsers(data.data);
        } catch (err) { console.error(err); }
    };

    const fetchLogs = async () => {
        try {
            const res = await fetch(`${apiUrl}/users/audit-logs`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (data.success) setAuditLogs(data.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (view === 'users') fetchUsers();
        else fetchLogs();
    }, [view]);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (formData.password.length < 6) return alert('Password must be at least 6 characters');

        try {
            const res = await fetch(`${apiUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                setShowForm(false);
                setFormData({ name: '', email: '', password: '', role: 'WAITER' });
                fetchUsers();
            } else {
                alert(data.error);
            }
        } catch (err) { console.error(err); }
    };

    const handleAction = async (userId, action) => {
        try {
            const res = await fetch(`${apiUrl}/users/${userId}/${action}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (data.success) {
                fetchUsers();
            } else {
                alert(data.error);
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            const res = await fetch(`${apiUrl}/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (data.success) {
                fetchUsers();
            } else {
                alert(data.error);
            }
        } catch (err) { console.error(err); }
    };

    const handleSetPin = async (e) => {
        e.preventDefault();
        if (pinModal.pin.length !== 4 || !/^\d{4}$/.test(pinModal.pin)) {
            return alert('PIN must be exactly 4 digits');
        }

        try {
            const res = await fetch(`${apiUrl}/users/${pinModal.userId}/pin`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` 
                },
                body: JSON.stringify({ pin: pinModal.pin })
            });
            const data = await res.json();
            if (data.success) {
                setPinModal({ open: false, userId: null, pin: '' });
                alert('PIN successfully updated');
            } else {
                alert(data.error);
            }
        } catch (err) { console.error(err); }
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        const title = view === 'users' ? "User Management Report" : "Security Audit Trail Report";

        doc.setFontSize(20);
        doc.setTextColor(0, 84, 119);
        doc.text(`OceanBreeze - ${title}`, 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        if (view === 'users') {
            const tableColumn = ["Name", "Email", "Role", "Status"];
            const tableRows = users.map(u => [
                u.name,
                u.email,
                u.role,
                u.isActive ? "Active" : "Deactivated"
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 40,
                theme: 'grid',
                headStyles: { fillColor: [0, 84, 119] }
            });
        } else {
            const tableColumn = ["Action", "Resource", "User", "Role", "Date"];
            const tableRows = auditLogs.map(log => [
                log.action,
                log.resource,
                log.user?.name || "-",
                log.user?.role || "-",
                new Date(log.createdAt).toLocaleString()
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 45,
                theme: 'grid',
                headStyles: { fillColor: [0, 84, 119], textColor: [255, 255, 255] },
                alternateRowStyles: { fillColor: [240, 247, 247] },
                margin: { top: 45 }
            });
        }

        doc.save(`OceanBreeze_${view === 'users' ? 'Users' : 'AuditTrail'}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="p-6 max-w-6xl pt-20 mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white dark:text-white">User Management</h1>
                    <p className="text-gray-400 text-sm mt-1">Manage staff accounts and monitor security logs</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={exportToPDF}
                        disabled={(view === 'users' && users.length === 0) || (view === 'logs' && auditLogs.length === 0)}
                        className="bg-white hover:bg-gray-100 flex items-center gap-2 border-[#408c8c] text-[#408c8c] h-10 px-4 rounded-xl font-bold transition-all hover:scale-110"
                    >
                        <FileDown className="h-4 w-4" />
                        Export PDF
                    </Button>
                    <Button onClick={() => setShowForm(true)} className="bg-[#005477] hover:bg-[#005477]/90 text-white h-10 px-4 rounded-xl font-bold shadow-lg shadow-[#005477]/20 transition-all hover:scale-110">
                        <Plus className="h-4 w-4 mr-2" /> Add User
                    </Button>
                    <div className="flex space-x-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                            onClick={() => setView('users')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'users' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
                        >
                            Users
                        </button>
                        <button
                            onClick={() => setView('logs')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'logs' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
                        >
                            Audit Trail
                        </button>
                    </div>
                </div>
            </div>

            {pinModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F0E28]/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#002b3d] p-8 rounded-[2rem] border border-white/10 shadow-3xl w-full max-w-sm animate-in zoom-in-95">
                        <div className="flex items-center gap-3 mb-6 relative">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                                <KeyRound className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black text-white">Set Staff PIN</h2>
                            <button onClick={() => setPinModal({ open: false, userId: null, pin: '' })} className="absolute -top-2 -right-2 p-2 text-white/40 hover:text-white transition-colors">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSetPin} className="space-y-6">
                            <div>
                                <label className="text-xs font-black text-[#8ec6e1] uppercase tracking-widest block mb-2 text-center">Enter 4-Digit Access Code</label>
                                <Input
                                    type="password"
                                    maxLength={4}
                                    placeholder="••••"
                                    className="h-16 text-center text-3xl tracking-[0.5em] bg-white/10 border-white/20 rounded-2xl text-white focus:bg-white/20 font-bold"
                                    value={pinModal.pin}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setPinModal({ ...pinModal, pin: val });
                                    }}
                                />
                            </div>
                            <Button type="submit" className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black uppercase tracking-[0.2em] text-sm rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all">
                                Save PIN
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {showForm && (
                <div className="mb-8 bg-[#002b3d]/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                            <Plus className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-black text-white">Create Staff Account</h2>
                    </div>

                    <form onSubmit={handleCreateUser} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-[#8ec6e1] uppercase tracking-widest flex items-center gap-2">
                                    <User className="w-3 h-3" /> Full Name
                                </label>
                                <Input
                                    placeholder="Enter full name"
                                    className="h-14 bg-white/10 border-white/20 rounded-2xl px-5 text-lg font-bold text-white placeholder:text-white/30 focus:bg-white/20 transition-all"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-[#8ec6e1] uppercase tracking-widest flex items-center gap-2">
                                    <Mail className="w-3 h-3" /> Email Address
                                </label>
                                <Input
                                    placeholder="email@example.com"
                                    type="email"
                                    className="h-14 bg-white/10 border-white/20 rounded-2xl px-5 text-lg font-bold text-white placeholder:text-white/30 focus:bg-white/20 transition-all"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-[#8ec6e1] uppercase tracking-widest flex items-center gap-2">
                                    <Lock className="w-3 h-3" /> Password
                                </label>
                                <Input
                                    placeholder="••••••••"
                                    type="password"
                                    className="h-14 bg-white/10 border-white/20 rounded-2xl px-5 text-lg font-bold text-white placeholder:text-white/30 focus:bg-white/20 transition-all"
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-end gap-6">
                            <div className="flex-1 space-y-3 min-w-[200px]">
                                <label className="text-xs font-black text-[#8ec6e1] uppercase tracking-widest flex items-center gap-2">
                                    <Shield className="w-3 h-3" /> Access Role
                                </label>
                                <Select
                                    value={formData.role}
                                    onValueChange={val => setFormData({ ...formData, role: val })}
                                >
                                    <SelectTrigger className="h-14 bg-white/10 border-white/20 rounded-2xl px-5 text-lg font-bold text-white focus:ring-0">
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#002b3d] border-white/10 text-white rounded-2xl">
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                        <SelectItem value="CHEF">Chef</SelectItem>
                                        <SelectItem value="WAITER">Waiter</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setShowForm(false)}
                                    className="h-14 px-8 text-white/60 hover:text-white hover:bg-white/10 rounded-2xl font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="h-14 px-12 bg-white hover:bg-white/90 text-[#005477] font-black text-lg rounded-2xl shadow-xl shadow-black/20 transition-all active:scale-95"
                                >
                                    Create User
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {view === 'users' ? (
                <div className="bg-[#002b3d]/30 backdrop-blur-md rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="px-8 py-6 text-xs font-black text-[#8ec6e1] uppercase tracking-widest">User Details</th>
                                <th className="px-8 py-6 text-xs font-black text-[#8ec6e1] uppercase tracking-widest">Access Role</th>
                                <th className="px-8 py-6 text-xs font-black text-[#8ec6e1] uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-xs font-black text-[#8ec6e1] uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map(u => (
                                <tr key={u._id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-[#8ec6e1]/10 flex items-center justify-center text-[#8ec6e1] font-black transform transition-transform group-hover:scale-110">
                                                {u.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-white">{u.name}</div>
                                                <div className="text-sm text-white/40">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase",
                                            u.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                u.role === 'CHEF' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                        )}>
                                            <Shield className="w-3 h-3" />
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={cn(
                                            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase",
                                            u.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                        )}>
                                            {u.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                            {u.isActive ? 'Active' : 'Offline'}
                                            {u.lockedUntil && new Date(u.lockedUntil) > new Date() && (
                                                <span className="ml-1 text-[10px] opacity-70">(Locked)</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right space-x-3">
                                        {u.lockedUntil && new Date(u.lockedUntil) > new Date() && (
                                            <Button
                                                onClick={() => handleAction(u._id, 'unlock')}
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 font-bold"
                                            >
                                                Unlock
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => setPinModal({ open: true, userId: u._id, pin: '' })}
                                            variant="ghost"
                                            size="sm"
                                            className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 font-bold"
                                        >
                                            <KeyRound className="w-4 h-4 mr-1.5" /> PIN
                                        </Button>
                                        <Button
                                            onClick={() => handleAction(u._id, u.isActive ? 'deactivate' : 'activate')}
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "font-bold transition-all",
                                                u.isActive ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-400/10' : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10'
                                            )}
                                        >
                                            {u.isActive ? 'Deactivate' : 'Activate'}
                                        </Button>
                                        <Button
                                            onClick={() => handleDeleteUser(u._id)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 font-bold transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid gap-4">
                    {auditLogs.map(log => (
                        <div key={log._id} className="bg-[#002b3d]/30 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 shadow-xl flex justify-between items-center group hover:bg-white/5 transition-all">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#8ec6e1] transition-colors">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <div className="text-lg font-bold text-white flex items-center gap-2">
                                        {log.action}
                                        <span className="text-white/30 font-medium text-sm">on</span>
                                        <span className="px-3 py-0.5 bg-white/5 rounded-lg text-[#8ec6e1] text-sm">
                                            {log.resource}
                                        </span>
                                    </div>
                                    <div className="text-sm text-white/40 flex items-center gap-3">
                                        <span className="flex items-center gap-1.5 font-medium">
                                            <UserCircle2 className="w-3.5 h-3.5" /> {log.user?.name}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-white/20" />
                                        <span className="flex items-center gap-1.5 italic">
                                            <Fingerprint className="w-3.5 h-3.5" /> {log.ip}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-sm font-black text-[#8ec6e1]/40 tracking-widest uppercase">
                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                <div className="text-[10px] font-medium opacity-50 text-right mt-1">
                                    {new Date(log.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
