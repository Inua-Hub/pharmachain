"use client";
import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import { QRCodeGenerator } from "../../components";
import { validators } from "../../lib/validation";

interface Batch { _id: string; batchNo: string; batchIndex: number; status: string; isListed: boolean; tmdaApproved: boolean; currentOwnerName: string; currentOwnerRole: string; }
interface Group { medicineGroup: string; name: string; manufacturerName: string; expiryDate: string; tmdaApproved: boolean; tmdaApprovalNumber?: string; currentOwnerName: string; currentOwnerRole: string; isListed: boolean; batchCount: number; quantityPerBatch: number; batches: Batch[]; }
interface Order { _id: string; orderNumber: string; medicineName: string; medicineGroup: string; batchNos: string[]; batchCount: number; buyerName: string; buyerRole: string; status: string; createdAt: string; }

export default function ManufacturerDashboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [section, setSection] = useState<"medicines" | "orders">("medicines");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Form
  const [name, setName] = useState("");
  const [batchPrefix, setBatchPrefix] = useState("");
  const [batchCount, setBatchCount] = useState("10");
  const [expiry, setExpiry] = useState("");
  const [perBatch, setPerBatch] = useState("100");
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState<{ prefix?: string; name?: string }>({});

  useEffect(() => {
    const t = localStorage.getItem("pharma_token");
    if (t) { setToken(t); fetchAll(t); }
  }, []);

  const fetchAll = async (authToken: string) => {
    setLoading(true);
    try {
      const g: any = await api.getMedicineGroups("all", authToken);
      if (g.success) setGroups(g.groups || []);
      const o: any = await api.getManufacturerOrders(authToken);
      if (o.success) setOrders(o.orders || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async () => {
    const errs: any = {};
    if (!name.trim()) errs.name = "Medicine name is required";
    const p = validators.batchPrefix(batchPrefix);
    if (!p.valid) errs.prefix = p.error;
    if (!expiry) { alert("Expiry date is required"); return; }
    const cnt = parseInt(batchCount);
    if (!cnt || cnt < 1 || cnt > 1000) { alert("Batch count must be 1–1000"); return; }
    setFormErr(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const r: any = await api.createBulkMedicine({
        name: name.trim(),
        batchPrefix: batchPrefix.trim().toUpperCase(),
        batchCount: cnt,
        expiryDate: expiry,
        quantityPerBatch: parseInt(perBatch) || 1,
      }, token);

      if (r.success) {
        alert(`✅ Created ${r.batchCount} batches of "${name}"\nGroup: ${r.medicineGroup}\nEach batch has its own QR code.`);
        setName(""); setBatchPrefix(""); setBatchCount("10"); setExpiry(""); setPerBatch("100"); setFormErr({});
        await fetchAll(token);
      } else {
        alert("❌ " + (r.message || "Failed"));
      }
    } catch (e: any) { alert("❌ " + e.message); }
    setSubmitting(false);
  };

  const handleListGroup = async (g: string) => {
    const r: any = await api.listGroup(g, token);
    if (r.success) { alert(`✅ ${r.count} batches listed`); await fetchAll(token); }
    else alert("❌ " + r.message);
  };
  const handleUnlistGroup = async (g: string) => {
    const r: any = await api.unlistGroup(g, token);
    if (r.success) { alert(`${r.count} batches unlisted`); await fetchAll(token); }
  };

  const acceptOrder = async (id: string) => {
    if (!confirm("Accept this order? Ownership will transfer and be recorded on blockchain.")) return;
    const r: any = await api.acceptOrder(id, token);
    if (r.success) { alert(`✅ ${r.message}`); await fetchAll(token); }
    else alert("❌ " + r.message);
  };
  const rejectOrder = async (id: string) => {
    if (!confirm("Reject this order?")) return;
    const r: any = await api.rejectOrder(id, token);
    if (r.success) { alert("Rejected"); await fetchAll(token); }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const totalBatches = groups.reduce((s, g) => s + g.batchCount, 0);
  const inStock = groups.filter((g) => g.currentOwnerRole === "manufacturer").reduce((s, g) => s + g.batchCount, 0);
  const previewPad = String(batchCount || 0).length + 2;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border"><p className="text-sm text-gray-500">Product Groups</p><p className="text-2xl font-bold text-blue-600">{groups.length}</p></div>
        <div className="bg-white rounded-xl p-6 shadow-sm border"><p className="text-sm text-gray-500">Total Batches</p><p className="text-2xl font-bold text-purple-600">{totalBatches}</p></div>
        <div className="bg-white rounded-xl p-6 shadow-sm border"><p className="text-sm text-gray-500">In Stock (Batches)</p><p className="text-2xl font-bold text-green-600">{inStock}</p></div>
        <div className="bg-white rounded-xl p-6 shadow-sm border"><p className="text-sm text-gray-500">Pending Orders</p><p className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</p></div>
      </div>

      <div className="flex gap-2 bg-white rounded-xl p-2 shadow-sm border">
        <button onClick={() => setSection("medicines")} className={`flex-1 py-2 px-4 rounded-lg font-medium ${section === "medicines" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>💊 Products ({groups.length})</button>
        <button onClick={() => setSection("orders")} className={`flex-1 py-2 px-4 rounded-lg font-medium ${section === "orders" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>📋 Orders ({orders.length})</button>
      </div>

      {section === "medicines" && (
        <>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-1">Create Batch Group</h2>
            <p className="text-sm text-gray-500 mb-4">Enter how many batches to create. Each batch gets a unique number + QR code.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name *</label>
                <input type="text" value={name} onChange={(e) => { setName(e.target.value); if (formErr.name) setFormErr({ ...formErr, name: undefined }); }} placeholder="e.g., Paracetamol 500mg" className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErr.name ? "border-red-500" : "border-gray-300"}`} />
                {formErr.name && <p className="text-xs text-red-500 mt-1">{formErr.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Prefix *</label>
                <input type="text" value={batchPrefix} onChange={(e) => { setBatchPrefix(e.target.value); if (formErr.prefix) setFormErr({ ...formErr, prefix: undefined }); }} placeholder="e.g., PARA-2024" className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErr.prefix ? "border-red-500" : "border-gray-300"}`} />
                {formErr.prefix && <p className="text-xs text-red-500 mt-1">{formErr.prefix}</p>}
                <p className="text-xs text-gray-400 mt-1">Letters, numbers and hyphens only</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Batches *</label>
                <input type="number" min="1" max="1000" value={batchCount} onChange={(e) => setBatchCount(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                <p className="text-xs text-gray-400 mt-1">Preview: <span className="font-mono">{batchPrefix || "PREFIX"}-001</span> → <span className="font-mono">{batchPrefix || "PREFIX"}-{String(batchCount || 0).padStart(previewPad, "0")}</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Units per Batch</label>
                <input type="number" min="1" value={perBatch} onChange={(e) => setPerBatch(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
            <button onClick={handleCreate} disabled={submitting} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70">
              {submitting ? "Creating..." : `Create ${batchCount || 0} Batches`}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">My Products</h2>
              <span className="text-sm text-gray-500">{groups.length} groups</span>
            </div>
            {groups.length === 0 && <div className="p-8 text-center text-gray-500">No products yet. Create your first batch group above.</div>}
            {groups.map((g) => {
              const isExpanded = expanded === g.medicineGroup;
              const ownedBatches = g.currentOwnerRole === "manufacturer" ? g.batchCount : 0;
              return (
                <div key={g.medicineGroup} className="border-b last:border-b-0">
                  <div className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setExpanded(isExpanded ? null : g.medicineGroup)} className="text-gray-400">{isExpanded ? "▼" : "▶"}</button>
                      <div>
                        <p className="font-semibold">{g.name}</p>
                        <p className="text-sm text-gray-500">Group: <span className="font-mono">{g.medicineGroup}</span> • {g.batchCount} batches • {g.quantityPerBatch} units/batch</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${g.currentOwnerRole === "manufacturer" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                        {g.currentOwnerRole === "manufacturer" ? `${ownedBatches} in stock` : `Sold to ${g.currentOwnerRole}`}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${g.tmdaApproved ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {g.tmdaApproved ? "TMDA ✓" : "TMDA pending"}
                      </span>
                      {g.currentOwnerRole === "manufacturer" && g.tmdaApproved && ownedBatches > 0 && (
                        g.isListed
                          ? <button onClick={() => handleUnlistGroup(g.medicineGroup)} className="px-3 py-1 bg-yellow-500 text-white rounded text-xs">Unlist</button>
                          : <button onClick={() => handleListGroup(g.medicineGroup)} className="px-3 py-1 bg-green-600 text-white rounded text-xs">List All</button>
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="bg-gray-50 px-6 py-4">
                      <p className="text-xs text-gray-500 mb-2">Individual batches (each with own QR):</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {g.batches.map((b) => (
                          <div key={b._id} className="bg-white p-2 rounded-lg border flex flex-col items-center">
                            <QRCodeGenerator batchNo={b.batchNo} medicineName={g.name} manufacturer={g.manufacturerName} expiryDate={g.expiryDate} status={b.status} currentOwner={b.currentOwnerName} size={60} canDownload={g.currentOwnerRole === "manufacturer"} />
                            <p className="text-xs font-mono mt-1">{b.batchNo}</p>
                            <p className={`text-xs mt-0.5 ${b.currentOwnerRole === "manufacturer" ? "text-green-600" : "text-gray-400"}`}>
                              {b.currentOwnerRole === "manufacturer" ? "✓ mine" : b.currentOwnerRole}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {section === "orders" && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b"><h2 className="text-lg font-semibold">Orders from Distributors</h2></div>
          {orders.length === 0 && <div className="p-8 text-center text-gray-500">No orders yet.</div>}
          {orders.length > 0 && (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batches</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td className="px-6 py-4 font-mono text-sm">{o.orderNumber}</td>
                    <td className="px-6 py-4"><div className="font-medium">{o.medicineName}</div><div className="text-xs text-gray-500 font-mono">{o.medicineGroup}</div></td>
                    <td className="px-6 py-4 font-semibold">{o.batchCount}</td>
                    <td className="px-6 py-4"><div>{o.buyerName}</div><div className="text-xs text-gray-500">{o.buyerRole}</div></td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${o.status === "pending" ? "bg-yellow-100 text-yellow-800" : o.status === "accepted" ? "bg-blue-100 text-blue-800" : o.status === "completed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {o.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {o.status === "pending" && (
                        <div className="flex gap-2">
                          <button onClick={() => acceptOrder(o._id)} className="px-3 py-1 bg-green-600 text-white rounded text-xs">Accept</button>
                          <button onClick={() => rejectOrder(o._id)} className="px-3 py-1 bg-red-600 text-white rounded text-xs">Reject</button>
                        </div>
                      )}
                      {o.status === "accepted" && <span className="text-xs text-blue-600">Transferred</span>}
                      {o.status === "completed" && <span className="text-xs text-green-600">Done</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}