"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Save, X, Calendar, Package } from "lucide-react";

export default function UsageDataManager({ onDataUpdated }) {
    const [usageRecords, setUsageRecords] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    
    const [formData, setFormData] = useState({
        ingredientId: "",
        date: new Date().toISOString().split('T')[0],
        quantity: "5.00"
    });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            
            // Fetch ingredients
            const ingredientsRes = await fetch(`${apiUrl}/inventory/ingredients`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const ingredientsData = await ingredientsRes.json();
            if (ingredientsData.success) {
                setIngredients(ingredientsData.data);
            }

            // Fetch usage records
            const usageRes = await fetch(`${apiUrl}/inventory/stock`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const usageData = await usageRes.json();
            console.log('Usage data response:', usageData);
            if (usageData.success) {
                // Filter only USAGE type records
                const usageOnly = usageData.data.filter(record => record.type === 'USAGE');
                console.log('Filtered usage records:', usageOnly);
                setUsageRecords(usageOnly);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!formData.ingredientId || !formData.quantity || !formData.date) {
            alert("Please fill all fields");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/inventory/stock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ingredientId: formData.ingredientId,
                    type: 'USAGE',
                    quantity: Number(formData.quantity),
                    date: formData.date,
                    reason: 'Manual entry'
                })
            });

            const data = await res.json();
            if (data.success) {
                setShowAddForm(false);
                setFormData({
                    ingredientId: "",
                    date: new Date().toISOString().split('T')[0],
                    quantity: "5.00"
                });
                fetchData();
                if (onDataUpdated) onDataUpdated();
            } else {
                alert(data.error || 'Failed to add usage record');
            }
        } catch (error) {
            console.error("Error adding record:", error);
            alert("Connection error");
        }
    };

    const handleUpdate = async (id) => {
        const record = usageRecords.find(r => r._id === id);
        if (!record) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/inventory/stock/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    quantity: Number(record.quantity),
                    date: record.date
                })
            });

            const data = await res.json();
            if (data.success) {
                setEditingId(null);
                fetchData();
                if (onDataUpdated) onDataUpdated();
            } else {
                alert(data.error || 'Failed to update record');
            }
        } catch (error) {
            console.error("Error updating record:", error);
            alert("Connection error");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this usage record?")) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/inventory/stock/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) {
                fetchData();
                if (onDataUpdated) onDataUpdated();
            } else {
                alert(data.error || 'Failed to delete record');
            }
        } catch (error) {
            console.error("Error deleting record:", error);
            alert("Connection error");
        }
    };

    const updateRecord = (id, field, value) => {
        setUsageRecords(prev => prev.map(record => 
            record._id === id ? { ...record, [field]: value } : record
        ));
    };

    const getIngredientName = (ingredientIdOrObject) => {
        // If it's already populated (object with name)
        if (ingredientIdOrObject && typeof ingredientIdOrObject === 'object' && ingredientIdOrObject.name) {
            return ingredientIdOrObject.name;
        }
        // If it's just an ID string
        if (typeof ingredientIdOrObject === 'string') {
            const ingredient = ingredients.find(i => i._id === ingredientIdOrObject);
            return ingredient ? ingredient.name : 'Unknown';
        }
        return 'Unknown';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Invalid Date';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date';
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        } catch (e) {
            return 'Invalid Date';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-white/10 border-t-[#005477]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-white">Usage Data Manager</h3>
                    <p className="text-sm text-slate-400 mt-1">Add, edit, or remove ingredient usage records</p>
                </div>
                <Button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-[#005477] hover:bg-[#005477]/90 text-white rounded-xl h-10 px-5 gap-2 font-bold"
                >
                    <Plus className="w-4 h-4" />
                    Add Usage Record
                </Button>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <Card className="bg-white/5 border-white/10 backdrop-blur-md p-6 rounded-2xl">
                    <h4 className="text-lg font-bold text-white mb-4">New Usage Record</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Ingredient</label>
                            <select
                                value={formData.ingredientId}
                                onChange={(e) => setFormData({ ...formData, ingredientId: e.target.value })}
                                className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-[#005477] focus:ring-4 focus:ring-[#005477]/10"
                            >
                                <option value="" className="bg-[#181E38]">Select ingredient...</option>
                                {ingredients.map(ing => (
                                    <option key={ing._id} value={ing._id} className="bg-[#181E38]">
                                        {ing.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="h-11 rounded-xl border-white/10 bg-white/5 text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Quantity (kg)</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                placeholder="0.00"
                                className="h-11 rounded-xl border-white/10 bg-white/5 text-white"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6">
                        <Button
                            onClick={handleAdd}
                            className="bg-[#005477] hover:bg-[#005477]/90 text-white rounded-xl h-10 px-6 gap-2 font-bold"
                        >
                            <Save className="w-4 h-4" />
                            Save Record
                        </Button>
                        <Button
                            onClick={() => {
                                setShowAddForm(false);
                                setFormData({
                                    ingredientId: "",
                                    date: new Date().toISOString().split('T')[0],
                                    quantity: "5.00"
                                });
                            }}
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10 rounded-xl h-10 px-6"
                        >
                            Cancel
                        </Button>
                    </div>
                </Card>
            )}

            {/* Records Table */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-md rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left p-4 text-xs font-bold text-slate-400 uppercase">Ingredient</th>
                                <th className="text-left p-4 text-xs font-bold text-slate-400 uppercase">Date</th>
                                <th className="text-left p-4 text-xs font-bold text-slate-400 uppercase">Quantity (kg)</th>
                                <th className="text-right p-4 text-xs font-bold text-slate-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usageRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-10 text-slate-400">
                                        No usage records found. Add your first record above.
                                    </td>
                                </tr>
                            ) : (
                                usageRecords.map((record) => (
                                    <tr key={record._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Package className="w-4 h-4 text-[#408c8c]" />
                                                <span className="text-white font-medium">
                                                    {getIngredientName(record.ingredientId)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {editingId === record._id ? (
                                                <Input
                                                    type="date"
                                                    value={record.date ? new Date(record.date).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => updateRecord(record._id, 'date', e.target.value)}
                                                    className="h-9 rounded-lg border-white/10 bg-white/5 text-white w-40"
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <Calendar className="w-4 h-4 text-slate-500" />
                                                    {formatDate(record.createdAt || record.date)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {editingId === record._id ? (
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={record.quantity}
                                                    onChange={(e) => updateRecord(record._id, 'quantity', e.target.value)}
                                                    className="h-9 rounded-lg border-white/10 bg-white/5 text-white w-24"
                                                />
                                            ) : (
                                                <span className="text-white font-semibold">{record.quantity} kg</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {editingId === record._id ? (
                                                    <>
                                                        <Button
                                                            onClick={() => handleUpdate(record._id)}
                                                            size="sm"
                                                            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg h-8 px-3 gap-1"
                                                        >
                                                            <Save className="w-3.5 h-3.5" />
                                                            Save
                                                        </Button>
                                                        <Button
                                                            onClick={() => {
                                                                setEditingId(null);
                                                                fetchData();
                                                            }}
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-white/20 text-white hover:bg-white/10 rounded-lg h-8 px-3"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button
                                                            onClick={() => setEditingId(record._id)}
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-[#408c8c] text-[#408c8c] hover:bg-[#408c8c]/10 rounded-lg h-8 px-3 gap-1"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDelete(record._id)}
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-red-500 text-red-500 hover:bg-red-500/10 rounded-lg h-8 px-3 gap-1"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            Delete
                                                        </Button>
                                                    </>
                                                )}
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
    );
}
