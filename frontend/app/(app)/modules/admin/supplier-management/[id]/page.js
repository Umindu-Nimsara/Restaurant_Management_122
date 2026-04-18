"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Building2, User, Phone, Mail, MapPin,
    Package, History, Info, Plus, ChevronRight,
    Calendar, DollarSign, Tag, Trash2, CheckCircle2,
    AlertCircle, Scale, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function SupplierDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id;

    const [supplier, setSupplier] = useState(null);
    const [ingredients, setIngredients] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [isLinking, setIsLinking] = useState(false);

    // Purchase Form State
    const [purchaseForm, setPurchaseForm] = useState({
        ingredientId: "",
        quantity: "",
        unitPrice: "",
        cost: ""
    });
    const [purchaseErrors, setPurchaseErrors] = useState({});
    const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const fetchData = async () => {
        setLoading(true);
        try {
            const [supRes, ingRes, transRes] = await Promise.all([
                fetch(`${apiUrl}/suppliers/${id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${apiUrl}/inventory/ingredients`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${apiUrl}/suppliers/${id}/transactions`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const supData = await supRes.json();
            const ingData = await ingRes.json();
            const transData = await transRes.json();

            if (supData.success) setSupplier(supData.data);
            if (ingData.success) setIngredients(ingData.data);
            if (transData.success) setTransactions(transData.data);
        } catch (error) {
            console.error("Error fetching supplier data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id && token) fetchData();
    }, [id, token]);

    const linkedIngredients = useMemo(() => {
        if (!supplier || !ingredients.length) return [];
        return ingredients.filter(ing => supplier.suppliedIngredients?.includes(ing._id));
    }, [supplier, ingredients]);

    const unlinkedIngredients = useMemo(() => {
        if (!supplier || !ingredients.length) return ingredients;
        return ingredients.filter(ing => !supplier.suppliedIngredients?.includes(ing._id));
    }, [supplier, ingredients]);

    const handleLinkIngredient = async (ingId) => {
        try {
            const updatedIngredients = [...(supplier.suppliedIngredients || []), ingId];
            const res = await fetch(`${apiUrl}/suppliers/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ suppliedIngredients: updatedIngredients })
            });
            const data = await res.json();
            if (data.success) {
                setSupplier(data.data);
            }
        } catch (error) {
            console.error("Error linking ingredient:", error);
        }
    };

    const handleUnlinkIngredient = async (ingId) => {
        try {
            const updatedIngredients = supplier.suppliedIngredients.filter(id => id !== ingId);
            const res = await fetch(`${apiUrl}/suppliers/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ suppliedIngredients: updatedIngredients })
            });
            const data = await res.json();
            if (data.success) {
                setSupplier(data.data);
            }
        } catch (error) {
            console.error("Error unlinking ingredient:", error);
        }
    };

    const handlePurchase = async (e) => {
        e.preventDefault();
        if (!purchaseForm.ingredientId || !purchaseForm.quantity || !purchaseForm.cost) {
            alert("Please fill all purchase fields.");
            return;
        }

        setIsSubmittingPurchase(true);
        try {
            const res = await fetch(`${apiUrl}/suppliers/${id}/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(purchaseForm)
            });
            const data = await res.json();
            if (data.success) {
                setPurchaseForm({ ingredientId: "", quantity: "", unitPrice: "", cost: "" });
                setPurchaseErrors({});
                fetchData(); // Refresh everything
                alert("Purchase recorded successfully!");
            } else {
                alert(data.error || "Purchase failed.");
            }
        } catch (error) {
            console.error("Error recording purchase:", error);
        } finally {
            setIsSubmittingPurchase(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005477]"></div>
        </div>
    );

    if (!supplier) return (
        <div className="p-8 text-center">
            <h2 className="text-2xl font-bold">Supplier not found</h2>
            <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
        </div>
    );

    return (
        <div className="p-18 max-w-7xl mx-auto mb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push("/modules/admin/supplier-management")}
                        className="rounded-xl hover:bg-gray-500 bg-white text-[#005477]"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black text-white leading-tight">
                                {supplier.name}
                            </h1>
                            <div className={cn(
                                "px-4 py-1.5 rounded-full text-xs font-black border tracking-wider uppercase shadow-sm",
                                supplier.contractStatus === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                            )}>
                                {supplier.contractStatus}
                            </div>
                        </div>
                        <p className="text-white font-medium flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4 text-white" />
                            Partner since {new Date(supplier.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => router.push(`/modules/admin/supplier-management/edit?id=${id}`)}
                    className="bg-white hover:bg-gray-50 text-[#005477] border-2 border-[#005477]/20 rounded-2xl px-6 h-12 font-bold flex gap-2 transition-all hover:border-[#005477]"
                >
                    <Pencil className="w-4 h-4" />
                    Edit Profile
                </Button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 p-1.5 bg-gray-100/80 backdrop-blur-sm rounded-3xl w-fit mb-10 border border-gray-200 shadow-inner">
                {[
                    { id: "overview", label: "Overview", icon: Info },
                    { id: "ingredients", label: "Ingredients", icon: Package },
                    { id: "transactions", label: "Transactions", icon: History }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2.5 px-8 py-3 rounded-2xl text-sm font-bold transition-all duration-300",
                            activeTab === tab.id
                                ? "bg-white text-[#005477] shadow-xl shadow-[#005477]/10"
                                : "text-gray-500 hover:text-[#005477] hover:bg-white/50"
                        )}
                    >
                        <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-[#005477]" : "text-gray-400")} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2">
                    {activeTab === "overview" && (
                        <div className="space-y-8">
                            {/* Contact Information Card */}
                            <Card className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-[#005477]/5 border-none">
                                <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                                    <div className="p-2 bg-[#005477]/5 rounded-xl text-[#005477]">
                                        <Info className="w-6 h-6" />
                                    </div>
                                    Contact Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                                    <div className="space-y-2 group">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <User className="w-3 h-3" /> Contact Person
                                        </label>
                                        <p className="text-xl font-bold text-gray-800 group-hover:text-[#005477] transition-colors">{supplier.contactPerson}</p>
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Phone className="w-3 h-3" /> Phone Number
                                        </label>
                                        <p className="text-xl font-bold text-gray-800 group-hover:text-[#005477] transition-colors">{supplier.phone}</p>
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Mail className="w-3 h-3" /> Email Address
                                        </label>
                                        <p className="text-xl font-bold text-gray-800 break-all group-hover:text-[#005477] transition-colors">{supplier.email || "Not Provided"}</p>
                                    </div>
                                    <div className="space-y-2 group md:col-span-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <MapPin className="w-3 h-3" /> Location / Address
                                        </label>
                                        <p className="text-xl font-bold text-gray-800 leading-relaxed group-hover:text-[#005477] transition-colors">{supplier.address || "No address recorded"}</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Business & Contract Details Card */}
                            <Card className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-[#005477]/5 border-none">
                                <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                                    <div className="p-2 bg-[#005477]/5 rounded-xl text-[#005477]">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    Business & Contract Details
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                                    <div className="space-y-2 group">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Tag className="w-3 h-3" /> Supplier Category
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="px-4 py-2 bg-[#005477]/10 text-[#005477] rounded-xl font-bold text-lg">
                                                {supplier.category || 'Other'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <DollarSign className="w-3 h-3" /> Payment Terms
                                        </label>
                                        <p className="text-xl font-bold text-gray-800 group-hover:text-[#005477] transition-colors">{supplier.paymentTerms || 'Net 30'}</p>
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Calendar className="w-3 h-3" /> Contract Expiry Date
                                        </label>
                                        {supplier.contractExpiryDate ? (
                                            <div className="flex items-center gap-3">
                                                <p className="text-xl font-bold text-gray-800">{new Date(supplier.contractExpiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                {(() => {
                                                    const daysUntilExpiry = Math.ceil((new Date(supplier.contractExpiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                                                    if (daysUntilExpiry < 0) {
                                                        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-black">EXPIRED</span>;
                                                    } else if (daysUntilExpiry <= 30) {
                                                        return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-black">EXPIRING SOON</span>;
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                        ) : (
                                            <p className="text-xl font-bold text-gray-400">Not Set</p>
                                        )}
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <CheckCircle2 className="w-3 h-3" /> Business Registration No
                                        </label>
                                        <p className="text-xl font-bold text-gray-800 group-hover:text-[#005477] transition-colors">{supplier.businessRegistrationNo || 'Not Provided'}</p>
                                    </div>
                                    <div className="space-y-2 group md:col-span-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <CheckCircle2 className="w-3 h-3" /> VAT Number
                                        </label>
                                        <p className="text-xl font-bold text-gray-800 group-hover:text-[#005477] transition-colors">{supplier.vatNumber || 'Not Provided'}</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Supplier Rating Card */}
                            <Card className="bg-gradient-to-br from-[#005477] to-[#003d5c] text-white rounded-[2.5rem] p-10 shadow-2xl shadow-[#005477]/20 border-none">
                                <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-xl">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    Supplier Performance Rating
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Delivery Speed */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-white/70 uppercase tracking-widest">Delivery Speed</label>
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <span key={star} className={star <= (supplier.rating?.deliverySpeed || 5) ? 'text-yellow-400' : 'text-white/20'}>
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="text-2xl font-black">{supplier.rating?.deliverySpeed || 5}/5</span>
                                        </div>
                                    </div>

                                    {/* Quality */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-white/70 uppercase tracking-widest">Product Quality</label>
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <span key={star} className={star <= (supplier.rating?.quality || 5) ? 'text-yellow-400' : 'text-white/20'}>
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="text-2xl font-black">{supplier.rating?.quality || 5}/5</span>
                                        </div>
                                    </div>

                                    {/* Communication */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-white/70 uppercase tracking-widest">Communication</label>
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <span key={star} className={star <= (supplier.rating?.communication || 5) ? 'text-yellow-400' : 'text-white/20'}>
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="text-2xl font-black">{supplier.rating?.communication || 5}/5</span>
                                        </div>
                                    </div>

                                    {/* Pricing */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-white/70 uppercase tracking-widest">Pricing</label>
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <span key={star} className={star <= (supplier.rating?.pricing || 5) ? 'text-yellow-400' : 'text-white/20'}>
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="text-2xl font-black">{supplier.rating?.pricing || 5}/5</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Overall Rating */}
                                <div className="mt-8 pt-8 border-t border-white/20">
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-black text-white/70 uppercase tracking-widest">Overall Rating</span>
                                        <div className="flex items-center gap-4">
                                            <div className="flex gap-1 text-3xl">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <span key={star} className={star <= Math.round(supplier.averageRating || 5) ? 'text-yellow-400' : 'text-white/20'}>
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="text-4xl font-black">{supplier.averageRating || '5.0'}/5</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === "ingredients" && (
                        <Card className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-[#005477]/5 border-none">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                    <div className="p-2 bg-[#005477]/5 rounded-xl text-[#005477]">
                                        <Package className="w-6 h-6" />
                                    </div>
                                    Supplied Ingredients
                                </h2>
                                <Button
                                    onClick={() => setIsLinking(!isLinking)}
                                    className={cn(
                                        "rounded-2xl px-6 h-12 font-bold flex gap-2 transition-all",
                                        isLinking ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-[#005477] hover:bg-[#005477]/90 text-white shadow-lg shadow-[#005477]/10"
                                    )}
                                >
                                    {isLinking ? "Done" : (
                                        <>
                                            <Plus className="w-5 h-5" />
                                            Link New Item
                                        </>
                                    )}
                                </Button>
                            </div>

                            {isLinking ? (
                                <div className="space-y-4">
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Available for linking</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {unlinkedIngredients.length === 0 ? (
                                            <p className="text-gray-500 italic pb-4">No more ingredients to link.</p>
                                        ) : unlinkedIngredients.map(ing => (
                                            <div key={ing._id} className="p-5 rounded-3xl border-2 border-dashed border-gray-100 hover:border-[#005477]/30 hover:bg-[#005477]/5 transition-all flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-[#005477] font-black text-xs">
                                                        {ing.unit}
                                                    </div>
                                                    <span className="font-bold text-gray-700">{ing.name}</span>
                                                </div>
                                                <Button size="icon" variant="ghost" onClick={() => handleLinkIngredient(ing._id)} className="rounded-full text-[#005477] hover:bg-[#005477] hover:text-white transition-all scale-0 group-hover:scale-110">
                                                    <Plus className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {linkedIngredients.length === 0 ? (
                                        <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                                            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 font-bold">No ingredients linked yet.</p>
                                            <p className="text-sm text-gray-400 mt-1">Link items to start tracking purchases.</p>
                                        </div>
                                    ) : linkedIngredients.map(ing => (
                                        <div key={ing._id} className="p-6 rounded-[2rem] bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-xl hover:shadow-[#005477]/5 transition-all group flex items-center justify-between">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-col">
                                                    <span className="text-[#005477] font-black leading-none">{ing.quantity}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{ing.unit}</span>
                                                </div>
                                                <div>
                                                    <p className="text-lg font-black text-gray-900 group-hover:text-[#005477] transition-colors">{ing.name}</p>
                                                    <p className="text-sm text-gray-400 font-bold flex items-center gap-2">
                                                        Min Level: {ing.minLevel} {ing.unit}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleUnlinkIngredient(ing._id)}
                                                className="text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}

                    {activeTab === "transactions" && (
                        <Card className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-[#005477]/5 border-none">
                            <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                                <div className="p-2 bg-[#005477]/5 rounded-xl text-[#005477]">
                                    <History className="w-6 h-6" />
                                </div>
                                Transaction Records
                            </h2>
                            <div className="space-y-4">
                                {transactions.length === 0 ? (
                                    <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                                        <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 font-bold">No purchase history found.</p>
                                    </div>
                                ) : transactions.map(tx => (
                                    <div key={tx._id} className="p-6 rounded-[2rem] bg-white border border-gray-100 hover:shadow-xl hover:shadow-[#005477]/5 transition-all group grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                                        <div className="col-span-1 space-y-1">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Date</p>
                                            <p className="font-bold text-gray-700">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="col-span-1 space-y-1">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Ingredient</p>
                                            <p className="font-bold text-gray-900 group-hover:text-[#005477] transition-colors">{tx.ingredientId?.name}</p>
                                        </div>
                                        <div className="col-span-1 space-y-1">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Quantity</p>
                                            <p className="font-black text-[#005477]">{tx.quantity} <span className="text-[10px] text-gray-400">{tx.ingredientId?.unit}</span></p>
                                        </div>
                                        <div className="col-span-1 space-y-1">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Cost</p>
                                            <p className="font-black text-green-600">${tx.cost?.toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Sidebar - Purchase Recording */}
                <div className="space-y-8">
                    <Card className="bg-[#005477] text-white rounded-[2.5rem] p-10 shadow-2xl shadow-[#005477]/20 border-none relative overflow-hidden">
                        <div className="absolute top-[-20%] right-[-20%] w-60 h-60 bg-white/5 rounded-full blur-3xl pointer-events-none" />

                        <h2 className="text-2xl font-black mb-8 flex items-center gap-3 relative z-10">
                            <Plus className="w-8 h-8 p-1.5 bg-white/20 rounded-xl" />
                            New Purchase
                        </h2>

                        <form onSubmit={handlePurchase} className="space-y-6 relative z-10">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-[#8ec6e1] uppercase tracking-widest flex items-center gap-2">
                                    <Tag className="w-3 h-3" /> Select Ingredient
                                </label>
                                <select
                                    className="w-full h-14 bg-white/10 border border-white/20 rounded-2xl px-5 text-lg font-bold outline-none focus:bg-white/20 focus:border-white/40 transition-all cursor-pointer placeholder:text-blue-200 text-white"
                                    value={purchaseForm.ingredientId}
                                    onChange={(e) => setPurchaseForm({ ...purchaseForm, ingredientId: e.target.value })}
                                    required
                                >
                                    <option value="" disabled className="text-gray-800">-- Select Linked Item --</option>
                                    {linkedIngredients.map(ing => (
                                        <option key={ing._id} value={ing._id} className="text-gray-800">{ing.name}</option>
                                    ))}
                                    {linkedIngredients.length === 0 && <option disabled className="text-gray-400 italic">No items linked</option>}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-[#8ec6e1] uppercase tracking-widest flex items-center gap-2">
                                    <Scale className="w-3 h-3" /> Purchase Quantity
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="0.00"
                                    className={cn(
                                        "h-14 bg-white/10 border-white/20 rounded-2xl px-5 text-xl font-black text-white placeholder:text-white/30 focus:bg-white/20 transition-colors",
                                        purchaseErrors.quantity && "border-red-500 bg-red-500/10 focus:border-red-500"
                                    )}
                                    value={purchaseForm.quantity}
                                    onChange={(e) => {
                                        const rawVal = e.target.value;
                                        const numVal = parseFloat(rawVal);

                                        if (numVal < 0 || rawVal.includes('-')) {
                                            setPurchaseErrors(prev => ({ ...prev, quantity: "Minus values cannot be entered." }));
                                        } else {
                                            setPurchaseErrors(prev => ({ ...prev, quantity: null }));
                                        }

                                        const val = Math.max(0, numVal || 0);
                                        const total = (val * (parseFloat(purchaseForm.unitPrice) || 0)).toFixed(2);
                                        setPurchaseForm({ ...purchaseForm, quantity: rawVal, cost: total });
                                    }}
                                    required
                                />
                                {purchaseErrors.quantity && (
                                    <p className="text-xs text-red-400 font-bold flex items-center gap-1 mt-1 transition-all">
                                        <AlertCircle className="w-3 h-3" /> {purchaseErrors.quantity}
                                    </p>
                                )}
                                {purchaseForm.ingredientId && !purchaseErrors.quantity && (
                                    <p className="text-xs text-[#8ec6e1] font-bold">
                                        Unit: {ingredients.find(i => i._id === purchaseForm.ingredientId)?.unit}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-[#8ec6e1] uppercase tracking-widest flex items-center gap-2">
                                    <DollarSign className="w-3 h-3" /> Unit Price ($)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    className={cn(
                                        "h-14 bg-white/10 border-white/20 rounded-2xl px-5 text-xl font-black text-white placeholder:text-white/30 focus:bg-white/20 transition-colors",
                                        purchaseErrors.unitPrice && "border-red-500 bg-red-500/10 focus:border-red-500"
                                    )}
                                    value={purchaseForm.unitPrice}
                                    onChange={(e) => {
                                        const rawVal = e.target.value;
                                        const numVal = parseFloat(rawVal);

                                        if (numVal < 0 || rawVal.includes('-')) {
                                            setPurchaseErrors(prev => ({ ...prev, unitPrice: "Minus values cannot be entered." }));
                                        } else {
                                            setPurchaseErrors(prev => ({ ...prev, unitPrice: null }));
                                        }

                                        const val = Math.max(0, numVal || 0);
                                        const total = ((parseFloat(purchaseForm.quantity) || 0) * val).toFixed(2);
                                        setPurchaseForm({ ...purchaseForm, unitPrice: rawVal, cost: total });
                                    }}
                                    required
                                />
                                {purchaseErrors.unitPrice && (
                                    <p className="text-xs text-red-400 font-bold flex items-center gap-1 mt-1 transition-all">
                                        <AlertCircle className="w-3 h-3" /> {purchaseErrors.unitPrice}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-[#8ec6e1] uppercase tracking-widest flex items-center gap-2">
                                    <DollarSign className="w-3 h-3" /> Total Cost ($)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    className={cn(
                                        "h-14 bg-white/10 border-white/20 rounded-2xl px-5 text-xl font-black text-white placeholder:text-white/30 focus:bg-white/20 transition-colors",
                                        purchaseErrors.cost && "border-red-500 bg-red-500/10 focus:border-red-500"
                                    )}
                                    value={purchaseForm.cost}
                                    onChange={(e) => {
                                        const rawVal = e.target.value;
                                        const numVal = parseFloat(rawVal);

                                        if (numVal < 0 || rawVal.includes('-')) {
                                            setPurchaseErrors(prev => ({ ...prev, cost: "Minus values cannot be entered." }));
                                        } else {
                                            setPurchaseErrors(prev => ({ ...prev, cost: null }));
                                        }

                                        setPurchaseForm({ ...purchaseForm, cost: rawVal });
                                    }}
                                    required
                                />
                                {purchaseErrors.cost && (
                                    <p className="text-xs text-red-400 font-bold flex items-center gap-1 mt-1 transition-all">
                                        <AlertCircle className="w-3 h-3" /> {purchaseErrors.cost}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmittingPurchase || linkedIngredients.length === 0 || purchaseErrors.quantity || purchaseErrors.unitPrice || purchaseErrors.cost}
                                className="w-full h-16 bg-white hover:bg-gray-100 text-[#005477] font-black text-xl rounded-2xl shadow-xl shadow-black/10 mt-4 transition-transform active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isSubmittingPurchase ? (
                                    <div className="animate-spin rounded-full h-6 w-6 border-4 border-[#005477]/30 border-t-[#005477]" />
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-6 h-6" />
                                        Record Stock
                                    </>
                                )}
                            </Button>
                        </form>
                    </Card>

                    <Card className="bg-gradient-to-br from-[#005477]/5 to-[#005477]/10 rounded-[2.5rem] p-8 border border-[#005477]/10">
                        <div className="flex items-center gap-3 mb-6">
                            <History className="w-5 h-5 text-[#005477]" />
                            <h3 className="font-black text-gray-900 tracking-tight">Recent Activity</h3>
                        </div>
                        <div className="space-y-5">
                            {transactions.slice(0, 3).map(tx => (
                                <div key={tx._id} className="flex gap-4 group">
                                    <div className="w-1.5 h-auto bg-[#005477]/20 rounded-full group-hover:bg-[#005477] transition-colors" />
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">{tx.ingredientId?.name}</p>
                                        <p className="text-xs text-gray-500 font-medium">Purchased {tx.quantity} {tx.ingredientId?.unit} for ${tx.cost}</p>
                                        <p className="text-[10px] text-gray-400 font-black uppercase mt-1 tracking-tighter">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                            {transactions.length === 0 && <p className="text-sm text-gray-400 font-bold italic">No recent transactions.</p>}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Add custom scrollbar styles to global or component
const scrollbarStyle = `
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
`;
