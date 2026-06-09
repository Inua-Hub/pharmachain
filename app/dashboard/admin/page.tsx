"use client";

import { useState, useEffect } from "react";
import { 
  Shield, 
  Users, 
  DollarSign, 
  CheckCircle, 
  RefreshCw, 
  Bell, 
  Settings, 
  Activity,
  Mail,
  Phone,
  Database,
  Download,
  Trash2,
  Server,
  Wallet,
  Clock,
  Send,
  Ban,
  UserCheck,
  X,
  TrendingUp,
  CreditCard,
  Receipt,
  Calendar
} from "lucide-react";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [notifySubject, setNotifySubject] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyRole, setNotifyRole] = useState("all");

  useEffect(() => {
    const saved = localStorage.getItem("allUsers");
    if (saved) {
      setUsers(JSON.parse(saved));
    } else {
      const admin = {
        id: 999,
        name: "System Admin",
        email: "admin@pharmachain.com",
        password: "admin123",
        phone: "+255 888 123 456",
        role: "admin",
        status: "active",
        createdAt: new Date().toISOString()
      };
      setUsers([admin]);
      localStorage.setItem("allUsers", JSON.stringify([admin]));
    }
  }, []);

  const members = users.filter(u => u.role !== "admin");
  
  const stats = {
    total: members.length,
    manufacturers: members.filter(u => u.role === "manufacturer").length,
    distributors: members.filter(u => u.role === "distributor").length,
    pharmacies: members.filter(u => u.role === "pharmacy").length,
    patients: members.filter(u => u.role === "patient").length,
    revenue: 4250000,
    pending: 1500000,
  };

  const getAmount = (role: string) => {
    const map: any = { manufacturer: "2,500,000", distributor: "1,500,000", pharmacy: "500,000", patient: "0" };
    return map[role] || "0";
  };

  const getPlan = (role: string) => {
    const map: any = { manufacturer: "Enterprise", distributor: "Business", pharmacy: "Standard", patient: "Free" };
    return map[role] || "Basic";
  };

  const sendReminder = (member: any) => {
    alert(`📧 Payment reminder sent to ${member.email}`);
  };

  const markPaid = () => {
    alert(`✅ Payment recorded for ${selectedMember?.name}`);
    setShowPaymentModal(false);
    setSelectedMember(null);
  };

  const banUser = (member: any) => {
    if (confirm(`Ban ${member.name}?`)) {
      const updated = users.map(u => u.id === member.id ? { ...u, status: "banned" } : u);
      setUsers(updated);
      localStorage.setItem("allUsers", JSON.stringify(updated));
      alert(`⚠️ ${member.name} banned`);
    }
  };

  const activateUser = (member: any) => {
    const updated = users.map(u => u.id === member.id ? { ...u, status: "active" } : u);
    setUsers(updated);
    localStorage.setItem("allUsers", JSON.stringify(updated));
    alert(`✅ ${member.name} activated`);
  };

  const sendNotification = () => {
    let count = notifyRole === "all" ? members.length : members.filter(m => m.role === notifyRole).length;
    alert(`✅ Notification sent to ${count} members\nSubject: ${notifySubject}`);
    setShowNotifyModal(false);
    setNotifySubject("");
    setNotifyMessage("");
  };

  return (
    <div className="space-y-6">
      
      {/* Header - Admin Only */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-slate-400" />
          <span className="text-sm text-slate-400">Administrator Dashboard</span>
        </div>
        <h2 className="text-2xl font-bold">System Control Panel</h2>
        <p className="text-slate-400 text-sm">Manage members, payments, and system operations</p>
      </div>

      {/* System Health Stats - NO MEDICINE DATA */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">System Uptime</p>
              <p className="text-2xl font-bold">99.95%</p>
            </div>
            <Server className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-xs text-green-600 mt-2">● All systems operational</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Members</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">M:{stats.manufacturers} D:{stats.distributors} Ph:{stats.pharmacies} Pa:{stats.patients}</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">Revenue (MTD)</p>
              <p className="text-2xl font-bold text-green-600">{stats.revenue.toLocaleString()} TZS</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-xs text-green-600 mt-2">+12% vs last month</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-500">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending Collection</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending.toLocaleString()} TZS</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-xs text-yellow-600 mt-2">3 members overdue</p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setShowNotifyModal(true)}
          className="bg-blue-600 text-white p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition font-medium"
        >
          <Send className="w-5 h-5" />
          Broadcast Message
        </button>
        <button className="bg-gray-800 text-white p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-900 transition font-medium">
          <RefreshCw className="w-5 h-5" />
          Sync Blockchain
        </button>
      </div>

      {/* Members Table - Full Control */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Member Management</h3>
            <span className="text-xs text-gray-400 ml-2">{stats.total} total members</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600">Name</th>
                <th className="text-left p-3 font-medium text-gray-600">Email</th>
                <th className="text-left p-3 font-medium text-gray-600">Role</th>
                <th className="text-left p-3 font-medium text-gray-600">Plan</th>
                <th className="text-left p-3 font-medium text-gray-600">Monthly Fee</th>
                <th className="text-left p-3 font-medium text-gray-600">Status</th>
                <th className="text-left p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-gray-400">
                    No members registered yet
                  </td>
                </tr>
              ) : (
                members.map((m, idx) => {
                  const isOverdue = idx % 3 === 1;
                  return (
                    <tr key={m.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{m.name}</td>
                      <td className="p-3 text-gray-600">{m.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          m.role === "manufacturer" ? "bg-blue-100 text-blue-700" :
                          m.role === "distributor" ? "bg-purple-100 text-purple-700" :
                          m.role === "pharmacy" ? "bg-green-100 text-green-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {m.role}
                        </span>
                      </td>
                      <td className="p-3">{getPlan(m.role)}</td>
                      <td className="p-3 font-medium">{getAmount(m.role)} TZS</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          m.status === "banned" ? "bg-red-100 text-red-700" : 
                          isOverdue ? "bg-yellow-100 text-yellow-700" : 
                          "bg-green-100 text-green-700"
                        }`}>
                          {m.status === "banned" ? "Banned" : isOverdue ? "Overdue" : "Active"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => sendReminder(m)}
                            className="p-1.5 bg-yellow-100 rounded-lg hover:bg-yellow-200 transition"
                            title="Send Payment Reminder"
                          >
                            <Bell className="w-4 h-4 text-yellow-700" />
                          </button>
                          <button 
                            onClick={() => { setSelectedMember(m); setShowPaymentModal(true); }}
                            className="p-1.5 bg-green-100 rounded-lg hover:bg-green-200 transition"
                            title="Mark Payment Received"
                          >
                            <DollarSign className="w-4 h-4 text-green-700" />
                          </button>
                          {m.status !== "banned" ? (
                            <button 
                              onClick={() => banUser(m)}
                              className="p-1.5 bg-red-100 rounded-lg hover:bg-red-200 transition"
                              title="Ban User"
                            >
                              <Ban className="w-4 h-4 text-red-700" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => activateUser(m)}
                              className="p-1.5 bg-green-100 rounded-lg hover:bg-green-200 transition"
                              title="Activate User"
                            >
                              <UserCheck className="w-4 h-4 text-green-700" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Maintenance Section */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-gray-700" />
            <h3 className="font-semibold text-gray-800">System Maintenance</h3>
          </div>
          <div className="space-y-2">
            <button className="w-full flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-gray-500" />
                Backup Database
              </span>
              <span className="text-xs text-gray-400">Run now</span>
            </button>
            <button className="w-full flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4 text-gray-500" />
                Export Audit Logs
              </span>
              <span className="text-xs text-gray-400">Last 30 days</span>
            </button>
            <button className="w-full flex justify-between items-center p-3 border border-red-200 rounded-lg hover:bg-red-50 transition">
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-500" />
                Clear System Cache
              </span>
              <span className="text-xs text-red-500">Maintenance</span>
            </button>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-gray-700" />
            <h3 className="font-semibold text-gray-800">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Database backup completed</p>
                <p className="text-xs text-gray-400">Size: 2.4 GB</p>
              </div>
              <span className="text-xs text-gray-400">02:00 AM</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Blockchain sync completed</p>
                <p className="text-xs text-gray-400">Height: 1,284,592</p>
              </div>
              <span className="text-xs text-gray-400">01:30 AM</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Payment reminders sent</p>
                <p className="text-xs text-gray-400">3 members notified</p>
              </div>
              <span className="text-xs text-gray-400">Yesterday</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">New member registered</p>
                <p className="text-xs text-gray-400">Role: Pharmacy</p>
              </div>
              <span className="text-xs text-gray-400">Yesterday</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
        <p className="text-xs text-slate-500">
          <Shield className="w-3 h-3 inline mr-1" />
          System Administrator • All actions are logged for security auditing
        </p>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Member</p>
                <p className="font-semibold">{selectedMember.name}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Amount Due</p>
                <p className="font-semibold text-green-600">{getAmount(selectedMember.role)} TZS</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Date</label>
                <input 
                  type="date" 
                  className="w-full p-2 border rounded-lg" 
                  defaultValue={new Date().toISOString().split('T')[0]} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Transaction ID</label>
                <input 
                  type="text" 
                  placeholder="TX-XXXX-XXXX" 
                  className="w-full p-2 border rounded-lg" 
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowPaymentModal(false)} 
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={markPaid} 
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Send Broadcast</h3>
              <button onClick={() => setShowNotifyModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Send to</label>
                <select 
                  className="w-full p-2 border rounded-lg"
                  value={notifyRole}
                  onChange={(e) => setNotifyRole(e.target.value)}
                >
                  <option value="all">All Members ({stats.total})</option>
                  <option value="manufacturer">Manufacturers ({stats.manufacturers})</option>
                  <option value="distributor">Distributors ({stats.distributors})</option>
                  <option value="pharmacy">Pharmacies ({stats.pharmacies})</option>
                  <option value="patient">Patients ({stats.patients})</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input 
                  type="text" 
                  placeholder="Notification subject"
                  className="w-full p-2 border rounded-lg"
                  value={notifySubject}
                  onChange={(e) => setNotifySubject(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea 
                  rows={4} 
                  placeholder="Type your message here..."
                  className="w-full p-2 border rounded-lg resize-none"
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowNotifyModal(false)} 
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={sendNotification} 
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Send Broadcast
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}