const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export const menuService = {
    // Menu Items
    async fetchMenuItems() {
        const res = await fetch(`${API_URL}/menu/items`, {
            headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch menu items");
        return data.data;
    },

    async fetchMenuItem(id) {
        const res = await fetch(`${API_URL}/menu/items/${id}`, {
            headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch menu item");
        return data.data;
    },

    async createMenuItem(payload) {
        const res = await fetch(`${API_URL}/menu/items`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create menu item");
        return data.data;
    },

    async updateMenuItem(id, payload) {
        const res = await fetch(`${API_URL}/menu/items/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update menu item");
        return data.data;
    },

    async deleteMenuItem(id) {
        const res = await fetch(`${API_URL}/menu/items/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to delete menu item");
        return data;
    },

    // Categories
    async fetchCategories() {
        const res = await fetch(`${API_URL}/menu/categories`, {
            headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch categories");
        return data.data;
    },

    async createCategory(name) {
        const res = await fetch(`${API_URL}/menu/categories`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create category");
        return data.data;
    },
};
