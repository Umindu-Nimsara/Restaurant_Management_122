"use client";

import React, { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/authContext";
import { ChevronRight, ChevronLeft, ChevronDown } from "lucide-react";

import BreadcrumbNav from "@/components/ui/breadcrumb";
import { icons, sideBarIcon } from "@/components/ui/icon";

export default function SideMenu({ isOpen, setIsOpen, isMobileRoute = false }) {
    const router = useRouter();
    const pathname = usePathname();

    const { user } = useAuth();
    const [loadingName, setLoadingName] = useState(null);
    const [expanded, setExpanded] = useState({});

    const menuItems = useMemo(() => {
        const allItems = [
            // {
            //     name: "Home",
            //     route: "/modules/admin",
            //     icon: sideBarIcon.Home,
            //     roles: ["ADMIN", "CHEF", "WAITER", "CUSTOMER"]
            // },
            {
                name: "Dashboard",
                route: "/modules/admin/dashboard",
                icon: icons.LayoutDashboard,
                roles: ["ADMIN"]
            },
            {
                name: "Menu Management",
                route: "/modules/admin/menu-management/",
                icon: sideBarIcon.HandPlatter,
                roles: ["ADMIN", "CHEF"]
            },
            {
                name: "Inventory Management",
                route: "/modules/admin/inventory-management/",
                icon: sideBarIcon.ShoppingCart,
                roles: ["ADMIN", "CHEF"]
            },
            {
                name: "Order Management",
                route: "/modules/admin/order-management/",
                icon: sideBarIcon.BadgeDollarSign,
                roles: ["ADMIN", "CHEF", "WAITER"]
            },
            {
                name: "Table Management",
                route: "/modules/admin/table-management/",
                icon: sideBarIcon.DoorOpenIcon,
                roles: ["ADMIN", "WAITER"]
            },
            {
                name: "Supplier Management",
                route: "/modules/admin/supplier-management/",
                icon: sideBarIcon.StoreIcon,
                roles: ["ADMIN", "CHEF"]
            },
            {
                name: "User Management",
                route: "/modules/admin/users/",
                icon: sideBarIcon.UserPen,
                roles: ["ADMIN"]
            },
        ];

        return allItems.filter(item => !item.roles || item.roles.includes(user?.role));
    }, [user]);

    const handleNavigate = (route, name) => {
        if (!route || !name) return;
        const safeRoute = route.startsWith("/") ? route : `/${route}`;

        setLoadingName(name);
        router.push(safeRoute);

        if (typeof window !== "undefined" && window.innerWidth < 640) setIsOpen(false);

        setTimeout(() => setLoadingName(null), 500);
    };

    const normPath = (p) => p.replace(/\/+$/, "") || "/";
    const isRouteActive = (route) => {
        if (!route) return false;
        const r = normPath(route.startsWith("/") ? route : `/${route}`);
        const p = normPath(pathname || "/");
        return p === r || p.startsWith(r + "/");
    };

    const renderIcon = (icon) => {
        if (!icon) return null;

        if (typeof icon === "function") {
            const IconComp = icon;
            return <IconComp className="text-white w-5 h-5" />;
        }

        return <span className="text-white">{icon}</span>;
    };

    const renderItems = (items, level = 0) => {
        return items.map((item) => {
            const hasChildren = !!(item.subItems && item.subItems.length);
            const isActive = isRouteActive(item.route);

            return (
                <div key={item.name}>
                    <button
                        type="button"
                        onClick={() => handleNavigate(item.route, item.name)}
                        className={cn(
                            "flex w-full items-center rounded-md transition-all cursor-pointer",
                            "mt-2 p-2",
                            isActive
                                ? "bg-white/10"
                                : "hover:bg-white/10"
                        )}
                        style={{ paddingLeft: isOpen ? 14 + level * 26 : 8 }}
                    >
                        <div className="w-7 flex items-center justify-center">
                            {loadingName === item.name ? (
                                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                                renderIcon(item.icon)
                            )}
                        </div>

                        {isOpen && (
                            <span className="ml-2 flex-1 text-sm text-white text-left">
                                {item.name}
                            </span>
                        )}

                        {isOpen && hasChildren && (
                            <ChevronDown className="h-4 w-4 text-white" />
                        )}
                    </button>
                </div>
            );
        });
    };

    if (isMobileRoute) return null;

    const handleMenuToggle = () => setIsOpen(!isOpen);

    return (
        <div className="relative">
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 sm:hidden"
                    onClick={handleMenuToggle}
                    aria-hidden="true"
                />
            )}

            {/* SIDEBAR */}
            <div
                className={cn(
                    "fixed top-16 left-0 text-white shadow-lg flex flex-col transition-all duration-300 ease-in-out z-40 overflow-y-auto",
                    isOpen ? "w-64 p-3" : "w-16 p-2"
                )}
                style={{
                    height: "calc(100vh - 64px)",
                    backgroundColor: "#111C2B"
                }}
            >
                <nav>{renderItems(menuItems)}</nav>
            </div>

            {/* TOGGLE BUTTON */}
            <div
                className={cn(
                    "fixed top-16 z-50 flex items-center gap-2 transition-all duration-300",
                    isOpen ? "left-4 sm:left-64" : "left-4 sm:left-16"
                )}
            >
                <button
                    onClick={handleMenuToggle}
                    className="p-2 ml-2 mt-5 bg-[#111C2B] text-white rounded-md shadow-md hover:bg-[#1b2a40]"
                >
                    {isOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
                </button>

                <div className="mt-5">
                    <BreadcrumbNav />
                </div>
            </div>
        </div>
    );
}