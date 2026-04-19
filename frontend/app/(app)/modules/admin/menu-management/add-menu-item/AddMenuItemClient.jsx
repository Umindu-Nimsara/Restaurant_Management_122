"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ImagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { menuService } from "@/lib/menuService";
import { cn } from "@/lib/utils";
import { z } from "zod";

const menuItemSchema = z.object({
    menuName: z.string().min(1, "Menu Name is required"),
    availability: z.enum(["AVAILABLE", "OUT_OF_STOCK"], {
        errorMap: () => ({ message: "Please select availability" }),
    }),
    price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Price must be a positive number",
    }),
    portionSize: z.string().min(1, "Portion Size is required"),
    category: z.string().min(1, "Category is required"),
    featured: z.enum(["Yes", "No"], {
        errorMap: () => ({ message: "Please select if featured" }),
    }),
    tags: z.array(z.string()).optional(),
    description: z.string().min(10, "Description must be at least 10 characters"),
    image: z.string().min(1, "Image is required"),
});

const STORAGE_KEY = "oceanbreeze_add_menu_item_v1";

const AVAILABILITY_OPTIONS = [
    { value: "AVAILABLE", label: "Available" },
    { value: "OUT_OF_STOCK", label: "Out of Stock" },
];

const PORTION_SIZE_OPTIONS = [
    { value: "Small (S)", label: "Small (S)" },
    { value: "Medium (M)", label: "Medium (M)" },
    { value: "Large (L)", label: "Large (L)" },
    { value: "Family / Sharing", label: "Family / Sharing" },
    { value: "Kids", label: "Kids" },
];

const TAG_OPTIONS = [
    { value: "Chef's Special", label: "Chef's Special", color: "amber", icon: "⭐" },
    { value: "New", label: "New", color: "blue", icon: "✨" },
    { value: "Seasonal", label: "Seasonal", color: "green", icon: "🍂" },
    { value: "Bestseller", label: "Bestseller", color: "purple", icon: "🔥" },
    { value: "Spicy", label: "Spicy", color: "red", icon: "🌶️" },
    { value: "Vegan", label: "Vegan", color: "emerald", icon: "🌱" },
];

