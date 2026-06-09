"use client";

import { useState, useEffect } from "react";
import { FileText, Download, Calendar, TrendingUp, Package, DollarSign } from "lucide-react";

export default function ReportsPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [verified, setVerified] = useState<number[]>([]);

  useEffect(() => {
    const savedMedicines = localStorage.getItem("medicines");
    if (savedMedicines) setMedicines(JSON.parse(savedMedicines));
    const savedVerified = localStorage.getItem("verified");
    if (savedVerified) setVerified(JSON.parse(savedVerified));
  }, []);

  const reports = [
    { name: "Supply Chain Summary", date: "2024-03-15", size: "2.4 MB", type: "PDF" },
    { name: "Medicine Inventory Report", date: "2024-03-10", size: "1.8 MB", type: "PDF" },
    { name: "Verification Statistics", date: "2024-03-05", size: "956 KB", type: "PDF" },
    { name: "Blockchain Transaction Log", date: "2024-03-01", size: "3.2 MB", type: "CSV" },
  ];

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
          <p className="text-gray-500 text-sm mt-1">Generate and download system reports</p>
        </div>
        <button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Generate New Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Medicines</p>
          <p className="text-2xl font-bold text-gray-800">{medicines.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-xs text-gray-500">Verified Medicines</p>
          <p className="text-2xl font-bold text-green-600">{verified.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-xs text-gray-500">Verification Rate</p>
          <p className="text-2xl font-bold text-blue-600">{medicines.length ? Math.round((verified.length / medicines.length) * 100) : 0}%</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-xs text-gray-500">Active Manufacturers</p>
          <p className="text-2xl font-bold text-purple-600">12</p>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Generated Reports</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {reports.map((report, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{report.name}</p>
                  <p className="text-xs text-gray-400">{report.date} • {report.size}</p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                <Download className="w-4 h-4" />
                <span className="text-sm">Download</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}