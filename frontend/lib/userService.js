const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export const userService = {
    async fetchUsers() {
        const res = await fetch(`${API_URL}/users`, {
            headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch users");
        return data.data;
    },

    async fetchStaff() {
        const users = await this.fetchUsers();
        return users.filter(u => ['ADMIN', 'CHEF', 'WAITER'].includes(u.role));
    }
};
