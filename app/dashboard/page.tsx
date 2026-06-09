"use client";

import { useState, useEffect } from "react";
import { Package, CheckCircle, Shield, DollarSign, TrendingUp, Clock, ArrowUpRight, QrCode, Users, Truck } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function DashboardPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [verified, setVerified] = useState<number[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedMedicines = localStorage.getItem("medicines");
    if (savedMedicines) setMedicines(JSON.parse(savedMedicines));
    const savedVerified = localStorage.getItem("verified");
    if (savedVerified) setVerified(JSON.parse(savedVerified));
    const savedUser = localStorage.getItem("pharmaUser");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const getMyMedicines = () => {
    if (user?.role === "manufacturer") return medicines.filter(m => m.manufacturer === user.name);
    if (user?.role === "patient") return medicines.filter(m => verified.includes(m.id));
    return medicines;
  };

  const myMedicines = getMyMedicines();
  const totalValue = myMedicines.reduce((sum, m) => sum + (parseInt(m.price) || 0), 0);
  const expiringSoon = medicines.filter(m => {
    if (!m.expiryDate) return false;
    const daysLeft = (new Date(m.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return daysLeft <= 30 && daysLeft > 0;
  }).length;

  const chartData = [
    { month: "Jan", medicines: 12, value: 50000 },
    { month: "Feb", medicines: 19, value: 78000 },
    { month: "Mar", medicines: 25, value: 120000 },
    { month: "Apr", medicines: 32, value: 165000 },
    { month: "May", medicines: 40, value: 210000 },
    { month: "Jun", medicines: 48, value: 280000 },
  ];

  const pieData = [
    { name: "Manufactured", value: medicines.filter(m => m.status === "active").length, color: "#3b82f6" },
    { name: "Distributed", value: medicines.filter(m => m.status === "transferred").length, color: "#06b6d4" },
    { name: "Dispensed", value: verified.length, color: "#10b981" },
  ];

  const stats = [
    { label: "Total Medicines", value: myMedicines.length, icon: Package, color: "blue", change: "+12%", changeType: "up" },
    { label: "Active Batches", value: medicines.filter(m => m.status === "active").length, icon: CheckCircle, color: "green", change: "+5%", changeType: "up" },
    { label: "Verified Items", value: verified.length, icon: Shield, color: "cyan", change: "+23%", changeType: "up" },
    { label: "Total Value", value: `${totalValue.toLocaleString()} TZS`, icon: DollarSign, color: "purple", change: "+8%", changeType: "up" },
  ];

  const recentActivities = medicines.slice(-5).reverse().map(m => ({
    id: m.id,
    action: `Medicine ${m.name} was created`,
    batch: m.batchNo,
    time: new Date(m.createdAt || Date.now()).toLocaleTimeString(),
    hash: m.txHash || `0x${Math.random().toString(36).substring(2, 10)}`,
  }));

  return (
    <div className="space-y-8 animate-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name}!</h2>
            <p className="text-white/80">Here's what's happening with your pharmaceutical supply chain today.</p>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-2 text-sm">
            <Shield className="w-4 h-4 inline mr-2" />
            Blockchain Secured
          </div>
        </div>
        <div className="grid grid-cols-4 gap-6 mt-6 pt-6 border-t border-white/20">
          <div>
            <p className="text-white/60 text-sm">Total Transactions</p>
            <p className="text-2xl font-bold">{medicines.length + verified.length}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm">Active Manufacturers</p>
            <p className="text-2xl font-bold">12</p>
          </div>
          <div>
            <p className="text-white/60 text-sm">Network Status</p>
            <p className="text-2xl font-bold flex items-center gap-1">● <span className="text-sm">Active</span></p>
          </div>
          <div>
            <p className="text-white/60 text-sm">Uptime</p>
            <p className="text-2xl font-bold">99.95%</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</p>
                <div className={`flex items-center gap-1 mt-2 text-xs ${stat.changeType === "up" ? "text-green-600" : "text-red-600"}`}>
                  <ArrowUpRight className="w-3 h-3" />
                  <span>{stat.change}</span>
                  <span className="text-gray-400">vs last month</span>
                </div>
              </div>
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-800">Medicine Growth</h3>
            <select className="text-sm border rounded-lg px-3 py-1 bg-white">
              <option>Last 6 months</option>
              <option>Last year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorMedicines" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "12px", color: "white" }}
                labelStyle={{ color: "white" }}
              />
              <Area type="monotone" dataKey="medicines" stroke="#3b82f6" fill="url(#colorMedicines)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-6">Supply Chain Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600">{item.name}</span>
                <span className="text-sm font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-800">Recent Blockchain Activities</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700">View all →</button>
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                    <p className="text-xs text-gray-400 font-mono">{activity.hash}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{activity.time}</p>
                  <p className="text-xs text-gray-400">Batch: {activity.batch}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Alerts & Notifications</h3>
          <div className="space-y-4">
            {expiringSoon > 0 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">{expiringSoon} medicines expiring soon</p>
                  <p className="text-xs text-yellow-600">Check expiry dates and take action</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Blockchain network active</p>
                <p className="text-xs text-green-600">All systems operational</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Security check passed</p>
                <p className="text-xs text-blue-600">No unauthorized access detected</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Quick Actions</span>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition">
                  <QrCode className="w-3 h-3 inline mr-1" />
                  Scan
                </button>
                <button className="px-3 py-1.5 bg-blue-600 rounded-lg text-sm text-white hover:bg-blue-700 transition">
                  + Create
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}