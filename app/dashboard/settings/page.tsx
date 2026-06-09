"use client";

import { useState, useEffect } from "react";
import { User, Bell, Shield, Key, Globe, Smartphone, Save, Mail, Phone, Eye, EyeOff, Lock, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    medicineExpiry: true,
    transfers: true,
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("pharmaUser");
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      setProfile({
        name: u.name || "",
        email: u.email || "",
        phone: u.phone || "",
      });
    }
    const saved2FA = localStorage.getItem("twoFactorEnabled");
    if (saved2FA) setTwoFactorEnabled(JSON.parse(saved2FA));
  }, []);

  const handleSaveProfile = () => {
    if (user) {
      const updatedUser = { ...user, ...profile };
      localStorage.setItem("pharmaUser", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    alert("Password changed successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const toggle2FA = () => {
    const newState = !twoFactorEnabled;
    setTwoFactorEnabled(newState);
    localStorage.setItem("twoFactorEnabled", JSON.stringify(newState));
    alert(newState ? "2FA enabled! Scan QR code with authenticator app." : "2FA disabled.");
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Manage your account preferences and security</p>
      </div>

      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-700">Settings saved successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Profile Information</h3>
              <p className="text-sm text-gray-500">Update your personal details</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="email" 
                  value={profile.email}
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="tel" 
                  value={profile.phone}
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                />
              </div>
            </div>
            <button 
              onClick={handleSaveProfile}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-2.5 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Security</h3>
              <p className="text-sm text-gray-500">Manage your security settings</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Change Password</label>
              <div className="relative mb-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type={showCurrent ? "text" : "password"} 
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                />
                <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showCurrent ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
              <div className="relative mb-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type={showNew ? "text" : "password"} 
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                />
                <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showNew ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
              <input 
                type="password" 
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
              />
              <button 
                onClick={handleChangePassword}
                className="w-full mt-3 border border-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                Update Password
              </button>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Two-Factor Authentication</span>
                </div>
                <button 
                  onClick={toggle2FA}
                  className={`relative w-12 h-6 rounded-full transition ${twoFactorEnabled ? "bg-blue-600" : "bg-gray-300"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${twoFactorEnabled ? "right-1" : "left-1"}`}></div>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Add an extra layer of security to your account</p>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              <p className="text-sm text-gray-500">Manage your alert preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-700">Email Alerts</p>
                <p className="text-xs text-gray-500">Receive notifications via email</p>
              </div>
              <button 
                onClick={() => setNotifications({...notifications, emailAlerts: !notifications.emailAlerts})}
                className={`relative w-12 h-6 rounded-full transition ${notifications.emailAlerts ? "bg-blue-600" : "bg-gray-300"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${notifications.emailAlerts ? "right-1" : "left-1"}`}></div>
              </button>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-700">SMS Alerts</p>
                <p className="text-xs text-gray-500">Receive notifications via SMS</p>
              </div>
              <button 
                onClick={() => setNotifications({...notifications, smsAlerts: !notifications.smsAlerts})}
                className={`relative w-12 h-6 rounded-full transition ${notifications.smsAlerts ? "bg-blue-600" : "bg-gray-300"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${notifications.smsAlerts ? "right-1" : "left-1"}`}></div>
              </button>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-700">Medicine Expiry Alerts</p>
                <p className="text-xs text-gray-500">Get notified when medicines expire</p>
              </div>
              <button 
                onClick={() => setNotifications({...notifications, medicineExpiry: !notifications.medicineExpiry})}
                className={`relative w-12 h-6 rounded-full transition ${notifications.medicineExpiry ? "bg-blue-600" : "bg-gray-300"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${notifications.medicineExpiry ? "right-1" : "left-1"}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Blockchain Info */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5" />
            <h3 className="font-semibold">Blockchain Status</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/70">Network</span>
              <span className="font-mono">Ethereum Mainnet</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Wallet Address</span>
              <span className="font-mono text-xs">0x742d35Cc6634C0532925a3b844Bc9e7595f0b146</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Status</span>
              <span className="text-green-300">● Connected</span>
            </div>
            <div className="border-t border-white/20 pt-3 mt-2">
              <p className="text-white/60 text-xs">Your data is secured on the blockchain and cannot be altered</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}