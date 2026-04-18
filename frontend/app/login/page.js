"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, Delete } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
    const [loginMode, setLoginMode] = useState('EMAIL'); // 'EMAIL' or 'PIN'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, pinLogin } = useAuth();
    const router = useRouter();

    // Clear any invalid tokens on mount
    useEffect(() => {
        // Clear localStorage to prevent "User not found" errors
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Also clear any error messages
        setError('');
    }, []);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setIsSubmitting(true);
        const res = await login(email, password);
        if (res.success) {
            // Redirect handled in context
        } else {
            setError(res.error || 'Invalid email or password');
            setPassword('');
        }
        setIsSubmitting(false);
    };

    const handlePinSubmit = async (completePin) => {
        setError('');
        setIsSubmitting(true);
        const res = await pinLogin(completePin);
        if (res.success) {
            // Redirect handled in context
        } else {
            setError(res.error || 'Invalid PIN');
            setPin(''); // Reset PIN on failure
        }
        setIsSubmitting(false);
    };

    const handlePinClick = (digit) => {
        if (isSubmitting || pin.length >= 4) return;
        const newPin = pin + digit;
        setPin(newPin);
        
        if (newPin.length === 4) {
            // Auto submit
            handlePinSubmit(newPin);
        }
    };

    const handlePinDelete = () => {
        if (isSubmitting || pin.length === 0) return;
        setPin(pin.slice(0, -1));
    };

    // Listen for physical keyboard input for PIN
    useEffect(() => {
        if (loginMode !== 'PIN') return;
        const handleKeyDown = (e) => {
            if (/^[0-9]$/.test(e.key)) {
                handlePinClick(e.key);
            } else if (e.key === 'Backspace') {
                handlePinDelete();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [loginMode, pin, isSubmitting]);

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 scale-105"
                style={{ backgroundImage: "url('/login.jpg')" }}
            />
            <div className="absolute inset-0 z-0 bg-[#0F0E28]/40" />

            <div className="w-full max-w-md p-10 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-3xl relative z-10 transition-all duration-500 hover:border-white/20 group">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase italic italic">
                        <span className="text-[#408c8c]">Ocean</span>Breeze
                    </h1>
                    <p className="text-slate-400 font-medium tracking-tight uppercase text-[10px] letter-spacing-[0.2em] opacity-80">Experience Excellence</p>
                </div>

                {/* Login Mode Toggle */}
                <div className="flex bg-white/5 rounded-2xl p-1 mb-8">
                    <button
                        type="button"
                        onClick={() => { setLoginMode('EMAIL'); setError(''); setPin(''); }}
                        className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2", loginMode === 'EMAIL' ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white")}
                    >
                        <Mail className="w-4 h-4" /> Email
                    </button>
                    <button
                        type="button"
                        onClick={() => { setLoginMode('PIN'); setError(''); setPassword(''); }}
                        className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2", loginMode === 'PIN' ? "bg-[#408c8c]/20 border border-[#408c8c]/30 text-[#408c8c]" : "text-slate-400 hover:text-white")}
                    >
                        <KeyRound className="w-4 h-4" /> PIN
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest text-center animate-shake">
                        {error}
                    </div>
                )}

                {loginMode === 'EMAIL' ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-100 tracking-[0.2em] mb-2 ml-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#408c8c]/50 focus:border-[#408c8c]/50 focus:bg-white/10 transition-all font-medium"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2 ml-1">
                            <label className="block text-[10px] font-black uppercase text-slate-100 tracking-[0.2em]">Password</label>
                            <a href="/forgot-password" virtual="true" className="text-[10px] font-black uppercase text-[#408c8c] hover:text-white transition-colors tracking-widest">Forgot password?</a>
                        </div>
                        <input
                            type="password"
                            required
                            className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#408c8c]/50 focus:border-[#408c8c]/50 focus:bg-white/10 transition-all font-medium"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#408c8c] to-[#005477] hover:from-[#408c8c]/90 hover:to-[#005477]/90 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-[#408c8c]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {isSubmitting ? 'Verifying Identity...' : 'Sign In'}
                    </button>

                    <div className="text-center mt-8">
                        <p className="text-slate-400 text-xs font-medium">
                            Don't have an account?
                            <a href="/register" virtual="true" className="text-[#408c8c] hover:text-white font-bold ml-2 transition-colors uppercase tracking-widest text-[10px]">Create Account</a>
                        </p>
                    </div>
                </form>
                ) : (
                    <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* PIN Dots */}
                        <div className="flex gap-4 mb-8">
                            {[...Array(4)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className={cn(
                                        "w-4 h-4 rounded-full transition-all duration-300",
                                        i < pin.length ? "bg-[#408c8c] scale-125 shadow-[0_0_15px_rgba(64,140,140,0.5)]" : "bg-white/10"
                                    )}
                                />
                            ))}
                        </div>

                        {/* Numeric Keypad */}
                        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => handlePinClick(num.toString())}
                                    disabled={isSubmitting}
                                    className="h-16 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 active:scale-95 text-white text-2xl font-light transition-all flex items-center justify-center disabled:opacity-50"
                                >
                                    {num}
                                </button>
                            ))}
                            <div className="h-16" /> {/* Empty Slot */}
                            <button
                                type="button"
                                onClick={() => handlePinClick('0')}
                                disabled={isSubmitting}
                                className="h-16 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 active:scale-95 text-white text-2xl font-light transition-all flex items-center justify-center disabled:opacity-50"
                            >
                                0
                            </button>
                            <button
                                type="button"
                                onClick={handlePinDelete}
                                disabled={isSubmitting || pin.length === 0}
                                className="h-16 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:text-red-400 active:scale-95 text-slate-400 transition-all flex items-center justify-center disabled:opacity-20 disabled:hover:text-slate-400"
                            >
                                <Delete className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-8 text-center">
                            Enter your robust 4-digit Staff PIN
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
}
