"use client";

import { useState, useEffect } from "react";
import { Package, Search, Filter, Calendar, DollarSign, Building2, ChevronRight, QrCode, Eye, Download } from "lucide-react";

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [verified, setVerified] = useState<number[]>([]);
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const savedMedicines = localStorage.getItem("medicines");
    if (savedMedicines) setMedicines(JSON.parse(savedMedicines));
    const savedVerified = localStorage.getItem("verified");
    if (savedVerified) setVerified(JSON.parse(savedVerified));
    const savedUser = localStorage.getItem("pharmaUser");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const getMyMedicines = () => {
    let items: any[] = [];
    if (user?.role === "manufacturer") items = medicines.filter(m => m.manufacturer === user.name);
    else if (user?.role === "patient") items = medicines.filter(m => verified.includes(m.id));
    else items = medicines;
    
    if (searchTerm) items = items.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.batchNo.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterStatus !== "all") items = items.filter(m => m.status === filterStatus);
    
    return items;
  };

  const myMedicines = getMyMedicines();

  const getStatusColor = (status: string) => {
    switch(status) {
      case "active": return "bg-green-100 text-green-700";
      case "transferred": return "bg-blue-100 text-blue-700";
      case "dispensed": return "bg-purple-100 text-purple-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Medicines</h2>
          <p className="text-gray-500 text-sm mt-1">Manage and track your pharmaceutical inventory</p>
        </div>
        {user?.role === "manufacturer" && (
          <button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg transition">
            + Create New Medicine
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by medicine name or batch number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:border-blue-500 outline-none bg-white appearance-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="transferred">Transferred</option>
              <option value="dispensed">Dispensed</option>
            </select>
          </div>
          <button className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
            <Download className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Items</p>
          <p className="text-2xl font-bold text-gray-800">{myMedicines.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{myMedicines.filter(m => m.status === "active").length}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Value</p>
          <p className="text-2xl font-bold text-purple-600">{myMedicines.reduce((s,m) => s + (parseInt(m.price)||0), 0).toLocaleString()} TZS</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-xs text-gray-500">Batches</p>
          <p className="text-2xl font-bold text-cyan-600">{new Set(myMedicines.map(m => m.batchNo)).size}</p>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Medicine</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Batch Number</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Manufacturer</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Expiry Date</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Price</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myMedicines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    No medicines found
                  </td>
                </tr>
              ) : (
                myMedicines.map((med) => (
                  <tr key={med.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-800">{med.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{med.batchNo}</code>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{med.manufacturer || "N/A"}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{med.expiryDate || "N/A"}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-gray-400" />
                        <span className="text-sm font-medium">{parseInt(med.price).toLocaleString()} TZS</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(med.status)}`}>
                        {med.status || "active"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                          <QrCode className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}