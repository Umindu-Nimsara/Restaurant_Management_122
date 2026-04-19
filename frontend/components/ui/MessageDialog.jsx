"use client";

import React from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Info, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MessageDialog({
    open,
    onOpenChange,
    title,
    description,
    type = "info", // info, error, success
    onClose,
}) {
    const icons = {
        info: <Info className="h-6 w-6 text-blue-500" />,
        error: <AlertCircle className="h-6 w-6 text-red-500" />,
        success: <CheckCircle2 className="h-6 w-6 text-green-500" />,
    };

    const actionButtonStyles = {
        info: "bg-blue-500 hover:bg-blue-600 text-white",
        error: "bg-red-500 hover:bg-red-600 text-white",
        success: "bg-green-500 hover:bg-green-600 text-white",
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-[400px]">
                <AlertDialogHeader className="flex flex-col items-center text-center">
                    <div className="mb-2 p-3 rounded-full bg-gray-50">
                        {icons[type]}
                    </div>
                    <AlertDialogTitle className="text-xl font-bold">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-500 pt-1">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="sm:justify-center mt-2">
                    <AlertDialogAction
                        className={cn(
                            "w-full sm:w-32 h-11 rounded-xl font-bold shadow-sm transition-all",
                            actionButtonStyles[type]
                        )}
                        onClick={onClose}
                    >
                        Close
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
