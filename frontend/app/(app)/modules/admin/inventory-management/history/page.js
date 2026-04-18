"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, ShoppingCart, Utensils, Settings2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";


export default function InventoryHistoryPage() {
    const router = useRouter();
    const [logs, setLogs] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${apiUrl}/inventory/stock`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setLogs(data.data);
                }
            } catch (e) {
                console.error("Error fetching logs:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [apiUrl]);

    const filteredLogs = logs.filter(log =>
        log.ingredientId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        log.type?.toLowerCase().includes(search.toLowerCase()) ||
        log.reason?.toLowerCase().includes(search.toLowerCase())
    );

    const getTypeIcon = (type) => {
        switch (type) {
            case "PURCHASE": return <ShoppingCart className="h-4 w-4 text-green-600" />;
            case "USAGE": return <Utensils className="h-4 w-4 text-orange-600" />;
            case "ADJUSTMENT": return <Settings2 className="h-4 w-4 text-blue-600" />;
            default: return <Clock className="h-4 w-4 text-gray-600" />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case "PURCHASE": return "bg-green-100 text-green-700 border-green-200";
            case "USAGE": return "bg-orange-100 text-orange-700 border-orange-200";
            case "ADJUSTMENT": return "bg-blue-100 text-blue-700 border-blue-200";
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
                        <h1 className="text-3xl font-bold text-gray-900">Stock History</h1>
                        <p className="text-gray-500 mt-1">Audit log of all inventory changes and stock updates.</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search logs..."
                        className="h-10 w-[300px] pl-10 pr-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#005477]/10 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-sm font-bold text-gray-600">Timestamp</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-600">Ingredient</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-600">Action Type</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-600 text-center">Qty Change</th>
                            <th className="px-6 py-4 text-sm font-bold text-gray-600">Note / Reason</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <Clock className="h-12 w-12 opacity-20" />
                                        <p className="text-lg font-medium">No history logs found</p>
                                        <p className="text-sm">Stock changes will appear here as they occur.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredLogs.map((log) => (
                                <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                        {log.ingredientId?.name || "Deleted Ingredient"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getTypeColor(log.type)}`}>
                                            {getTypeIcon(log.type)}
                                            {log.type}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-sm font-bold ${log.type === 'PURCHASE' || (log.type === 'ADJUSTMENT' && log.quantity > 0) ? 'text-green-600' : 'text-red-600'}`}>
                                            {log.type === 'PURCHASE' || (log.type === 'ADJUSTMENT' && log.quantity > 0) ? `+${log.quantity}` : `-${log.quantity}`}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 italic">
                                        {log.reason || "Automatic adjustment"}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
