"use client";

import React, { useEffect, useState } from 'react';
import { X, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PriceHistoryDrawer({ open, onClose, itemId, itemName }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && itemId) {
            loadHistory();
        }
    }, [open, itemId]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/menu/${itemId}/history`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setHistory(data.data || []);
            }
        } catch (err) {
            console.error('Failed to load price history:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <>
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                onClick={onClose}
            />
            
            {/* Drawer */}
            <div className={cn(
                "fixed right-0 top-0 h-full w-full max-w-md bg-[#0f1923] border-l border-[#2a3a4a] z-50 shadow-2xl",
                "animate-in slide-in-from-right duration-300"
            )}>
                {/* Header */}
                <div className="p-6 border-b border-[#2a3a4a]">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold text-white">Price History</h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-400">{itemName}</p>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto h-[calc(100%-88px)]">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No price changes recorded yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((entry, idx) => {
                                const priceChange = entry.newPrice - entry.oldPrice;
                                const isIncrease = priceChange > 0;
                                
                                return (
                                    <div key={idx} className="bg-[#1a2535] rounded-xl p-4 border border-[#2a3a4a]">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                {isIncrease ? (
                                                    <TrendingUp className="w-4 h-4 text-red-400" />
                                                ) : (
                                                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                                                )}
                                                <span className={cn(
                                                    "text-sm font-semibold",
                                                    isIncrease ? "text-red-400" : "text-emerald-400"
                                                )}>
                                                    {isIncrease ? '+' : ''}{priceChange.toFixed(2)} LKR
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {new Date(entry.changedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-gray-400 line-through text-sm">
                                                {entry.oldPrice.toFixed(2)} LKR
                                            </span>
                                            <span className="text-gray-600">→</span>
                                            <span className="text-white font-semibold">
                                                {entry.newPrice.toFixed(2)} LKR
                                            </span>
                                        </div>
                                        
                                        <div className="text-xs text-gray-500">
                                            Changed by: <span className="text-gray-400">{entry.changedBy?.name || 'Unknown'}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
