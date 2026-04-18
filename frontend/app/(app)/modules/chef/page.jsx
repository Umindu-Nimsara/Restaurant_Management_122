"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
    ChefHat,
    Clock,
    CheckCircle2,
    Timer,
    RefreshCcw,
    Utensils,
    LayoutDashboard,
    Search,
    Eye
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { orderService } from "@/lib/orderService";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import OrderViewDialog from "@/components/ui/OrderViewDialog";

const COLUMNS = [
    { id: "PENDING", title: "Pending", icon: Timer, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20 shadow-orange-500/10" },
    { id: "COOKING", title: "Cooking", icon: ChefHat, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20 shadow-blue-500/10" },
    { id: "SERVED", title: "Served", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20 shadow-green-500/10" },
];

export default function KitchenDisplaySystem() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isLive, setIsLive] = useState(true);
    const [isBrowser, setIsBrowser] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);

    const isInitialLoadRef = useRef(true);
    const prevOrdersIdsRef = useRef(new Set());

    const playAlertSound = useCallback(() => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            
            // First beep: A5
            const osc1 = ctx.createOscillator();
            const gainNode1 = ctx.createGain();
            osc1.connect(gainNode1);
            gainNode1.connect(ctx.destination);
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(880, ctx.currentTime);
            gainNode1.gain.setValueAtTime(0.1, ctx.currentTime);
            osc1.start(ctx.currentTime);
            osc1.stop(ctx.currentTime + 0.15);

            // Second beep: C6
            setTimeout(() => {
                const osc2 = ctx.createOscillator();
                const gainNode2 = ctx.createGain();
                osc2.connect(gainNode2);
                gainNode2.connect(ctx.destination);
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(1046.50, ctx.currentTime);
                gainNode2.gain.setValueAtTime(0.1, ctx.currentTime);
                osc2.start(ctx.currentTime);
                osc2.stop(ctx.currentTime + 0.3);
            }, 200);
        } catch (err) {
            console.error('Audio play failed:', err);
        }
    }, []);

    // Initial hydration check for DND
    useEffect(() => {
        setIsBrowser(true);
    }, []);

    const fetchOrders = async () => {
        try {
            const data = await orderService.fetchAllOrders();
            // Filter only active kitchen orders
            const activeOrders = data.filter(o => ["PENDING", "COOKING", "SERVED"].includes(o.status));
            
            if (!isInitialLoadRef.current) {
                const newPendingOrders = activeOrders.filter(o => o.status === "PENDING");
                const hasNew = newPendingOrders.some(newO => !prevOrdersIdsRef.current.has(newO._id));
                if (hasNew) {
                    playAlertSound();
                }
            }
            
            if (isInitialLoadRef.current) {
               isInitialLoadRef.current = false;
            }
            
            prevOrdersIdsRef.current = new Set(activeOrders.map(o => o._id));
            setOrders(activeOrders);
        } catch (err) {
            console.error("Failed to fetch KOTs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        let interval;
        if (isLive) {
            interval = setInterval(fetchOrders, 10000); // Auto refresh every 10s
        }
        return () => clearInterval(interval);
    }, [isLive]);

    const handleStatusChange = async (orderId, newStatus) => {
        const originalOrders = [...orders];
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));

        try {
            await orderService.updateOrderStatus(orderId, newStatus);
        } catch (err) {
            alert("Failed to update status: " + err.message);
            setOrders(originalOrders);
        }
    };

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        await handleStatusChange(draggableId, destination.droppableId);
    };

    const groupedOrders = useMemo(() => {
        const groups = {
            PENDING: [],
            COOKING: [],
            SERVED: [],
        };

        orders.forEach(order => {
            if (groups[order.status]) {
                const searchQ = search.toLowerCase();
                const matchesSearch =
                    (order.orderNo || "").toLowerCase().includes(searchQ) ||
                    (order.tableId?.tableNumber || "").toLowerCase().includes(searchQ);

                if (matchesSearch) {
                    groups[order.status].push(order);
                }
            }
        });

        return groups;
    }, [orders, search]);

    if (!isBrowser) return null;

    if (loading && orders.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen bg-[#0F0E28]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing with Kitchen...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 pt-24 bg-[#0F0E28] min-h-screen overflow-hidden flex flex-col">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-[2rem] bg-gradient-to-br from-primary/30 to-purple-500/10 flex items-center justify-center border border-white/10 shadow-2xl shadow-primary/20">
                        <LayoutDashboard className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">Kitchen <span className="text-gray-400 not-italic">Display System</span></h1>
                        <p className="text-slate-400 text-sm font-bold flex items-center gap-2 mt-1">
                            <Utensils className="h-4 w-4 text-primary" />
                            Drag and drop to manage order workflow in real-time
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5 shadow-inner">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-hover:text-primary transition-colors" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Find Order # or Table..."
                            className="h-12 w-64 pl-11 pr-4 rounded-xl border border-white/5 bg-[#0F0E28]/50 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-700 shadow-inner"
                        />
                    </div>
                    <div className="h-8 w-[1px] bg-white/10 mx-1" />
                    <button
                        onClick={() => setIsLive(!isLive)}
                        className={cn(
                            "h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg shadow-black/20",
                            isLive ? "bg-green-500/20 text-green-400 border border-green-400/30 hover:bg-green-500/30" : "bg-white/5 text-slate-500 border border-white/10"
                        )}
                    >
                        <div className={cn("h-2.5 w-2.5 rounded-full shadow-lg shadow-green-500/50", isLive ? "bg-green-400 animate-pulse" : "bg-slate-700")} />
                        {isLive ? "Live Sync" : "Updates Paused"}
                    </button>
                    <button
                        onClick={fetchOrders}
                        className="h-12 w-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-black/20"
                    >
                        <RefreshCcw className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 overflow-x-auto pb-6 scrollbar-hide">
                    <div className="flex gap-8 min-h-[600px] h-full min-w-[1200px]">
                        {COLUMNS.map((column) => (
                            <div key={column.id} className="flex-1 flex flex-col min-w-[380px]">
                                {/* Column Header */}
                                <div className={cn(
                                    "flex items-center justify-between p-6 mb-6 rounded-[2rem] border bg-gradient-to-r from-white/5 to-transparent backdrop-blur-2xl transition-all shadow-xl",
                                    column.border
                                )}>
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-3 rounded-2xl shadow-xl", column.bg)}>
                                            <column.icon className={cn("h-6 w-6", column.color)} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white uppercase tracking-tight">{column.title}</h3>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                {groupedOrders[column.id].length} KOT Active
                                            </p>
                                        </div>
                                    </div>
                                    <div className="h-3 w-3 rounded-full bg-white/5 border border-white/10" />
                                </div>

                                {/* Droppable Area */}
                                <Droppable droppableId={column.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={cn(
                                                "flex-1 rounded-[3rem] p-5 transition-all duration-500 border-2 border-dashed flex flex-col overflow-hidden",
                                                snapshot.isDraggingOver ? "bg-primary/5 border-primary/30 shadow-2xl shadow-primary/5 scale-[1.01]" : "bg-black/10 border-white/5"
                                            )}
                                        >
                                            <div className="space-y-6 overflow-y-auto scrollbar-hide flex-1">
                                                {groupedOrders[column.id].map((order, index) => (
                                                    <Draggable key={order._id} draggableId={order._id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={cn(
                                                                    "group relative overflow-hidden bg-white/5 border border-white/10 rounded-[2.5rem] p-7 transition-all duration-300",
                                                                    snapshot.isDragging ? "bg-white/10 border-primary scale-105 shadow-2xl z-50 ring-4 ring-primary/20 rotate-1 shadow-primary/30" : "hover:border-white/20 hover:bg-white/[0.07] hover:shadow-2xl translate-y-0 shadow-xl"
                                                                )}
                                                            >
                                                                {/* Background Glow */}
                                                                <div className={cn(
                                                                    "absolute -right-10 -top-10 w-40 h-40 blur-[60px] opacity-10 transition-all rounded-full group-hover:opacity-20",
                                                                    column.bg
                                                                )} />

                                                                <div className="flex justify-between items-start mb-5 relative z-10">
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{order.orderNo}</span>
                                                                            <div className="h-1 w-1 rounded-full bg-white/20" />
                                                                            <span className="text-[9px] font-bold text-slate-500 uppercase">Waitstaff: {order.staffId?.name || "Customer"}</span>
                                                                        </div>
                                                                        <h4 className="text-3xl font-black text-white italic tracking-tighter">Table {order.tableId?.tableNumber || "N/A"}</h4>
                                                                    </div>
                                                                    <div className="text-right flex flex-col items-end gap-2">
                                                                        <div className="flex items-center gap-2">

                                                                            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 animate-pulse">
                                                                                <Clock className="h-3 w-3 text-white animate-pulse" />
                                                                                <span className="text-[10px] font-black text-white tracking-widest">
                                                                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-3 mb-6 bg-black/40 backdrop-blur-md rounded-[2rem] p-6 border border-white/5 relative z-10 shadow-inner">
                                                                    <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
                                                                        <Utensils className="h-3.5 w-3.5 text-primary" />
                                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Items</span>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setSelectedOrder(order);
                                                                                setViewDialogOpen(true);
                                                                            }}
                                                                            className="ml-40 h-8 w-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-110 transition-all text-slate-200 hover:text-white p-0"
                                                                        >
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                    {order.items.map((item, i) => (
                                                                        <div key={i} className="flex justify-between items-start group/item">
                                                                            <div className="flex items-start gap-4">
                                                                                <div className="h-7 w-7 rounded-xl bg-white/5 flex items-center justify-center text-xs font-black text-white border border-white/5 shadow-lg group-hover/item:border-primary/50 transition-colors">
                                                                                    {item.qty}
                                                                                </div>
                                                                                <div className="pt-0.5">
                                                                                    <p className="text-sm font-black text-white leading-tight group-hover/item:text-gray-400 transition-colors uppercase tracking-tight">{item.name}</p>
                                                                                    {item.note && (
                                                                                        <p className="text-[10px] text-orange-400 italic mt-1 font-bold flex items-center gap-1">
                                                                                            <span className="h-1 w-1 rounded-full bg-orange-400" />
                                                                                            {item.note}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {order.notes && (
                                                                    <div className="mb-6 px-5 py-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 relative z-10 shadow-xl shadow-orange-500/5">
                                                                        <p className="text-[11px] font-bold text-orange-400 leading-snug">
                                                                            <span className="uppercase text-[9px] block mb-1">General Note:</span>
                                                                            {order.notes}
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                <div className="flex items-center justify-between pt-2 relative z-10">
                                                                    <div className="flex -space-x-2">
                                                                        {[1, 2, 3].map(i => (
                                                                            <div key={i} className="h-6 w-6 rounded-full border-2 border-[#1B1A3D] bg-slate-600 flex items-center justify-center text-[10px] font-bold text-white">
                                                                                {i === 1 ? (order.staffId?.name?.charAt(0) || "C") : "?"}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {order.status === "PENDING" && (
                                                                            <Button size="sm" className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 font-bold uppercase tracking-widest text-[10px] h-7 px-3" onClick={() => handleStatusChange(order._id, "COOKING")}>
                                                                                Start Cooking
                                                                            </Button>
                                                                        )}
                                                                        {order.status === "COOKING" && (
                                                                            <Button size="sm" className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 font-bold uppercase tracking-widest text-[10px] h-7 px-3" onClick={() => handleStatusChange(order._id, "SERVED")}>
                                                                                Mark Served
                                                                            </Button>
                                                                        )}
                                                                        {order.status === "SERVED" && (
                                                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-lg border border-green-500/20">
                                                                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                                                                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Done</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>

                                            {groupedOrders[column.id].length === 0 && (
                                                <div className="h-full flex flex-col items-center justify-center text-white opacity-20 py-24 select-none">
                                                    <column.icon className="h-20 w-20 mb-6" />
                                                    <p className="text-sm font-black uppercase tracking-[0.3em]">Clear Queue</p>
                                                    <p className="text-[10px] font-bold mt-2 uppercase tracking-widest text-center px-10">No {column.title.toLowerCase()} KOTs currently</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </div>
            </DragDropContext>

            <OrderViewDialog
                open={viewDialogOpen}
                onOpenChange={setViewDialogOpen}
                order={selectedOrder}
            />

            {/* Layout Custom Scrollbars (Tailwind Plugin style) */}
            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
