"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Pencil, Trash2, LayoutGrid, FileDown, Eye, ChevronDown, ChevronUp, TrendingUp, Clock, RotateCcw, Upload, ArrowUpDown, ArrowUp, ArrowDown, History } from "lucide-react";
import { useRouter } from "next/navigation";
import DeleteConfirmDialog from "@/components/ui/DeleteConfirmDialog";
import MenuViewDialog from "@/components/ui/MenuViewDialog";
import PriceHistoryDrawer from "@/components/ui/PriceHistoryDrawer";
import ImportModal from "@/components/ui/ImportModal";
import MenuPreviewModal from "@/components/ui/MenuPreviewModal";
import MenuAnalytics from "@/components/ui/MenuAnalytics";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { menuService } from "@/lib/menuService";

function MenuManagementPage() {
    const router = useRouter();
    const { showToast, ToastContainer } = useToast();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    //  Dropdown filters
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [availabilityFilter, setAvailabilityFilter] = useState("All");
    const [tagFilter, setTagFilter] = useState("All Tags");

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const [viewOpen, setViewOpen] = useState(false);
    const [selectedViewItem, setSelectedViewItem] = useState(null);

    const [dynamicCategories, setDynamicCategories] = useState(["All"]);
    const [dynamicTags, setDynamicTags] = useState(["All Tags"]);
    const availabilityOptions = ["All", "Available", "Out of Stock"];

    // New states for bulk actions and analytics
    const [selectedItems, setSelectedItems] = useState([]);
    const [analyticsExpanded, setAnalyticsExpanded] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // New modals
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyItem, setHistoryItem] = useState(null);
    const [importOpen, setImportOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);

    useEffect(() => {
        loadItems();
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await menuService.fetchCategories();
            if (data && data.length > 0) {
                setDynamicCategories(["All", ...data.map(c => c.name)]);
            } else {
                setDynamicCategories(["All", "Starters", "Main Course", "Beverages", "Desserts"]);
            }
        } catch (err) {
            console.error("Failed to fetch categories:", err);
            setDynamicCategories(["All", "Starters", "Main Course", "Beverages", "Desserts"]);
        }
    };

    const loadItems = async () => {
        try {
            setLoading(true);
            const data = await menuService.fetchMenuItems();
            setItems(data);
            
            // Extract unique tags from all items
            const allTags = new Set();
            data.forEach(item => {
                if (item.tags && Array.isArray(item.tags)) {
                    item.tags.forEach(tag => allTags.add(tag));
                }
            });
            setDynamicTags(["All Tags", ...Array.from(allTags)]);
        } catch (err) {
            console.error("Failed to load menu items:", err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        let result = [...items];

        const q = search.trim().toLowerCase();
        if (q) {
            result = result.filter((it) => {
                const name = (it.menuName || it.name || "").toLowerCase();
                const cat = (it.category || "").toLowerCase();
                return name.includes(q) || cat.includes(q);
            });
        }

        if (categoryFilter !== "All") {
            result = result.filter((it) => {
                const itemCat = it.categoryId?.name || it.category || "";
                return itemCat === categoryFilter;
            });
        }

        if (availabilityFilter !== "All") {
            result = result.filter((it) => {
                const itemAvailability = it.availability || "AVAILABLE";
                // Map filter value to database value
                if (availabilityFilter === "Available") {
                    return itemAvailability === "AVAILABLE";
                } else if (availabilityFilter === "Out of Stock") {
                    return itemAvailability === "OUT_OF_STOCK";
                }
                return true;
            });
        }

        if (tagFilter !== "All Tags") {
            result = result.filter((it) => {
                const tags = it.tags || [];
                return tags.includes(tagFilter);
            });
        }

        // Apply sorting
        if (sortConfig.key) {
            result.sort((a, b) => {
                let aVal, bVal;
                
                if (sortConfig.key === 'name') {
                    aVal = (a.menuName || a.name || '').toLowerCase();
                    bVal = (b.menuName || b.name || '').toLowerCase();
                } else if (sortConfig.key === 'price') {
                    aVal = Number(a.price || 0);
                    bVal = Number(b.price || 0);
                } else if (sortConfig.key === 'category') {
                    aVal = (a.categoryId?.name || a.category || '').toLowerCase();
                    bVal = (b.categoryId?.name || b.category || '').toLowerCase();
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [items, search, categoryFilter, availabilityFilter, tagFilter, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) {
            return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
        }
        return sortConfig.direction === 'asc' 
            ? <ArrowUp className="w-3 h-3 ml-1" />
            : <ArrowDown className="w-3 h-3 ml-1" />;
    };

    // Bulk action handlers
    const toggleSelectAll = () => {
        if (selectedItems.length === filtered.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filtered.map(it => it._id || it.id));
        }
    };

    const toggleSelectItem = (id) => {
        setSelectedItems(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkAvailability = async (status) => {
        try {
            for (const id of selectedItems) {
                await menuService.updateMenuItem(id, { availability: status });
            }
            await loadItems();
            setSelectedItems([]);
            showToast(`${selectedItems.length} items updated successfully`, 'success');
        } catch (err) {
            showToast("Failed to update items: " + err.message, 'error');
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedItems.length} items?`)) return;
        try {
            for (const id of selectedItems) {
                await menuService.deleteMenuItem(id);
            }
            await loadItems();
            setSelectedItems([]);
            showToast(`${selectedItems.length} items deleted successfully`, 'success');
        } catch (err) {
            showToast("Failed to delete items: " + err.message, 'error');
        }
    };

    const handleDelete = async (id) => {
        try {
            await menuService.deleteMenuItem(id);
            setItems((prev) => prev.filter((it) => (it._id || it.id) !== id));
            showToast("Item deleted successfully", 'success');
        } catch (err) {
            showToast("Failed to delete item: " + err.message, 'error');
        }
    };

    const handleEdit = (id) => {
        router.push(`/modules/admin/menu-management/add-menu-item?id=${id}`);
    };

    const toggleAvailability = async (id) => {
        const item = items.find((it) => (it._id || it.id) === id);
        if (!item) return;

        const newAvailability = (item.availability || "AVAILABLE") === "AVAILABLE" ? "OUT_OF_STOCK" : "AVAILABLE";

        try {
            const updated = await menuService.updateMenuItem(id, { availability: newAvailability });
            setItems((prev) => prev.map((it) => ((it._id || it.id) === id ? updated : it)));
        } catch (err) {
            alert("Failed to update status: " + err.message);
        }
    };

    const resetFilters = () => {
        setSearch("");
        setCategoryFilter("All");
        setAvailabilityFilter("All");
        setTagFilter("All Tags");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        // Add Title
        doc.setFontSize(20);
        doc.setTextColor(0, 84, 119); // #005477
        doc.text("OceanBreeze Restaurant - Menu Report", 14, 22);

        // Add Date
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        // Add Filter Info
        doc.text(`Category: ${categoryFilter} | Availability: ${availabilityFilter}`, 14, 36);

        // Define Table Columns
        const tableColumn = ["Name", "Category", "Price (LKR)", "Portion Size", "Availability"];

        // Define Table Rows
        const tableRows = filtered.map(item => [
            item.menuName || item.name,
            item.categoryId?.name || item.category || "-",
            Number(item.price || 0).toLocaleString(),
            item.potionSize || item.portionSize || "-",
            (item.availability || "AVAILABLE") === "AVAILABLE" ? "Available" : "Out of Stock"
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
        doc.save(`OceanBreeze_Menu_${categoryFilter}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="flex-1 p-8 pt-24 bg-[#0A0E27] min-h-screen">
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <span>Home</span>
                        <span>/</span>
                        <span className="text-white">Menu Management</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Menu Management
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Manage your restaurant menu items, categories, and pricing
                    </p>
                </div>

                {/* Menu Analytics Section */}
                <MenuAnalytics 
                    isExpanded={analyticsExpanded}
                    onToggle={() => setAnalyticsExpanded(!analyticsExpanded)}
                    itemCount={items.length}
                />

                {/* Filters Section */}
                <div className="mb-6">
                    <div className="flex flex-wrap items-end gap-4">
                        {/* Search */}
                        <div className="flex-1 min-w-[300px] flex flex-col gap-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Search
                            </label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by name or category..."
                                    className="w-full h-12 pl-12 pr-4 bg-[#151932] border border-[#1E2442] rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-sm text-white placeholder:text-gray-500"
                                />
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="w-[180px] flex flex-col gap-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Category
                            </label>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="h-12 bg-[#151932] border-[#1E2442] text-white rounded-xl focus:ring-2 focus:ring-cyan-500/50">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#151932] border-[#1E2442] text-white">
                                    {dynamicCategories.map((c) => (
                                        <SelectItem key={c} value={c} className="focus:bg-[#1A1F3A]">
                                            {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Filter */}
                        <div className="w-[180px] flex flex-col gap-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Status
                            </label>
                            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                                <SelectTrigger className="h-12 bg-[#151932] border-[#1E2442] text-white rounded-xl focus:ring-2 focus:ring-cyan-500/50">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#151932] border-[#1E2442] text-white">
                                    {availabilityOptions.map((v) => (
                                        <SelectItem key={v} value={v} className="focus:bg-[#1A1F3A]">
                                            {v}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tag Filter */}
                        <div className="w-[180px] flex flex-col gap-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Tag
                            </label>
                            <Select value={tagFilter} onValueChange={setTagFilter}>
                                <SelectTrigger className="h-12 bg-[#151932] border-[#1E2442] text-white rounded-xl focus:ring-2 focus:ring-cyan-500/50">
                                    <SelectValue placeholder="All Tags" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#151932] border-[#1E2442] text-white">
                                    {dynamicTags.map((tag) => (
                                        <SelectItem key={tag} value={tag} className="focus:bg-[#1A1F3A]">
                                            {tag}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={resetFilters}
                                className="h-12 px-4 bg-transparent border-[#1E2442] text-gray-400 hover:bg-[#151932] hover:text-white rounded-xl"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Reset
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => setImportOpen(true)}
                                className="h-12 px-4 bg-transparent border-[#1E2442] text-gray-400 hover:bg-[#151932] hover:text-white rounded-xl"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Import
                            </Button>

                            <Button
                                variant="outline"
                                onClick={exportToPDF}
                                disabled={filtered.length === 0}
                                className="h-12 px-4 bg-transparent border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 rounded-xl"
                            >
                                <FileDown className="w-4 h-4 mr-2" />
                                Export
                            </Button>

                            <Button
                                onClick={() => setPreviewOpen(true)}
                                className="h-12 px-4 bg-transparent border-[#1E2442] text-gray-400 hover:bg-[#151932] hover:text-white rounded-xl border"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                            </Button>

                            <Button
                                onClick={() => router.push("/modules/admin/menu-management/add-menu-item")}
                                className="h-12 px-6 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Add Item
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedItems.length > 0 && (
                    <div className="mb-6 bg-[#151932] border border-cyan-500/30 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-white font-semibold">
                                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => handleBulkAvailability("AVAILABLE")}
                                    className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg h-8 px-3 text-xs"
                                >
                                    <Clock className="w-3 h-3 mr-1" />
                                    Available
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => handleBulkAvailability("OUT_OF_STOCK")}
                                    className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-lg h-8 px-3 text-xs"
                                >
                                    <Clock className="w-3 h-3 mr-1" />
                                    Unavailable
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleBulkDelete}
                                    className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-lg h-8 px-3 text-xs"
                                >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Delete
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => setSelectedItems([])}
                                    className="bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 border border-gray-500/30 rounded-lg h-8 px-3 text-xs"
                                >
                                    Deselect
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="w-full">
                    <Card className="bg-[#151932] border-[#1E2442] rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-[#1E2442] flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white">
                                Menu Details
                            </h2>
                            <div className="text-sm text-gray-400">
                                Showing <span className="text-white font-semibold">{filtered.length}</span> of <span className="text-white font-semibold">{items.length}</span> items
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-[#1E2442]">
                                        <th className="px-6 py-4 w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.length === filtered.length && filtered.length > 0}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 rounded border-[#1E2442] bg-[#0A0E27] text-cyan-500 focus:ring-cyan-500/50"
                                            />
                                        </th>
                                        <th className="px-6 py-4">Image</th>
                                        <th className="px-6 py-4">
                                            <button 
                                                onClick={() => handleSort('name')}
                                                className="flex items-center hover:text-white transition-colors"
                                            >
                                                Name
                                                <SortIcon columnKey="name" />
                                            </button>
                                        </th>
                                        <th className="px-6 py-4">
                                            <button 
                                                onClick={() => handleSort('price')}
                                                className="flex items-center hover:text-white transition-colors"
                                            >
                                                Price (LKR)
                                                <SortIcon columnKey="price" />
                                            </button>
                                        </th>
                                        <th className="px-6 py-4">
                                            <button 
                                                onClick={() => handleSort('category')}
                                                className="flex items-center hover:text-white transition-colors"
                                            >
                                                Category
                                                <SortIcon columnKey="category" />
                                            </button>
                                        </th>
                                        <th className="px-6 py-4">Portion Size</th>
                                        <th className="px-6 py-4">Availability</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[#1E2442]">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={8} className="px-8 py-20 text-center">
                                                <div className="flex justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4 text-gray-400">
                                                    <LayoutGrid className="w-12 h-12 opacity-20" />
                                                    <p className="font-medium text-lg">
                                                        No menu items found
                                                    </p>
                                                    <p className="text-sm">
                                                        Try adjusting your filters or add a new item.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((it) => (
                                            <tr
                                                key={it._id || it.id}
                                                className="hover:bg-[#1A1F3A] transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.includes(it._id || it.id)}
                                                        onChange={() => toggleSelectItem(it._id || it.id)}
                                                        className="w-4 h-4 rounded border-[#1E2442] bg-[#0A0E27] text-cyan-500 focus:ring-cyan-500/50"
                                                    />
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="h-14 w-14 rounded-xl bg-[#1A1F3A] flex items-center justify-center overflow-hidden border border-[#1E2442]">
                                                        {it.imageUrl && it.imageUrl !== 'no-photo.jpg' ? (
                                                            <img
                                                                src={it.imageUrl}
                                                                alt={it.menuName || it.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextSibling.style.display = 'flex';
                                                                }}
                                                            />
                                                        ) : it.image ? (
                                                            <img
                                                                src={it.image}
                                                                alt={it.menuName || it.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextSibling.style.display = 'flex';
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div className="w-full h-full flex items-center justify-center" style={{ display: (it.imageUrl && it.imageUrl !== 'no-photo.jpg') || it.image ? 'none' : 'flex' }}>
                                                            <LayoutGrid className="w-6 h-6 text-gray-600" />
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-2">
                                                        <p className="font-semibold text-white text-base">
                                                            {it.menuName || it.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {/* Tags/Badges from database */}
                                                            {it.tags && it.tags.length > 0 ? (
                                                                it.tags.map((tag, idx) => {
                                                                    const tagConfig = {
                                                                        "Chef's Special": { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30", icon: "⭐" },
                                                                        "New": { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30", icon: "✨" },
                                                                        "Seasonal": { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30", icon: "🍂" },
                                                                        "Bestseller": { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30", icon: "🔥" },
                                                                        "Spicy": { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", icon: "🌶️" },
                                                                        "Vegan": { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", icon: "🌱" }
                                                                    };
                                                                    const config = tagConfig[tag] || { bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/30", icon: "" };
                                                                    return (
                                                                        <span 
                                                                            key={idx}
                                                                            className={`px-2 py-0.5 ${config.bg} ${config.text} text-[10px] font-semibold rounded border ${config.border} flex items-center gap-1`}
                                                                        >
                                                                            {config.icon && <span>{config.icon}</span>}
                                                                            {tag}
                                                                        </span>
                                                                    );
                                                                })
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-white text-lg">
                                                            {Number(it.price || 0).toLocaleString()}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-gray-500 uppercase">
                                                            LKR
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="text-gray-300 text-sm font-medium">
                                                        {it.categoryId?.name || it.category || "-"}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="text-gray-300 text-sm font-medium">
                                                        {it.potionSize || it.portionSize || "Medium (M)"}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => toggleAvailability(it._id || it.id)}
                                                            className={cn(
                                                                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                                                (it.availability || "AVAILABLE") === "AVAILABLE"
                                                                    ? "bg-emerald-500"
                                                                    : "bg-gray-600"
                                                            )}
                                                        >
                                                            <span
                                                                className={cn(
                                                                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                                    (it.availability || "AVAILABLE") === "AVAILABLE"
                                                                        ? "translate-x-5"
                                                                        : "translate-x-0"
                                                                )}
                                                            />
                                                        </button>

                                                        <span
                                                            className={cn(
                                                                "text-xs font-semibold uppercase tracking-wide",
                                                                (it.availability || "AVAILABLE") === "AVAILABLE"
                                                                    ? "text-emerald-400"
                                                                    : "text-gray-500"
                                                            )}
                                                        >
                                                            {(it.availability || "AVAILABLE") === "AVAILABLE"
                                                                ? "Available"
                                                                : "Out"}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedViewItem(it);
                                                                setViewOpen(true);
                                                            }}
                                                            className="w-9 h-9 rounded-lg bg-[#1A1F3A] text-gray-400 hover:bg-cyan-500/20 hover:text-cyan-400 flex items-center justify-center transition-all border border-[#1E2442] hover:border-cyan-500/30"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                setHistoryItem({ id: it._id || it.id, name: it.menuName || it.name });
                                                                setHistoryOpen(true);
                                                            }}
                                                            className="w-9 h-9 rounded-lg bg-[#1A1F3A] text-gray-400 hover:bg-cyan-500/20 hover:text-cyan-400 flex items-center justify-center transition-all border border-[#1E2442] hover:border-cyan-500/30"
                                                        >
                                                            <History className="w-4 h-4" />
                                                        </button>

                                                        <button
                                                            onClick={() => handleEdit(it._id || it.id)}
                                                            className="w-9 h-9 rounded-lg bg-[#1A1F3A] text-gray-400 hover:bg-cyan-500/20 hover:text-cyan-400 flex items-center justify-center transition-all border border-[#1E2442] hover:border-cyan-500/30"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                setDeleteId(it._id || it.id);
                                                                setDeleteOpen(true);
                                                            }}
                                                            className="w-9 h-9 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all border border-red-500/30"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Permanently remove item?"
                description="Are you sure you want to delete this menu item from your records? This cannot be undone."
                confirmText="Remove Item"
                onConfirm={() => {
                    if (!deleteId) return;
                    handleDelete(deleteId);
                    setDeleteOpen(false);
                    setDeleteId(null);
                }}
                confirmClassName="bg-red-500 hover:bg-red-600 font-black rounded-xl"
            />

            <MenuViewDialog
                open={viewOpen}
                onOpenChange={setViewOpen}
                item={selectedViewItem}
            />

            <PriceHistoryDrawer
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                itemId={historyItem?.id}
                itemName={historyItem?.name}
            />

            <ImportModal
                open={importOpen}
                onClose={() => setImportOpen(false)}
                onImportComplete={() => {
                    loadItems();
                    showToast('Items imported successfully', 'success');
                }}
            />

            <MenuPreviewModal
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                items={items}
                categories={dynamicCategories}
            />

            <ToastContainer />
        </div>
    );
}

export default MenuManagementPage;