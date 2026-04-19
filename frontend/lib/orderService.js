const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export const orderService = {
    async createOrder(payload) {
        const res = await fetch(`${API_URL}/orders`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create order");
        return data.data;
    },

    async fetchMyOrders() {
        const res = await fetch(`${API_URL}/orders?myOrders=true`, {
            headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch orders");
        return data.data;
    },

    async fetchAllOrders() {
        const res = await fetch(`${API_URL}/orders`, {
            headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch all orders");
        return data.data;
    },

    async updateOrderStatus(orderId, status) {
        const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ status }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update order status");
        return data.data;
    },

    async getOrder(orderId) {
        const res = await fetch(`${API_URL}/orders/${orderId}`, {
            headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch order");
        return data.data;
    },

    async updateOrder(orderId, payload) {
        const res = await fetch(`${API_URL}/orders/${orderId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update order");
        return data.data;
    }
};
