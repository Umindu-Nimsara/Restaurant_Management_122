"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, History, ChefHat, Utensils, CheckCircle, XCircle, Search, FileDown, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { orderService } from "@/lib/orderService";
import { useAuth } from "@/lib/authContext";

function OrderManagement() {
    const router = useRouter();
    const { user } = useAuth();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ACTIVE"); // ACTIVE, ALL

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await orderService.fetchAllOrders();
            setOrders(data || []);
        } catch (err) {
            console.error("Failed to fetch orders:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filteredOrders = useMemo(() => {
        let result = orders;

        if (statusFilter === "ACTIVE") {
            result = result.filter(o => ["PENDING", "COOKING", "SERVED"].includes(o.status));
        } else if (statusFilter !== "ALL") {
            result = result.filter(o => o.status === statusFilter);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(o =>
                o.orderNo?.toLowerCase().includes(q) ||
                o.tableId?.tableNumber?.toLowerCase().includes(q)
            );
        }

        return [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [orders, search, statusFilter]);

    const updateStatus = async (orderId, newStatus) => {
        try {
            await orderService.updateOrderStatus(orderId, newStatus);
            fetchOrders();
        } catch (err) {
            alert("Failed to update status: " + err.message);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "PENDING": return "bg-gray-100 text-gray-700 border-gray-200";
            case "COOKING": return "bg-orange-100 text-orange-700 border-orange-200";
            case "SERVED": return "bg-blue-100 text-blue-700 border-blue-200";
            case "PAID": return "bg-green-100 text-green-700 border-green-200";
            case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.setTextColor(0, 84, 119);
        doc.text("OceanBreeze Restaurant - Order Report", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`View: ${statusFilter === "ACTIVE" ? "Active Orders" : "All Orders"}`, 14, 36);

        const tableColumn = ["Order ID", "Table", "Staff/Customer", "Status", "Items", "Total (LKR)", "Time"];
        const tableRows = filteredOrders.map(order => [
            order.orderNo,
            order.tableId?.tableNumber || "N/A",
            order.staffId?.name || "Customer",
            order.status,
            order.items?.map(i => `${i.qty}x ${i.name}`).join(", "),
            Number(order.total || 0).toLocaleString(),
            new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [0, 84, 119], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [240, 247, 247] },
            margin: { top: 45 }
        });

        doc.save(`OceanBreeze_Orders_${statusFilter}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="flex-1 p-8 pt-24 bg-[#181E38] min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Order Management</h1>
                    <p className="text-gray-400 mt-1">Real-time tracking of active customer kitchen orders.</p>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={exportToPDF}
                        disabled={filteredOrders.length === 0}
                        className="flex items-center gap-2 border-[#408c8c] text-white hover:bg-[#408c8c]/20 h-10 hover:text-white px-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-[#408c8c]/10 transition-all hover:scale-110"
                    >
                        <FileDown className="h-4 w-4" />
                        Export PDF
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push("/modules/admin/order-management/history")}
                        className="flex items-center gap-2 border-white/20 text-white hover:bg-white/10 hover:text-white h-10 px-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-white/5 transition-all hover:scale-110"
                    >
                        <History className="h-4 w-4" />
                        Order History
                    </Button>
                    <Button
                        onClick={() => router.push("/modules/admin/order-management/add-order")}
                        className="bg-[#005477] hover:bg-[#005477]/90 text-white flex items-center gap-2 transition-all hover:scale-110"
                    >
                        <Plus className="h-4 w-4" />
                        Create New KOT
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 mb-6 bg-[#1A1937] p-4 rounded-2xl shadow-sm border border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by Order # or Table..."
                            className="h-10 w-[300px] pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:ring-4 focus:ring-[#005477]/10 focus:border-[#005477] outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">View Mode</span>
                    {[
                        { id: "ACTIVE", label: "Active Orders" },
                        { id: "PENDING", label: "Pending" },
                        { id: "COOKING", label: "Cooking" },
                        { id: "SERVED", label: "Served" },
                        { id: "ALL", label: "All Orders" },
                    ].map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setStatusFilter(filter.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all ${
                                statusFilter === filter.id 
                                ? 'bg-[#005477] text-white shadow-lg shadow-[#005477]/20 border border-[#005477]' 
                                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {statusFilter !== "ALL" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
                    {filteredOrders.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <div className="flex flex-col items-center gap-2">
                                <Utensils className="h-12 w-12 text-gray-300 mb-2" />
                                <p className="text-lg font-bold text-gray-900">No matching orders found</p>
                                <p className="text-sm text-gray-500 text-center max-w-xs mx-auto">Active orders will appear here as soon as they are created from the POS or KOT interface.</p>
                            </div>
                        </div>
                    ) : (
                        filteredOrders.map(order => (
                            <div
                                key={order._id}
                                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group animate-in fade-in slide-in-from-top-4 duration-500"
                            >
                                <div className="p-5 border-b border-gray-50 bg-gray-50/50 backdrop-blur-sm flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-[#005477]">{order.orderNo}</span>
                                            <div className={cn(
                                                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border",
                                                getStatusStyle(order.status),
                                                order.status === "COOKING" && "animate-pulse"
                                            )}>
                                                {order.status}
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900 mt-1">Table {order.tableId?.tableNumber || "N/A"}</h3>
                                        {order.notes && <p className="text-[10px] text-orange-600 italic font-bold mt-1">Note: {order.notes}</p>}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Waitstaff / Customer</p>
                                        <p className="text-xs font-semibold text-gray-700">{order.staffId?.name || "Customer"}</p>
                                    </div>
                                </div>

                                <div className="p-5 space-y-4">
                                    <div className="space-y-2">
                                        {order.items?.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-start">
                                                <div className="flex gap-2">
                                                    <span className="text-sm font-bold text-[#005477] opacity-60">x{item.qty}</span>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                                                        {item.note && <p className="text-[10px] text-orange-600 italic">"{item.note}"</p>}
                                                    </div>
                                                </div>
                                                <span className="text-sm font-mono font-medium text-gray-500">LKR {item.price * item.qty}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Grand Total</span>
                                        <span className="text-lg font-black text-[#005477]">LKR {Number(order.total).toLocaleString()}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-2 opacity-100 group-hover:opacity-100 transition-opacity duration-300">
                                        {order.status === "PENDING" && (
                                            <>
                                                <Button
                                                    onClick={() => router.push(`/modules/admin/order-management/add-order?id=${order._id}`)}
                                                    variant="outline"
                                                    className="col-span-1 bg-white border-[#005477]/30 text-[#005477] hover:bg-[#005477]/5 rounded-xl h-11 text-xs font-bold uppercase transition-all"
                                                >
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit Order
                                                </Button>
                                                <Button
                                                    onClick={() => updateStatus(order._id, "COOKING")}
                                                    className="col-span-1 bg-[#005477] hover:bg-[#005477]/90 text-white rounded-xl h-11 text-xs font-bold uppercase transition-all"
                                                >
                                                    <ChefHat className="h-4 w-4 mr-2" />
                                                    Send to Kitchen
                                                </Button>
                                            </>
                                        )}
                                        {order.status === "COOKING" && (
                                            <Button
                                                onClick={() => updateStatus(order._id, "SERVED")}
                                                className="col-span-2 bg-[#005477] hover:bg-[#005477]/90 text-white rounded-xl h-11 text-xs font-bold uppercase transition-all"
                                            >
                                                <Utensils className="h-4 w-4 mr-2" />
                                                Order Ready / Serve
                                            </Button>
                                        )}
                                        {order.status === "SERVED" && (
                                            <Button
                                                onClick={() => updateStatus(order._id, "PAID")}
                                                className="col-span-2 bg-green-600 hover:bg-green-700 text-white rounded-xl h-11 text-xs font-bold uppercase transition-all"
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Settle / Mark Paid
                                            </Button>
                                        )}
                                        {["PENDING", "COOKING"].includes(order.status) && (
                                            <Button
                                                onClick={() => updateStatus(order._id, "CANCELLED")}
                                                variant="ghost"
                                                className="col-span-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl h-11 text-xs font-bold uppercase"
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Cancel Order
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* ALL ORDERS TABLE VIEW */
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Order ID</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Table / Target</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Waitstaff</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Items Summary</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none text-right">Total</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center text-gray-400">
                                            No orders found in history.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map(order => (
                                        <tr key={order._id} className="hover:bg-gray-50/50 transition-colors cursor-default group">
                                            <td className="px-6 py-4 text-xs font-bold text-[#005477] whitespace-nowrap">
                                                {order.orderNo}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">
                                                Table {order.tableId?.tableNumber || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-600 font-medium whitespace-nowrap">
                                                {order.staffId?.name || "Customer"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={cn(
                                                    "inline-flex px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border",
                                                    getStatusStyle(order.status)
                                                )}>
                                                    {order.status}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <p className="text-xs text-gray-500 line-clamp-1">
                                                    {order.items?.map(i => `${i.qty}x ${i.name}`).join(", ")}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-black text-[#005477] text-right whitespace-nowrap">
                                                LKR {Number(order.total).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-[10px] font-medium text-gray-400 whitespace-nowrap uppercase">
                                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrderManagement;