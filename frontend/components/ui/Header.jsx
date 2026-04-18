"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
    ChevronDown,
    LogOut,
    User,
    Utensils,
    Clock,
    Calendar,
    Bell,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Header({
    onLogout,
    profileHref = "/profile",
    showProfile = true,
    showLogout = true,
    className,
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout: authLogout } = useAuth();
    const isAdminPage = pathname?.startsWith('/modules/admin');

    const [open, setOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const dropdownRef = useRef(null);
    const notifRef = useRef(null);
    const [notifications, setNotifications] = useState([]);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    // Fetch derived notifications (e.g. Low Stock)
    useEffect(() => {
        // Don't fetch on login page
        if (typeof window !== 'undefined' && window.location.pathname === '/login') {
            return;
        }
        
        if (!user || (user.role !== 'ADMIN' && user.role !== 'CHEF')) return;
        
        const fetchAlerts = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                
                const res = await fetch(`${apiUrl}/inventory/ingredients`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                // If unauthorized or user not found, clear token and skip
                if (res.status === 401 || res.status === 500) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    return;
                }
                
                const data = await res.json();
                
                if (data.success) {
                    const alerts = [];
                    const today = new Date();
                    const sevenDaysFromNow = new Date();
                    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

                    data.data.forEach(it => {
                        if (Number(it.quantity) <= Number(it.minLevel)) {
                            alerts.push({
                                id: `low_stock_${it._id}`,
                                title: "Low Stock Alert",
                                message: `${it.name} is low on stock (${it.quantity} ${it.unit} remaining).`,
                                type: "warning",
                                time: "Just now",
                                unread: true
                            });
                        }
                        
                        if (it.expiryDate) {
                            const expDate = new Date(it.expiryDate);
                            if (expDate <= sevenDaysFromNow && expDate >= today) {
                                alerts.push({
                                    id: `expiring_${it._id}`,
                                    title: "Expiring Soon",
                                    message: `${it.name} is expiring on ${expDate.toLocaleDateString()}.`,
                                    type: "danger",
                                    time: "Just now",
                                    unread: true
                                });
                            }
                        }
                    });
                    
                    setNotifications(alerts);
                }
            } catch (e) {
                // Silently fail - don't show errors on login page
                console.error("Failed to fetch alerts", e);
            }
        };

        fetchAlerts();
    }, [user, apiUrl]);

    // close dropdown on outside click / ESC
    useEffect(() => {
        const onClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
        };
        const onEsc = (e) => {
            if (e.key === "Escape") {
                setOpen(false);
                setNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", onClickOutside);
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onClickOutside);
            document.removeEventListener("keydown", onEsc);
        };
    }, []);

    const initials = (name) => {
        if (!name) return "U";
        const parts = name.trim().split(/\s+/);
        const first = parts[0]?.[0] ?? "U";
        const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
        return (first + last).toUpperCase();
    };

    const handleLogout = () => {
        setOpen(false);
        if (onLogout) {
            onLogout();
        } else {
            authLogout();
        }
    };

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    };

    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 h-18",
                "bg-[#0F0E28]/80 backdrop-blur-xl border-b border-white/5",
                className
            )}
        >
            <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between gap-8">
                {/* Left: Brand */}
                <Link
                    href={user?.role === 'ADMIN' ? '/modules/admin' : user?.role === 'CHEF' ? '/modules/chef' : '/'}
                    className="flex items-center gap-3 shrink-0 select-none"
                >
                    <Image
                        src="/OceanBreeze.png"
                        width={140}
                        height={40}
                        alt="OceanBreeze"
                        className="object-contain grayscale brightness-200"
                    />
                </Link>

                {/* Center: Navigation */}
                {!isAdminPage && (
                    <nav className="hidden lg:flex items-center gap-10">
                        <Link
                            href="/"
                            className={cn(
                                "text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 group transition-all",
                                pathname === "/" ? "text-white" : "text-slate-400 hover:text-white"
                            )}
                        >
                            <Utensils className="w-3.5 h-3.5 text-[#408c8c]" />
                            Menu
                        </Link>
                        <Link
                            href="/modules/customer-dashboard"
                            className={cn(
                                "text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 group transition-all",
                                pathname === "/modules/customer-dashboard" ? "text-white" : "text-slate-400 hover:text-white"
                            )}
                        >
                            <Clock className="w-3.5 h-3.5 text-[#408c8c]" />
                            Order Tracking
                        </Link>
                        {/* <Link 
                            href="#" 
                            className="text-slate-400 hover:text-white transition-all text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 group"
                        >
                            <Calendar className="w-3.5 h-3.5 text-[#408c8c]" />
                            Reservations
                        </Link> */}
                    </nav>
                )}

                {/* Right: Actions */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-2 md:gap-4">
                            
                            {/* Notification Bell */}
                            <div ref={notifRef} className="relative">
                                <Button
                                    variant="ghost"
                                    onClick={() => setNotifOpen(!notifOpen)}
                                    className="relative p-2 h-10 w-10 shrink-0 rounded-full hover:bg-white/5 transition-all outline-none"
                                >
                                    <Bell className="w-5 h-5 text-slate-300" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-[#0F0E28]"></span>
                                        </span>
                                    )}
                                </Button>

                                {notifOpen && (
                                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#161531] border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-[60] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-widest text-white">Notifications</h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                                    You have {unreadCount} unread
                                                </p>
                                            </div>
                                            {unreadCount > 0 && (
                                                <button 
                                                    onClick={markAllAsRead}
                                                    className="text-[10px] font-bold text-[#408c8c] hover:text-[#408c8c]/80 transition-colors uppercase tracking-widest"
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                                            {notifications.length === 0 ? (
                                                <div className="px-5 py-10 flex flex-col items-center justify-center text-center">
                                                    <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                                        <CheckCircle2 className="h-6 w-6 text-emerald-500/50" />
                                                    </div>
                                                    <p className="text-sm font-bold text-white">All caught up!</p>
                                                    <p className="text-xs text-slate-400 mt-1">No new alerts right now.</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col">
                                                    {notifications.map((notif) => (
                                                        <div 
                                                            key={notif.id}
                                                            onClick={() => markAsRead(notif.id)}
                                                            className={cn(
                                                                "px-5 py-4 border-b border-white/5 flex gap-4 cursor-pointer hover:bg-white/5 transition-colors relative",
                                                                notif.unread ? "bg-white/[0.02]" : "opacity-75"
                                                            )}
                                                        >
                                                            {notif.unread && (
                                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-r-full" />
                                                            )}
                                                            <div className={cn(
                                                                "h-10 w-10 shrink-0 rounded-full flex items-center justify-center border",
                                                                notif.type === "warning" ? "bg-orange-500/10 border-orange-500/20 text-orange-400" :
                                                                notif.type === "danger" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                                                                "bg-[#408c8c]/10 border-[#408c8c]/20 text-[#408c8c]"
                                                            )}>
                                                                <AlertCircle className="h-5 w-5" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                                    <p className={cn(
                                                                        "text-xs font-bold truncate",
                                                                        notif.unread ? "text-white" : "text-slate-300"
                                                                    )}>
                                                                        {notif.title}
                                                                    </p>
                                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
                                                                        {notif.time}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                                                    {notif.message}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="h-6 w-[1px] bg-white/10 hidden md:block mx-1"></div>

                            {/* Profile Dropdown */}
                            <div ref={dropdownRef} className="relative">
                                <Button
                                    variant="ghost"
                                    onClick={() => setOpen(!open)}
                                    className="flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-white/5 transition-all outline-none"
                                >
                                    <div className="h-8 w-8 rounded-full bg-[#408c8c] flex items-center justify-center text-white text-xs font-bold border border-white/10">
                                        {initials(user?.name)}
                                    </div>
                                    <div className="hidden md:flex flex-col items-start leading-tight">
                                        <span className="text-[11px] font-black uppercase tracking-widest text-white">
                                            {user?.name?.split(' ')[0] ?? "User"}
                                        </span>
                                    </div>
                                    <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", open && "rotate-180")} />
                                </Button>

                                {open && (
                                    <div className="absolute right-0 mt-2 w-56 bg-[#161531] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[60] py-2 backdrop-blur-xl">
                                        <div className="px-4 py-3 border-b border-white/5 mb-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#408c8c] mb-1">Signed in as</p>
                                            <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{user?.role}</p>
                                        </div>

                                        <button
                                            onClick={() => { setOpen(false); router.push('/profile'); }}
                                            className="w-full px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-3"
                                        >
                                            <User className="w-4 h-4 text-[#408c8c]" />
                                            My Profile
                                        </button>

                                        <div className="h-px bg-white/5 my-2" />

                                        <button
                                            onClick={handleLogout}
                                            className="w-full px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all flex items-center gap-3"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => router.push('/login')}
                                className="text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl px-6 h-11 font-black text-[11px] uppercase tracking-widest transition-all"
                            >
                                Sign In
                            </Button>
                            <Button
                                onClick={() => router.push('/register')}
                                className="bg-[#408c8c] hover:bg-[#408c8c]/90 text-white rounded-2xl px-7 h-11 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-[#408c8c]/20 transition-all active:scale-95"
                            >
                                Join Now
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
