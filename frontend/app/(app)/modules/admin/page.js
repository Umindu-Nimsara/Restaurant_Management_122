// app/page.js

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { modules } from "@/components/ui/module";

export default function AdminHomePage() {
    return (
        <div className="min-h-screen w-full relative flex flex-col items-center py-12 px-4 overflow-hidden bg-[#0a0c1a]/20">
            {/* Full Screen Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/dashbord.jpeg"
                    fill
                    alt="Background"
                    className="object-cover opacity-100"
                    priority
                />
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#181E38]/10 via-[#181E38]/30 to-[#181E38]/60" />
            </div>

            <div className="relative z-10 w-full max-w-6xl flex flex-col items-center">
                {/* Logo Section */}
                <div className="mb-12 p-8 rounded-[2rem] bg-white/5 backdrop-blur-md border border-white/10 flex justify-center animate-in fade-in slide-in-from-top-4 duration-1000 shadow-2xl">
                    <Image
                        src="/OceanBreeze.png"
                        width={320}
                        height={100}
                        alt="Restaurant Logo"
                        priority
                        className="drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    />
                </div>

                {/* Welcome Header */}
                <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">

                </div>

                {/* Modules Grid */}
                <div className="w-full flex justify-center animate-in fade-in zoom-in duration-1000 delay-500">
                    <div className="grid gap-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 item-center">
                        {modules.map((mod) => (
                            <Link key={mod.name} href={mod.route}>
                                <Card className="group flex flex-col items-center justify-center p-6 h-30 w-30 md:h-48 md:w-48 bg-white/5 border-white/10 hover:bg-white/10 hover:border-cyan-500/50 hover:scale-110 transition-all cursor-pointer rounded-[2rem] relative overflow-hidden backdrop-blur-md">
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="mb-4 text-white group-hover:text-cyan-400 transition-all duration-300 scale-150 md:scale-[2] group-hover:rotate-12">
                                        {mod.icon}
                                    </div>
                                    <span className="text-center text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-300 group-hover:text-white transition-colors">
                                        {mod.name}
                                    </span>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}