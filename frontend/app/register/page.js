"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MessageDialog from '@/components/ui/MessageDialog';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        birthday: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const router = useRouter();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Password Match Validation
        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        if (formData.password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        // Phone Validation
        if (formData.phone.replace(/\D/g, '').length !== 10) {
            return setError('Phone number must be exactly 10 digits');
        }

        // Birthday Validation (16+ years)
        if (!formData.birthday) {
            return setError('Please select your birthday');
        }
        const birthDate = new Date(formData.birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        if (age < 16) {
            return setError('Registration Failed: You must be at least 16 years old');
        }

        setIsSubmitting(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${apiUrl}/auth/customer-register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    birthday: formData.birthday,
                    password: formData.password,
                    role: 'CUSTOMER'
                })
            });
            const data = await res.json();
            if (data.success) {
                setShowSuccessDialog(true);
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError('Connection failed');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                        JOIN <span className="text-[#408c8c]">OCEAN</span>BREEZE
                    </h1>
                    <p className="text-slate-400 font-medium tracking-tight uppercase text-[10px] letter-spacing-[0.2em] opacity-80">Experience Excellence</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest text-center animate-shake">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-100 tracking-[0.2em] mb-1.5 ml-1">Full Name</label>
                        <input
                            name="name"
                            type="text"
                            required
                            className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#408c8c]/50 focus:border-[#408c8c]/50 focus:bg-white/10 transition-all font-medium"
                            placeholder="Enter Your Full Name"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-100 tracking-[0.2em] mb-1.5 ml-1">Phone Number</label>
                            <input
                                name="phone"
                                type="text"
                                required
                                maxLength={10}
                                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#408c8c]/50 focus:border-[#408c8c]/50 focus:bg-white/10 transition-all font-medium"
                                placeholder="07xxxxxxxx"
                                value={formData.phone}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setFormData({ ...formData, phone: val });
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-100 tracking-[0.2em] mb-1.5 ml-1">Birthday</label>
                            <input
                                name="birthday"
                                type="date"
                                required
                                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#408c8c]/50 focus:border-[#408c8c]/50 focus:bg-white/10 transition-all font-medium [color-scheme:dark]"
                                value={formData.birthday}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-100 tracking-[0.2em] mb-1.5 ml-1">Email Address</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#408c8c]/50 focus:border-[#408c8c]/50 focus:bg-white/10 transition-all font-medium"
                            placeholder="Enter Your Email Address"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-100 tracking-[0.2em] mb-1.5 ml-1">Password</label>
                            <input
                                name="password"
                                type="password"
                                required
                                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#408c8c]/50 focus:border-[#408c8c]/50 focus:bg-white/10 transition-all font-medium"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-100 tracking-[0.2em] mb-1.5 ml-1">Confirm Password</label>
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#408c8c]/50 focus:border-[#408c8c]/50 focus:bg-white/10 transition-all font-medium"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#408c8c] to-[#005477] hover:from-[#408c8c]/90 hover:to-[#005477]/90 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-[#408c8c]/20 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
                    >
                        {isSubmitting ? 'Creating account...' : 'Create Account'}
                    </button>

                    <div className="text-center mt-8">
                        <p className="text-slate-400 text-xs font-medium">
                            Already have an account? <a href="/login" virtual="true" className="text-[#408c8c] hover:text-white font-bold ml-2 transition-colors uppercase tracking-widest text-[10px]">Sign in</a>
                        </p>
                    </div>
                </form>
            </div>

            <MessageDialog
                open={showSuccessDialog}
                onOpenChange={setShowSuccessDialog}
                type="success"
                title="Account Created!"
                description="Your account has been created successfully. Welcome to OceanBreeze! You can now sign in to your new account."
                onClose={() => router.push('/login')}
            />
        </div>
    );
}
