"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit3, Trash2, Eye, Phone, Mail, User, Building2, ExternalLink, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import DeleteConfirmDialog from "@/components/ui/DeleteConfirmDialog";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SupplierManagementPage() {
    const router = useRouter();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [showCount, setShowCount] = useState(10);

    // Delete state
    const [deleteId, setDeleteId] = useState(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/suppliers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSuppliers(data.data);
            }
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.email || "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "ALL" || s.contractStatus === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [suppliers, searchQuery, statusFilter]);

    const visibleSuppliers = useMemo(() => {
        return filteredSuppliers.slice(0, Number(showCount));
    }, [filteredSuppliers, showCount]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/suppliers/${deleteId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSuppliers(suppliers.filter(s => s._id !== deleteId));
                setShowDeleteDialog(false);
            }
        } catch (error) {
            console.error("Error deleting supplier:", error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-700 border-green-200';
            case 'INACTIVE': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'SUSPENDED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        // Add Title
        doc.setFontSize(20);
        doc.setTextColor(0, 84, 119); // #005477
        doc.text("OceanBreeze Restaurant - Supplier Report", 14, 22);

        // Add Date
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        // Add Filter Info
        doc.text(`Status Filter: ${statusFilter} | Search: ${searchQuery || "None"}`, 14, 36);

        // Define Table Columns
        const tableColumn = ["Company Name", "Contact Person", "Phone", "Email", "Status", "Joined Date"];

        // Define Table Rows
        const tableRows = filteredSuppliers.map(s => [
            s.name,
            s.contactPerson,
            s.phone,
            s.email || "-",
            s.contractStatus,
            new Date(s.createdAt).toLocaleDateString()
        ]);

        // Generate Table
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [0, 84, 119], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [240, 247, 247] },
            margin: { top: 45 }
        });

        // Save PDF
        doc.save(`OceanBreeze_Suppliers_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="flex-1 p-8 pt-24 bg-[#181E38] min-h-screen">
            <div className="max-w-[1600px] mx-auto">
                {/* TOP: Title + Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-semibold text-white pl-4">
                            Supplier Management
                        </h1>
                        <p className="text-slate-300 pl-4 mt-1">Manage restaurant vendors and contracts.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={exportToPDF}
                            disabled={filteredSuppliers.length === 0}
                            className="h-11 px-6 border-[#408c8c] text-white hover:bg-[#408c8c]/20 rounded-xl flex items-center gap-2 font-bold transition-all hover:scale-110 shadow-lg shadow-[#408c8c]/10"
                        >
                            <FileDown className="w-5 h-5" />
                            Export PDF
                        </Button>

                        <Link href="/modules/admin/supplier-management/add">
                            <Button className="bg-[#005477] hover:bg-[#005477]/90 text-white flex items-center gap-2 rounded-xl h-11 px-6 shadow-lg shadow-[#005477]/20 font-bold transition-all hover:scale-110">
                                <Plus className="h-5 w-5" />
                                Register New Supplier
                            </Button>
                        </Link>
                    </div>
                </div>

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
                                    <option value="ALL" className="bg-[#011627]">All Status</option>
                                    <option value="ACTIVE" className="bg-[#011627]">Active</option>
                                    <option value="INACTIVE" className="bg-[#011627]">Inactive</option>
                                    <option value="SUSPENDED" className="bg-[#011627]">Suspended</option>
                                </select>
                            </div>
                        </div>

                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by company, contact or email..."
                                className="h-11 pl-10 rounded-xl border-white/10 focus:ring-4 focus:ring-[#005477]/5 focus:border-[#005477] transition-all bg-white/10 text-white font-medium placeholder:text-slate-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="mt-8 overflow-x-auto custom-scrollbar italic-none">
                    <Card className="bg-[#232943] backdrop-blur-md border-none rounded-[2rem] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white">
                                Supplier Details
                            </h2>
                            <div className="text-xs font-semibold text-white/70">
                                Total <span className="text-white font-bold">{filteredSuppliers.length}</span> suppliers
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-white text-xs font-medium uppercase tracking-widest border-b border-white/10">
                                        <th className="px-8 py-6">Supplier Info</th>
                                        <th className="px-8 py-6">Contact Person</th>
                                        <th className="px-8 py-6 text-center">Contact Info</th>
                                        <th className="px-8 py-6 text-center">Status</th>
                                        <th className="px-8 py-6 text-center">Joined Date</th>
                                        <th className="px-8 py-6 text-right">Actions</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-white/5">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-white/10 border-t-[#005477]"></div>
                                                    <p className="text-sm font-bold text-slate-400 animate-pulse">Fetching Suppliers...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : visibleSuppliers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-20 text-center text-slate-400">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="p-4 bg-white/5 rounded-2xl shadow-sm border border-white/10">
                                                        <Building2 className="h-8 w-8 text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xl font-bold text-white">No suppliers found</p>
                                                        <p className="text-sm font-medium mt-1">Try a different search or register a new vendor.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        visibleSuppliers.map((supplier) => (
                                            <tr
                                                key={supplier._id}
                                                className="hover:bg-white/5 transition-colors group"
                                            >
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-white font-black group-hover:bg-[#005477] transition-all">
                                                            <Building2 className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-white font-black text-lg group-hover:text-white transition-colors leading-tight">
                                                                {supplier.name}
                                                            </span>
                                                            <span className="text-xs font-bold text-slate-400 mt-1 truncate max-w-[200px]">
                                                                {supplier.address || "No address recorded"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-slate-300">
                                                            <User className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-slate-200 font-bold text-sm">
                                                            {supplier.contactPerson}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-8 py-5 text-center">
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-white bg-white/10 px-3 py-1 rounded-full border border-white/5">
                                                            <Phone className="h-3 w-3 text-[#408c8c]" />
                                                            {supplier.phone}
                                                        </div>
                                                        {supplier.email && (
                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-white transition-colors">
                                                                <Mail className="h-3 w-3" />
                                                                {supplier.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-8 py-5 text-center">
                                                    <span className={cn(
                                                        "inline-flex items-center px-3.5 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border shadow-sm",
                                                        supplier.contractStatus === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                            supplier.contractStatus === 'INACTIVE' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                                                                'bg-red-500/10 text-red-400 border-red-500/20'
                                                    )}>
                                                        {supplier.contractStatus}
                                                    </span>
                                                </td>

                                                <td className="px-8 py-5 text-center text-sm font-bold text-slate-400">
                                                    {new Date(supplier.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>

                                                <td className="px-8 py-5">
                                                    <div className="flex justify-end items-center gap-3">
                                                        <button
                                                            onClick={() => router.push(`/modules/admin/supplier-management/${supplier._id}`)}
                                                            className="p-2.5 rounded-xl bg-white/5 hover:bg-[#005477]/10 text-white transition-all hover:scale-110 shadow-sm border border-white/10"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </button>

                                                        <button
                                                            onClick={() => router.push(`/modules/admin/supplier-management/edit?id=${supplier._id}`)}
                                                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-all hover:scale-110 shadow-sm border border-white/10"
                                                            title="Edit Supplier"
                                                        >
                                                            <Edit3 className="h-4.5 w-4.5" />
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                setDeleteId(supplier._id);
                                                                setShowDeleteDialog(true);
                                                            }}
                                                            className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all hover:scale-110 shadow-sm border border-red-500/20"
                                                            title="Remove Supplier"
                                                        >
                                                            <Trash2 className="h-4.5 w-4.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>

            <DeleteConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDelete}
                title="Permanently Remove Supplier?"
                description="Are you sure you want to remove this vendor? This will archive their transaction history and link associations. This action is irreversible."
                confirmClassName="bg-red-600 hover:bg-red-700 text-white font-black rounded-xl h-11"
                cancelText="Keep Supplier"
                confirmText="Yes, Remove Vendor"
            />

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
        </div>
    );
}
