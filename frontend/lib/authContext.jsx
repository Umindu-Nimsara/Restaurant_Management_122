"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login');
    }, [router]);

    // Session Timeout Logic (10 minutes)
    useEffect(() => {
        let timeout;
        const resetTimeout = () => {
            if (timeout) clearTimeout(timeout);
            if (user) {
                timeout = setTimeout(() => {
                    alert('Session expired due to inactivity');
                    logout();
                }, 10 * 60 * 1000); // 10 minutes
            }
        };

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => window.addEventListener(event, resetTimeout));

        resetTimeout();

        return () => {
            if (timeout) clearTimeout(timeout);
            events.forEach(event => window.removeEventListener(event, resetTimeout));
        };
    }, [user, logout]);

    useEffect(() => {
        // Don't load user from localStorage on login page
        if (typeof window !== 'undefined' && window.location.pathname === '/login') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setLoading(false);
            return;
        }
        
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (savedUser && token) {
            try {
                const parsed = JSON.parse(savedUser);
                setUser(parsed);
            } catch (err) {
                // Clear invalid data
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('token', data.token);
                // In a real app, fetch full profile here. For now, use role from response.
                const userObj = { email, role: data.role, name: data.name };
                localStorage.setItem('user', JSON.stringify(userObj));
                setUser(userObj);

                // Redirect based on role
                if (data.role === 'ADMIN') router.push('/modules/admin');
                else if (data.role === 'CHEF') router.push('/modules/chef');
                else if (data.role === 'CUSTOMER') router.push('/');
                else router.push('/');

                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (err) {
            return { success: false, error: 'Connection failed' };
        }
    };

    const pinLogin = async (pin) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${apiUrl}/auth/pin-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('token', data.token);
                const userObj = { role: data.role, name: data.name };
                localStorage.setItem('user', JSON.stringify(userObj));
                setUser(userObj);

                // Redirect based on role
                if (data.role === 'ADMIN') router.push('/modules/admin');
                else if (data.role === 'CHEF') router.push('/modules/chef');
                else if (data.role === 'WAITER') router.push('/modules/admin/order-management/add-order');
                else router.push('/');

                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (err) {
            return { success: false, error: 'Connection failed' };
        }
    };

    const updateUser = useCallback((newData) => {
        const updatedUser = { ...user, ...newData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, login, pinLogin, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
export const RoleCheck = ({ allowedRoles, children }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user || !allowedRoles.includes(user.role)) return null;
    return children;
};
