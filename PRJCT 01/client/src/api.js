const API_URL = import.meta.env.VITE_API_URL || "/api";

export function getToken() {
  return localStorage.getItem("rentit_token");
}

export function setToken(token) {
  if (token) {
    localStorage.setItem("rentit_token", token);
  } else {
    localStorage.removeItem("rentit_token");
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const api = {
  signup(payload) {
    return request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  login(payload) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  me() {
    return request("/auth/me");
  },
  verify(payload) {
    return request("/users/me/verification", {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },
  items(params = {}) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== "" && value !== "All" && value != null)
    ).toString();

    return request(`/items${query ? `?${query}` : ""}`);
  },
  createItem(payload) {
    return request("/items", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  createBooking(payload) {
    return request("/bookings", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  myBookings() {
    return request("/bookings/me");
  },
  updateBookingStatus(id, status) {
    return request(`/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
  },
  adminSummary() {
    return request("/admin/summary");
  }
};
