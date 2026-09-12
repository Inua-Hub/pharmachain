"use client";
import React, { useState, useEffect } from "react";
import api from "../../lib/api";

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [blockchainStatus, setBlockchainStatus] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("pharma_token");
    if (t) {
      setToken(t);
      fetchAll(t);
    }
  }, []);

  const fetchAll = async (authToken: string) => {
    setLoading(true);
    try {
      const usersRes: any = await api.getUsers(authToken);
      if (usersRes.success) setUsers(usersRes.users || []);

      const bcRes: any = await api.getBlockchainStatus(authToken);
      if (bcRes.success) setBlockchainStatus(bcRes);

      const dashRes: any = await api.getAdminDashboard(authToken);
      if (dashRes.success) setStats(dashRes.stats);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleStatusChange = async (userId: string, status: string) => {
    const r: any = await api.updateUserStatus(userId, status, token);
    if (r.success) {
      setUsers(users.map((u) => (u._id === userId ? { ...u, status } : u)));
      alert(`User status updated to ${status}`);
    } else alert(r.message || "Failed to update status");
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const r: any = await api.deleteUser(userId, token);
    if (r.success) {
      setUsers(users.filter((u) => u._id !== userId));
      alert("User deleted");
    } else alert(r.message || "Failed to delete");
  };

  const runFixMedicineOwnership = async () => {
    if (!confirm("Fix all medicine ownership data?")) return;
    setRunning(true);
    const r: any = await api.fixMedicineOwnership(token);
    if (r.success) alert(`✅ Fixed ${r.fixed}/${r.total} medicines`);
    else alert("❌ " + (r.message || "Failed"));
    setRunning(false);
  };

  const runFixOrderRoles = async () => {
    if (!confirm("Fix all order roles?")) return;
    setRunning(true);
    const r: any = await api.fixOrderRoles(token);
    if (r.success) alert(`✅ Fixed ${r.fixed}/${r.total} orders`);
    else alert("❌ " + (r.message || "Failed"));
    setRunning(false);
  };

  const statusColor = (status: string) =>
    status === "active"
      ? "bg-green-100 text-green-800"
      : status === "pending"
      ? "bg-yellow-100 text-yellow-800"
      : status === "banned"
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-800";

  const roleColor = (role: string) =>
    role === "admin"
      ? "bg-purple-100 text-purple-800"
      : role === "manufacturer"
      ? "bg-blue-100 text-blue-800"
      : role === "distributor"
      ? "bg-orange-100 text-orange-800"
      : role === "pharmacy"
      ? "bg-teal-100 text-teal-800"
      : role === "msd"
      ? "bg-indigo-100 text-indigo-800"
      : role === "tmda"
      ? "bg-rose-100 text-rose-800"
      : "bg-gray-100 text-gray-800";

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  const pendingUsers = users.filter((u) => u.status === "pending");

  return (
    <div className="space-y-6">
      {/* Only 3 stat cards now — no batches */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <p className="text-sm text-gray-500">Active Users</p>
            <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <p className="text-sm text-gray-500">Pending Users</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingUsers}</p>
          </div>
        </div>
      )}

      {blockchainStatus && (
        <div
          className={`p-4 rounded-xl border ${
            blockchainStatus.connected
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{blockchainStatus.connected ? "🔗" : "⚠️"}</span>
            <div>
              <p
                className={`font-semibold ${
                  blockchainStatus.connected ? "text-green-700" : "text-red-700"
                }`}
              >
                {blockchainStatus.connected
                  ? "Blockchain Connected"
                  : "Blockchain Disconnected"}
              </p>
              {blockchainStatus.connected && (
                <p className="text-sm text-gray-600">
                  Contract: {blockchainStatus.contractAddress?.slice(0, 10)}...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold text-gray-800 mb-3">🔧 Maintenance Tools</h3>
        <p className="text-sm text-gray-500 mb-3">
          Run these after deploying a new version to migrate old data.
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={runFixMedicineOwnership}
            disabled={running}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            Fix Medicine Ownership
          </button>
          <button
            onClick={runFixOrderRoles}
            disabled={running}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50"
          >
            Fix Order Roles
          </button>
        </div>
      </div>

      {pendingUsers.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">
            Pending Approvals ({pendingUsers.length})
          </h3>
          <div className="space-y-2">
            {pendingUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between bg-white p-3 rounded-lg"
              >
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-500">
                    {user.email} • {user.role} • {user.phone}
                  </p>
                </div>
                <button
                  onClick={() => handleStatusChange(user._id, "active")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">System Users</h2>
          <p className="text-sm text-gray-500">
            Approve or ban accounts. Role changes are not permitted.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* Role is read-only */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${roleColor(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.status}
                      onChange={(e) => handleStatusChange(user._id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border-0 ${statusColor(
                        user.status
                      )}`}
                      disabled={user.role === "admin"}
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="banned">Banned</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(user._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                      disabled={user.role === "admin"}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="p-8 text-center text-gray-500">No users found</div>
        )}
      </div>
    </div>
  );
}