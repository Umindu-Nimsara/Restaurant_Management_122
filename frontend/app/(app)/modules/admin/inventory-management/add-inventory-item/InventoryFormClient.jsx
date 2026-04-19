"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlusCircle, ArrowLeft, Save, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STORAGE_KEY = "oceanbreeze_inventory_items_v1";
const DRAFT_KEY = "oceanbreeze_inventory_item_draft_v1";

const UNIT_OPTIONS = [
    { value: "kg", label: "Kilograms (kg)" },
    { value: "g", label: "Grams (g)" },
    { value: "L", label: "Liters (L)" },
    { value: "ml", label: "Milliliters (ml)" },
    { value: "pcs", label: "Pieces (pcs)" },
];

export default function AddInventoryItemPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    const [form, setForm] = useState({
        name: "",
        unit: "",
        quantity: "",
        minLevel: "",
        costPerUnit: "",
        expiryDate: "",
    });

    const [errors, setErrors] = useState({
        quantity: "",
        minLevel: "",
        costPerUnit: "",
        expiryDate: ""
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    // Load from Backend or Draft
    useEffect(() => {
        if (typeof window === "undefined") return;

        const loadItem = async () => {
            if (id) {
                try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${apiUrl}/inventory/ingredients`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (data.success) {
                        const item = data.data.find((it) => String(it._id) === id);
                        if (item) {
                            setForm({
                                name: item.name || "",
                                unit: item.unit || "",
                                quantity: String(item.quantity || "0"),
                                minLevel: String(item.minLevel || "0"),
                                costPerUnit: item.costPerUnit != null ? String(item.costPerUnit) : "",
                                expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : "",
                            });
                        }
                    }
                } catch (e) {
                    console.error("Error loading item for edit:", e);
                }
            } else {
                // Load draft
                try {
                    const raw = localStorage.getItem(DRAFT_KEY);
                    if (raw) setForm(JSON.parse(raw));
                } catch (e) { }
            }
        };

        loadItem();
    }, [id, apiUrl]);

    // Auto-save draft only for new items
    useEffect(() => {
        if (typeof window === "undefined" || id) return;
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    }, [form, id]);

    const isValid = useMemo(() => {
        const hasFormValues = (
            form.name.trim() &&
            form.unit &&
            form.quantity.trim() !== "" &&
            form.minLevel.trim() !== ""
        );
        const hasNoErrors = !errors.quantity && !errors.minLevel && !errors.costPerUnit && !errors.expiryDate;
        return hasFormValues && hasNoErrors;
    }, [form, errors]);

    const setField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));

        // Real-time validation
        if (key === "quantity" || key === "minLevel" || key === "costPerUnit") {
            if (Number(value) < 0) {
                setErrors(prev => ({ ...prev, [key]: "Value cannot be negative" }));
            } else {
                setErrors(prev => ({ ...prev, [key]: "" }));
            }
        }

        if (key === "expiryDate") {
            if (value) {
                const selected = new Date(value).setHours(0, 0, 0, 0);
                const today = new Date().setHours(0, 0, 0, 0);
                if (selected < today) {
                    setErrors(prev => ({ ...prev, expiryDate: "Expiry date cannot be in the past" }));
                } else {
                    setErrors(prev => ({ ...prev, expiryDate: "" }));
                }
            } else {
                setErrors(prev => ({ ...prev, expiryDate: "" }));
            }
        }
    };

    const handleSave = async () => {
        if (!isValid) {
            alert("Please fill all required fields.");
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const url = id
                ? `${apiUrl}/inventory/ingredients/${id}`
                : `${apiUrl}/inventory/ingredients`;

            const method = id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...form,
                    quantity: Number(form.quantity),
                    minLevel: Number(form.minLevel),
                    costPerUnit: form.costPerUnit ? Number(form.costPerUnit) : 0,
                })
            });

            const data = await res.json();
            if (data.success) {
                if (!id) localStorage.removeItem(DRAFT_KEY);
                router.push("/modules/admin/inventory-management");
            } else {
                alert(data.error || 'Save failed');
            }
        } catch (e) {
            console.error("Error saving ingredient:", e);
            alert("Connection failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="pt-24 max-w-5xl mx-auto px-6 pb-20">
            <div className="flex items-center gap-4 mb-10 animate-in fade-in slide-in-from-left duration-700">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
                        {id ? "Edit Ingredient" : "Add New Ingredient"}
                    </h1>
                    <p className="text-[#408c8c] font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Inventory Control System</p>
                </div>
            </div>

            <div className="bg-[#002b3d]/40 backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                <div className="p-10 md:p-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                        {/* Ingredient Name */}
                        <div className="space-y-3 group">
                            <label className="text-[10px] font-black uppercase text-slate-100 tracking-[0.2em] pl-1 group-focus-within:text-[#408c8c] transition-colors">
                                Ingredient Name <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                value={form.name}
                                onChange={(e) => setField("name", e.target.value)}
                                placeholder="e.g. Fresh Tomatoes"
                                className="h-16 rounded-[1.5rem] bg-white/5 border-white/10 focus:border-[#408c8c] focus:bg-white/10 transition-all text-lg font-bold text-white placeholder:text-slate-400 px-8"
                            />
                        </div>

                        {/* Unit Selection */}
                        <div className="space-y-3 group">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] pl-1 group-focus-within:text-[#408c8c] transition-colors">
                                Measurement Unit <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={form.unit}
                                    onChange={(e) => setField("unit", e.target.value)}
                                    className="h-16 w-full rounded-[1.5rem] border border-white/10 bg-white/5 px-8 text-lg font-bold text-white shadow-sm outline-none focus:border-[#408c8c] focus:bg-white/10 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" disabled className="bg-[#002b3d]">-- Select Unit --</option>
                                    {UNIT_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value} className="bg-[#002b3d] text-white py-4">{opt.label}</option>
                                    ))}
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                    <PlusCircle className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        {/* Current Quantity */}
                        <div className="space-y-3 group">
                            <label className="text-[10px] font-black uppercase text-slate-200 tracking-[0.2em] pl-1 group-focus-within:text-[#408c8c] transition-colors">
                                Current Quantity <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                type="number"
                                value={form.quantity}
                                onChange={(e) => setField("quantity", e.target.value)}
                                placeholder="0.00"
                                className={cn(
                                    "h-16 rounded-[1.5rem] bg-white/5 border px-8 text-xl font-black text-white placeholder:text-slate-400 transition-all focus:bg-white/10",
                                    errors.quantity ? "border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : "border-white/10 focus:border-[#408c8c]"
                                )}
                            />
                            {errors.quantity && <p className="text-[10px] font-bold text-rose-500 pl-4 uppercase tracking-widest">{errors.quantity}</p>}
                        </div>

                        {/* Alert Level */}
                        <div className="space-y-3 group">
                            <label className="text-[10px] font-black uppercase text-slate-200 tracking-[0.2em] pl-1 group-focus-within:text-[#408c8c] transition-colors">
                                Minimum Alert Level <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                type="number"
                                value={form.minLevel}
                                onChange={(e) => setField("minLevel", e.target.value)}
                                placeholder="Notify when below..."
                                className={cn(
                                    "h-16 rounded-[1.5rem] bg-white/5 border px-8 text-xl font-black text-white placeholder:text-slate-400 transition-all focus:bg-white/10",
                                    errors.minLevel ? "border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : "border-white/10 focus:border-[#408c8c]"
                                )}
                            />
                            {errors.minLevel && <p className="text-[10px] font-bold text-rose-500 pl-4 uppercase tracking-widest">{errors.minLevel}</p>}
                        </div>

                        {/* Cost Per Unit */}
                        <div className="space-y-3 group">
                            <label className="text-[10px] font-black uppercase text-slate-200 tracking-[0.2em] pl-1 group-focus-within:text-[#408c8c] transition-colors">
                                Cost Per Unit ($) <span className="text-slate-600 font-medium lowercase tracking-normal ml-1">(Optional)</span>
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                value={form.costPerUnit}
                                onChange={(e) => setField("costPerUnit", e.target.value)}
                                placeholder="0.00"
                                className={cn(
                                    "h-16 rounded-[1.5rem] bg-white/5 border px-8 text-xl font-black text-white placeholder:text-slate-400 transition-all focus:bg-white/10",
                                    errors.costPerUnit ? "border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : "border-white/10 focus:border-[#408c8c]"
                                )}
                            />
                            {errors.costPerUnit && <p className="text-[10px] font-bold text-rose-500 pl-4 uppercase tracking-widest">{errors.costPerUnit}</p>}
                        </div>

                        {/* Expiry Date */}
                        <div className="space-y-3 md:col-span-2 group">
                            <label className="text-[10px] font-black uppercase text-slate-100 tracking-[0.2em] pl-1 group-focus-within:text-[#408c8c] transition-colors">
                                Expiry Date <span className="text-slate-600 font-medium lowercase tracking-normal ml-1">(Optional)</span>
                            </label>
                            <Input
                                type="date"
                                value={form.expiryDate}
                                onChange={(e) => setField("expiryDate", e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                                className={cn(
                                    "h-16 rounded-[1.5rem] bg-white/5 border px-8 text-lg font-bold text-white transition-all [color-scheme:dark] focus:bg-white/10",
                                    errors.expiryDate ? "border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : "border-white/10 focus:border-[#408c8c]"
                                )}
                            />
                            {errors.expiryDate && <p className="text-[10px] font-bold text-rose-500 pl-4 uppercase tracking-widest">{errors.expiryDate}</p>}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-20 pt-10 border-t border-white/5 flex flex-wrap items-center justify-between gap-6">
                        {!id ? (
                            <button
                                onClick={() => setForm({ name: "", unit: "", quantity: "", minLevel: "", costPerUnit: "", expiryDate: "" })}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-rose-500 transition-colors px-4 py-2 border border-radius-full border-white"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Reset Draft
                            </button>
                        ) : (
                            <div />
                        )}
                        <div className="flex gap-4 ml-auto">
                            <Button
                                variant="ghost"
                                onClick={() => router.back()}
                                className="bg-slate-600 h-14 px-10 rounded-[1.2rem] text-slate-100 font-bold uppercase tracking-widest text-[10px] hover:text-white hover:bg-white/5"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={!isValid || isSubmitting}
                                className="h-16 px-12 rounded-[1.5rem] bg-gradient-to-r from-[#408c8c] to-[#005477] hover:scale-[1.02] active:scale-95 text-white shadow-xl shadow-[#408c8c]/20 font-black uppercase italic tracking-widest text-base gap-3 transition-all disabled:opacity-30 disabled:grayscale disabled:scale-100"
                            >
                                {isSubmitting ? (
                                    <div className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full" />
                                ) : (
                                    <>
                                        <Save className="h-6 w-6" />
                                        {id ? "Update Record" : "Save Ingredient"}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
