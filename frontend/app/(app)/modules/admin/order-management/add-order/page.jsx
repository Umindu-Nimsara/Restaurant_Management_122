"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, ShoppingCart, Search, Plus, Minus, Trash2, Utensils, ChefHat, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { menuService } from "@/lib/menuService";
import { tableService } from "@/lib/tableService";
import { userService } from "@/lib/userService";
import { orderService } from "@/lib/orderService";
import { useAuth } from "@/lib/authContext";
import { cn } from "@/lib/utils";
import InvoiceSuccessDialog from "@/components/ui/InvoiceSuccessDialog";
import { generateInvoicePDF } from "@/lib/invoiceHelper";

function AddOrderForm() {
    const router = useRouter();
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const orderId = searchParams.get("id");

    const [menu, setMenu] = useState([]);
    const [tables, setTables] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedTable, setSelectedTable] = useState("");
    const [selectedStaff, setSelectedStaff] = useState("");
    const [search, setSearch] = useState("");
    const [cart, setCart] = useState([]);
    
    // Takeaway states
    const [orderType, setOrderType] = useState('Dine-In');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    // Invoice/Success State
    const [showSuccess, setShowSuccess] = useState(false);
    const [createdOrder, setCreatedOrder] = useState(null);

    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);
                // Fetch live menu from backend
                const liveMenu = await menuService.fetchMenuItems();
                setMenu(liveMenu || []);

                // Fetch live tables & staff from backend
                const [liveTables, liveStaff] = await Promise.all([
                    tableService.fetchTables(),
                    userService.fetchStaff()
                ]);
                setTables(liveTables || []);
                setStaff(liveStaff || []);

                // Set default staff to current user if not editing
                if (!orderId && user) {
                    setSelectedStaff(user.id);
                }

                // If editing, fetch order details
                if (orderId) {
                    const orderData = await orderService.getOrder(orderId); // read (orderID exists)
                    if (orderData) {
                        setOrderType(orderData.orderType || 'Dine-In');
                        setCustomerName(orderData.customerName || '');
                        setCustomerPhone(orderData.customerPhone || '');
                        setSelectedTable(orderData.tableId?._id || "");
                        setSelectedStaff(orderData.staffId?._id || "");
                        setCart(orderData.items.map(item => ({
                            _id: item.menuItemId?._id || item.menuItemId,
                            name: item.name,
                            price: item.price,
                            qty: item.qty,
                            note: item.note || ""
                        })));
                    }
                }
            } catch (err) {
                console.error("Init error:", err);
            } finally {
                setLoading(false);
            }
        };

        if (typeof window !== "undefined") {
            init();
        }
    }, [orderId]);

    const filteredMenu = useMemo(() => {
        if (!search.trim()) return menu;
        const q = search.toLowerCase();
        return menu.filter(it =>
            (it.name || "").toLowerCase().includes(q) ||
            (it.categoryId?.name || it.category || "").toLowerCase().includes(q)
        );
    }, [menu, search]);

    const addToCart = (item) => {
        const existing = cart.find(c => c._id === item._id);
        if (existing) {
            setCart(cart.map(c => c._id === item._id ? { ...c, qty: c.qty + 1 } : c));
        } else {
            setCart([...cart, {
                _id: item._id,
                name: item.name,
                price: Number(item.hasOwnProperty('effectivePrice') ? item.effectivePrice : item.price),
                qty: 1,
                note: ""
            }]);
        }
    };

    const updateQty = (id, delta) => {
        setCart(cart.map(c => {
            if (c._id === id) {
                const next = c.qty + delta;
                return next > 0 ? { ...c, qty: next } : c;
            }
            return c;
        }));
    };

    const removeItem = (id) => {
        setCart(cart.filter(c => c._id !== id));
    };

    const updateNote = (id, note) => {
        setCart(cart.map(c => c._id === id ? { ...c, note } : c));
    };

    const resetForm = () => {
        setCart([]);
        setSelectedTable("");
        setSelectedStaff(user?.id || "");
        setSearch("");
        setOrderType("Dine-In");
        setCustomerName("");
        setCustomerPhone("");
        setCreatedOrder(null);
    };

    const subtotal = useMemo(() => cart.reduce((acc, c) => acc + (c.price * c.qty), 0), [cart]);
    const tax = Math.round(subtotal * 0.0); // 10% tax
    const total = subtotal + tax;

    const handleSave = async () => {
        if (cart.length === 0) {
            alert("Please add at least one item.");
            return;
        }
        if (!selectedStaff) {
            alert("Please select a staff member.");
            return;
        }

        if (orderType === 'Dine-In' && !selectedTable) {
            alert("Please select a table for Dine-In orders.");
            return;
        }

        if (orderType === 'Takeaway' && (!customerName || !customerPhone)) {
            alert("Please provide both Customer Name and Phone for Takeaway orders.");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                orderType,
                tableId: orderType === 'Dine-In' ? selectedTable : undefined,
                customerName: orderType === 'Takeaway' ? customerName : undefined,
                customerPhone: orderType === 'Takeaway' ? customerPhone : undefined,
                staffId: selectedStaff,
                items: cart.map(c => ({
                    menuItemId: c._id,
                    qty: c.qty,
                    price: c.price,
                    note: c.note
                })),
                notes: "" // Top-level notes if needed
            };

            let res;
            if (orderId) {
                res = await orderService.updateOrder(orderId, payload);  // update 
                router.push("/modules/admin/order-management");
            } else {
                res = await orderService.createOrder(payload); // create(orderID is empty)
                setCreatedOrder(res);
                setShowSuccess(true);
            }
        } catch (err) {
            alert(`Failed to ${orderId ? 'update' : 'save'} order: ` + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen bg-[#011627]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#408c8c]"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Menu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-6 pt-24 bg-[#011627] min-h-screen flex flex-col">
            <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col">
                <div className="flex items-center gap-5 mb-10">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-2xl hover:bg-white/10 text-slate-400 hover:text-white transition-all transform active:scale-90 h-12 w-12 border border-white/5"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3 uppercase">
                            {orderId ? <Edit3 className="w-8 h-8 text-[#408c8c]" /> : <ChefHat className="w-8 h-8 text-[#408c8c]" />}
                            {orderId ? "Edit Order" : "Create Order"} <span className="text-slate-500 font-light">({orderId ? "Update" : "KOT"})</span>
                        </h1>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 pb-8">
                    {/* Left: Menu Picker */}
                    <div className="lg:col-span-8 flex flex-col bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-white/10 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3 col-span-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1 flex items-center gap-2">
                                        Order Type
                                    </label>
                                    <div className="flex bg-[#011627]/50 rounded-xl p-1 border border-white/10">
                                        <button
                                            type="button"
                                            onClick={() => setOrderType('Dine-In')}
                                            className={cn("flex-1 h-10 rounded-lg text-sm font-bold transition-all", orderType === 'Dine-In' ? "bg-[#408c8c] text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-white/5")}
                                        >
                                            Dine-In
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setOrderType('Takeaway')}
                                            className={cn("flex-1 h-10 rounded-lg text-sm font-bold transition-all", orderType === 'Takeaway' ? "bg-[#408c8c] text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-white/5")}
                                        >
                                            Takeaway
                                        </button>
                                    </div>
                                </div>

                                {orderType === 'Dine-In' ? (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1 flex items-center gap-2">
                                            Assign Table
                                        </label>
                                        <select
                                            value={selectedTable}
                                            onChange={(e) => setSelectedTable(e.target.value)}
                                            className="w-full h-12 rounded-xl border border-white/10 px-4 text-sm font-bold bg-[#011627]/50 text-white outline-none focus:ring-2 focus:ring-[#408c8c]/20 focus:border-[#408c8c] transition-all cursor-pointer appearance-none"
                                        >
                                            <option value="" disabled className="bg-[#011627]">-- Select Table --</option>
                                            {tables.map(t => <option key={t._id} value={t._id} className="bg-[#011627]">Table {t.tableNumber}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1 flex items-center gap-2">
                                                Customer Name
                                            </label>
                                            <input
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                placeholder="Enter Name"
                                                className="w-full h-12 rounded-xl border border-white/10 px-4 text-sm font-bold bg-[#011627]/50 text-white outline-none focus:ring-2 focus:ring-[#408c8c]/20 focus:border-[#408c8c] transition-all"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1 flex items-center gap-2">
                                                Customer Phone
                                            </label>
                                            <input
                                                value={customerPhone}
                                                onChange={(e) => setCustomerPhone(e.target.value)}
                                                placeholder="07XXXXXXXX"
                                                maxLength={10}
                                                className="w-full h-12 rounded-xl border border-white/10 px-4 text-sm font-bold bg-[#011627]/50 text-white outline-none focus:ring-2 focus:ring-[#408c8c]/20 focus:border-[#408c8c] transition-all"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className={cn("space-y-3", orderType === 'Takeaway' ? "col-span-2" : "")}>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1 flex items-center gap-2">
                                        Waitstaff
                                    </label>
                                    <select
                                        value={selectedStaff}
                                        onChange={(e) => setSelectedStaff(e.target.value)}
                                        className="w-full h-12 rounded-xl border border-white/10 px-4 text-sm font-bold bg-[#011627]/50 text-white outline-none focus:ring-2 focus:ring-[#408c8c]/20 focus:border-[#408c8c] transition-all cursor-pointer appearance-none"
                                    >
                                        <option value="" disabled className="bg-[#011627]">-- Select Staff --</option>
                                        {staff.map(s => <option key={s._id} value={s._id} className="bg-[#011627]">{s.name} ({s.role})</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-hover:text-[#408c8c] transition-colors" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by dish name or category..."
                                    className="w-full h-14 pl-14 pr-6 rounded-2xl border border-white/10 bg-white/5 text-lg font-medium text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.08] focus:border-[#408c8c]"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredMenu.map(item => (
                                    <button
                                        key={item._id}
                                        onClick={() => addToCart(item)}
                                        className="bg-white/5 p-4 rounded-3xl border border-white/10 shadow-lg hover:border-[#408c8c]/50 hover:bg-white/[0.08] transition-all text-left group flex flex-col relative overflow-hidden"
                                    >
                                        <div className="h-32 w-full rounded-2xl bg-black/20 mb-4 overflow-hidden relative">
                                            {item.imageUrl && item.imageUrl !== 'no-photo.jpg' ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center opacity-30">
                                                    <Utensils className="h-10 w-10 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1 px-1">
                                            <h4 className="text-sm font-black text-white line-clamp-2 min-h-[40px] leading-snug">
                                                {item.name}
                                            </h4>
                                            <div className="flex justify-between items-center pt-2">
                                                <div className="flex items-center gap-2">
                                                    {item.hasOwnProperty('effectivePrice') && item.effectivePrice !== item.originalPrice && (
                                                        <span className="text-[10px] font-bold text-slate-500 line-through">LKR {item.originalPrice}</span>
                                                    )}
                                                    <span className={cn(
                                                        "text-sm font-bold",
                                                        item.hasOwnProperty('effectivePrice') && item.effectivePrice < item.originalPrice ? "text-amber-400" : 
                                                        item.hasOwnProperty('effectivePrice') && item.effectivePrice > item.originalPrice ? "text-rose-400" : "text-[#408c8c]"
                                                    )}>
                                                        LKR {item.hasOwnProperty('effectivePrice') ? item.effectivePrice : item.price}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.categoryId?.name || "Dish"}</span>
                                            </div>
                                        </div>
                                        <div className="absolute top-6 right-6 p-2 rounded-full bg-[#408c8c] text-white transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-xl shadow-[#408c8c]/20">
                                            <Plus className="h-4 w-4" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Cart/Summary */}
                    <div className="lg:col-span-4 flex flex-col bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-white/10 bg-[#005477]/80 backdrop-blur-md text-white">
                            <div className="flex items-center gap-3 mb-2 opacity-80">
                                <ShoppingCart className="h-5 w-5" />
                                <span className="text-xs font-black uppercase tracking-[0.2em]">{orderId ? "Updating Order" : "Pending Order"}</span>
                            </div>
                            <p className="text-3xl font-black tracking-tight">LKR {total.toLocaleString()}</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-5 scrollbar-hide">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-40">
                                    <ShoppingCart className="h-16 w-16 mb-4" />
                                    <p className="text-sm font-black uppercase tracking-[0.2em] text-center px-10">Select dishes to generate KOT</p>
                                </div>
                            ) : (
                                cart.map(c => (
                                    <div key={c._id} className="space-y-4 p-5 rounded-3xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 transition-colors">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <p className="text-sm font-black text-white leading-tight">{c.name}</p>
                                                <p className="text-xs font-bold text-[#408c8c] mt-2">LKR {(c.price * c.qty).toLocaleString()}</p>
                                            </div>
                                            <button
                                                onClick={() => removeItem(c._id)}
                                                className="text-slate-600 hover:text-red-500 transition-colors p-1"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 pt-1">
                                            <input
                                                value={c.note}
                                                onChange={(e) => updateNote(c._id, e.target.value)}
                                                placeholder="Notes..."
                                                className="h-9 flex-1 text-[11px] font-bold rounded-xl border border-white/5 bg-white/5 px-3 text-white placeholder:text-slate-700 outline-none focus:border-[#408c8c]/50 transition-all"
                                            />
                                            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-1 shadow-inner">
                                                <button
                                                    onClick={() => updateQty(c._id, -1)}
                                                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 transition-colors"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="text-xs font-black text-white min-w-[20px] text-center">{c.qty}</span>
                                                <button
                                                    onClick={() => updateQty(c._id, 1)}
                                                    className="p-1.5 hover:bg-white/10 rounded-lg text-[#408c8c] transition-colors"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-8 bg-black/20 border-t border-white/10 space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                                    <span>Subtotal</span>
                                    <span className="text-slate-300">LKR {subtotal.toLocaleString()}</span>
                                </div>
                                {/* <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                                    <span>VAT/Tax (10%)</span>
                                    <span className="text-slate-300">LKR {tax.toLocaleString()}</span>
                                </div> */}
                            </div>
                            <Button
                                onClick={handleSave}
                                disabled={cart.length === 0}
                                className="w-full h-16 bg-[#408c8c] hover:bg-[#408c8c]/90 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-[#408c8c]/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-30"
                            >
                                <Save className="h-6 w-6" />
                                {orderId ? "Update Order" : "Print KOT & Save"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <InvoiceSuccessDialog
                open={showSuccess}
                onOpenChange={setShowSuccess}
                order={createdOrder}
                tableInfo={tables.find(t => t._id === selectedTable)}
                staffInfo={staff.find(s => s._id === selectedStaff)}
                resetForm={resetForm}
            />
        </div>
    );
}

export default function AddOrderPage() {
    return (
        <React.Suspense fallback={
            <div className="flex-1 flex items-center justify-center min-h-screen bg-[#011627]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#408c8c]"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading...</p>
                </div>
            </div>
        }>
            <AddOrderForm />
        </React.Suspense>
    );
}
