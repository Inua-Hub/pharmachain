"use client";
import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import { QRCodeGenerator } from "../../components";

interface Batch { _id: string; batchNo: string; batchIndex: number; status: string; isListed: boolean; currentOwnerName: string; currentOwnerRole: string; }
interface Group { medicineGroup: string; name: string; manufacturerName: string; expiryDate: string; tmdaApproved: boolean; currentOwnerName: string; currentOwnerRole: string; isListed: boolean; batchCount: number; quantityPerBatch: number; batches: Batch[]; }
interface Order {
  _id: string;
  orderNumber: string;
  medicineName: string;
  medicineGroup: string;
  batchCount: number;
  batchNos: string[];
  buyerName: string;
  buyerRole: string;
  sellerName: string;
  sellerRole: string;
  status: string;
  createdAt: string;
}

type Section = 'marketplace' | 'inventory' | 'myorders' | 'incoming';

export default function DistributorDashboard() {
  const [market, setMarket] = useState<Group[]>([]);
  const [inventory, setInventory] = useState<Group[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [incoming, setIncoming] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [section, setSection] = useState<Section>('marketplace');
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Order modal
  const [showOrder, setShowOrder] = useState(false);
  const [selected, setSelected] = useState<Group | null>(null);
  const [batchQty, setBatchQty] = useState(1);

  useEffect(() => { const t = localStorage.getItem("pharma_token"); if (t) { setToken(t); fetchAll(t); } }, []);

  const fetchAll = async (authToken: string) => {
    setLoading(true);
    try {
      const m: any = await api.getMedicineGroups('marketplace', authToken);
      if (m.success) setMarket(m.groups || []);
      const i: any = await api.getMedicineGroups('owned', authToken);
      if (i.success) setInventory(i.groups || []);
      const o: any = await api.getBuyerOrders(authToken);
      if (o.success) setMyOrders(o.orders || []);
      const inc: any = await api.getManufacturerOrders(authToken);
      if (inc.success) setIncoming(inc.orders || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const placeOrder = async () => {
    if (!selected || batchQty < 1) return;
    if (batchQty > selected.batchCount) { alert(`Only ${selected.batchCount} batches available`); return; }
    const r: any = await api.createOrder({ medicineGroup: selected.medicineGroup, batchCount: batchQty }, token);
    if (r.success) {
      alert(`✅ Order placed!\n${batchQty} batches ordered from ${r.order.sellerName} (${r.order.sellerRole})\nOrder #: ${r.order.orderNumber}`);
      setShowOrder(false); setSelected(null); setBatchQty(1);
      await fetchAll(token);
      setSection('myorders');
    } else alert("❌ " + r.message);
  };

  const acceptOrder = async (id: string) => {
    if (!confirm("Accept? All batches will transfer to the buyer and be recorded on blockchain.")) return;
    const r: any = await api.acceptOrder(id, token);
    if (r.success) { alert(`✅ ${r.message}`); await fetchAll(token); }
    else alert("❌ " + r.message);
  };
  const rejectOrder = async (id: string) => {
    if (!confirm("Reject?")) return;
    const r: any = await api.rejectOrder(id, token);
    if (r.success) { alert("Rejected"); await fetchAll(token); }
  };
  const listGroup = async (g: string) => {
    const r: any = await api.listGroup(g, token);
    if (r.success) { alert(`✅ ${r.count} batches listed`); await fetchAll(token); }
    else alert("❌ " + r.message);
  };
  const unlistGroup = async (g: string) => {
    const r: any = await api.unlistGroup(g, token);
    if (r.success) { alert(`${r.count} batches unlisted`); await fetchAll(token); }
  };

  const filterGroups = (arr: Group[]) => arr.filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.medicineGroup.toLowerCase().includes(search.toLowerCase()) || g.manufacturerName.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  const pendingMine = myOrders.filter(o => o.status === 'pending').length;
  const pendingIncoming = incoming.filter(o => o.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border"><p className="text-sm text-gray-500">Marketplace</p><p className="text-2xl font-bold text-blue-600">{market.length}</p></div>
        <div className="bg-white rounded-xl p-6 shadow-sm border"><p className="text-sm text-gray-500">My Batches</p><p className="text-2xl font-bold text-green-600">{inventory.reduce((s, g) => s + g.batchCount, 0)}</p></div>
        <div className="bg-white rounded-xl p-6 shadow-sm border"><p className="text-sm text-gray-500">My Orders</p><p className="text-2xl font-bold text-purple-600">{myOrders.length}</p></div>
        <div className="bg-white rounded-xl p-6 shadow-sm border"><p className="text-sm text-gray-500">From Pharmacies</p><p className="text-2xl font-bold text-orange-600">{incoming.length}</p></div>
      </div>

      <div className="flex flex-wrap gap-2 bg-white rounded-xl p-2 shadow-sm border">
        <button onClick={() => setSection('marketplace')} className={`flex-1 min-w-[150px] py-2 px-4 rounded-lg font-medium ${section === 'marketplace' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>🛒 Marketplace ({market.length})</button>
        <button onClick={() => setSection('inventory')} className={`flex-1 min-w-[150px] py-2 px-4 rounded-lg font-medium ${section === 'inventory' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>📦 My Batches ({inventory.length})</button>
        <button onClick={() => setSection('myorders')} className={`flex-1 min-w-[150px] py-2 px-4 rounded-lg font-medium ${section === 'myorders' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
          📤 My Orders ({myOrders.length}){pendingMine > 0 && <span className="ml-2 px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded-full text-xs">{pendingMine}</span>}
        </button>
        <button onClick={() => setSection('incoming')} className={`flex-1 min-w-[150px] py-2 px-4 rounded-lg font-medium ${section === 'incoming' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
          📥 From Pharmacies ({incoming.length}){pendingIncoming > 0 && <span className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs">{pendingIncoming}</span>}
        </button>
      </div>

      {(section === 'marketplace' || section === 'inventory') && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
      )}

      {section === 'marketplace' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b"><h2 className="text-lg font-semibold">Available from Manufacturers</h2><p className="text-sm text-gray-500">Buy batches — each batch has its own QR code and route</p></div>
          {filterGroups(market).length === 0 && <div className="p-8 text-center text-gray-500">No products available from manufacturers</div>}
          {filterGroups(market).map(g => (
            <div key={g.medicineGroup} className="border-b last:border-b-0">
              <div className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <button onClick={() => setExpanded(expanded === g.medicineGroup ? null : g.medicineGroup)} className="text-gray-400">{expanded === g.medicineGroup ? '▼' : '▶'}</button>
                  <div>
                    <p className="font-semibold">{g.name}</p>
                    <p className="text-sm text-gray-500">{g.manufacturerName} • Group: <span className="font-mono">{g.medicineGroup}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">{g.batchCount} batches</span>
                  <button onClick={() => { setSelected(g); setBatchQty(1); setShowOrder(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Order</button>
                </div>
              </div>
              {expanded === g.medicineGroup && (
                <div className="bg-gray-50 px-6 py-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {g.batches.map(b => (
                      <div key={b._id} className="bg-white p-2 rounded-lg border flex flex-col items-center">
                        <QRCodeGenerator batchNo={b.batchNo} medicineName={g.name} manufacturer={g.manufacturerName} expiryDate={g.expiryDate} status={b.status} currentOwner={b.currentOwnerName} size={60} />
                        <p className="text-xs font-mono mt-1">{b.batchNo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {section === 'inventory' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b"><h2 className="text-lg font-semibold">My Batches</h2><p className="text-sm text-gray-500">Batches you own — list them so pharmacies can buy</p></div>
          {filterGroups(inventory).length === 0 && <div className="p-8 text-center text-gray-500">No batches in your inventory yet</div>}
          {filterGroups(inventory).map(g => (
            <div key={g.medicineGroup} className="border-b last:border-b-0">
              <div className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <button onClick={() => setExpanded(expanded === g.medicineGroup ? null : g.medicineGroup)} className="text-gray-400">{expanded === g.medicineGroup ? '▼' : '▶'}</button>
                  <div>
                    <p className="font-semibold">{g.name}</p>
                    <p className="text-sm text-gray-500">{g.manufacturerName} • Group: <span className="font-mono">{g.medicineGroup}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${g.isListed ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}`}>{g.isListed ? 'Listed' : 'Not listed'}</span>
                  {g.isListed ? <button onClick={() => unlistGroup(g.medicineGroup)} className="px-3 py-1 bg-yellow-500 text-white rounded text-xs">Unlist</button> : <button onClick={() => listGroup(g.medicineGroup)} className="px-3 py-1 bg-green-600 text-white rounded text-xs">List All</button>}
                </div>
              </div>
              {expanded === g.medicineGroup && (
                <div className="bg-gray-50 px-6 py-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {g.batches.map(b => (
                      <div key={b._id} className="bg-white p-2 rounded-lg border flex flex-col items-center">
                        <QRCodeGenerator batchNo={b.batchNo} medicineName={g.name} manufacturer={g.manufacturerName} expiryDate={g.expiryDate} status={b.status} currentOwner={b.currentOwnerName} size={60} />
                        <p className="text-xs font-mono mt-1">{b.batchNo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {section === 'myorders' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b"><h2 className="text-lg font-semibold">My Orders</h2></div>
          {myOrders.length === 0 && <div className="p-8 text-center text-gray-500">No orders placed yet</div>}
          {myOrders.length > 0 && (
            <table className="w-full">
              <thead className="bg-gray-50"><tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batches</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr></thead>
              <tbody className="divide-y">
                {myOrders.map(o => (
                  <tr key={o._id}>
                    <td className="px-6 py-4 font-mono text-sm">{o.orderNumber}</td>
                    <td className="px-6 py-4"><div>{o.medicineName}</div><div className="text-xs text-gray-500">{o.medicineGroup}</div></td>
                    <td className="px-6 py-4 font-semibold">{o.batchCount}</td>
                    <td className="px-6 py-4"><div>{o.sellerName}</div><div className="text-xs text-gray-500">{o.sellerRole}</div></td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${o.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : o.status === 'accepted' ? 'bg-blue-100 text-blue-800' : o.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{o.status.toUpperCase()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {section === 'incoming' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b"><h2 className="text-lg font-semibold">Orders from Pharmacies</h2></div>
          {incoming.length === 0 && <div className="p-8 text-center text-gray-500">No incoming orders</div>}
          {incoming.length > 0 && (
            <table className="w-full">
              <thead className="bg-gray-50"><tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batches</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr></thead>
              <tbody className="divide-y">
                {incoming.map(o => (
                  <tr key={o._id}>
                    <td className="px-6 py-4 font-mono text-sm">{o.orderNumber}</td>
                    <td className="px-6 py-4"><div>{o.medicineName}</div><div className="text-xs text-gray-500">{o.medicineGroup}</div></td>
                    <td className="px-6 py-4 font-semibold">{o.batchCount}</td>
                    <td className="px-6 py-4"><div>{o.buyerName}</div><div className="text-xs text-gray-500">{o.buyerRole}</div></td>
                    <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${o.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : o.status === 'accepted' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{o.status.toUpperCase()}</span></td>
                    <td className="px-6 py-4">
                      {o.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => acceptOrder(o._id)} className="px-3 py-1 bg-green-600 text-white rounded text-xs">Accept</button>
                          <button onClick={() => rejectOrder(o._id)} className="px-3 py-1 bg-red-600 text-white rounded text-xs">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showOrder && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Order Batches</h3>
              <button onClick={() => setShowOrder(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">Order from:</p>
                <p className="text-sm">🏭 {selected.manufacturerName} (manufacturer)</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Product</p>
                <p className="font-semibold">{selected.name}</p>
                <p className="text-sm text-gray-500">Group: <span className="font-mono">{selected.medicineGroup}</span></p>
                <p className="text-sm text-gray-500">Available: {selected.batchCount} batches</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Batches *</label>
                <input type="number" min="1" max={selected.batchCount} value={batchQty} onChange={(e) => setBatchQty(Math.max(1, Math.min(selected.batchCount, parseInt(e.target.value) || 1)))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                <p className="text-xs text-gray-400 mt-1">Max: {selected.batchCount} batches</p>
              </div>
              <button onClick={placeOrder} className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold">Confirm Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}