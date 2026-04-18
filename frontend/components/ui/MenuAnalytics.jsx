"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, ChevronUp, ChevronDown, Package, CheckCircle, XCircle, Layers, Tag, Crown } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MenuAnalytics = ({ isExpanded, onToggle, itemCount }) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isExpanded && !analytics) {
            fetchAnalytics();
        }
    }, [isExpanded]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/menu/analytics`);
            const data = await res.json();
            if (data.success) {
                setAnalytics(data.data);
            } else {
                console.error('Analytics fetch failed:', data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            // Set empty analytics to prevent infinite loading
            setAnalytics({
                totalItems: 0,
                availableItems: 0,
                outOfStock: 0,
                categoriesCount: 0,
                totalValue: 0,
                availablePercent: 0,
                mostExpensive: null,
                itemsPerCategory: [],
                availabilityRatio: { available: 0, unavailable: 0 },
                itemsPerTag: []
            });
        } finally {
            setLoading(false);
        }
    };

    // Color maps
    const categoryColors = {
        'Main Course': '#00b4a6',
        'Seafood': '#3b82f6',
        'Appetizers': '#f59e0b',
        'Desserts': '#8b5cf6',
        'Beverages': '#22c55e',
        'Starters': '#f97316',
        'Noodles / Pasta': '#06b6d4',
        'Side Dishes': '#ec4899',
        'Other': '#6b7280'
    };

    const tagColors = {
        "Chef's Special": '#854F0B',
        'New': '#185FA5',
        'Bestseller': '#3B6D11',
        'Spicy': '#A32D2D',
        'Vegan': '#0F6E56',
        'Seasonal': '#993C1D'
    };

    // Prepare chart data
    const categoryChartData = analytics?.itemsPerCategory?.map(item => ({
        ...item,
        fill: categoryColors[item.category] || categoryColors['Other']
    })) || [];

    const pieChartData = analytics ? [
        { name: 'Available', value: analytics.availabilityRatio.available, fill: '#00b4a6' },
        { name: 'Unavailable', value: analytics.availabilityRatio.unavailable, fill: '#ef4444' }
    ] : [];

    const tagChartData = analytics?.itemsPerTag?.map(item => ({
        ...item,
        fill: tagColors[item.tag] || '#6b7280'
    })) || [];

    return (
        <Card className="bg-[#151932] border-[#1E2442] rounded-2xl mb-6 overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#1A1F3A] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    <span className="text-white font-semibold text-lg">Menu Analytics</span>
                    <span className="text-gray-400 text-sm">({itemCount} items total)</span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </button>

            {isExpanded && mounted && (
                <div className="px-6 pb-6 border-t border-[#1E2442] pt-6">
                    {loading ? (
                        <div className="space-y-6">
                            {/* Skeleton Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-32 bg-[#1a2535] rounded-xl animate-pulse" />
                                ))}
                            </div>
                            {/* Skeleton Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="h-80 bg-[#1a2535] rounded-xl animate-pulse" />
                                <div className="h-80 bg-[#1a2535] rounded-xl animate-pulse" />
                            </div>
                        </div>
                    ) : analytics ? (
                        <div className="space-y-6">
                            {/* Stat Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                {/* Card 1: Total Items */}
                                <div 
                                    className={`bg-[#1a2535] border border-[#2a3a4a] border-t-[3px] border-t-[#00b4a6] rounded-xl p-5 hover:border-[#00b4a6]/50 transition-all hover:-translate-y-1 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                                    style={mounted ? { transition: 'all 0.3s ease', transitionDelay: '0ms' } : {}}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-3 rounded-lg bg-[#00b4a6]/15">
                                            <Package className="w-6 h-6 text-[#00b4a6]" />
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Items</div>
                                    <div className="text-3xl font-bold text-white">{analytics.totalItems}</div>
                                </div>

                                {/* Card 2: Available */}
                                <div 
                                    className={`bg-[#1a2535] border border-[#2a3a4a] border-t-[3px] border-t-[#22c55e] rounded-xl p-5 hover:border-[#22c55e]/50 transition-all hover:-translate-y-1 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                                    style={mounted ? { transition: 'all 0.3s ease', transitionDelay: '75ms' } : {}}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-3 rounded-lg bg-[#22c55e]/15">
                                            <CheckCircle className="w-6 h-6 text-[#22c55e]" />
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Available</div>
                                    <div className="text-3xl font-bold text-[#22c55e]">{analytics.availableItems}</div>
                                    <div className="text-xs text-gray-500 mt-1">{analytics.availablePercent}% of total</div>
                                </div>

                                {/* Card 3: Out of Stock */}
                                <div 
                                    className={`bg-[#1a2535] border border-[#2a3a4a] border-t-[3px] border-t-[#ef4444] rounded-xl p-5 hover:border-[#ef4444]/50 transition-all hover:-translate-y-1 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                                    style={mounted ? { transition: 'all 0.3s ease', transitionDelay: '150ms' } : {}}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-3 rounded-lg bg-[#ef4444]/15">
                                            <XCircle className="w-6 h-6 text-[#ef4444]" />
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Out of Stock</div>
                                    <div className={`text-3xl font-bold ${analytics.outOfStock > 0 ? 'text-[#ef4444]' : 'text-gray-600'}`}>
                                        {analytics.outOfStock}
                                    </div>
                                </div>

                                {/* Card 4: Categories */}
                                <div 
                                    className={`bg-[#1a2535] border border-[#2a3a4a] border-t-[3px] border-t-[#8b5cf6] rounded-xl p-5 hover:border-[#8b5cf6]/50 transition-all hover:-translate-y-1 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                                    style={mounted ? { transition: 'all 0.3s ease', transitionDelay: '225ms' } : {}}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-3 rounded-lg bg-[#8b5cf6]/15">
                                            <Layers className="w-6 h-6 text-[#8b5cf6]" />
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Categories</div>
                                    <div className="text-3xl font-bold text-[#8b5cf6]">{analytics.categoriesCount}</div>
                                </div>

                                {/* Card 5: Total Value */}
                                <div 
                                    className={`bg-[#1a2535] border border-[#2a3a4a] border-t-[3px] border-t-[#f59e0b] rounded-xl p-5 hover:border-[#f59e0b]/50 transition-all hover:-translate-y-1 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                                    style={mounted ? { transition: 'all 0.3s ease', transitionDelay: '300ms' } : {}}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-3 rounded-lg bg-[#f59e0b]/15">
                                            <Tag className="w-6 h-6 text-[#f59e0b]" />
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Value</div>
                                    <div className="text-3xl font-bold text-[#f59e0b]">LKR {analytics.totalValue.toFixed(0)}</div>
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Chart 1: Items Per Category */}
                                <Card className="bg-[#1a2535] border-[#2a3a4a] rounded-xl p-6">
                                    <h3 className="text-white font-semibold text-lg mb-4">Items Per Category</h3>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={categoryChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4a" />
                                            <XAxis 
                                                dataKey="category" 
                                                tick={{ fill: '#8892a4', fontSize: 12 }}
                                                angle={-35}
                                                textAnchor="end"
                                                height={80}
                                            />
                                            <YAxis tick={{ fill: '#8892a4', fontSize: 12 }} />
                                            <Tooltip 
                                                contentStyle={{
                                                    backgroundColor: '#0f1923',
                                                    border: '1px solid #2a3a4a',
                                                    borderRadius: '8px',
                                                    color: '#ffffff'
                                                }}
                                            />
                                            <Bar dataKey="count" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#ffffff', fontSize: 12 }} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Card>

                                {/* Chart 2: Availability Ratio */}
                                <Card className="bg-[#1a2535] border-[#2a3a4a] rounded-xl p-6">
                                    <h3 className="text-white font-semibold text-lg mb-4">Availability Ratio</h3>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie
                                                data={pieChartData}
                                                cx="50%"
                                                cy="45%"
                                                innerRadius={65}
                                                outerRadius={110}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {pieChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{
                                                    backgroundColor: '#0f1923',
                                                    border: '1px solid #2a3a4a',
                                                    borderRadius: '8px',
                                                    color: '#ffffff'
                                                }}
                                            />
                                            <Legend 
                                                wrapperStyle={{ color: '#8892a4' }}
                                                formatter={(value, entry) => `${value} (${entry.payload.value})`}
                                            />
                                            <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle">
                                                <tspan x="50%" dy="-10" fontSize="32" fontWeight="bold" fill="#ffffff">
                                                    {analytics.availablePercent}%
                                                </tspan>
                                                <tspan x="50%" dy="25" fontSize="14" fill="#8892a4">
                                                    Available
                                                </tspan>
                                            </text>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Card>
                            </div>

                            {/* Chart 3: Tags Distribution */}
                            {tagChartData.length > 0 && (
                                <Card className="bg-[#1a2535] border-[#2a3a4a] rounded-xl p-6">
                                    <h3 className="text-white font-semibold text-lg mb-4">Tag Distribution</h3>
                                    <ResponsiveContainer width="100%" height={Math.max(200, tagChartData.length * 50)}>
                                        <BarChart data={tagChartData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4a" />
                                            <XAxis type="number" tick={{ fill: '#8892a4', fontSize: 12 }} />
                                            <YAxis 
                                                dataKey="tag" 
                                                type="category" 
                                                tick={{ fill: '#8892a4', fontSize: 12 }}
                                                width={120}
                                            />
                                            <Tooltip 
                                                contentStyle={{
                                                    backgroundColor: '#0f1923',
                                                    border: '1px solid #2a3a4a',
                                                    borderRadius: '8px',
                                                    color: '#ffffff'
                                                }}
                                            />
                                            <Bar dataKey="count" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#ffffff', fontSize: 12 }} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Card>
                            )}

                            {/* Most Expensive Highlight */}
                            {analytics.mostExpensive && (
                                <Card className="bg-gradient-to-r from-[#00b4a6]/10 to-[#0f1923] border-[#2a3a4a] border-l-4 border-l-[#f59e0b] rounded-xl p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Crown className="w-6 h-6 text-[#f59e0b]" />
                                            <div>
                                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                                    Most Expensive Item
                                                </div>
                                                <div className="text-2xl font-bold text-white">
                                                    {analytics.mostExpensive.name}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-[#f59e0b]">
                                            LKR {analytics.mostExpensive.price.toLocaleString()}
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>
                    ) : null}
                </div>
            )}
        </Card>
    );
};

export default MenuAnalytics;
