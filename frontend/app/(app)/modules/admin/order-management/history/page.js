"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Calendar, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const ORDERS_KEY = "oceanbreeze_orders_v1";

export default function OrderHistoryPage() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [search, setSearch] = useState("");
    const [expandedOrder, setExpandedOrder] = useState(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const raw = localStorage.getItem(ORDERS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        // Only show completed or cancelled in history, or allow toggling
        setOrders(parsed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }, []);

    const filteredOrders = useMemo(() => {
        const q = search.toLowerCase();
        return orders.filter(o =>
            o.orderNo?.toLowerCase().includes(q) ||
            o.tableName?.toLowerCase().includes(q) ||
            o.status?.toLowerCase().includes(q)
        );
    }, [orders, search]);

    const getStatusStyle = (status) => {
        switch (status) {
            case "PAID": return "bg-green-100 text-green-700 border-green-200";
            case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
            case "SERVED": return "bg-blue-100 text-blue-700 border-blue-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    return (
        <div className="flex-1 p-6 pt-20 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Order History</h1>
                        <p className="text-gray-400 mt-1 font-medium">Archive and logs of all past restaurant transactions.</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search records..."
                        className="h-12 w-[300px] pl-10 pr-4 rounded-2xl border border-gray-800 bg-[#1A1937] text-white focus:ring-4 focus:ring-[#005477]/5 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                    <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold uppercase tracking-widest">No order records found</p>
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <div key={order.id} className="bg-[#1A1937] rounded-2xl border border-gray-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
                            <div
                                className="p-5 flex items-center justify-between cursor-pointer"
                                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-[#005477] uppercase tracking-widest">{order.orderNo}</span>
                                        <span className="text-lg font-black text-white tracking-tight">{order.tableName}</span>
                                    </div>
                                    <div className="hidden md:flex flex-col border-l border-gray-800 pl-6">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</span>
                                        <span className="text-sm font-bold text-gray-300">{new Date(order.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="hidden md:flex flex-col border-l border-gray-800 pl-6">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount</span>
                                        <span className="text-sm font-black text-[#005477]">LKR {order.total}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(order.status)}`}>
                                        {order.status}
                                    </div>
                                    {expandedOrder === order.id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                                </div>
                            </div>

                            {expandedOrder === order.id && (
                                <div className="p-6 bg-gray-50/50 border-t border-gray-50 animate-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Items Ordered</h4>
                                            <div className="space-y-2">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-black text-[#005477]">x{item.qty}</span>
                                                            <span className="text-sm font-bold text-gray-800">{item.name}</span>
                                                        </div>
                                                        <span className="text-sm font-mono font-bold text-gray-500">LKR {item.price * item.qty}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Summary</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm font-bold text-gray-500">
                                                        <span>Subtotal</span>
                                                        <span>LKR {order.subtotal}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm font-bold text-gray-500">
                                                        <span>Tax (10%)</span>
                                                        <span>LKR {order.tax}</span>
                                                    </div>
                                                    <div className="pt-4 mt-2 border-t border-gray-100 flex justify-between text-xl font-black text-[#005477]">
                                                        <span>Total Amount</span>
                                                        <span>LKR {order.total}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 p-4 rounded-xl bg-gray-100/50">
                                                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-gray-200 shadow-sm font-black text-[10px] text-[#005477]">
                                                    {order.staffName?.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Handled By</span>
                                                    <span className="text-xs font-bold text-gray-700">{order.staffName}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
