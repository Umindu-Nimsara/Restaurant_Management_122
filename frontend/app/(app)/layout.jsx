"use client";

import React, { useState } from "react";
import SideMenu from "@/components/ui/sideBar";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/footer";

export default function AppLayout({ children }) {
    const [isOpen, setIsOpen] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const { logout, user } = useAuth();

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    // Hide sidebar on the main admin/chef dashboard pages to avoid redundancy with the cards
    const hideSidebar = pathname === "/modules/admin" || pathname === "/modules/admin/" || pathname === "/modules/chef" || pathname === "/modules/chef/" || pathname === "/" || pathname === "/profile" || pathname === "/modules/customer-dashboard";

    // Don't show header/sidebar on login/register pages
    if (pathname === "/login" || pathname === "/register") {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-background dark:bg-background-dark">
            {!hideSidebar && (
                <SideMenu isOpen={isOpen} setIsOpen={setIsOpen} />
            )}

            <Header
                title="OceanBreeze"
                onLogout={handleLogout}
                profileHref="/profile"
                showProfile={true}
                showLogout={true}
            />

            <main className={`pt-16 transition-all duration-300 ${!hideSidebar ? (isOpen ? "ml-64" : "ml-16") : "ml-0"}`}>
                {children}
                <Footer />
            </main>
        </div>
    );
}