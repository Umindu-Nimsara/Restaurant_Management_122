import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { X, Utensils, IndianRupee, LayoutGrid, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function MenuViewDialog({ open, onOpenChange, item }) {
    if (!item) return null;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="w-[600px] bg-[#011627] border-white/10 rounded-[2.5rem] p-0 overflow-y-auto max-h-[90vh] shadow-2xl shadow-black/60 custom-scrollbar">
                <AlertDialogDescription className="sr-only">
                    Details for {item.name}
                </AlertDialogDescription>
                <div className="relative h-[350px] w-full bg-slate-900 flex items-center justify-center shrink-0">
                    {item.imageUrl && item.imageUrl !== 'no-photo.jpg' ? (
                        <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-4 opacity-20">
                            <Utensils className="h-20 w-40 text-white" />
                            <p className="text-white font-black uppercase tracking-widest text-sm">No Image Available</p>
                        </div>
                    )}

                    {/* Header Overlay */}
                    <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
                        <div className="space-y-1">
                            <Badge className={cn(
                                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-none shadow-lg",
                                (item.availability || "AVAILABLE") === "AVAILABLE"
                                    ? "bg-[#408c8c] text-white"
                                    : "bg-red-500 text-white"
                            )}>
                                {(item.availability || "AVAILABLE") === "AVAILABLE" ? "Available" : "Out of Stock"}
                            </Badge>
                        </div>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="h-12 w-12 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Category Label Overlay */}
                    <div className="absolute bottom-6 left-8">
                        <div className="px-5 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center gap-3">
                            <LayoutGrid className="w-4 h-4 text-[#408c8c]" />
                            <span className="text-sm font-black text-white uppercase tracking-widest">
                                {item.categoryId?.name || item.category || "Dish"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-8">
                    <div className="flex justify-between items-start gap-10">
                        <div className="space-y-2">
                            <AlertDialogTitle className="text-4xl font-extrabold text-white tracking-tight leading-tight">
                                {item.name || item.menuName}
                            </AlertDialogTitle>
                            <p className="text-slate-400 font-medium text-lg italic">
                                OceanBreeze Signature Culinary Creation
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-4xl font-black text-[#408c8c] block">
                                LKR {Number(item.price || 0).toLocaleString()}
                            </span>
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest mt-1 block">
                                Per Portion
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-4">
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] block">Portion Details</label>
                            <p className="text-white text-xl font-bold flex items-center gap-3">
                                <Utensils className="w-5 h-5 text-[#408c8c]" />
                                {item.potionSize || item.portionSize || "Regular"}
                            </p>
                        </div>
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] block">Last Updated</label>
                            <p className="text-white text-xl font-bold flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-[#408c8c]" />
                                Today
                            </p>
                        </div>
                    </div>

                    {item.description && (
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] block ml-1">Composition & Details</label>
                            <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/5">
                                <p className="text-slate-300 leading-relaxed font-medium">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-10 pt-0 flex justify-end">
                    <AlertDialogCancel className="h-14 px-10 rounded-2xl border-white/10 text-white hover:bg-white/5 font-bold tracking-widest uppercase text-xs">
                        Close Details
                    </AlertDialogCancel>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
