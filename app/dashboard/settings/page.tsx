"use client";
import React, { useState, useEffect } from "react";
import api from "../../lib/api";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [blockchainStatus, setBlockchainStatus] = useState<any>(null);
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("pharma_token");
    const savedUser = localStorage.getItem("pharma_current");
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
        setName(u.name || "");
        setPhone(u.phone || "");
        if (u.role === "admin") fetchBlockchainStatus(savedToken);
      } catch (e) { console.error(e); }
    }
  }, []);

  const fetchBlockchainStatus = async (authToken: string) => {
    try {
      const res: any = await api.getBlockchainStatus(authToken);
      if (res.success) setBlockchainStatus(res);
    } catch (e) { console.error(e); }
  };

  const handleSave = async () => {
    if (!name.trim()) { alert("Name is required"); return; }
    setLoading(true);
    try {
      alert("✅ Profile updated (backend integration pending)");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6 max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Profile Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input
              type="text"
              value={user?.role || ""}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 capitalize"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {user?.role === "admin" && blockchainStatus && (
        <div className="bg-white rounded-xl shadow-sm border p-6 max-w-lg">
          <h2 className="text-lg font-semibold mb-4">🔗 Blockchain Status</h2>
          <div className={`p-4 rounded-lg ${blockchainStatus.connected ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{blockchainStatus.connected ? "✅" : "❌"}</span>
              <div>
                <p className={`font-semibold ${blockchainStatus.connected ? "text-green-700" : "text-red-700"}`}>
                  {blockchainStatus.connected ? "Connected" : "Disconnected"}
                </p>
                {blockchainStatus.connected && (
                  <>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Contract:</span> {blockchainStatus.contractAddress}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Wallet:</span> {blockchainStatus.walletAddress}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Batches on Chain:</span> {blockchainStatus.medicineCount || 0}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Network:</span> {blockchainStatus.network || "Unknown"}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}