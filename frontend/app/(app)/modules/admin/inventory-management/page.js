"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Trash2, Pencil, History, AlertTriangle, ArrowRightLeft, FileDown, Boxes, Clock, DollarSign, Database } from "lucide-react";
import { useRouter } from "next/navigation";
import DeleteConfirmDialog from "@/components/ui/DeleteConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import UsageDataManager from "@/components/ui/UsageDataManager";

function InventoryManagementPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const [items, setItems] = useState([]);
    const [showCount, setShowCount] = useState(10);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const [mounted, setMounted] = useState(false);
    const [showDataManager, setShowDataManager] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/inventory/ingredients`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setItems(data.data);
            }
        } catch (e) {
            console.error("Error fetching inventory:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const filtered = useMemo(() => {
        let result = items;
        const q = search.trim().toLowerCase();

        if (q) {
            result = result.filter((it) => {
                const name = (it.name || "").toLowerCase();
                const unit = (it.unit || "").toLowerCase();
                return name.includes(q) || unit.includes(q);
            });
        }

        if (statusFilter === "Low Stock") {
            result = result.filter((it) => Number(it.quantity) <= Number(it.minLevel));
        }

        return result;
    }, [items, search, statusFilter]);

    const visible = useMemo(() => {
        return filtered.slice(0, Number(showCount));
    }, [filtered, showCount]);

    const kpis = useMemo(() => {
        let totalIngredients = items.length;
        let lowStockCount = items.filter(it => Number(it.quantity) <= Number(it.minLevel)).length;
        
        let expiringSoonCount = 0;
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        
        items.forEach(it => {
            if (it.expiryDate) {
                const expDate = new Date(it.expiryDate);
                if (expDate <= sevenDaysFromNow) {
                    expiringSoonCount++;
                }
            }
        });
        
        let inventoryValue = items.reduce((acc, it) => acc + (Number(it.quantity) * Number(it.costPerUnit || 0)), 0);
        
        return { totalIngredients, lowStockCount, expiringSoonCount, inventoryValue };
    }, [items]);

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/inventory/ingredients/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                fetchItems();
            } else {
                alert(data.error || 'Delete failed');
            }
        } catch (e) {
            console.error("Error deleting:", e);
        }
    };

    const [adjustmentOpen, setAdjustmentOpen] = useState(false);
    const [adjustmentItem, setAdjustmentItem] = useState(null);
    const [adjType, setAdjType] = useState("USAGE");
    const [adjQty, setAdjQty] = useState("");
    const [adjReason, setAdjReason] = useState("");

    const handleAdjustStock = async () => {
        if (!adjustmentItem || !adjQty || isNaN(adjQty)) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/inventory/stock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ingredientId: adjustmentItem._id,
                    type: adjType,
                    quantity: Number(adjQty),
                    reason: adjReason
                })
            });
            const data = await res.json();
            if (data.success) {
                fetchItems();
                setAdjustmentOpen(false);
                setAdjustmentItem(null);
                setAdjQty("");
                setAdjReason("");
            } else {
                alert(data.error || 'Adjustment failed');
            }
        } catch (e) {
            console.error("Error adjusting stock:", e);
        }
    };

    const handleEdit = (id) => {
        router.push(`/modules/admin/inventory-management/add-inventory-item?id=${id}`);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.setTextColor(0, 84, 119);
        doc.text("OceanBreeze Restaurant - Inventory Report", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Filter Applied: ${statusFilter}`, 14, 36);

        const tableColumn = ["Ingredient Name", "Unit", "Quantity", "Min Level", "Expiry Date"];
        const tableRows = filtered.map(it => [
            it.name || "-",
            it.unit || "-",
            it.quantity || "0",
            it.minLevel || "0",
            it.expiryDate ? new Date(it.expiryDate).toLocaleDateString() : "-"
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 55,
            theme: 'grid',
            headStyles: { fillColor: [0, 84, 119], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [240, 247, 247] },
            margin: { top: 55 }
        });

        doc.save(`OceanBreeze_Inventory_${statusFilter.replace(" ", "_")}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="flex-1 p-8 pt-24 bg-[#181E38] min-h-screen">
            <div className="max-w-[1600px] mx-auto">
                {/* TOP: Title + Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-semibold text-white pl-4">
                            Inventory Management
                        </h1>
                        <p className="text-slate-300 pl-4 mt-1">Monitor and manage your restaurant stock levels.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={exportToPDF}
                            disabled={filtered.length === 0}
                            className="h-11 px-6 border-[#408c8c] text-white hover:bg-[#408c8c]/20 rounded-xl flex items-center gap-2 font-bold transition-all active:scale-95 shadow-lg shadow-[#408c8c]/10"
                        >
                            <FileDown className="w-5 h-5" />
                            Export PDF
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => router.push('/modules/admin/inventory-management/history')}
                            className="h-11 px-6 border-[#005477] text-white hover:bg-[#005477]/20 rounded-xl flex items-center gap-2 font-bold transition-all active:scale-95 shadow-lg shadow-[#005477]/10"
                        >
                            <History className="h-5 w-5" />
                            Stock History
                        </Button>

                        <Button
                            onClick={() => router.push("/modules/admin/inventory-management/add-inventory-item")}
                            className="bg-[#005477] hover:bg-[#005477]/90 text-white flex items-center gap-2 rounded-xl h-11 px-6 shadow-lg shadow-[#005477]/20 font-bold transition-all active:scale-95"
                        >
                            <Plus className="h-5 w-5" />
                            Add New Ingredient
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                {mounted && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="bg-white/5 border-white/10 backdrop-blur-md p-6 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all">
                            <div className="h-14 w-14 rounded-2xl bg-[#005477]/20 flex items-center justify-center text-[#408c8c] shadow-inner border border-white/5">
                                <Boxes className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Ingredients</p>
                                <p className="text-3xl font-black text-white">{kpis.totalIngredients}</p>
                            </div>
                        </Card>

                        <Card className="bg-white/5 border-white/10 backdrop-blur-md p-6 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all">
                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner border border-white/5 ${kpis.lowStockCount > 0 ? 'bg-red-500/20 text-red-500' : 'bg-[#005477]/20 text-[#408c8c]'}`}>
                                <AlertTriangle className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Low Stock Alerts</p>
                                <p className={`text-3xl font-black ${kpis.lowStockCount > 0 ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-white'}`}>{kpis.lowStockCount}</p>
                            </div>
                        </Card>

                        <Card className="bg-white/5 border-white/10 backdrop-blur-md p-6 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all">
                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner border border-white/5 ${kpis.expiringSoonCount > 0 ? 'bg-orange-500/20 text-orange-500' : 'bg-[#005477]/20 text-[#408c8c]'}`}>
                                <Clock className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Expiring Soon (7d)</p>
                                <p className={`text-3xl font-black ${kpis.expiringSoonCount > 0 ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'text-white'}`}>{kpis.expiringSoonCount}</p>
                            </div>
                        </Card>

                        <Card className="bg-white/5 border-white/10 backdrop-blur-md p-6 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all">
                            <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner border border-white/5">
                                <DollarSign className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Inventory Value</p>
                                <p className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">LKR {kpis.inventoryValue.toFixed(2)}</p>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Usage Data Section */}
                {mounted && (
                    <div className="mt-8">
                        <button
                            onClick={() => setShowDataManager(!showDataManager)}
                            className="w-full bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-[#005477]/20 flex items-center justify-center text-[#408c8c]">
                                    <Database className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white">Usage Data</h3>
                                    <p className="text-xs text-slate-400">Manage ingredient usage records for analytics</p>
                                </div>
                            </div>
                            <div className={`transition-transform ${showDataManager ? 'rotate-180' : ''}`}>
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>

                        {showDataManager && (
                            <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                <Card className="bg-white/5 border-white/10 backdrop-blur-md p-8 rounded-2xl">
                                    <UsageDataManager onDataUpdated={() => {
                                        fetchItems();
                                    }} />
                                </Card>
                            </div>
                        )}
                    </div>
                )}

                {/* Controls Bar */}
                <div className="mt-8 rounded-2xl border bg-white/5 backdrop-blur-md shadow-sm overflow-hidden border-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-6 p-4">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2.5 text-sm">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Show</span>
                                <select
                                    value={showCount}
                                    onChange={(e) => setShowCount(Number(e.target.value))}
                                    className="h-10 rounded-xl border border-white/10 px-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#005477]/5 focus:border-[#005477] transition-all bg-white/10 text-white"
                                >
                                    <option value={10} className="bg-[#011627]">10</option>
                                    <option value={25} className="bg-[#011627]">25</option>
                                    <option value={50} className="bg-[#011627]">50</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2.5 text-sm">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Status</span>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-10 rounded-xl border border-white/10 px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#005477]/5 focus:border-[#005477] transition-all bg-white/10 text-white min-w-[140px]"
                                >
                                    <option value="All" className="bg-[#011627]">All Stock</option>
                                    <option value="Low Stock" className="bg-[#011627]">Low Stock Alert</option>
                                </select>
                            </div>
                        </div>

                        <div className="relative flex-1 max-w-md">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or unit..."
                                className="w-full h-11 px-5 rounded-xl border border-white/10 focus:ring-4 focus:ring-[#005477]/5 focus:border-[#005477] transition-all bg-white/10 text-white font-medium placeholder:text-slate-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="mt-8 overflow-x-auto custom-scrollbar">
                    <Card className="bg-[#232943] backdrop-blur-md border-none rounded-[2rem] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white">
                                Ingredient Details
                            </h2>
                            <div className="text-xs font-semibold text-white/70">
                                Total <span className="text-white font-bold">{filtered.length}</span> ingredients
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-white text-xs font-medium uppercase tracking-widest border-b border-white/10">
                                        <th className="px-8 py-6">Ingredient Name</th>
                                        <th className="px-8 py-6 text-center">Unit</th>
                                        <th className="px-8 py-6 text-center">Remaining Qty</th>
                                        <th className="px-8 py-6 text-center">Min Level</th>
                                        <th className="px-8 py-6 text-center">Expiry Date</th>
                                        <th className="px-8 py-6 text-center">Status</th>
                                        <th className="px-8 py-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-20">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-white/10 border-t-[#005477]"></div>
                                                    <p className="text-sm font-bold text-slate-400 animate-pulse">Fetching Inventory...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : visible.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-20">
                                                <div className="flex flex-col items-center gap-4 text-slate-400">
                                                    <div className="p-4 bg-white/5 rounded-2xl shadow-sm border border-white/10">
                                                        <AlertTriangle className="h-8 w-8 text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xl font-bold text-white">No ingredients found</p>
                                                        <p className="text-sm font-medium mt-1">Try a different search or add a new record.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        visible.map((it) => {
                                            const isLowStock = Number(it.quantity) <= Number(it.minLevel);
                                            const isExpired = mounted && it.expiryDate && new Date(it.expiryDate) < new Date();

                                            return (
                                                <tr
                                                    key={it._id}
                                                    className="border-b border-white/5 hover:bg-white/5 transition-all group"
                                                >
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white font-black transition-all ${isLowStock ? 'bg-red-500/20 text-red-400' : 'bg-white/10 group-hover:bg-[#005477]'}`}>
                                                                <span className="text-lg uppercase">{(it.name || "U")[0]}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-white font-black text-lg leading-tight">
                                                                    {it.name || "Unnamed"}
                                                                </span>
                                                                {isLowStock && (
                                                                    <span className="text-xs text-red-400 font-bold mt-1 flex items-center gap-1">
                                                                        <AlertTriangle className="h-3 w-3" />
                                                                        Low Stock Alert
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-8 py-5 text-center">
                                                        <span className="text-slate-300 font-semibold text-sm">{it.unit || "-"}</span>
                                                    </td>

                                                    <td className="px-8 py-5 text-center">
                                                        <span className={`text-lg font-black ${isLowStock ? 'text-red-400' : 'text-white'}`}>
                                                            {it.quantity || 0}
                                                        </span>
                                                    </td>

                                                    <td className="px-8 py-5 text-center">
                                                        <span className="text-slate-400 font-semibold text-sm">{it.minLevel || 0}</span>
                                                    </td>

                                                    <td className="px-8 py-5 text-center">
                                                        {it.expiryDate ? (
                                                            <span className={`text-sm font-semibold ${isExpired ? 'text-red-400' : 'text-slate-300'}`}>
                                                                {new Date(it.expiryDate).toLocaleDateString()}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-600 text-sm">-</span>
                                                        )}
                                                    </td>

                                                    <td className="px-8 py-5 text-center">
                                                        {isLowStock ? (
                                                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-bold">
                                                                Low Stock
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold">
                                                                In Stock
                                                            </Badge>
                                                        )}
                                                    </td>

                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setAdjustmentItem(it);
                                                                    setAdjustmentOpen(true);
                                                                }}
                                                                className="h-9 w-9 rounded-xl bg-[#005477]/20 hover:bg-[#005477] text-[#408c8c] hover:text-white flex items-center justify-center transition-all active:scale-90 border border-white/5"
                                                                title="Adjust Stock"
                                                            >
                                                                <ArrowRightLeft className="h-4.5 w-4.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEdit(it._id)}
                                                                className="h-9 w-9 rounded-xl bg-white/10 hover:bg-[#408c8c] text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-90 border border-white/5"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="h-4.5 w-4.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setDeleteId(it._id);
                                                                    setDeleteOpen(true);
                                                                }}
                                                                className="h-9 w-9 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white flex items-center justify-center transition-all active:scale-90 border border-white/5"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-4.5 w-4.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Adjustment Modal */}
            {adjustmentOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1e233b] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-white mb-2">Record Stock Change</h2>
                            <p className="text-slate-400 text-sm mb-8">Ingredient: <span className="text-[#408c8c] font-black">{adjustmentItem?.name}</span></p>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Action Type</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {["USAGE", "PURCHASE", "ADJUSTMENT"].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setAdjType(t)}
                                                className={`py-2 text-[10px] font-bold rounded-xl border transition-all ${adjType === t
                                                    ? 'bg-[#005477] text-white border-[#005477] shadow-lg shadow-[#005477]/20 whitespace-normal'
                                                    : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/10'
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Quantity ({adjustmentItem?.unit})</label>
                                    <input
                                        type="number"
                                        value={adjQty}
                                        onChange={(e) => setAdjQty(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full h-14 px-4 rounded-2xl border border-white/5 bg-white/5 focus:ring-4 focus:ring-[#005477]/10 focus:border-[#005477] outline-none text-lg font-bold text-white"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Log Note</label>
                                    <textarea
                                        value={adjReason}
                                        onChange={(e) => setAdjReason(e.target.value)}
                                        placeholder="e.g. Order #1024 or Daily Kitchen Prep"
                                        className="w-full h-24 p-4 rounded-2xl border border-white/5 bg-white/5 focus:ring-4 focus:ring-[#005477]/10 focus:border-[#005477] outline-none text-sm text-white placeholder:text-slate-600 resize-none"
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setAdjustmentOpen(false)}
                                        className="flex-1 h-14 rounded-2xl text-slate-400 font-bold hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        Dismiss
                                    </Button>
                                    <Button
                                        onClick={handleAdjustStock}
                                        disabled={!adjQty || isNaN(adjQty)}
                                        className="flex-1 h-14 rounded-2xl bg-[#005477] hover:bg-[#005477]/90 text-white font-bold shadow-xl shadow-[#005477]/20 transition-all active:scale-95"
                                    >
                                        Log Record
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <DeleteConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete ingredient record?"
                description="Are you sure you want to remove this ingredient from your inventory system? This will also clear its stock tracking history. This action is irreversible."
                confirmText="Yes, Delete Record"
                confirmClassName="bg-red-600 hover:bg-red-700 text-white font-black rounded-xl h-11"
                onConfirm={() => {
                    if (!deleteId) return;
                    handleDelete(deleteId);
                    setDeleteOpen(false);
                    setDeleteId(null);
                }}
            />

            {mounted && (
                <style jsx global>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        height: 6px;
                        width: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 255, 255, 0.2);
                    }
                `}</style>
            )}
        </div>
    );
}

export default InventoryManagementPage;
