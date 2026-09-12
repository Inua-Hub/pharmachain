"use client";
import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import { QRCodeGenerator } from "../../components";

interface Batch {
  _id: string;
  batchNo: string;
  status: string;
  tmdaApproved: boolean;
  tmdaApprovalNumber?: string;
  currentOwnerName: string;
}
interface Group {
  medicineGroup: string;
  name: string;
  manufacturerName: string;
  expiryDate: string;
  tmdaApproved: boolean;
  tmdaApprovalNumber?: string;
  currentOwnerName: string;
  currentOwnerRole: string;
  batchCount: number;
  quantityPerBatch: number;
  batches: Batch[];
}

export default function TMDADashboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [showApprove, setShowApprove] = useState(false);
  const [selected, setSelected] = useState<Group | null>(null);
  const [approvalNumber, setApprovalNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("pharma_token");
    if (t) { setToken(t); fetchAll(t); }
  }, []);

  const fetchAll = async (authToken: string) => {
    setLoading(true);
    try {
      const r: any = await api.getMedicineGroups('all', authToken);
      if (r.success) setGroups(r.groups || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openApproveModal = (g: Group) => {
    setSelected(g);
    setApprovalNumber(`TMDA-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
    setShowApprove(true);
  };

  const handleApprove = async () => {
    if (!selected || !approvalNumber) return;
    setProcessing(true);
    try {
      const r: any = await api.tmdaApprove(
        { medicineGroup: selected.medicineGroup, approvalNumber },
        token
      );
      if (r.success) {
        alert(`✅ ${r.count} batches approved!\nApproval: ${r.approvalNumber}`);
        setShowApprove(false); setSelected(null); setApprovalNumber("");
        await fetchAll(token);
      } else alert("❌ " + r.message);
    } catch (e: any) { alert("❌ " + e.message); }
    setProcessing(false);
  };

  const filtered = groups.filter(g =>
    !search ||
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.medicineGroup.toLowerCase().includes(search.toLowerCase()) ||
    g.manufacturerName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  const pending = filtered.filter(g => !g.tmdaApproved);
  const approved = filtered.filter(g => g.tmdaApproved);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-2xl font-bold text-blue-600">{groups.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-sm text-gray-500">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600">{pending.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-2xl font-bold text-green-600">{approved.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <input
          type="text"
          placeholder="Search by name, group, or manufacturer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {pending.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-semibold text-yellow-800 mb-3">
            ⏳ Pending Approval ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map(g => (
              <div key={g.medicineGroup} className="flex items-center justify-between bg-white p-3 rounded-lg">
                <div>
                  <p className="font-medium">{g.name}</p>
                  <p className="text-sm text-gray-500">
                    Group: <span className="font-mono">{g.medicineGroup}</span> • {g.batchCount} batches • Manufacturer: {g.manufacturerName}
                  </p>
                </div>
                <button
                  onClick={() => openApproveModal(g)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Approve All {g.batchCount} Batches
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">All Products</h2>
          <span className="text-sm text-gray-500">{filtered.length} groups</span>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-500">No products found</div>
        )}
        {filtered.map(g => (
          <div key={g.medicineGroup} className="border-b last:border-b-0">
            <div className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setExpanded(expanded === g.medicineGroup ? null : g.medicineGroup)}
                  className="text-gray-400"
                >
                  {expanded === g.medicineGroup ? '▼' : '▶'}
                </button>
                <div>
                  <p className="font-semibold">{g.name}</p>
                  <p className="text-sm text-gray-500">
                    Group: <span className="font-mono">{g.medicineGroup}</span> • {g.batchCount} batches • {g.manufacturerName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {g.tmdaApproved ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    ✓ Approved {g.tmdaApprovalNumber}
                  </span>
                ) : (
                  <>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Pending</span>
                    <button
                      onClick={() => openApproveModal(g)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-xs"
                    >
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
            {expanded === g.medicineGroup && (
              <div className="bg-gray-50 px-6 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {g.batches.map(b => (
                    <div key={b._id} className="bg-white p-2 rounded-lg border flex flex-col items-center">
                      <QRCodeGenerator
                        batchNo={b.batchNo}
                        medicineName={g.name}
                        manufacturer={g.manufacturerName}
                        expiryDate={g.expiryDate}
                        status={b.status}
                        currentOwner={b.currentOwnerName}
                        size={60}
                      />
                      <p className="text-xs font-mono mt-1">{b.batchNo}</p>
                      <p className={`text-xs mt-0.5 ${b.tmdaApproved ? 'text-green-600' : 'text-yellow-600'}`}>
                        {b.tmdaApproved ? '✓' : '⏳'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showApprove && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Approve Batch Group</h3>
              <button onClick={() => setShowApprove(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-green-700 font-medium mb-1">Approving:</p>
                <p className="font-semibold">{selected.name}</p>
                <p className="text-sm text-gray-600">
                  Group: <span className="font-mono">{selected.medicineGroup}</span>
                </p>
                <p className="text-sm text-gray-600">Manufacturer: {selected.manufacturerName}</p>
                <p className="text-sm text-gray-600 font-semibold mt-1">
                  → {selected.batchCount} batches will be approved
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Approval Number</label>
                <input
                  type="text"
                  value={approvalNumber}
                  onChange={(e) => setApprovalNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowApprove(false)}
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold disabled:opacity-70"
                >
                  {processing ? "Approving..." : `Approve ${selected.batchCount} Batches`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}