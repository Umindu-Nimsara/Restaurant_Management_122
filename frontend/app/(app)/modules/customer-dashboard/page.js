"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
    Clock, 
    CheckCircle2, 
    Timer, 
    Utensils, 
    LayoutDashboard, 
    RefreshCcw, 
    ReceiptText, 
    FileDown, 
    ChevronRight,
    ChefHat,
    CircleDot
} from "lucide-react";
import { orderService } from "@/lib/orderService";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { generateInvoicePDF } from "@/lib/invoiceHelper";
import { useAuth } from "@/lib/authContext";

const STATUS_STEPS = [
    { id: "PENDING", label: "Validated", icon: Timer, color: "text-orange-400" },
    { id: "COOKING", label: "In Kitchen", icon: ChefHat, color: "text-blue-400" },
    { id: "SERVED", label: "Served", icon: Utensils, color: "text-purple-400" },
    { id: "PAID", label: "Settle", icon: CheckCircle2, color: "text-green-400" },
];

export default function CustomerDashboard() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLive, setIsLive] = useState(true);

    const fetchOrders = async () => {
        try {
            const data = await orderService.fetchMyOrders();
            setOrders(data || []);
        } catch (err) {
            console.error("Failed to fetch customer orders:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        let interval;
        if (isLive) {
            interval = setInterval(fetchOrders, 15000); // refresh every 15s
        }
        return () => clearInterval(interval);
    }, [isLive]);

    const activeOrders = useMemo(() => 
        orders.filter(o => ["PENDING", "COOKING", "SERVED"].includes(o.status)), 
    [orders]);

    const pastOrders = useMemo(() => 
        orders.filter(o => ["PAID", "CANCELLED"].includes(o.status)), 
    [orders]);

    const getStatusIndex = (status) => {
        return STATUS_STEPS.findIndex(s => s.id === status);
    };

    if (loading && orders.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen bg-[#0F0E28]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#408c8c]"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Retrieving your orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 pt-24 bg-[#0F0E28] min-h-screen flex flex-col">
            <div className="max-w-6xl mx-auto w-full space-y-12">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="h-16 w-16 rounded-[2rem] bg-[#408c8c]/20 flex items-center justify-center border border-white/10 shadow-2xl">
                            <Clock className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">Order <span className="text-slate-500 not-italic">Tracking</span></h1>
                            <p className="text-slate-400 text-sm font-bold flex items-center gap-2 mt-1">
                                <ReceiptText className="h-4 w-4 text-[#408c8c]" />
                                Follow your culinary journey in real-time
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                        <button
                            onClick={() => setIsLive(!isLive)}
                            className={cn(
                                "h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3",
                                isLive ? "bg-green-500/20 text-green-400 border border-green-400/30" : "bg-white/5 text-slate-500 border border-white/10"
                            )}
                        >
                            <div className={cn("h-2 w-2 rounded-full", isLive ? "bg-green-400 animate-pulse" : "bg-slate-700")} />
                            {isLive ? "Live Sync" : "Refresh Off"}
                        </button>
                        <button
                            onClick={fetchOrders}
                            className="h-12 w-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all active:scale-95"
                        >
                            <RefreshCcw className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Active Orders Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <CircleDot className="h-4 w-4 text-[#408c8c] animate-pulse" />
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Active Culinary Orders</h2>
                    </div>

                    {activeOrders.length === 0 ? (
                        <div className="py-24 text-center bg-white/5 rounded-[3rem] border border-white/5 border-dashed">
                            <Utensils className="h-16 w-16 text-slate-700 mx-auto mb-6 opacity-20" />
                            <h3 className="text-xl font-black text-white mb-2 uppercase italic tracking-tighter">No active orders</h3>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest px-10">Visit our menu to explore your next culinary selection</p>
                            <Button 
                                onClick={() => window.location.href = "/"}
                                className="mt-8 bg-[#408c8c] hover:bg-[#408c8c]/90 text-white rounded-2xl px-10 h-12 font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-[#408c8c]/20"
                            >
                                Browse Menu
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-8">
                            {activeOrders.map((order) => {
                                const activeIdx = getStatusIndex(order.status);
                                return (
                                    <div key={order._id} className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                                        <div className="p-8 md:p-12">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="px-4 py-1.5 bg-[#408c8c]/20 text-[#408c8c] text-[10px] font-black uppercase tracking-widest rounded-full border border-[#408c8c]/30">
                                                            Order #{order.orderNo}
                                                        </span>
                                                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                                            {new Date(order.createdAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">Table #{order.tableId?.tableNumber || "N/A"}</h3>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Current Estimations</p>
                                                    <p className="text-2xl font-black text-[#408c8c]">LKR {Number(order.total).toLocaleString()}</p>
                                                </div>
                                            </div>

                                            {/* Progress Tracker */}
                                            <div className="relative mb-12 px-4">
                                                <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/5 -translate-y-1/2" />
                                                <div 
                                                    className="absolute top-1/2 left-0 h-1 bg-[#408c8c] -translate-y-1/2 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(64,140,140,0.5)]" 
                                                    style={{ width: `${(activeIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
                                                />
                                                
                                                <div className="relative flex justify-between items-center">
                                                    {STATUS_STEPS.map((step, idx) => {
                                                        const isPast = idx < activeIdx;
                                                        const isCurrent = idx === activeIdx;
                                                        const IconComp = step.icon;
                                                        
                                                        return (
                                                            <div key={step.id} className="flex flex-col items-center group">
                                                                <div className={cn(
                                                                    "h-14 w-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 z-10",
                                                                    isPast ? "bg-[#408c8c] border-[#408c8c] shadow-lg shadow-[#408c8c]/30" :
                                                                    isCurrent ? "bg-[#0F0E28] border-[#408c8c] shadow-2xl shadow-[#408c8c]/40 scale-125 bg-gradient-to-br from-[#408c8c]/20 to-transparent" :
                                                                    "bg-[#0F0E28] border-white/10 grayscale opacity-40 group-hover:opacity-80 group-hover:grayscale-0"
                                                                )}>
                                                                    <IconComp className={cn(
                                                                        "h-6 w-6 transition-colors duration-500",
                                                                        isPast || isCurrent ? "text-white" : "text-slate-500"
                                                                    )} />
                                                                </div>
                                                                <span className={cn(
                                                                    "mt-4 text-[10px] font-black uppercase tracking-[.2em] transition-colors duration-500",
                                                                    isCurrent ? "text-white" : "text-slate-500"
                                                                )}>
                                                                    {step.label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Items List */}
                                            <div className="bg-black/20 rounded-[2.5rem] p-8 md:p-10 border border-white/5">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-4">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-6">Culinary Selection</p>
                                                        {order.items.map((item, i) => (
                                                            <div key={i} className="flex justify-between items-center group/item">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center text-xs font-black text-[#408c8c] border border-white/5 group-hover/item:border-[#408c8c]/40 transition-all">
                                                                        {item.qty}
                                                                    </div>
                                                                    <span className="text-sm font-bold text-slate-300 uppercase tracking-tight">{item.name}</span>
                                                                </div>
                                                                <span className="text-[10px] font-bold text-slate-600 uppercase">LKR {(item.price * item.qty).toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex flex-col justify-end items-end gap-4">
                                                        <Button
                                                            onClick={() => generateInvoicePDF(order)}
                                                            variant="outline"
                                                            className="bg-white/5 border-white/10 hover:bg-[#408c8c] hover:text-white transition-all rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[11px] gap-3"
                                                        >
                                                            <FileDown className="h-5 w-5" />
                                                            Download Invoice
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* History Section */}
                <div className="pt-8 space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <LayoutDashboard className="h-4 w-4 text-slate-600" />
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Order History</h2>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-[3rem] border border-white/10 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/5 uppercase text-[9px] font-black text-slate-500 tracking-[0.2em] border-b border-white/5">
                                <tr>
                                    <th className="px-10 py-6">Order ID</th>
                                    <th className="px-10 py-6">Date</th>
                                    <th className="px-10 py-6">Items</th>
                                    <th className="px-10 py-6 text-right">Total</th>
                                    <th className="px-10 py-6 text-center">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {pastOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-16 text-center text-slate-600 font-bold uppercase text-[10px] tracking-widest italic opacity-40">
                                            No past culinary registrations found
                                        </td>
                                    </tr>
                                ) : (
                                    pastOrders.map(order => (
                                        <tr key={order._id} className="group hover:bg-white/[0.02] transition-all cursor-default">
                                            <td className="px-10 py-6">
                                                <span className="text-xs font-black text-[#408c8c] uppercase tracking-widest group-hover:text-white transition-colors">{order.orderNo}</span>
                                            </td>
                                            <td className="px-10 py-6">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </p>
                                                <p className="text-[9px] text-slate-600 font-black mt-1 uppercase italic tracking-widest">
                                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </td>
                                            <td className="px-10 py-6">
                                                <p className="text-xs font-medium text-slate-400 line-clamp-1 max-w-[200px]">
                                                    {order.items.map(i => `${i.qty}x ${i.name}`).join(", ")}
                                                </p>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <span className="text-sm font-black text-white italic tracking-tighter">LKR {Number(order.total).toLocaleString()}</span>
                                            </td>
                                            <td className="px-10 py-6 text-center">
                                                <button 
                                                    onClick={() => generateInvoicePDF(order)}
                                                    className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 hover:bg-[#408c8c] hover:border-[#408c8c] text-slate-400 hover:text-white flex items-center justify-center mx-auto transition-all transform active:scale-95"
                                                >
                                                    <FileDown className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}