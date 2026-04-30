"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
    Calendar,
    Plus,
    Users,
    Clock,
    MapPin,
    CheckCircle,
    XCircle,
    User,
    Phone,
    LayoutGrid,
    List,
    Trash2,
    FileDown,
    Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import DeleteConfirmDialog from "@/components/ui/DeleteConfirmDialog";
import MessageDialog from "@/components/ui/MessageDialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { z } from "zod";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const reservationSchema = z.object({
    customerName: z.string().trim().min(1, "Customer Name is required"),
    phone: z.string()
        .trim()
        .length(10, "Phone number must be exactly 10 digits")
        .regex(/^\d+$/, "Phone number must contain only digits"),
    guestCount: z.coerce.number().min(1, "At least 1 guest required"),
    date: z.string().min(1, "Date is required"),
    time: z.string().min(1, "Time is required"),
    tableId: z.string().min(1, "Please select a table (Check Availability first)"),
    startAt: z.string().min(1, "Start time is required"),
    endAt: z.string().min(1, "End time is required"),
}).superRefine((data, ctx) => {
    // Current local time
    const now = new Date();

    // Get local 'today' date string (YYYY-MM-DD)
    const yearNow = now.getFullYear();
    const monthNow = String(now.getMonth() + 1).padStart(2, '0');
    const dayNow = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yearNow}-${monthNow}-${dayNow}`;

    if (data.date < todayStr) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Date cannot be in the past",
            path: ["date"],
        });
    }

    // If date is today, check if time is in the past
    if (data.date === todayStr) {
        const [hours, minutes] = data.time.split(":").map(Number);
        const inputTime = new Date();
        inputTime.setHours(hours, minutes, 0, 0);

        if (inputTime <= now) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Time cannot be in the past",
                path: ["time"],
            });
        }
    }
});

export default function TableManagement() {
    const [tables, setTables] = useState([]);
    const [reservations, setReservations] = useState([]);
    const getLocalDate = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
        ).padStart(2, "0")}`;
    };

    const getLocalTime = () => {
        const d = new Date();
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(
            2,
            "0"
        )}`;
    };

    const [selectedDate, setSelectedDate] = useState(getLocalDate());
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("TABLES");

    const [showAddTable, setShowAddTable] = useState(false);
    const [showAddReservation, setShowAddReservation] = useState(false);
    const [isEditingRes, setIsEditingRes] = useState(false);
    const [selectedReservationId, setSelectedReservationId] = useState(null);
    const [showDeleteTable, setShowDeleteTable] = useState(false);
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [showDeleteReservation, setShowDeleteReservation] = useState(false);
    const [selectedReservationIdToDelete, setSelectedReservationIdToDelete] = useState(null);
    const [availableTables, setAvailableTables] = useState([]);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [resErrors, setResErrors] = useState({});
    const [messageDialog, setMessageDialog] = useState({
        open: false,
        title: "",
        description: "",
        type: "info",
    });

    const showMessage = (title, description, type = "info") => {
        setMessageDialog({
            open: true,
            title,
            description,
            type,
        });
    };

    const [tableForm, setTableForm] = useState({
        tableNumber: "",
        capacity: 2,
        location: "INDOOR",
    });

    const [resForm, setResForm] = useState({
        customerName: "",
        phone: "",
        email: "",
        guestCount: 2,
        tableId: "",
        startAt: "",
        endAt: "",
        date: getLocalDate(),
        time: "19:00",
    });

    const resetReservationForm = () => {
        setResForm({
            customerName: "",
            phone: "",
            email: "",
            guestCount: 2,
            tableId: "",
            startAt: "",
            endAt: "",
            date: getLocalDate(),
            time: "19:00",
        });
        setAvailableTables([]);
        setResErrors({});
        setSelectedReservationId(null);
        setIsEditingRes(false);
    };

    const fetchTables = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/tables`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setTables(data.data || []);
        } catch (err) {
            console.error("Error fetching tables:", err);
        }
    }, []);

    const fetchReservations = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/reservations`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setReservations(data.data || []);
        } catch (err) {
            console.error("Error fetching reservations:", err);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchTables(), fetchReservations()]).finally(() =>
            setLoading(false)
        );
    }, [fetchTables, fetchReservations]);

    const handleAddTable = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/tables`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...tableForm,
                    capacity: Number(tableForm.capacity),
                }),
            });

            const data = await res.json();
            if (data.success) {
                await fetchTables();
                setShowAddTable(false);
                setTableForm({ tableNumber: "", capacity: 2, location: "INDOOR" });
            } else {
                showMessage("Failed to Create Table", data.error || "Please check your inputs.", "error");
            }
        } catch (err) {
            console.error("Error adding table:", err);
        }
    };

    const handleDeleteTable = async () => {
        if (!selectedTableId) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/tables/${selectedTableId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                await fetchTables();
                setShowDeleteTable(false);
                setSelectedTableId(null);
            }
        } catch (err) {
            console.error("Error deleting table:", err);
        }
    };

    const handleCheckAvailability = async () => {
        if (!resForm.date || !resForm.time || !resForm.guestCount) {
            showMessage("Missing Information", "Please fill in date, time and guest count to check availability.", "info");
            return;
        }

        setCheckingAvailability(true);
        try {
            const token = localStorage.getItem("token");
            const startAt = new Date(`${resForm.date}T${resForm.time}`).toISOString();
            const endAt = new Date(
                new Date(`${resForm.date}T${resForm.time}`).getTime() + 2 * 60 * 60 * 1000
            ).toISOString();

            const query = `startAt=${encodeURIComponent(
                startAt
            )}&endAt=${encodeURIComponent(endAt)}&guestCount=${resForm.guestCount}`;

            const res = await fetch(`${API_URL}/reservations/availability?${query}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setAvailableTables(data.data || []);
                if (data.data?.length > 0) {
                    setResForm((prev) => ({
                        ...prev,
                        tableId: data.data[0]._id,
                        startAt,
                        endAt,
                    }));
                    setResErrors((prev) => ({ ...prev, tableId: null }));
                } else {
                    showMessage("No Tables Available", "Sorry, no tables match your guest count and time slot.", "error");
                }
            }
        } catch (err) {
            console.error("Error checking availability:", err);
        } finally {
            setCheckingAvailability(false);
        }
    };

    const handleEditReservation = (reservation) => {
        const tableIdValue =
            typeof reservation.tableId === "object"
                ? reservation.tableId?._id || ""
                : reservation.tableId || "";

        setResForm({
            customerName: reservation.customerName,
            phone: reservation.phone,
            email: reservation.email || "",
            guestCount: reservation.guestCount,
            tableId: tableIdValue,
            startAt: reservation.startAt,
            endAt: reservation.endAt,
            date: new Date(reservation.startAt).toISOString().split("T")[0],
            time: new Date(reservation.startAt).toLocaleTimeString([], {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
            }),
        });

        setSelectedReservationId(reservation._id);
        setIsEditingRes(true);
        setShowAddReservation(true);
    };

    const handleSaveReservation = async (e) => {
        e.preventDefault();

        // Perform Zod validation
        const validate = reservationSchema.safeParse(resForm);
        if (!validate.success) {
            const errors = {};
            validate.error.issues.forEach((issue) => {
                errors[issue.path[0]] = issue.message;
            });
            setResErrors(errors);
            showMessage("Validation Error", "Please correct the highlighted errors in the form.", "error");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const method = isEditingRes ? "PUT" : "POST";
            const url = isEditingRes
                ? `${API_URL}/reservations/${selectedReservationId}`
                : `${API_URL}/reservations`;

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(resForm),
            });

            const data = await res.json();
            if (data.success) {
                await fetchReservations();
                setShowAddReservation(false);
                resetReservationForm();
                showMessage("Success!", `Reservation for ${resForm.customerName} has been saved successfully.`, "success");
            } else {
                showMessage("Save Failed", data.error || "There was an error saving this reservation.", "error");
            }
        } catch (err) {
            console.error("Error saving reservation:", err);
        }
    };

    const handleDeleteReservation = async () => {
        if (!selectedReservationIdToDelete) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/reservations/${selectedReservationIdToDelete}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                await fetchReservations();
                setShowDeleteReservation(false);
                setSelectedReservationIdToDelete(null);
                showMessage("Deleted", "Reservation has been deleted successfully.", "success");
            } else {
                showMessage("Delete Failed", data.error || "Failed to delete reservation.", "error");
            }
        } catch (err) {
            console.error("Error deleting reservation:", err);
            showMessage("Error", "An unexpected error occurred while deleting.", "error");
        }
    };

    const updateReservationStatus = async (id, status) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/reservations/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });

            const data = await res.json();
            if (data.success) await fetchReservations();
        } catch (err) {
            console.error("Error updating reservation status:", err);
        }
    };

    const handleCancelReservation = async (id) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/reservations/${id}/cancel`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) await fetchReservations();
        } catch (err) {
            console.error("Error cancelling reservation:", err);
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case "BOOKED":
                return "secondary";
            case "ARRIVED":
                return "default";
            case "COMPLETED":
                return "outline";
            case "CANCELLED":
                return "destructive";
            case "NO_SHOW":
                return "destructive";
            default:
                return "secondary";
        }
    };

    const dailyReservations = reservations.filter((reservation) => {
        const reservationDate = new Date(reservation.startAt).toISOString().split("T")[0];
        return reservationDate === selectedDate;
    });

    const filteredTables = tables.filter((table) => {
        const query = searchQuery.toLowerCase();
        return (
            table.tableNumber.toString().toLowerCase().includes(query) ||
            table.location.toLowerCase().includes(query) ||
            table.status.toLowerCase().includes(query)
        );
    });

    const filteredReservations = dailyReservations.filter((reservation) => {
        const query = searchQuery.toLowerCase();
        const tableNum = typeof reservation.tableId === "object"
            ? reservation.tableId?.tableNumber || ""
            : "";
        return (
            reservation.customerName.toLowerCase().includes(query) ||
            reservation.phone.toLowerCase().includes(query) ||
            reservation.status.toLowerCase().includes(query) ||
            tableNum.toString().toLowerCase().includes(query)
        );
    });

    const exportToPDF = () => {
        const doc = new jsPDF();
        const title =
            viewMode === "TABLES"
                ? "Table Management Report"
                : `Reservations Report - ${selectedDate}`;

        doc.setFontSize(20);
        doc.setTextColor(0, 84, 119);
        doc.text("OceanBreeze Restaurant", 14, 22);

        doc.setFontSize(14);
        doc.setTextColor(50);
        doc.text(title, 14, 30);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 38);

        if (viewMode === "TABLES") {
            const tableColumn = ["Table No.", "Status", "Capacity", "Location"];
            const tableRows = tables.map((table) => [
                table.tableNumber,
                table.status,
                `${table.capacity} Seats`,
                table.location,
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 45,
                theme: "grid",
                headStyles: {
                    fillColor: [0, 84, 119],
                    textColor: [255, 255, 255],
                },
                alternateRowStyles: { fillColor: [240, 247, 247] },
                margin: { top: 45 },
            });
        } else {
            const tableColumn = ["Table", "Customer", "Guests", "Time", "Phone", "Status"];
            const tableRows = dailyReservations.map((reservation) => [
                typeof reservation.tableId === "object"
                    ? reservation.tableId?.tableNumber || "?"
                    : "?",
                reservation.customerName,
                reservation.guestCount,
                new Date(reservation.startAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                reservation.phone,
                reservation.status,
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 45,
                theme: "grid",
                headStyles: {
                    fillColor: [0, 84, 119],
                    textColor: [255, 255, 255],
                },
                alternateRowStyles: { fillColor: [240, 247, 247] },
                margin: { top: 45 },
            });
        }

        doc.save(
            `OceanBreeze_Tables_${viewMode}_${new Date().toISOString().split("T")[0]}.pdf`
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#181E38]">
                <div className="text-white font-semibold text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 pt-24 min-h-screen relative bg-[#181E38]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(64,140,140,0.15),_transparent_60%)] pointer-events-none" />

            <div className="relative">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Table & Reservations</h1>
                        <p className="text-slate-300 mt-1">
                            Manage restaurant tables and customer bookings.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <Button
                            variant="outline"
                            onClick={exportToPDF}
                            disabled={
                                viewMode === "TABLES"
                                    ? tables.length === 0
                                    : dailyReservations.length === 0
                            }
                            className="bg-white/10 hover:bg-white/15 border-[#408c8c] text-white h-10 px-4 rounded-xl font-bold transition-all hover:scale-110"
                        >
                            <FileDown className="h-4 w-4 mr-2" />
                            Export PDF
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => setShowAddTable(true)}
                            className="bg-white text-slate-900 hover:bg-gray-200 hover:text-slate-900 border-gray-200 h-10 px-4 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-110"
                        >
                            <Plus className="h-4 w-4" />
                            Add Table
                        </Button>

                        <Button
                            onClick={() => {
                                resetReservationForm();
                                setShowAddReservation(true);
                            }}
                            className="bg-[#005477] hover:bg-[#005477]/90 text-white rounded-xl hover:scale-110"
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            New Reservation
                        </Button>
                    </div>
                </div>

                {/* View Selection */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center bg-white/10 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-white/10">
                        <button
                            onClick={() => setViewMode("TABLES")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === "TABLES"
                                ? "bg-[#005477] text-white shadow-md"
                                : "text-slate-300 hover:bg-white/10"
                                }`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                            Table List
                        </button>

                        <button
                            onClick={() => setViewMode("RESERVATIONS")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === "RESERVATIONS"
                                ? "bg-[#005477] text-white shadow-md"
                                : "text-slate-300 hover:bg-white/10"
                                }`}
                        >
                            <List className="h-4 w-4" />
                            Reservations
                        </button>
                    </div>

                    <div className="flex items-center gap-3 flex-1 max-w-md">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder={viewMode === "TABLES" ? "Search tables by ID or location..." : "Search by customer name, phone, or table..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white/10 border-white/10 text-white placeholder:text-slate-400 focus:ring-[#005477] focus:border-[#005477] rounded-xl h-10 w-full"
                            />
                        </div>
                    </div>

                    {viewMode === "RESERVATIONS" && (
                        <div className="flex items-center gap-3">
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-white w-44 text-slate-900"
                            />
                        </div>
                    )}
                </div>

                {/* Main Content */}
                {viewMode === "TABLES" ? (
                    <div className="w-full">
                        <Card className="bg-[#232943] border-none shadow-xl rounded-[2rem] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-white">Table Details</h2>
                                <div className="text-xs font-semibold text-slate-300">
                                    {searchQuery ? `Found ${filteredTables.length} result(s)` : `Total ${tables.length} tables`}
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-white text-xs font-medium uppercase tracking-widest border-b border-white/20">
                                            <th className="px-8 py-6 text-center">No.</th>
                                            <th className="px-8 py-6">Status</th>
                                            <th className="px-8 py-6">Capacity</th>
                                            <th className="px-8 py-6">Location</th>
                                            <th className="px-8 py-6 text-right">Action</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-white/10">
                                        {filteredTables.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-4 text-slate-300">
                                                        <Search className="w-12 h-12 opacity-20" />
                                                        <p className="font-medium text-lg">
                                                            {searchQuery ? "No tables match your search." : "No tables configured yet."}
                                                        </p>
                                                        {!searchQuery && (
                                                            <Button
                                                                variant="link"
                                                                className="text-white"
                                                                onClick={() => setShowAddTable(true)}
                                                            >
                                                                Add your first table
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTables.map((table) => (
                                                <tr
                                                    key={table._id}
                                                    className="hover:bg-white/5 transition-colors group"
                                                >
                                                    <td className="px-8 py-5">
                                                        <div className="flex justify-center">
                                                            <div className="h-12 w-12 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-lg border border-white/10 shadow-sm">
                                                                {table.tableNumber}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-8 py-5">
                                                        <Badge
                                                            variant={
                                                                table.status === "AVAILABLE"
                                                                    ? "default"
                                                                    : table.status === "OCCUPIED"
                                                                        ? "secondary"
                                                                        : "outline"
                                                            }
                                                            className={
                                                                table.status === "AVAILABLE"
                                                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                                                    : table.status === "OCCUPIED"
                                                                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                                                                        : "bg-white/10 text-white border-white/20"
                                                            }
                                                        >
                                                            {table.status}
                                                        </Badge>
                                                    </td>

                                                    <td className="px-8 py-5 font-bold text-white text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-3.5 w-3.5 text-slate-300" />
                                                            {table.capacity} Seats
                                                        </div>
                                                    </td>

                                                    <td className="px-8 py-5 font-bold text-white text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-3.5 w-3.5 text-slate-300" />
                                                            {table.location}
                                                        </div>
                                                    </td>

                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex justify-end items-center gap-3">
                                                            {table.status === "AVAILABLE" && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-10 px-4 rounded-xl hover:text-gray-300 text-white bg-[#2F344A] hover:bg-[#181E38] font-bold"
                                                                    onClick={() => {
                                                                        resetReservationForm();
                                                                        setResForm((prev) => ({
                                                                            ...prev,
                                                                            tableId: table._id,
                                                                        }));
                                                                        setShowAddReservation(true);
                                                                    }}
                                                                >
                                                                    Book
                                                                </Button>
                                                            )}

                                                            <button
                                                                onClick={() => {
                                                                    setSelectedTableId(table._id);
                                                                    setShowDeleteTable(true);
                                                                }}
                                                                className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all hover:scale-110 shadow-sm border border-red-500/20"
                                                            >
                                                                <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
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
                ) : (
                    <div className="space-y-4">
                        {filteredReservations.map((reservation) => (
                            <div
                                key={reservation._id}
                                className="bg-[#183247] p-5 rounded-2xl border border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#408c8c]/40 transition-all"
                            >
                                <div className="flex items-center gap-4 text-left">
                                    <div className="h-12 w-12 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-lg">
                                        {typeof reservation.tableId === "object"
                                            ? reservation.tableId?.tableNumber || "?"
                                            : "?"}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-bold text-white">
                                                {reservation.customerName}
                                            </h3>
                                            <Badge variant={getStatusVariant(reservation.status)}>
                                                {reservation.status}
                                            </Badge>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-300">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                {new Date(reservation.startAt).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3.5 w-3.5" />
                                                {reservation.guestCount} guests
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Phone className="h-3.5 w-3.5" />
                                                {reservation.phone}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-slate-200 hover:bg-white/10 hover:text-white"
                                        onClick={() => handleEditReservation(reservation)}
                                    >
                                        Edit
                                    </Button>

                                    <button
                                        onClick={() => {
                                            setSelectedReservationIdToDelete(reservation._id);
                                            setShowDeleteReservation(true);
                                        }}
                                        className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all hover:scale-110 shadow-sm border border-red-500/20"
                                    >
                                        <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                    </button>

                                    {reservation.status === "BOOKED" && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-green-400 border-green-400/40 bg-transparent hover:bg-green-500/10"
                                                onClick={() =>
                                                    updateReservationStatus(reservation._id, "ARRIVED")
                                                }
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                Arrived
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-400 hover:bg-red-500/10"
                                                onClick={() => handleCancelReservation(reservation._id)}
                                            >
                                                <XCircle className="h-4 w-4 mr-1" />
                                                Cancel
                                            </Button>
                                        </>
                                    )}

                                    {reservation.status === "ARRIVED" && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-blue-400 border-blue-400/40 bg-transparent hover:bg-blue-500/10"
                                            onClick={() =>
                                                updateReservationStatus(reservation._id, "COMPLETED")
                                            }
                                        >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Complete
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {filteredReservations.length === 0 && (
                            <div className="py-20 bg-[#183247] rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center">
                                {searchQuery ? (
                                    <>
                                        <Search className="h-10 w-10 text-slate-400 mb-2" />
                                        <p className="text-slate-300 font-medium">
                                            No reservations match your search.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <Calendar className="h-10 w-10 text-slate-400 mb-2" />
                                        <p className="text-slate-300 font-medium">
                                            No reservations for this date.
                                        </p>
                                        <Button
                                            variant="link"
                                            className="text-white"
                                            onClick={() => {
                                                resetReservationForm();
                                                setShowAddReservation(true);
                                            }}
                                        >
                                            Create one now
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Add Table Modal */}
                {showAddTable && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Add New Table</h2>
                                <button
                                    onClick={() => setShowAddTable(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleAddTable} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        Table Number
                                    </label>
                                    <Input
                                        required
                                        placeholder="e.g. 10 or T1"
                                        className="text-slate-900"
                                        value={tableForm.tableNumber}
                                        onChange={(e) =>
                                            setTableForm((prev) => ({
                                                ...prev,
                                                tableNumber: e.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        Capacity (Persons)
                                    </label>
                                    <Input
                                        type="number"
                                        required
                                        min="1"
                                        className="text-slate-900"
                                        value={tableForm.capacity}
                                        onChange={(e) =>
                                            setTableForm((prev) => ({
                                                ...prev,
                                                capacity: e.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        Location
                                    </label>
                                    <Select
                                        value={tableForm.location}
                                        onValueChange={(value) =>
                                            setTableForm((prev) => ({ ...prev, location: value }))
                                        }
                                    >
                                        <SelectTrigger className="bg-white text-slate-900 border-gray-200">
                                            <SelectValue placeholder="Select Location" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="INDOOR">Indoor</SelectItem>
                                            <SelectItem value="OUTDOOR">Outdoor</SelectItem>
                                            <SelectItem value="WINDOW">Window Side</SelectItem>
                                            <SelectItem value="BALCONY">Balcony</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setShowAddTable(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-[#005477] hover:bg-[#005477]/90 text-white font-bold"
                                    >
                                        Create Table
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add/Edit Reservation Modal */}
                {showAddReservation && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-8 animate-in fade-in zoom-in duration-200">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {isEditingRes ? "Edit Reservation" : "New Table Reservation"}
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowAddReservation(false);
                                        resetReservationForm();
                                    }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveReservation} className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">
                                                Customer Name
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    required
                                                    className="pl-10 text-slate-900"
                                                    placeholder="John Doe"
                                                    value={resForm.customerName}
                                                    onChange={(e) => {
                                                        setResForm((prev) => ({
                                                            ...prev,
                                                            customerName: e.target.value,
                                                        }));
                                                        if (resErrors.customerName) {
                                                            setResErrors((prev) => ({ ...prev, customerName: null }));
                                                        }
                                                    }}
                                                />
                                            </div>
                                            {resErrors.customerName && (
                                                <p className="text-[10px] text-red-500 mt-1 font-bold">{resErrors.customerName}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">
                                                Phone Number
                                            </label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    required
                                                    type="tel"
                                                    maxLength={10}
                                                    className="pl-10 text-slate-900"
                                                    placeholder="07XXXXXXXX"
                                                    value={resForm.phone}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, "");
                                                        setResForm((prev) => ({
                                                            ...prev,
                                                            phone: val,
                                                        }));
                                                        if (resErrors.phone) {
                                                            setResErrors((prev) => ({ ...prev, phone: null }));
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        if (resForm.phone && resForm.phone.length < 10) {
                                                            setResErrors(prev => ({
                                                                ...prev,
                                                                phone: "You must type 10 digits"
                                                            }));
                                                        }
                                                    }}
                                                />
                                            </div>
                                            {resErrors.phone && (
                                                <p className="text-[10px] text-red-500 mt-1 font-bold">{resErrors.phone}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">
                                                Guests
                                            </label>
                                            <div className="relative">
                                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    type="number"
                                                    required
                                                    className="pl-10 text-slate-900"
                                                    min="1"
                                                    value={resForm.guestCount}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value || "1", 10);
                                                        setResForm((prev) => ({
                                                            ...prev,
                                                            guestCount: val,
                                                            tableId: "", // Clear table on change
                                                        }));
                                                        setAvailableTables([]);
                                                        if (resErrors.guestCount || resErrors.tableId) {
                                                            setResErrors((prev) => ({ ...prev, guestCount: null, tableId: null }));
                                                        }
                                                    }}
                                                />
                                            </div>
                                            {resErrors.guestCount && (
                                                <p className="text-[10px] text-red-500 mt-1 font-bold">{resErrors.guestCount}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">
                                                Date
                                            </label>
                                            <Input
                                                type="date"
                                                required
                                                min={getLocalDate()}
                                                className="text-slate-900"
                                                value={resForm.date}
                                                onChange={(e) => {
                                                    setResForm((prev) => ({
                                                        ...prev,
                                                        date: e.target.value,
                                                        tableId: "", // Clear table on change
                                                    }));
                                                    setAvailableTables([]);
                                                    if (resErrors.date || resErrors.tableId) {
                                                        setResErrors((prev) => ({ ...prev, date: null, tableId: null }));
                                                    }
                                                }}
                                            />
                                            {resErrors.date && (
                                                <p className="text-[10px] text-red-500 mt-1 font-bold">{resErrors.date}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">
                                                Time
                                            </label>
                                            <Input
                                                type="time"
                                                required
                                                min={resForm.date === getLocalDate() ? getLocalTime() : undefined}
                                                className="text-slate-900"
                                                value={resForm.time}
                                                onChange={(e) => {
                                                    setResForm((prev) => ({
                                                        ...prev,
                                                        time: e.target.value,
                                                        tableId: "", // Clear table on change
                                                    }));
                                                    setAvailableTables([]);
                                                    if (resErrors.time || resErrors.tableId) {
                                                        setResErrors((prev) => ({ ...prev, time: null, tableId: null }));
                                                    }
                                                }}
                                            />
                                            {resErrors.time && (
                                                <p className="text-[10px] text-red-500 mt-1 font-bold">{resErrors.time}</p>
                                            )}
                                        </div>

                                        <div className="pt-2">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                className="w-full h-11 font-bold"
                                                onClick={handleCheckAvailability}
                                                disabled={checkingAvailability}
                                            >
                                                {checkingAvailability
                                                    ? "Checking..."
                                                    : "Check Available Tables"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {availableTables.length > 0 && (
                                    <div className="mt-6">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">
                                            Select Table
                                        </label>

                                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                            {availableTables.map((table) => (
                                                <button
                                                    key={table._id}
                                                    type="button"
                                                    onClick={() => {
                                                        setResForm((prev) => ({
                                                            ...prev,
                                                            tableId: table._id,
                                                        }));
                                                        if (resErrors.tableId) {
                                                            setResErrors((prev) => ({ ...prev, tableId: null }));
                                                        }
                                                    }}
                                                    className={`py-3 rounded-xl border-2 transition-all font-bold text-sm ${resForm.tableId === table._id
                                                        ? "border-[#005477] bg-[#005477]/5 text-[#005477]"
                                                        : "border-gray-100 hover:border-gray-200 text-gray-600"
                                                        }`}
                                                >
                                                    {table.tableNumber}
                                                </button>
                                            ))}
                                        </div>
                                        {resErrors.tableId && (
                                            <p className="text-[10px] text-red-500 mt-2 font-bold">{resErrors.tableId}</p>
                                        )}

                                        <p className="mt-2 text-[10px] text-gray-400 italic">
                                            * Only tables matching guest capacity are shown.
                                        </p>
                                    </div>
                                )}

                                <div className="pt-8 flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            setShowAddReservation(false);
                                            resetReservationForm();
                                        }}
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        type="submit"
                                        className="flex-1 bg-[#005477] hover:bg-[#005477]/90 text-white font-bold h-11"
                                    >
                                        {isEditingRes ? "Save Changes" : "Book Reservation"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Table Confirmation */}
                <DeleteConfirmDialog
                    open={showDeleteTable}
                    onOpenChange={setShowDeleteTable}
                    onConfirm={handleDeleteTable}
                    title="Delete Table?"
                    description="Are you sure you want to delete this table? This cannot be undone."
                />

                {/* Delete Reservation Confirmation */}
                <DeleteConfirmDialog
                    open={showDeleteReservation}
                    onOpenChange={setShowDeleteReservation}
                    onConfirm={handleDeleteReservation}
                    title="Delete Reservation?"
                    description="Are you sure you want to delete this reservation? This cannot be undone."
                />

                {/* Message Dialog */}
                <MessageDialog
                    open={messageDialog.open}
                    onOpenChange={(open) => setMessageDialog((prev) => ({ ...prev, open }))}
                    title={messageDialog.title}
                    description={messageDialog.description}
                    type={messageDialog.type}
                    onClose={() => setMessageDialog((prev) => ({ ...prev, open: false }))}
                />
            </div>
        </div>
    );
}