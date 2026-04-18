"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, DollarSign, Calendar, BarChart3 } from 'lucide-react';

const RevenueAnalytics = () => {
    const [timeRange, setTimeRange] = useState(7);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        // Load Chart.js from CDN
        if (!window.Chart) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
            script.async = true;
            script.onload = () => {
                fetchAnalytics(timeRange);
            };
            document.body.appendChild(script);
        } else {
            fetchAnalytics(timeRange);
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, []);

    useEffect(() => {
        if (window.Chart) {
            fetchAnalytics(timeRange);
        }
    }, [timeRange]);

    const fetchAnalytics = async (days) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/dashboard/revenue-analytics?days=${days}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setAnalytics(data.data);
                renderChart(data.data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderChart = (data) => {
        if (!chartRef.current || !window.Chart) return;

        // Destroy existing chart
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        
        const revenues = data.chartData.map(d => d.revenue);
        const labels = data.chartData.map(d => timeRange === 7 ? d.day : d.displayDate);

        chartInstance.current = new window.Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Revenue',
                        data: revenues,
                        backgroundColor: '#1db88a',
                        borderColor: '#1db88a',
                        borderWidth: 0,
                        borderRadius: 4,
                        barThickness: timeRange === 30 ? 12 : timeRange === 14 ? 20 : 30,
                    },
                    {
                        label: 'Trend',
                        data: revenues,
                        type: 'line',
                        borderColor: '#6b7280',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        tension: 0.4,
                        order: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: '#0f1923',
                        titleColor: '#ffffff',
                        bodyColor: '#8892a4',
                        borderColor: '#2a3a4a',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                const index = context[0].dataIndex;
                                return data.chartData[index].displayDate || data.chartData[index].day;
                            },
                            label: function(context) {
                                if (context.dataset.label === 'Revenue') {
                                    const index = context.dataIndex;
                                    const revenue = data.chartData[index].revenue;
                                    const orders = data.chartData[index].orderCount;
                                    return [
                                        `Revenue: LKR ${revenue.toLocaleString()}`,
                                        `Orders: ${orders}`
                                    ];
                                }
                                return null;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: '#8892a4',
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#2a3a4a',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#8892a4',
                            font: {
                                size: 11
                            },
                            callback: function(value) {
                                if (value >= 1000) {
                                    return (value / 1000).toFixed(0) + 'k';
                                }
                                return value;
                            }
                        }
                    }
                }
            }
        });
    };

    if (loading && !analytics) {
        return (
            <Card className="border border-[#2a3a4a] bg-[#1a2535] rounded-xl p-6">
                <div className="h-96 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#1db88a] border-t-transparent"></div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="border border-[#2a3a4a] bg-[#1a2535] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-[#2a3a4a]">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-white text-lg font-semibold flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-[#1db88a]" />
                            Revenue Analytics
                        </h3>
                        <p className="text-[#8892a4] text-sm mt-1">Track your daily revenue performance</p>
                    </div>
                    
                    {/* Time Range Buttons */}
                    <div className="flex gap-2">
                        {[7, 14, 30].map(days => (
                            <button
                                key={days}
                                onClick={() => setTimeRange(days)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    timeRange === days
                                        ? 'bg-[#1db88a] text-white'
                                        : 'bg-[#1a2035] text-[#8892a4] hover:bg-[#252d45]'
                                }`}
                            >
                                {days} Days
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary Stats */}
                {analytics && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total Revenue */}
                        <div className="bg-[#1a2035] rounded-lg p-4 border border-[#2a3a4a]">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-[#1db88a]/10">
                                    <DollarSign className="w-5 h-5 text-[#1db88a]" />
                                </div>
                                <span className="text-xs font-bold text-[#8892a4] uppercase tracking-wider">Total Revenue</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                LKR {analytics.summary.totalRevenue.toLocaleString()}
                            </p>
                        </div>

                        {/* Average per Day */}
                        <div className="bg-[#1a2035] rounded-lg p-4 border border-[#2a3a4a]">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-[#3b82f6]/10">
                                    <TrendingUp className="w-5 h-5 text-[#3b82f6]" />
                                </div>
                                <span className="text-xs font-bold text-[#8892a4] uppercase tracking-wider">Average per Day</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                LKR {Math.round(analytics.summary.avgPerDay).toLocaleString()}
                            </p>
                        </div>

                        {/* Peak Day */}
                        <div className="bg-[#1a2035] rounded-lg p-4 border border-[#2a3a4a]">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-[#f59e0b]/10">
                                    <Calendar className="w-5 h-5 text-[#f59e0b]" />
                                </div>
                                <span className="text-xs font-bold text-[#8892a4] uppercase tracking-wider">Peak Day</span>
                            </div>
                            <p className="text-lg font-bold text-white">{analytics.summary.peakDay.date}</p>
                            <p className="text-sm text-[#1db88a] font-medium">
                                LKR {analytics.summary.peakDay.revenue.toLocaleString()}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Chart */}
            <div className="p-6">
                <div className="relative h-80">
                    <canvas ref={chartRef}></canvas>
                </div>

                {/* Custom Legend */}
                <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-[#2a3a4a]">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-[#1db88a]"></div>
                        <span className="text-sm text-[#8892a4]">Revenue</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-[#6b7280]"></div>
                        <span className="text-sm text-[#8892a4]">Trend Line</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default RevenueAnalytics;
