// app/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "manufacturer" | "distributor" | "pharmacy" | "msd" | "tmda" | "admin";
  status: "active" | "pending" | "banned";
  ethAddress?: string;
}

export interface Batch {
  _id: string;
  batchNo: string;
  batchIndex: number;
  status: string;
  isListed: boolean;
  tmdaApproved: boolean;
  currentOwnerName: string;
  currentOwnerRole: string;
  txHash?: string;
  createdAt?: string;
}

export interface MedicineGroup {
  _id: string;
  medicineGroup: string;
  name: string;
  manufacturerName: string;
  expiryDate: string;
  tmdaApproved: boolean;
  tmdaApprovalNumber?: string;
  currentOwnerName: string;
  currentOwnerRole: string;
  isListed: boolean;
  status: string;
  quantityPerBatch: number;
  batchCount: number;
  batches: Batch[];
}

export interface Order {
  _id: string;
  orderNumber: string;
  medicineName: string;
  medicineGroup: string;
  batchIds: string[];
  batchNos: string[];
  batchCount: number;
  buyerId: any;
  buyerName: string;
  buyerRole: string;
  sellerId: any;
  sellerName: string;
  sellerRole: string;
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
  notes?: string;
  transactionHash?: string;
  blockNumber?: number;
  acceptedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data: any;
  createdAt: string;
}

export const api = {
  // ============ AUTH ============
  register: async (data: any) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  getMe: async (token: string) => {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  forgotPassword: async (email: string) => {
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  resetPassword: async (token: string, newPassword: string) => {
    const res = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    return res.json();
  },

  validateResetToken: async (token: string) => {
    const res = await fetch(`${API_URL}/api/auth/validate-reset-token/${token}`);
    return res.json();
  },

  // ============ MEDICINES — BULK (batch groups) ============
  createBulkMedicine: async (data: any, token: string) => {
    const res = await fetch(`${API_URL}/api/medicines/create-bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getMedicineGroups: async (scope: "owned" | "marketplace" | "all", token: string) => {
    const res = await fetch(`${API_URL}/api/medicines/groups?scope=${scope}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  listGroup: async (medicineGroup: string, token: string) => {
    const res = await fetch(`${API_URL}/api/medicines/group/${encodeURIComponent(medicineGroup)}/list`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  unlistGroup: async (medicineGroup: string, token: string) => {
    const res = await fetch(`${API_URL}/api/medicines/group/${encodeURIComponent(medicineGroup)}/unlist`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // ============ MEDICINES — LEGACY ============
  getMedicines: async (token: string) => {
    const res = await fetch(`${API_URL}/api/medicines`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  getOwnedMedicines: async (token: string) => {
    const res = await fetch(`${API_URL}/api/medicines/owned`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  getMarketplace: async (token: string) => {
    const res = await fetch(`${API_URL}/api/marketplace`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  verifyMedicine: async (batchNo: string, email?: string) => {
    const res = await fetch(`${API_URL}/api/medicines/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchNo, email }),
    });
    return res.json();
  },

  getMedicineByBatch: async (batchNo: string) => {
    const res = await fetch(`${API_URL}/api/medicines/batch/${batchNo}`);
    return res.json();
  },

  // ============ TMDA ============
  tmdaApprove: async (data: any, token: string) => {
    const res = await fetch(`${API_URL}/api/tmda/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // ============ MSD ============
  msdAllocate: async (data: any, token: string) => {
    const res = await fetch(`${API_URL}/api/medicines/msd-allocate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // ============ ORDERS ============
  createOrder: async (data: any, token: string) => {
    const res = await fetch(`${API_URL}/api/orders/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getManufacturerOrders: async (token: string) => {
    const res = await fetch(`${API_URL}/api/orders/manufacturer`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  getBuyerOrders: async (token: string) => {
    const res = await fetch(`${API_URL}/api/orders/buyer`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  getAllOrders: async (token: string) => {
    const res = await fetch(`${API_URL}/api/orders/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  acceptOrder: async (id: string, token: string) => {
    const res = await fetch(`${API_URL}/api/orders/${id}/accept`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  rejectOrder: async (id: string, token: string) => {
    const res = await fetch(`${API_URL}/api/orders/${id}/reject`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  completeOrder: async (id: string, token: string) => {
    const res = await fetch(`${API_URL}/api/orders/${id}/complete`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  getOrderDebug: async (token: string) => {
    const res = await fetch(`${API_URL}/api/orders/debug`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // ============ NOTIFICATIONS ============
  getNotifications: async (token: string) => {
    const res = await fetch(`${API_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  markNotificationRead: async (id: string, token: string) => {
    const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  markAllNotificationsRead: async (token: string) => {
    const res = await fetch(`${API_URL}/api/notifications/read-all`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // ============ USERS (Admin) ============
  getUsers: async (token: string) => {
    const res = await fetch(`${API_URL}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  updateUserStatus: async (userId: string, status: string, token: string) => {
    const res = await fetch(`${API_URL}/api/users/${userId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  updateUserRole: async (userId: string, role: string, token: string) => {
    const res = await fetch(`${API_URL}/api/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role }),
    });
    return res.json();
  },

  deleteUser: async (userId: string, token: string) => {
    const res = await fetch(`${API_URL}/api/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // ============ BLOCKCHAIN ============
  getBlockchainStatus: async (token: string) => {
    const res = await fetch(`${API_URL}/api/blockchain/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // ============ ADMIN DASHBOARD ============
  getAdminDashboard: async (token: string) => {
    const res = await fetch(`${API_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  fixMedicineOwnership: async (token: string) => {
    const res = await fetch(`${API_URL}/api/admin/fix-medicine-ownership`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  fixOrderRoles: async (token: string) => {
    const res = await fetch(`${API_URL}/api/admin/fix-order-roles`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
};

export default api;