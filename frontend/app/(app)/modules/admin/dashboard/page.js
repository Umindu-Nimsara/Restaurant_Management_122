"use client";

import React, { useState, useEffect } from 'react';
import {
    Users,
    ReceiptText,
    DollarSign,
    Utensils,
    Truck,
    Table as TableIcon,
    CalendarDays,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    ChevronRight,
    Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { dashboardService } from "@/lib/dashboardService";
import RevenueAnalytics from "@/components/ui/RevenueAnalytics";

// --- Internal Mini Components ---

const MetricCard = ({ title, value, icon: Icon, iconBg, iconColor, borderColor, trend, description, delay, valueColor }) => (
    <Card
        className="overflow-hidden relative transition-all duration-300 hover:-translate-y-1 border border-[#2a3a4a] bg-[#1a2535] rounded-xl animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
        style={{ 
            animationDelay: `${delay}ms`,
            borderTop: `3px solid ${borderColor}`
        }}
    >
        <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div 
                    className="p-3 rounded-xl transition-transform duration-300 hover:scale-110"
                    style={{ backgroundColor: iconBg, color: iconColor }}
                >
                    <Icon size={24} />
                </div>
                {trend && (
                    <Badge className="border border-[#22c55e] text-[#22c55e] bg-[#052e16] px-2 py-0.5 font-medium text-xs">
                        <TrendingUp size={12} className="mr-1" />
                        {trend}
                    </Badge>
                )}
            </div>
            <div>
                <p className="text-xs font-bold text-[#8892a4] uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-[28px] font-bold tracking-tight" style={{ color: valueColor || '#ffffff' }}>{value}</h3>
                {description && <p className="text-xs text-[#8892a4] mt-2">{description}</p>}
            </div>
        </CardContent>
    </Card>
);

const SimpleBarChart = ({ data }) => {
    if (!data || data.length === 0) return <div className="h-[220px] flex items-center justify-center text-[#8892a4] italic">No chart data available</div>;

    const maxVal = Math.max(...data.map(d => d.dailyRevenue), 1);

    return (
        <div className="flex items-end justify-between h-[220px] w-full gap-3 px-1">
            {data.map((item, idx) => {
                const height = (item.dailyRevenue / maxVal) * 100;
                const hasRevenue = item.dailyRevenue > 0;
                
                return (
                    <div key={idx} className="flex-1 flex flex-col items-center group">
                        <div className="w-full relative flex items-end justify-center h-48">
                            {/* Tooltip on hover */}
                            {hasRevenue && (
                                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0f1923] border border-[#2a3a4a] rounded-lg px-3 py-2 text-xs font-bold z-10 whitespace-nowrap shadow-xl text-white">
                                    LKR {item.dailyRevenue.toLocaleString()}
                                </div>
                            )}
                            {/* Value label above bar */}
                            {hasRevenue && (
                                <div className="absolute -top-6 text-[11px] font-bold text-white opacity-90">
                                    {item.dailyRevenue > 999 ? `${(item.dailyRevenue / 1000).toFixed(1)}k` : item.dailyRevenue}
                                </div>
                            )}
                            <div
                                className="w-full max-w-[50px] rounded-t transition-all duration-500 animate-in slide-in-from-bottom-full fill-mode-both"
                                style={{
                                    height: `${Math.max(height, hasRevenue ? 10 : 5)}%`,
                                    backgroundColor: hasRevenue ? '#00b4a6' : '#2a3a4a',
                                    borderRadius: '4px 4px 0 0',
                                    animationDelay: `${idx * 75}ms`
                                }}
                            />
                        </div>
                        <span className="text-xs text-[#8892a4] mt-3 font-medium">
                            {item.day || new Date(item._id).toLocaleDateString('en', { weekday: 'short' })}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await dashboardService.fetchStatistics();
            setStats(data);
        } catch (err) {
            setError(err.message || "Network error. Could not reach the server.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 pt-28 bg-[#0f1923] min-h-screen text-[#8892a4] gap-4">
                <Loader2 className="animate-spin text-[#00b4a6]" size={48} />
                <p className="animate-pulse font-medium">Analyzing restaurant performance...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 pt-28 bg-[#0f1923] min-h-screen text-center">
                <div className="max-w-md mx-auto">
                    <div className="p-4 bg-[#3b1515] text-[#ef4444] rounded-2xl mb-4 border border-[#ef4444]/20 inline-block">
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-xl font-bold mb-2 text-white">Something went wrong</h2>
                    <p className="text-[#8892a4] mb-6">{error}</p>
                    <button
                        onClick={fetchStats}
                        className="bg-[#00b4a6] text-white px-6 py-2 rounded-xl font-medium hover:bg-[#00b4a6]/90 transition-all"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

                const {summary, lowStockItems, popularMenuItems, chartData} = stats;

                return (
                <div className="p-8 pt-28 bg-[#0f1923] min-h-screen space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Header section with search/actions */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-[28px] font-bold tracking-tight text-white">Enterprise Overview</h1>
                            <p className="text-[#8892a4] text-sm mt-1">Monitor your restaurant's vital statistics and performance trends.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8892a4]" size={16} />
                                <input
                                    placeholder="Quick search..."
                                    className="pl-10 pr-4 py-2 bg-[#1a2535] border border-[#2a3a4a] rounded-lg text-sm w-full md:w-64 focus:ring-2 ring-[#00b4a6] focus:border-[#00b4a6] outline-none transition-all text-white placeholder:text-[#8892a4]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quick Summary Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            title="Gross Revenue"
                            value={`LKR ${summary.totalRevenue.toLocaleString()}`}
                            icon={DollarSign}
                            iconBg="#1e3a5f"
                            iconColor="#3b82f6"
                            borderColor="#3b82f6"
                            trend="+12.5%"
                            description="Across all paid transactions"
                            delay={100}
                        />
                        <MetricCard
                            title="Total Orders"
                            value={summary.totalOrders}
                            icon={ReceiptText}
                            iconBg="#3b1515"
                            iconColor="#ef4444"
                            borderColor="#ef4444"
                            trend="+8.2%"
                            description={`${summary.totalOrdersToday} new orders today`}
                            delay={200}
                        />
                        <MetricCard
                            title="Guest Profiles"
                            value={summary.totalUsers}
                            icon={Users}
                            iconBg="#2d1f00"
                            iconColor="#f59e0b"
                            borderColor="#f59e0b"
                            description="Registered customers & staff"
                            delay={300}
                        />
                        <MetricCard
                            title="Reservations"
                            value={summary.totalReservations}
                            icon={CalendarDays}
                            iconBg="#1a2e1a"
                            iconColor="#22c55e"
                            borderColor="#22c55e"
                            description={`${summary.activeReservations} upcoming seatings`}
                            delay={400}
                        />
                        <MetricCard
                            title="Menu Variety"
                            value={summary.totalMenuItems}
                            icon={Utensils}
                            iconBg="#1e1535"
                            iconColor="#8b5cf6"
                            borderColor="#8b5cf6"
                            description="Active dishes across all categories"
                            delay={500}
                        />
                        <MetricCard
                            title="Active Suppliers"
                            value={summary.totalSuppliers}
                            icon={Truck}
                            iconBg="#2d1f00"
                            iconColor="#f97316"
                            borderColor="#f97316"
                            description="Partners in supply chain"
                            delay={600}
                        />
                        <MetricCard
                            title="Floor Tables"
                            value={summary.totalTables}
                            icon={TableIcon}
                            iconBg="#1a2535"
                            iconColor="#00b4a6"
                            borderColor="#00b4a6"
                            description="Current dining capacity"
                            delay={700}
                        />
                        <MetricCard
                            title="Today's Revenue"
                            value={`LKR ${summary.totalRevenueToday.toLocaleString()}`}
                            icon={DollarSign}
                            iconBg="#1e3a5f"
                            iconColor="#3b82f6"
                            borderColor="#3b82f6"
                            valueColor="#00b4a6"
                            description="Instant business performance"
                            delay={800}
                        />
                    </div>

                    {/* Charts and Insights Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                        {/* Weekly Revenue Diagram - Now using RevenueAnalytics component */}
                        <div className="lg:col-span-3">
                            <RevenueAnalytics />
                        </div>

                        {/* Popular Dishes */}
                        <Card className="lg:col-span-2 border border-[#2a3a4a] bg-[#1a2535] rounded-xl shadow-none">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-white text-lg font-semibold">Bestselling Items</CardTitle>
                                <CardDescription className="text-[#8892a4] text-[13px] mt-1">Most frequently ordered delicacies</CardDescription>
                            </CardHeader>
                            <CardContent className="px-6 pb-6">
                                <div className="space-y-3">
                                    {popularMenuItems.length > 0 ? (
                                        popularMenuItems.map((item, idx) => {
                                            const maxSold = popularMenuItems[0].totalSold;
                                            const progressWidth = (item.totalSold / maxSold) * 100;
                                            
                                            let rankBg, rankText;
                                            if (idx === 0) {
                                                rankBg = '#f59e0b';
                                                rankText = '#000000';
                                            } else if (idx === 1) {
                                                rankBg = '#9ca3af';
                                                rankText = '#000000';
                                            } else if (idx === 2) {
                                                rankBg = '#b45309';
                                                rankText = '#ffffff';
                                            } else {
                                                rankBg = '#2a3a4a';
                                                rankText = '#8892a4';
                                            }
                                            
                                            return (
                                                <div key={idx} className="group cursor-default">
                                                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-[#1e2d3d] transition-colors border-b border-[#2a3a4a] last:border-0">
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <div 
                                                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                                                                style={{ backgroundColor: rankBg, color: rankText }}
                                                            >
                                                                {idx + 1}
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="font-medium text-sm text-white block">{item.name}</span>
                                                                <div className="w-full h-[3px] bg-[#2a3a4a] rounded-full mt-1.5 overflow-hidden">
                                                                    <div 
                                                                        className="h-full rounded-full transition-all duration-500"
                                                                        style={{ 
                                                                            width: `${progressWidth}%`,
                                                                            backgroundColor: rankBg
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-bold text-[#00b4a6] ml-3">{item.totalSold} sold</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-[#8892a4] text-sm italic py-8 text-center">No sales data recorded yet</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Critical Alerts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Inventory Alerts */}
                        <Card className="border-none bg-rose-500/5 ring-1 ring-rose-500/10 shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div>
                                    <CardTitle className="text-rose-600 flex items-center gap-2">
                                        <AlertTriangle size={18} />
                                        Low Stock Alerts
                                    </CardTitle>
                                </div>
                                <Badge variant="outline" className="text-rose-600 border-rose-600/20 bg-rose-500/5">{lowStockItems.length}</Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="mt-4 space-y-2">
                                    {lowStockItems.length > 0 ? (
                                        lowStockItems.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-rose-500/10">
                                                <div>
                                                    <p className="font-bold text-sm tracking-tight">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground">{item.quantity} {item.unit} remaining</p>
                                                </div>
                                                <Badge variant="secondary" className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-200 border-none">Refill Needed</Badge>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                            <div className="p-4 rounded-full bg-emerald-500/10 mb-4">
                                                <CheckCircle2 size={32} className="text-emerald-500" />
                                            </div>
                                            <p className="text-sm font-semibold text-emerald-600">All stocks are optimal</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status card */}
                        <Card className="border-none bg-emerald-500/5 ring-1 ring-emerald-500/10 flex flex-col justify-center shadow-none">
                            <CardContent className="flex flex-col items-center text-center p-8">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-4 ring-8 ring-emerald-500/5">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-emerald-700">System Healthy</h3>
                                <p className="text-muted-foreground text-sm max-w-xs mt-2">
                                    The restaurant management system is running optimally across all modules.
                                </p>
                                <div className="mt-8 flex gap-8">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold tracking-tighter text-emerald-600">{summary.totalOrdersToday}</p>
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Today's Load</p>
                                    </div>
                                    <div className="w-[1px] bg-emerald-500/20" />
                                    <div className="text-center">
                                        <p className="text-3xl font-bold tracking-tighter text-emerald-600">{summary.activeReservations}</p>
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Scheduled</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                );
}