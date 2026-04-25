"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, ArrowLeft, RotateCcw, Building2, User, Phone, Mail, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function SupplierFormClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    const [form, setForm] = useState({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        contractStatus: "ACTIVE",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        if (id) {
            const fetchSupplier = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${apiUrl}/suppliers/${id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (data.success) {
                        setForm({
                            name: data.data.name || "",
                            contactPerson: data.data.contactPerson || "",
                            phone: data.data.phone || "",
                            email: data.data.email || "",
                            address: data.data.address || "",
                            contractStatus: data.data.contractStatus || "ACTIVE",
                        });
                    }
                } catch (error) {
                    console.error("Error fetching supplier:", error);
                }
            };
            fetchSupplier();
        }
    }, [id, apiUrl]);

    const isValid = useMemo(() => {
        const nameValid = form.name?.trim();
        const contactValid = form.contactPerson?.trim();
        const phoneValid = form.phone?.length === 10;
        const emailValid = !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

        return nameValid && contactValid && phoneValid && emailValid;
    }, [form]);

    const setField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!isValid) {
            alert("Please fill all required fields (Name, Contact Person, Phone).");
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const url = id ? `${apiUrl}/suppliers/${id}` : `${apiUrl}/suppliers`;
            const method = id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });

            const data = await res.json();
            if (data.success) {
                router.push("/modules/admin/supplier-management");
            } else {
                alert(data.error || "Failed to save supplier.");
            }
        } catch (error) {
            console.error("Error saving supplier:", error);
            alert("Connection error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 pb-20 bg-[#011627] min-h-screen">
            <div className="max-w-5xl mx-auto pt-16">
                <div className="flex items-center gap-5 mb-10 group">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-2xl hover:bg-white/10 text-slate-400 hover:text-white transition-all transform active:scale-90 h-14 w-14 border border-white/5"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tight">
                            {id ? "Edit Supplier" : "Register New Supplier"}
                        </h1>
                        <p className="text-slate-400 mt-2 font-medium">
                            {id ? "Update existing supplier information and status." : "Add a new vendor to your restaurant's supply chain."}
                        </p>
                    </div>
                </div>

                <Card className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl shadow-black/40 overflow-hidden">
                    <div className="p-10 md:p-16">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                            {/* Company Name */}
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-200 ml-1 flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5 text-white" />
                                    Company/Supplier Name <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setField("name", e.target.value)}
                                    placeholder="e.g. Fresh Garden Supplies"
                                    className="h-14 rounded-2xl border-white/10 bg-white/5 focus:border-[#408c8c] focus:ring-[#408c8c]/20 transition-all text-white placeholder:text-white/40 text-lg shadow-inner"
                                />
                            </div>

                            {/* Contact Person */}
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-200 ml-1 flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-white" />
                                    Contact Person <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={form.contactPerson}
                                    onChange={(e) => setField("contactPerson", e.target.value)}
                                    placeholder="Full Name"
                                    className="h-14 rounded-2xl border-white/10 bg-white/5 focus:border-[#408c8c] focus:ring-[#408c8c]/20 text-white placeholder:text-white/40 text-lg shadow-inner"
                                />
                            </div>

                            {/* Phone Number */}
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-200 ml-1 flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-white" />
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={form.phone}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                        setField("phone", val);
                                    }}
                                    placeholder="e.g. 0771234567"
                                    className="h-14 rounded-2xl border-white/10 bg-white/5 focus:border-[#408c8c] focus:ring-[#408c8c]/20 text-white placeholder:text-white/40 text-lg shadow-inner"
                                />
                            </div>

                            {/* Email Address */}
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-200 ml-1 flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-white" />
                                    Email Address
                                </label>
                                <Input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setField("email", e.target.value)}
                                    placeholder="supplier@example.com"
                                    className="h-14 rounded-2xl border-white/10 bg-white/5 focus:border-[#408c8c] focus:ring-[#408c8c]/20 text-white placeholder:text-white/40 text-lg shadow-inner"
                                />
                            </div>

                            {/* Status Selection */}
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-200 ml-1 flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                                    Contract Status
                                </label>
                                <div className="relative">
                                    <select
                                        value={form.contractStatus}
                                        onChange={(e) => setField("contractStatus", e.target.value)}
                                        className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-6 text-lg text-white shadow-inner outline-none focus:border-[#408c8c] focus:ring-4 focus:ring-[#408c8c]/10 transition-all cursor-pointer appearance-none"
                                    >
                                        <option value="ACTIVE" className="bg-[#011627]">Active</option>
                                        <option value="INACTIVE" className="bg-[#011627]">Inactive</option>
                                        <option value="SUSPENDED" className="bg-[#011627]">Suspended</option>
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <RotateCcw className="w-4 h-4 rotate-90" />
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-4 md:col-span-2">
                                <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-200 ml-1 flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-white" />
                                    Physical Address
                                </label>
                                <Input
                                    value={form.address}
                                    onChange={(e) => setField("address", e.target.value)}
                                    placeholder="Street, City, State, ZIP"
                                    className="h-14 rounded-2xl border-white/10 bg-white/5 focus:border-[#408c8c] focus:ring-[#408c8c]/20 text-white placeholder:text-white/40 text-lg shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="mt-20 pt-10 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <Button
                                variant="ghost"
                                onClick={() => setForm({ name: "", contactPerson: "", phone: "", email: "", address: "", contractStatus: "ACTIVE" })}
                                className="border border-white text-white hover:text-white hover:bg-white/5 rounded-2xl px-8 gap-3 h-14 font-bold transition-all"
                            >
                                <RotateCcw className="w-5 h-5" />
                                Clear Form
                            </Button>

                            <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    onClick={() => router.back()}
                                    className="h-14 px-10 rounded-2xl border-white/20 text-white hover:bg-white/10 hover:text-white font-black tracking-wide transition-all min-w-[140px]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={!isValid || isSubmitting}
                                    className="h-14 px-14 rounded-2xl bg-[#005477] hover:bg-[#005477]/80 text-white shadow-2xl shadow-[#005477]/30 font-black tracking-widest gap-3 min-w-[220px] transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white" />
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            {id ? "Update Supplier" : "Register Supplier"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
