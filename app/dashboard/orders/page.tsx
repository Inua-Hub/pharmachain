"use client";
import React, { useState, useEffect } from "react";
import api from "../../lib/api";

interface Order {
  _id: string; orderNumber: string;
  medicineName: string; medicineGroup: string;
  batchCount: number; batchNos: string[];
  buyerId: any; buyerName: string; buyerRole: string;
  sellerId: any; sellerName: string; sellerRole: string;
  status: string;
  transactionHash?: string;
  createdAt: string;
}

type Filter = 'all' | 'pending' | 'incoming' | 'outgoing' | 'completed';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("pharma_token");
    const u = localStorage.getItem("pharma_current");
    if (t && u) {
      setToken(t);
      try {
        const p = JSON.parse(u);
        setUserRole(p.role);
        setUserId(p._id || p.id);
      } catch {}
      fetchOrders(t);
    }
  }, []);

  const fetchOrders = async (authToken: string) => {
    setLoading(true);
    try {
      const u = localStorage.getItem("pharma_current");
      if (!u) return;
      const p = JSON.parse(u);
      let r: any;
      if (p.role === 'admin') r = await api.getAllOrders(authToken);
      else if (['manufacturer', 'distributor', 'msd'].includes(p.role)) r = await api.getManufacturerOrders(authToken);
      else r = await api.getBuyerOrders(authToken);
      if (r?.success) setOrders(r.orders || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const acceptOrder = async (id: string) => {
    if (!confirm("Accept? All batches will transfer to the buyer.")) return;
    const r: any = await api.acceptOrder(id, token);
    if (r.success) { alert(`✅ ${r.message}`); await fetchOrders(token); }
    else alert("❌ " + r.message);
  };
  const rejectOrder = async (id: string) => {
    if (!confirm("Reject?")) return;
    const r: any = await api.rejectOrder(id, token);
    if (r.success) { alert("Rejected"); await fetchOrders(token); }
  };
  const completeOrder = async (id: string) => {
    if (!confirm("Mark as completed?")) return;
    const r: any = await api.completeOrder(id, token);
    if (r.success) { alert("Completed"); await fetchOrders(token); }
  };

  const filtered = orders.filter(o => {
    if (search) {
      const s = search.toLowerCase();
      const match =
        o.orderNumber.toLowerCase().includes(s) ||
        o.medicineName.toLowerCase().includes(s) ||
        o.buyerName.toLowerCase().includes(s) ||
        o.sellerName.toLowerCase().includes(s);
      if (!match) return false;
    }
    if (filter === 'pending') return o.status === 'pending';
    if (filter === 'completed') return o.status === 'completed';
    if (filter === 'incoming') {
      const sid = typeof o.sellerId === 'object' ? o.sellerId?._id : o.sellerId;
      return sid === userId;
    }
    if (filter === 'outgoing') {
      const bid = typeof o.buyerId === 'object' ? o.buyerId?._id : o.buyerId;
      return bid === userId;
    }
    return true;
  });

  const getColor = (s: string) =>
    s === 'pending' ? 'bg-yellow-100 text-yellow-800'
    : s === 'accepted' ? 'bg-blue-100 text-blue-800'
    : s === 'completed' ? 'bg-green-100 text-green-800'
    : s === 'rejected' ? 'bg-red-100 text-red-800'
    : 'bg-gray-100 text-gray-800';

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  const isSeller = ['manufacturer', 'distributor', 'msd'].includes(userRole);
  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-sm text-gray-500">Accepted</p>
          <p className="text-2xl font-bold text-blue-600">{orders.filter(o => o.status === 'accepted').length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'completed').length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 bg-white rounded-xl p-2 shadow-sm border">
        <button onClick={() => setFilter('all')} className={`py-2 px-4 rounded-lg font-medium ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
          All ({orders.length})
        </button>
        <button onClick={() => setFilter('pending')} className={`py-2 px-4 rounded-lg font-medium ${filter === 'pending' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
          Pending ({orders.filter(o => o.status === 'pending').length})
        </button>
        {isSeller && (
          <button onClick={() => setFilter('incoming')} className={`py-2 px-4 rounded-lg font-medium ${filter === 'incoming' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            Incoming
          </button>
        )}
        {!isAdmin && !isSeller && (
          <button onClick={() => setFilter('outgoing')} className={`py-2 px-4 rounded-lg font-medium ${filter === 'outgoing' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            My Orders
          </button>
        )}
        <button onClick={() => setFilter('completed')} className={`py-2 px-4 rounded-lg font-medium ${filter === 'completed' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
          Completed ({orders.filter(o => o.status === 'completed').length})
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <input
          type="text"
          placeholder="Search by order #, medicine, buyer, seller..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">
            {isAdmin ? 'All Orders' : isSeller ? 'Order Management' : 'My Orders'}
          </h2>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-500">No orders match your filter</div>
        )}
        {filtered.length > 0 && (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batches</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                {(isSeller || isAdmin) && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(o => {
                const sid = typeof o.sellerId === 'object' ? o.sellerId?._id : o.sellerId;
                const bid = typeof o.buyerId === 'object' ? o.buyerId?._id : o.buyerId;
                const isMySale = sid === userId;
                const isMyPurchase = bid === userId;
                return (
                  <tr key={o._id}>
                    <td className="px-6 py-4 font-mono text-sm">{o.orderNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{o.medicineName}</div>
                      <div className="text-xs text-gray-500 font-mono">{o.medicineGroup}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold">{o.batchCount}</span>
                      <div className="text-xs text-gray-500">batches</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{o.buyerName}</div>
                      <div className="text-xs text-gray-500">
                        {o.buyerRole}
                        {isMyPurchase && ' (you)'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{o.sellerName}</div>
                      <div className="text-xs text-gray-500">
                        {o.sellerRole}
                        {isMySale && ' (you)'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getColor(o.status)}`}>
                        {o.status.toUpperCase()}
                      </span>
                    </td>
                    {(isSeller || isAdmin) && (
                      <td className="px-6 py-4">
                        {isMySale && o.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => acceptOrder(o._id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => rejectOrder(o._id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-xs"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {isMySale && o.status === 'accepted' && (
                          <button
                            onClick={() => completeOrder(o._id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
                          >
                            Complete
                          </button>
                        )}
                        {!isMySale && <span className="text-xs text-gray-400">—</span>}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}