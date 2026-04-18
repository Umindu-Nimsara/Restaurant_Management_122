"use client";

import React from "react";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { X, Utensils, ClipboardList, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OrderViewDialog({ open, onOpenChange, order }) {
    if (!order) return null;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-2xl bg-[#0F0E28] border-white/10 rounded-[2.5rem] p-0 overflow-y-auto max-h-[90vh] shadow-2xl shadow-black/60 custom-scrollbar text-white">
                <AlertDialogDescription className="sr-only">
                    Order details for {order.orderNo}
                </AlertDialogDescription>

                {/* Header Section */}
                <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-white/30">
                            <ClipboardList className="h-6 w-6 text-white " />
                        </div>
                        <div>
                            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight italic text-white leading-none">
                                Order <span className="text-white not-italic">Details</span>
                            </AlertDialogTitle>
                            <p className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mt-1">{order.orderNo}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Table</p>
                            <p className="text-lg font-black italic text-white">#{order.tableId?.tableNumber || "N/A"}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</p>
                            <p className={cn(
                                "text-sm font-black uppercase tracking-widest",
                                order.status === "PENDING" ? "text-orange-400" :
                                    order.status === "COOKING" ? "text-blue-400" : "text-green-400"
                            )}>{order.status}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Time</p>
                            <p className="text-sm font-bold text-white">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Waitstaff</p>
                            <p className="text-sm font-bold text-white truncate">{order.staffId?.name || "Customer"}</p>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Utensils className="h-4 w-4 text-primary" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Ordered Items</h3>
                        </div>
                        <div className="rounded-[2rem] border border-white/5 bg-black/20 overflow-hidden shadow-inner">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5 uppercase text-[9px] font-black text-slate-500 tracking-[0.2em]">
                                        <th className="px-6 py-4">Item</th>
                                        <th className="px-6 py-4 text-center w-24">Qty</th>
                                        <th className="px-6 py-4">Special Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {order.items?.map((item, i) => (
                                        <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-black uppercase tracking-tight text-white group-hover:text-slate-300 transition-colors">{item.name}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-xs font-black text-white border border-white/5 group-hover:border-primary/50">
                                                    {item.qty}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.note ? (
                                                    <p className="text-[10px] text-orange-400 font-bold italic flex items-center gap-1">
                                                        <span className="h-1 w-1 rounded-full bg-orange-400" />
                                                        {item.note}
                                                    </p>
                                                ) : (
                                                    <span className="text-[10px] text-slate-200 italic">No notes</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* General Notes */}
                    {order.notes && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <Info className="h-4 w-4 text-orange-400" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">General Note / Instructions</h3>
                            </div>
                            <div className="p-6 rounded-[2rem] bg-orange-500/5 border border-orange-500/10 shadow-xl shadow-orange-500/5">
                                <p className="text-sm font-bold text-orange-400 leading-relaxed italic">
                                    "{order.notes}"
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-8 pt-0 flex justify-end">
                    <AlertDialogCancel asChild>
                        <button className="h-12 px-8 rounded-xl bg-white/5 border border-white/10 hover:text-slate-100 text-white hover:bg-white/10 font-black uppercase text-[10px] tracking-widest transition-all">
                            Close Review
                        </button>
                    </AlertDialogCancel>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}

