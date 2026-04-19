"use client";

import React from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, FileDown, PlusCircle, LayoutDashboard, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateInvoicePDF } from "@/lib/invoiceHelper";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";

export default function InvoiceSuccessDialog({ open, onOpenChange, order, tableInfo, staffInfo, resetForm }) {
    const router = useRouter();
    const { user } = useAuth();
    
    if (!order) return null;

    const handleDownload = () => {
        generateInvoicePDF(order, tableInfo, staffInfo);
    };

    const handleDashboardRedirect = () => {
        if (user?.role === 'CUSTOMER') {
            router.push("/modules/customer-dashboard");
        } else {
            router.push("/modules/admin/order-management");
        }
        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-lg bg-[#011627] border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl shadow-black/80 text-white">
                <AlertDialogDescription className="sr-only">
                    Order created successfully. Download your invoice here.
                </AlertDialogDescription>

                {/* Success Banner */}
                <div className="bg-gradient-to-br from-[#408c8c] to-[#005477] p-10 flex flex-col items-center text-center">
                    <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center mb-6 shadow-xl border border-white/30 animate-in zoom-in duration-500">
                        <CheckCircle2 className="h-12 w-12 text-white" />
                    </div>
                    <AlertDialogTitle className="text-3xl font-black uppercase tracking-tight italic text-white flex items-center gap-3">
                        Order <span className="not-italic text-white/80">Confirmed!</span>
                    </AlertDialogTitle>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em] mt-2">
                        Successfully saved to KOT system
                    </p>
                </div>

                <div className="p-8 space-y-6">
                    {/* Order Mini-Summary */}
                    <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-500">
                            <span>Order No</span>
                            <span className="text-white">{order.orderNo}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-500">
                            <span>Table</span>
                            <span className="text-white">#{tableInfo?.tableNumber || order.tableId?.tableNumber || "N/A"}</span>
                        </div>
                        <div className="h-[1px] bg-white/5" />
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-widest text-[#408c8c]">Grand Total</span>
                            <span className="text-xl font-black text-white">LKR {Number(order.total).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 pt-2">
                        <Button
                            onClick={handleDownload}
                            className="w-full h-14 bg-[#408c8c] hover:bg-[#408c8c]/90 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#408c8c]/10 flex items-center justify-center gap-3 transition-all active:scale-95"
                        >
                            <FileDown className="h-5 w-5" />
                            Download Invoice
                        </Button>

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                onClick={() => {
                                    resetForm();
                                    onOpenChange(false);
                                }}
                                variant="outline"
                                className="h-12 border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all"
                            >
                                <PlusCircle className="h-4 w-4 mr-2" />
                                New Order
                            </Button>
                            <Button
                                onClick={handleDashboardRedirect}
                                variant="outline"
                                className="h-12 border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all"
                            >
                                <LayoutDashboard className="h-4 w-4 mr-2" />
                                {user?.role === 'CUSTOMER' ? "Track Order" : "Dashboard"}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-black/20 text-center">
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                        <Utensils className="h-2 w-2" />
                        Thank you for using OceanBreeze POS
                    </p>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