export default function AddMenuItemPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const fileRef = useRef(null);

    const [imageDataUrl, setImageDataUrl] = useState(""); // base64 (for preview + storage)
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [form, setForm] = useState({
        menuName: "",
        availability: "AVAILABLE",
        price: "",
        portionSize: "",
        category: "", // We'll store categoryId here
        featured: "No", // Frontend displays Yes/No, backend uses isFeatured (boolean)
        tags: [], // Array of selected tags
        description: "",
        dynamicPricing: {
            isActive: false,
            type: "DISCOUNT",
            percentage: 10,
            startTime: "00:00",
            endTime: "23:59",
            daysActive: [0, 1, 2, 3, 4, 5, 6]
        }
    });

    const [savedToast, setSavedToast] = useState(false);

    // -------------------------
    // Load setup data
    // -------------------------
    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);
                const cats = await menuService.fetchCategories();
                setCategories(cats || []);

                if (id) {
                    const item = await menuService.fetchMenuItem(id);
                    if (item) {
                        setForm({
                            menuName: item.name || "",
                            availability: item.availability || "AVAILABLE",
                            price: String(item.originalPrice || item.price || ""),
                            portionSize: item.portionSize || "",
                            category: item.categoryId?._id || item.categoryId || "",
                            featured: item.isFeatured ? "Yes" : "No",
                            tags: item.tags || [],
                            description: item.description || "",
                            dynamicPricing: item.dynamicPricing || {
                                isActive: false,
                                type: "DISCOUNT",
                                percentage: 10,
                                startTime: "00:00",
                                endTime: "23:59",
                                daysActive: [0, 1, 2, 3, 4, 5, 6]
                            }
                        });
                        setImageDataUrl(item.imageUrl && item.imageUrl !== 'no-photo.jpg' ? item.imageUrl : "");
                    }
                }
            } catch (err) {
                console.error("Error initializing page:", err);
                alert("Failed to load data: " + err.message);
            } finally {
                setLoading(false);
            }
        };

        if (typeof window !== "undefined") {
            init();
        }
    }, [id]);

    // -------------------------
    // Auto-save to localStorage
    // -------------------------
    useEffect(() => {
        if (typeof window === "undefined" || id) return; // Skip auto-save if in edit mode

        const payload = {
            form,
            imageDataUrl,
            updatedAt: new Date().toISOString(),
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }, [form, imageDataUrl, id]);

    const isValid = useMemo(() => {
        return (
            imageDataUrl &&
            form.menuName.trim() &&
            form.availability &&
            form.price.trim() &&
            form.portionSize &&
            form.category &&
            form.featured &&
            form.description.trim()
        );
    }, [form, imageDataUrl]);

    const onPickImage = () => fileRef.current?.click();

    const onFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file.");
            return;
        }

        // 2MB Size limit (2 * 1024 * 1024 bytes)
        const MAX_SIZE = 2 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            alert("Image size exceeds 2MB. Please upload a smaller image.");
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || "");
            setImageDataUrl(result);
            // Clear image error if any
            if (errors.image) {
                setErrors((prev) => ({ ...prev, image: null }));
            }
        };
        reader.readAsDataURL(file);
    };

    const setField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        // Clear field error when user starts typing
        if (errors[key]) {
            setErrors((prev) => ({ ...prev, [key]: null }));
        }
    };

    const handleCancel = () => {
        router.back();
    };

    const handleSave = async () => {
        // Zod validation
        const result = menuItemSchema.safeParse({
            ...form,
            image: imageDataUrl,
        });

        if (!result.success) {
            const formattedErrors = {};
            result.error.issues.forEach((issue) => {
                formattedErrors[issue.path[0]] = issue.message;
            });
            setErrors(formattedErrors);
            alert("Please correct the errors in the form.");
            return;
        }

        const payload = {
            name: form.menuName,
            categoryId: form.category,
            price: Number(form.price),
            description: form.description,
            portionSize: form.portionSize,
            availability: form.availability,
            isFeatured: form.featured === "Yes",
            tags: form.tags,
            imageUrl: imageDataUrl || 'no-photo.jpg',
            dynamicPricing: {
                ...form.dynamicPricing,
                percentage: Number(form.dynamicPricing.percentage)
            }
        };

        try {
            setLoading(true);
            if (id) {
                await menuService.updateMenuItem(id, payload);
            } else {
                await menuService.createMenuItem(payload);
                // Clear draft if not in edit mode
                localStorage.removeItem(STORAGE_KEY);
            }
            router.push("/modules/admin/menu-management");
        } catch (err) {
            console.error("Save error:", err);
            alert("Failed to save menu item: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClearDraft = () => {
        if (typeof window === "undefined") return;

        localStorage.removeItem(STORAGE_KEY);
        setImageDataUrl("");
        setForm({
            menuName: "",
            availability: "",
            price: "",
            portionSize: "",
            category: "",
            featured: "",
            description: "",
            dynamicPricing: { isActive: false, type: "DISCOUNT", percentage: 10, startTime: "00:00", endTime: "23:59", daysActive: [0,1,2,3,4,5,6] }
        });
    };

    if (loading && !imageDataUrl && !form.menuName) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen bg-[#011627]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005477]"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-6 pt-20 bg-[#011627] min-h-screen">
            <div className="max-w-5xl mx-auto">
                {/* Title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-white">
                        {id ? "Edit Menu Item" : "Add New Menu Item"}
                    </h1>
                    <p className="text-slate-400 mt-2">
                        {id ? "Modify existing menu item details." : "Create a new delicious addition to your menu."}
                    </p>
                </div>

                {/* Image Upload */}
                <div className="mb-10">
                    <label className="text-sm font-bold uppercase tracking-widest text-slate-200">
                        Upload Image<span className="text-red-500 ml-1">*</span>
                    </label>

                    <div
                        onClick={onPickImage}
                        role="button"
                        tabIndex={0}
                        className="mt-4 w-full rounded-2xl border-2 border-dashed border-white/10 hover:border-[#408c8c] transition-all cursor-pointer bg-white/5 backdrop-blur-sm overflow-hidden group"
                    >
                        <div className="h-[240px] flex items-center justify-center relative">
                            {imageDataUrl ? (
                                <div className="w-full h-full p-4 relative group">
                                    <img
                                        src={imageDataUrl}
                                        alt="Preview"
                                        className="w-full h-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                        <p className="text-white font-bold text-sm">Click to Change Image</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 group-hover:bg-[#408c8c]/20 group-hover:border-[#408c8c]/50 transition-all">
                                        <ImagePlus className="h-10 w-10 text-white/60" />
                                    </div>
                                    <p className="text-sm font-medium">Click or drag to upload menu item photo</p>
                                    <p className="text-xs text-slate-500">Maximum size 2MB (JPG, PNG)</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {errors.image && (
                        <p className="mt-2 text-sm text-red-500 font-medium px-2">{errors.image}</p>
                    )}

                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onFileChange}
                    />
                </div>

                {/* Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    {/* Menu Name */}
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                            Menu Name<span className="text-red-500 ml-1">*</span>
                        </label>
                        <Input
                            value={form.menuName}
                            onChange={(e) => setField("menuName", e.target.value)}
                            placeholder="e.g. Seafood Platter"
                            className={cn(
                                "h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-[#408c8c]/20 focus:border-[#408c8c] transition-all",
                                errors.menuName && "border-red-500 focus-visible:ring-red-500"
                            )}
                        />
                        {errors.menuName && (
                            <p className="text-xs text-red-500 font-medium ml-1">{errors.menuName}</p>
                        )}
                    </div>

                    {/* Availability */}
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                            Availability<span className="text-red-500 ml-1">*</span>
                        </label>

                        <select
                            value={form.availability}
                            onChange={(e) => setField("availability", e.target.value)}
                            className={cn(
                                "h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white shadow-sm outline-none focus:ring-2 focus:ring-[#408c8c]/20 focus:border-[#408c8c] transition-all appearance-none cursor-pointer",
                                errors.availability && "border-red-500 focus:ring-red-500/30"
                            )}
                        >
                            <option value="" disabled className="bg-[#011627]">--Select Availability--</option>
                            {AVAILABILITY_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} className="bg-[#011627]">
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {errors.availability && (
                            <p className="text-xs text-red-500 font-medium ml-1">{errors.availability}</p>
                        )}
                    </div>

                    {/* Price */}
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                            Price (LKR)<span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={form.price}
                                onChange={(e) => setField("price", e.target.value)}
                                placeholder="0.00"
                                className={cn(
                                    "h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-slate-600 pl-12 focus:ring-[#408c8c]/20 focus:border-[#408c8c] transition-all",
                                    errors.price && "border-red-500 focus-visible:ring-red-500"
                                )}
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">LKR</span>
                        </div>
                        {errors.price && (
                            <p className="text-xs text-red-500 font-medium ml-1">{errors.price}</p>
                        )}
                    </div>

                    {/* Portion Size */}
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                            Portion Size<span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                            value={form.portionSize}
                            onChange={(e) => setField("portionSize", e.target.value)}
                            className={cn(
                                "h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white shadow-sm outline-none focus:ring-2 focus:ring-[#408c8c]/20 focus:border-[#408c8c] transition-all appearance-none cursor-pointer",
                                errors.portionSize && "border-red-500 focus:ring-red-500/30"
                            )}
                        >
                            <option value="" disabled className="bg-[#011627]">--Select Portion Size--</option>
                            {PORTION_SIZE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} className="bg-[#011627]">
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {errors.portionSize && (
                            <p className="text-xs text-red-500 font-medium ml-1">{errors.portionSize}</p>
                        )}
                    </div>

                    {/* Category */}
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                            Category<span className="text-red-500 ml-1">*</span>
                        </label>

                        <select
                            value={form.category}
                            onChange={(e) => setField("category", e.target.value)}
                            className={cn(
                                "h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white shadow-sm outline-none focus:ring-2 focus:ring-[#408c8c]/20 focus:border-[#408c8c] transition-all appearance-none cursor-pointer",
                                errors.category && "border-red-500 focus:ring-red-500/30"
                            )}
                        >
                            <option value="" disabled className="bg-[#011627]">--Select Category--</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat._id} className="bg-[#011627]">
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        {errors.category && (
                            <p className="text-xs text-red-500 font-medium ml-1">{errors.category}</p>
                        )}
                    </div>

                    {/* Featured */}
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                            Set as Featured<span className="text-red-500 ml-1">*</span>
                        </label>

                        <select
                            value={form.featured}
                            onChange={(e) => setField("featured", e.target.value)}
                            className={cn(
                                "h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white shadow-sm outline-none focus:ring-2 focus:ring-[#408c8c]/20 focus:border-[#408c8c] transition-all appearance-none cursor-pointer",
                                errors.featured && "border-red-500 focus:ring-red-500/30"
                            )}
                        >
                            <option value="" disabled className="bg-[#011627]">--Promote Item?--</option>
                            <option value="Yes" className="bg-[#011627]">Yes, promote on home</option>
                            <option value="No" className="bg-[#011627]">No, standard item</option>
                        </select>
                        {errors.featured && (
                            <p className="text-xs text-red-500 font-medium ml-1">{errors.featured}</p>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="md:col-span-2 space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                            Tags
                        </label>
                        <div className="bg-[#0A0E27] border border-white/10 rounded-2xl p-4">
                            <div className="flex flex-wrap gap-3">
                                {TAG_OPTIONS.map((tag) => {
                                    const isSelected = form.tags.includes(tag.value);
                                    return (
                                        <button
                                            key={tag.value}
                                            type="button"
                                            onClick={() => {
                                                const newTags = isSelected
                                                    ? form.tags.filter(t => t !== tag.value)
                                                    : [...form.tags, tag.value];
                                                setField("tags", newTags);
                                            }}
                                            className={cn(
                                                "px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 flex items-center gap-2",
                                                isSelected
                                                    ? tag.color === "amber" ? "bg-amber-500/20 text-amber-400 border-amber-500/50" :
                                                      tag.color === "blue" ? "bg-blue-500/20 text-blue-400 border-blue-500/50" :
                                                      tag.color === "green" ? "bg-green-500/20 text-green-400 border-green-500/50" :
                                                      tag.color === "purple" ? "bg-purple-500/20 text-purple-400 border-purple-500/50" :
                                                      tag.color === "red" ? "bg-red-500/20 text-red-400 border-red-500/50" :
                                                      "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                                                    : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                                            )}
                                        >
                                            <span>{tag.icon}</span>
                                            <span>{tag.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {form.tags.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-white/10">
                                    <p className="text-xs text-gray-400">
                                        Selected: <span className="text-white font-semibold">{form.tags.join(", ")}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2 space-y-3 mt-4">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                            Item Description<span className="text-red-500 ml-1">*</span>
                        </label>

                        <textarea
                            value={form.description}
                            onChange={(e) => setField("description", e.target.value)}
                            placeholder="Describe your dish (ingredients, prep style...)"
                            className={cn(
                                "w-full min-h-[160px] rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white shadow-sm outline-none focus:ring-2 focus:ring-[#408c8c]/20 focus:border-[#408c8c] transition-all placeholder:text-slate-600",
                                errors.description && "border-red-500 focus:ring-red-500/30"
                            )}
                        />
                        {errors.description && (
                            <p className="text-xs text-red-500 font-medium ml-1">{errors.description}</p>
                        )}
                    </div>
                </div>

                {/* Dynamic Pricing Engine Section */}
                <div className="mt-8 bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 shadow-lg relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                ⚡ Automated Dynamic Pricing
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">Configure Happy Hours, Late Night Surges, and automated promotions.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-white uppercase tracking-widest">{form.dynamicPricing.isActive ? 'Active' : 'Disabled'}</span>
                            <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, dynamicPricing: { ...f.dynamicPricing, isActive: !f.dynamicPricing.isActive } }))}
                                className={cn(
                                    "relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                    form.dynamicPricing.isActive ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" : "bg-white/10"
                                )}
                            >
                                <span className={cn(
                                    "pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                    form.dynamicPricing.isActive ? "translate-x-6" : "translate-x-0"
                                )} />
                            </button>
                        </div>
                    </div>

                    {form.dynamicPricing.isActive && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 relative z-10">
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Type</label>
                                <select
                                    value={form.dynamicPricing.type}
                                    onChange={(e) => setForm(f => ({ ...f, dynamicPricing: { ...f.dynamicPricing, type: e.target.value } }))}
                                    className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white shadow-sm outline-none focus:ring-2 focus:ring-amber-500/50 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="DISCOUNT" className="bg-[#011627] text-emerald-400">Green / Discount (Happy Hour)</option>
                                    <option value="SURGE" className="bg-[#011627] text-rose-400">Red / Surge (Peak Hours)</option>
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Percentage %</label>
                                <Input
                                    type="number"
                                    min="1" max="100"
                                    value={form.dynamicPricing.percentage}
                                    onChange={(e) => setForm(f => ({ ...f, dynamicPricing: { ...f.dynamicPricing, percentage: e.target.value } }))}
                                    className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Start Time (24h)</label>
                                <Input
                                    type="time"
                                    value={form.dynamicPricing.startTime}
                                    onChange={(e) => setForm(f => ({ ...f, dynamicPricing: { ...f.dynamicPricing, startTime: e.target.value } }))}
                                    className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold focus:ring-amber-500/50 transition-all hide-time-icon"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">End Time (24h)</label>
                                <Input
                                    type="time"
                                    value={form.dynamicPricing.endTime}
                                    onChange={(e) => setForm(f => ({ ...f, dynamicPricing: { ...f.dynamicPricing, endTime: e.target.value } }))}
                                    className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold focus:ring-amber-500/50 transition-all hide-time-icon"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-3 mt-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Active Days</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, ix) => {
                                        const isActive = form.dynamicPricing.daysActive.includes(ix);
                                        return (
                                            <button
                                                key={ix}
                                                type="button"
                                                onClick={() => {
                                                    const newDays = isActive 
                                                        ? form.dynamicPricing.daysActive.filter(d => d !== ix)
                                                        : [...form.dynamicPricing.daysActive, ix];
                                                    setForm(f => ({ ...f, dynamicPricing: { ...f.dynamicPricing, daysActive: newDays } }));
                                                }}
                                                className={cn(
                                                    "px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border",
                                                    isActive ? "bg-amber-500 text-white border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]" : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                                                )}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-end gap-4 pb-20">
                    <Button
                        variant="ghost"
                        onClick={handleClearDraft}
                        className="text-slate-400 hover:text-white hover:bg-white/5 rounded-l px-6"
                    >
                        Reset Form
                    </Button>

                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="border-white/20 text-white hover:text-white hover:bg-white/5 rounded-xl px-8 h-12 font-bold"
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleSave}
                        disabled={!isValid || loading}
                        className="bg-[#005477] hover:bg-[#005477]/80 text-white px-12 h-12 rounded-xl font-black shadow-lg shadow-[#005477]/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Processing...
                            </div>
                        ) : id ? "Update Menu Item" : "Create Menu Item"}
                    </Button>
                </div>
            </div>

            {/* mini toast */}
            {savedToast && (
                <div className="fixed bottom-10 right-10 rounded-2xl bg-[#408c8c] text-white px-6 py-4 shadow-2xl border border-white/20 backdrop-blur-md animate-in slide-in-from-bottom-5 font-bold">
                    Draft saved successfully! ✅
                </div>
            )}
        </div>
    );
}
