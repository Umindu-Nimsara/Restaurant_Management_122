import React from 'react'
import Image from 'next/image'
import { ArrowRight, Facebook, Instagram, Twitter } from 'lucide-react'


function Footer() {
    return (
        <footer className="border-t border-white/10 pt-24 pb-12 px-6 bg-white/[0.02] backdrop-blur-3xl">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                <div className="space-y-6">
                    <Image src="/OceanBreeze.png" width={160} height={50} alt="OceanBreeze" className="opacity-90 grayscale brightness-200" />
                    <p className="text-slate-400 text-sm leading-relaxed max-w-xs font-medium">
                        Experience the pinnacle of culinary excellence. At OceanBreeze, we combine fresh ingredients with mastercraft techniques to deliver an unforgettable dining experience.
                    </p>
                </div>

                <div className="space-y-6">
                    <h4 className="text-white text-xs font-black uppercase tracking-[0.2em]">Quick Links</h4>
                    <ul className="space-y-4">
                        <li><a href="#" className="text-slate-500 hover:text-[#408c8c] transition-colors text-xs font-black uppercase tracking-widest flex items-center gap-2 group"><ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" /> Our Menu</a></li>
                        <li><a href="#" className="text-slate-500 hover:text-[#408c8c] transition-colors text-xs font-black uppercase tracking-widest flex items-center gap-2 group"><ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" /> Tracking Order</a></li>
                        <li><a href="#" className="text-slate-500 hover:text-[#408c8c] transition-colors text-xs font-black uppercase tracking-widest flex items-center gap-2 group"><ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" /> Reservations</a></li>
                    </ul>
                </div>

                <div className="space-y-6">
                    <h4 className="text-white text-xs font-black uppercase tracking-[0.2em]">Contact Us</h4>
                    <ul className="space-y-4">
                        <li className="text-slate-500 text-xs font-bold leading-relaxed">
                            123 Culinary Drive, Gourmet Plaza<br />
                            Colombo 07, Sri Lanka
                        </li>
                        <li className="text-slate-300 text-sm font-black">+94 11 234 5678</li>
                        <li className="text-slate-500 text-xs font-bold italic underline border-b border-transparent hover:border-slate-500 transition-all cursor-pointer">reservations@oceanbreeze.com</li>
                    </ul>
                </div>

                <div className="space-y-6">
                    <h4 className="text-white text-xs font-black uppercase tracking-[0.2em]">Opening Hours</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-slate-500 uppercase tracking-widest">Mon - Fri</span>
                            <span className="text-[#408c8c]">11 AM - 11 PM</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-slate-500 uppercase tracking-widest">Sat - Sun</span>
                            <span className="text-[#408c8c]">09 AM - 12 PM</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
                <p className="text-slate-600 font-bold text-[10px] uppercase tracking-[0.3em]">
                    © 2026 OceanBreeze Culinary Hub. <span className="hidden sm:inline">Crafted for Excellence.</span>
                </p>

                <div className="flex items-center gap-10">
                    <div className="flex gap-6">
                        <a href="#" className="text-slate-500 hover:text-white transition-all transform hover:scale-110"><Facebook className="w-5 h-5" /></a>
                        <a href="#" className="text-slate-500 hover:text-white transition-all transform hover:scale-110"><Instagram className="w-5 h-5" /></a>
                        <a href="#" className="text-slate-500 hover:text-white transition-all transform hover:scale-110"><Twitter className="w-5 h-5" /></a>
                    </div>
                    <div className="h-4 w-[1px] bg-white/10 hidden md:block"></div>
                    <div className="flex gap-8">
                        <a href="#" className="text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">Privacy</a>
                        <a href="#" className="text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">Terms</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
