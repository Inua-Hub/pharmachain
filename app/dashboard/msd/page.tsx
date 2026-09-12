"use client";
import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import { QRCodeGenerator } from "../../components";

interface Batch { _id: string; batchNo: string; status: string; currentOwnerName: string; }
interface Group {
  medicineGroup: string; name: string; manufacturerName: string; expiryDate: string;
  tmdaApproved: boolean; currentOwnerName: string; currentOwnerRole: string;
  batchCount: number; batches: Batch[];
}
interface User { _id: string; name: string; email: string; role: string; }

export default function MSDDashboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [pharmacies, setPharmacies] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [showAllocate, setShowAllocate] = useState(false);
  const [selected, setSelected] = useState<Group | null>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState("");
  const [batchQty, setBatchQty] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("pharma_token");
    if (t) { setToken(t); fetchAll(t); }
  }, []);

  const fetchAll = async (authToken: string) => {
    setLoading(true);
    try {
      const g: any = await api.getMedicineGroups('all', authToken);
      if (g.success) setGroups(g.groups || []);
      const u: any = await api.getUsers(authToken);
      if (u.success) {
        setPharmacies((u.users || []).filter((x: User) => x.role === 'pharmacy'));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleAllocate = async () => {
    if (!selected || !selectedPharmacy || !batchQty) { alert("Fill all fields"); return; }
    setProcessing(true);
    try {
      const r: any = await api.msdAllocate(
        { medicineGroup: selected.medicineGroup, pharmacyId: selectedPharmacy, batchCount: batchQty },
        token
      );
      if (r.success) {
        alert(`✅ ${r.count} batches allocated`);
        setShowAllocate(false); setSelected(null); setSelectedPharmacy(""); setBatchQty(1);
        await fetchAll(token);
      } else alert("❌ " + r.message);
    } catch (e: any) { alert("❌ " + e.message); }
    setProcessing(false);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  const available = groups.filter(g => g.currentOwnerRole === 'msd' && g.batchCount > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-2xl font-bold text-blue-600">{groups.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-sm text-gray-500">My Batches (MSD)</p>
          <p className="text-2xl font-bold text-green-600">
            {available.reduce((s, g) => s + g.batchCount, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-sm text-gray-500">Pharmacies</p>
          <p className="text-2xl font-bold text-purple-600">{pharmacies.length}</p>
        </div>
      </div>

      {available.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-800 mb-3">
            Allocate to Pharmacy ({available.length} products)
          </h3>
          <div className="space-y-2">
            {available.map(g => (
              <div key={g.medicineGroup} className="flex items-center justify-between bg-white p-3 rounded-lg">
                <div>
                  <p className="font-medium">{g.name}</p>
                  <p className="text-sm text-gray-500">
                    Group: <span className="font-mono">{g.medicineGroup}</span> • {g.batchCount} batches • Manufacturer: {g.manufacturerName}
                  </p>
                </div>
                <button
                  onClick={() => { setSelected(g); setBatchQty(1); setShowAllocate(true); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                >
                  Allocate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b"><h2 className="text-lg font-semibold">All Products</h2></div>
        {groups.length === 0 && <div className="p-8 text-center text-gray-500">No products</div>}
        {groups.map(g => (
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
                    Group: <span className="font-mono">{g.medicineGroup}</span> • {g.batchCount} batches
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                Owner: {g.currentOwnerRole}
              </span>
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
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showAllocate && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Allocate to Pharmacy</h3>
              <button onClick={() => setShowAllocate(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Product</p>
                <p className="font-semibold">{selected.name}</p>
                <p className="text-sm text-gray-500">Available: {selected.batchCount} batches</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacy *</label>
                <select
                  value={selectedPharmacy}
                  onChange={(e) => setSelectedPharmacy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select pharmacy...</option>
                  {pharmacies.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Batches *</label>
                <input
                  type="number"
                  min="1"
                  max={selected.batchCount}
                  value={batchQty}
                  onChange={(e) =>
                    setBatchQty(Math.max(1, Math.min(selected.batchCount, parseInt(e.target.value) || 1)))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <button
                onClick={handleAllocate}
                disabled={processing || !selectedPharmacy}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {processing ? "Allocating..." : "Allocate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}