"use client";

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MenuPreviewModal({ open, onClose, items, categories }) {
    if (!open) return null;

    // Filter only available items
    const availableItems = items.filter(item => 
        (item.availability || 'AVAILABLE') === 'AVAILABLE'
    );

    // Group by category
    const groupedItems = categories.reduce((acc, category) => {
        if (category === 'All') return acc;
        const categoryItems = availableItems.filter(item => 
            (item.categoryId?.name || item.category) === category
        );
        if (categoryItems.length > 0) {
            acc[category] = categoryItems;
        }
        return acc;
    }, {});

    const TagBadge = ({ tag }) => {
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
            <span className={`px-2 py-1 ${config.bg} ${config.text} text-xs font-semibold rounded-lg border ${config.border} flex items-center gap-1`}>
                {config.icon && <span>{config.icon}</span>}
                {tag}
            </span>
        );
    };

    return (
        <>
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 animate-in fade-in duration-300"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="min-h-screen p-4 md:p-8">
                    <div 
                        className="bg-[#0f1923] rounded-2xl border border-[#2a3a4a] max-w-7xl mx-auto animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-[#0f1923] border-b border-[#2a3a4a] p-6 rounded-t-2xl z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-1">OceanBreeze Menu</h2>
                                    <p className="text-sm text-gray-400">Customer View Preview</p>
                                </div>
                                
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {Object.keys(groupedItems).length === 0 ? (
                                <div className="text-center py-20">
                                    <p className="text-gray-400 text-lg">No available items to display</p>
                                </div>
                            ) : (
                                <div className="space-y-12">
                                    {Object.entries(groupedItems).map(([category, items]) => (
                                        <div key={category}>
                                            {/* Category Header */}
                                            <div className="mb-6">
                                                <h3 className="text-2xl font-bold text-white mb-2">{category}</h3>
                                                <div className="h-1 w-20 bg-gradient-to-r from-cyan-500 to-transparent rounded-full"></div>
                                            </div>

                                            {/* Items Grid */}
                                            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                                {items.map((item) => (
                                                    <div 
                                                        key={item._id || item.id}
                                                        className="bg-[#1a2535] rounded-xl border border-[#2a3a4a] overflow-hidden hover:border-cyan-500/50 transition-all group"
                                                    >
                                                        {/* Image */}
                                                        <div className="aspect-video bg-[#0f1923] overflow-hidden">
                                                            {item.imageUrl && item.imageUrl !== 'no-photo.jpg' ? (
                                                                <img
                                                                    src={item.imageUrl}
                                                                    alt={item.menuName || item.name}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                />
                                                            ) : item.image ? (
                                                                <img
                                                                    src={item.image}
                                                                    alt={item.menuName || item.name}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <span className="text-6xl opacity-20">🍽️</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="p-4">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <h4 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                                                                    {item.menuName || item.name}
                                                                </h4>
                                                                <span className="text-xl font-bold text-cyan-400 whitespace-nowrap ml-2">
                                                                    {Number(item.price || 0).toLocaleString()} LKR
                                                                </span>
                                                            </div>

                                                            {/* Tags */}
                                                            {item.tags && item.tags.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 mb-3">
                                                                    {item.tags.map((tag, idx) => (
                                                                        <TagBadge key={idx} tag={tag} />
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Description */}
                                                            <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                                                                {item.description || 'No description available'}
                                                            </p>

                                                            {/* Portion Size */}
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-gray-500">
                                                                    Portion: <span className="text-gray-400 font-semibold">{item.portionSize || item.potionSize || 'Medium'}</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
