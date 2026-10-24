import axios from "axios";
import { storage } from "@/lib/storage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request Interceptor: Attach Token & Active Society
apiClient.interceptors.request.use(
  (config) => {
    const token = storage.getItem("havenly.token");
    let societyId = storage.getItem("havenly.societyId");

    // Fallback: If societyId is not in storage, resolve from user profile
    if (!societyId) {
      try {
        const storedUser = storage.getItem("havenly.user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed?.societyId) {
            societyId = parsed.societyId;
            storage.setItem("havenly.societyId", societyId);
          }
        }
      } catch (e) {}
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (societyId) {
      config.headers["X-Society-Id"] = societyId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Token Refresh & Error Formatting
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Check if this endpoint should skip refresh attempts (e.g. login, refresh itself, public registration)
    const isAuthBypass =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/register");

    // Handle 401 Unauthorized token refresh
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthBypass) {
      const refreshToken = storage.getItem("havenly.refreshToken");

      if (!refreshToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { token: newToken, refreshToken: newRefreshToken } = refreshResponse.data.data;

        storage.setItem("havenly.token", newToken);
        if (newRefreshToken) {
          storage.setItem("havenly.refreshToken", newRefreshToken);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        storage.removeItem("havenly.token");
        storage.removeItem("havenly.refreshToken");
        storage.removeItem("havenly.user");
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/login") &&
          !window.location.pathname.includes("/select-society")
        ) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    const message = error.response?.data?.message || error.message || "An error occurred";
    return Promise.reject(new Error(message));
  }
);

// --- API Service Methods ---

// Auth
export const authApi = {
  login: (data) => apiClient.post("/auth/login", data),
  logout: (refreshToken) => apiClient.post("/auth/logout", { refreshToken }),
  getMe: () => apiClient.get("/auth/me"),
  forgotPassword: (email) => apiClient.post("/auth/forgot-password", { email }),
  resetPassword: (data) => apiClient.post("/auth/reset-password", data),
  registerResident: (data) => apiClient.post("/auth/register/resident", data),
  registerSecretary: (data) => apiClient.post("/auth/register/secretary", data),
  registerGuard: (data) => apiClient.post("/auth/register/guard", data),
  switchSociety: (societyId) => apiClient.post("/auth/switch-society", { societyId }),
};

// Societies
export const societyApi = {
  getAll: (params) => apiClient.get("/societies", { params }),
  getById: (id) => apiClient.get(`/societies/${id}`),
  create: (data) => apiClient.post("/societies", data),
  register: (data) => apiClient.post("/societies/register", data),
  getFlatsPublic: (societyId) => apiClient.get(`/societies/${societyId}/flats`),
  update: (id, data) => apiClient.patch(`/societies/${id}`, data),
  getStats: (id) => apiClient.get(`/societies/${id}/stats`),
};

// Complaints
export const complaintApi = {
  getAll: (params) => apiClient.get("/complaints", { params }),
  getById: (id) => apiClient.get(`/complaints/${id}`),
  getPublic: (params) => apiClient.get("/complaints/public", { params }),
  create: (data) => apiClient.post("/complaints", data),
  updateStatus: (id, data) => apiClient.patch(`/complaints/${id}/status`, data),
  assignStaff: (id, data) => apiClient.patch(`/complaints/${id}/assign`, data),
  unassignStaff: (id) => apiClient.patch(`/complaints/${id}/unassign`),
  toggleSupport: (id) => apiClient.post(`/complaints/${id}/support`),
};

// Finance & Maintenance
export const financeApi = {
  getMaintenance: (params) => apiClient.get("/maintenance", { params }),
  getBillById: (id, params) => apiClient.get(`/maintenance/${id}`, { params }),
  getFlatHistory: (flatId, params) => apiClient.get(`/maintenance/flat/${flatId}/history`, { params }),
  generateBills: (data) => apiClient.post("/maintenance/generate-bills", data),
  recordPayment: (id, data) => apiClient.post(`/maintenance/${id}/record-payment`, data),
  getPayments: (params) => apiClient.get("/payments", { params }),
  createOrder: (data) => apiClient.post("/payments/create-order", data),
  verifyPayment: (data) => apiClient.post("/payments/verify", data),
  recordCash: (data) => apiClient.post("/payments/cash", data),
  getReceipt: (id) => apiClient.get(`/payments/${id}/receipt`),
};

// Visitors
export const visitorApi = {
  getAll: (params) => apiClient.get("/visitors", { params }),
  getById: (id) => apiClient.get(`/visitors/${id}`),
  getExpected: () => apiClient.get("/visitors/expected"),
  register: (data) => apiClient.post("/visitors", data),
  approve: (id) => apiClient.patch(`/visitors/${id}/approve`),
  reject: (id, reason) => apiClient.patch(`/visitors/${id}/reject`, { reason }),
  recordEntry: (id) => apiClient.patch(`/visitors/${id}/entry`),
  recordExit: (id) => apiClient.patch(`/visitors/${id}/exit`),
  checkIn: (id) => apiClient.patch(`/visitors/${id}/check-in`),
  checkOut: (id) => apiClient.patch(`/visitors/${id}/check-out`),
};

// Community & Operations
export const communityApi = {
  getNotices: (params) => apiClient.get("/notices", { params }),
  createNotice: (data) => apiClient.post("/notices", data),
  deleteNotice: (id) => apiClient.delete(`/notices/${id}`),
  getDocuments: (params) => apiClient.get("/documents", { params }),
  createDocument: (data) => apiClient.post("/documents", data),
  deleteDocument: (id) => apiClient.delete(`/documents/${id}`),
  getResidents: (params) => apiClient.get("/residents", { params }),
  createResident: (data) => apiClient.post("/residents", data),
  getFlats: (params) => apiClient.get("/flats", { params }),
  getFlatById: (id) => apiClient.get(`/flats/${id}`),
  updateFlatOccupancy: (id, data) => apiClient.patch(`/flats/${id}/occupancy`, data),
  createFlat: (data) => apiClient.post("/flats", data),
  getStaff: (params) => apiClient.get("/staff", { params }),
  createStaff: (data) => apiClient.post("/staff", data),
  updateStaff: (id, data) => apiClient.patch(`/staff/${id}`, data),
  deleteStaff: (id) => apiClient.delete(`/staff/${id}`),
  getDeliveries: (params) => apiClient.get("/deliveries", { params }),
  getDeliveryById: (id) => apiClient.get(`/deliveries/${id}`),
  createDelivery: (data) => apiClient.post("/deliveries", data),
  collectDelivery: (id, data) => apiClient.patch(`/deliveries/${id}/collect`, data),
  handoverDelivery: (id, data) => apiClient.patch(`/deliveries/${id}/handover`, data),
  updateDeliveryStatus: (id, data) => apiClient.patch(`/deliveries/${id}/status`, data),
  getEmergency: () => apiClient.get("/emergency"),
  triggerEmergency: (data) => apiClient.post("/emergency", data),
  resolveEmergency: (id, data) => apiClient.patch(`/emergency/${id}/resolve`, data),
  getNotifications: () => apiClient.get("/notifications"),
  markNotificationRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllNotificationsRead: () => apiClient.patch("/notifications/read-all"),
  getAnalytics: () => apiClient.get("/analytics/overview"),
  getMembershipRequests: () => apiClient.get("/membership-requests"),
  approveMembershipRequest: (id) => apiClient.patch(`/membership-requests/${id}/approve`),
  rejectMembershipRequest: (id, reason) => apiClient.patch(`/membership-requests/${id}/reject`, { reason }),
  getInvitations: () => apiClient.get("/invitations"),
  createInvitation: (data) => apiClient.post("/invitations", data),
  revokeInvitation: (id) => apiClient.patch(`/invitations/${id}/revoke`),
};

// File Uploads
export const fileApi = {
  upload: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  uploadBase64: (base64, fileName = "captured_photo.jpg") => {
    return apiClient.post("/files/upload", { base64, fileName });
  },
};
