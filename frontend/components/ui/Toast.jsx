"use client";

import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle className="w-5 h-5" />,
        error: <AlertCircle className="w-5 h-5" />,
        info: <Info className="w-5 h-5" />
    };

    const colors = {
        success: 'bg-emerald-500 border-emerald-400',
        error: 'bg-red-500 border-red-400',
        info: 'bg-cyan-500 border-cyan-400'
    };

    return (
        <div className={cn(
            "fixed top-6 right-6 z-50 rounded-xl px-6 py-4 shadow-2xl border backdrop-blur-md animate-in slide-in-from-top-5 fade-in duration-300",
            colors[type]
        )}>
            <div className="flex items-center gap-3 text-white">
                {icons[type]}
                <span className="font-semibold">{message}</span>
                <button
                    onClick={onClose}
                    className="ml-4 hover:bg-white/20 rounded-lg p-1 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export function useToast() {
    const [toasts, setToasts] = React.useState([]);

    const showToast = (message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const ToastContainer = () => (
        <>
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </>
    );

    return { showToast, ToastContainer };
}
