// app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import api from "./lib/api";
import { QRCodeGenerator, PasswordStrengthMeter } from "./components";
import { validators, formatPhone } from "./lib/validation";

import AdminPage from "./dashboard/admin/page";
import TMDAPage from "./dashboard/tmda/page";
import MSDPage from "./dashboard/msd/page";
import ManufacturerPage from "./dashboard/manufacturer/page";
import DistributorPage from "./dashboard/distributor/page";
import PharmacyPage from "./dashboard/pharmacy/page";
import OrdersPage from "./dashboard/orders/page";
import SettingsPage from "./dashboard/settings/page";

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  ethAddress?: string;
}

interface Medicine {
  id: string;
  name: string;
  batchNo: string;
  manufacturer: string;
  manufacturerName: string;
  expiryDate: string;
  quantity: number;
  status: string;
  isListed: boolean;
  currentOwner: string;
  currentOwnerName: string;
  txHash: string;
  blockchainVerified: boolean;
  tmdaApproved: boolean;
  tmdaApprovalNumber?: string;
}

type UserRole = "manufacturer" | "distributor" | "pharmacy" | "msd" | "tmda" | "admin";
type UserStatus = "active" | "pending" | "banned";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showHomePage, setShowHomePage] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("pharmacy");
  const [regLicense, setRegLicense] = useState("");
  const [regBusiness, setRegBusiness] = useState("");
  const [regErrors, setRegErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  }>({});

  // Data
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [blockchainStatus, setBlockchainStatus] = useState<any>(null);

  const rolesNeedingLicense = ["manufacturer", "distributor", "pharmacy"];

  useEffect(() => {
    const savedToken = localStorage.getItem("pharma_token");
    const savedUser = localStorage.getItem("pharma_current");

    if (savedToken && savedUser) {
      try {
        const u: User = JSON.parse(savedUser);
        setUser(u);
        setToken(savedToken);
        setIsLoggedIn(true);
        setShowHomePage(false);

        if (u.role === "admin") setActiveTab("admin");
        else if (u.role === "tmda") setActiveTab("tmda");
        else if (u.role === "msd") setActiveTab("msd");
        else if (u.role === "manufacturer") setActiveTab("manufacturer");
        else if (u.role === "distributor") setActiveTab("distributor");
        else if (u.role === "pharmacy") setActiveTab("pharmacy");
        else setActiveTab("dashboard");

        fetchData(savedToken, u);
      } catch (e) {
        console.error(e);
        localStorage.removeItem("pharma_token");
        localStorage.removeItem("pharma_current");
      }
    }
  }, []);

  const fetchData = async (authToken: string, currentUser: User) => {
    try {
      setLoading(true);
      const medsRes: any = await api.getMedicines(authToken);
      if (medsRes.success) setMedicines(medsRes.medicines || []);

      if (currentUser?.role === "admin") {
        try {
          const usersRes: any = await api.getUsers(authToken);
          if (usersRes.success) setAllUsers(usersRes.users || []);
          const bcRes: any = await api.getBlockchainStatus(authToken);
          if (bcRes.success) setBlockchainStatus(bcRes);
        } catch (e) {
          console.error(e);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ========== PASSWORD RESET ==========
  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setResetStep(1);
    setResetEmail("");
    setResetNewPassword("");
    setResetConfirmPassword("");
  };

  const sendResetLink = async () => {
    if (!resetEmail) {
      alert("Please enter your email address");
      return;
    }
    setLoading(true);
    try {
      const result: any = await api.forgotPassword(resetEmail);
      if (result.success) {
        setResetStep(2);
        alert("Password reset link has been sent to your email.");
      } else {
        alert("❌ " + (result.message || "Email not found"));
      }
    } catch (e: any) {
      alert("❌ " + (e.message || "Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  const confirmResetPassword = async () => {
    if (!resetNewPassword) {
      alert("Please enter a new password");
      return;
    }
    const check = validators.password(resetNewPassword);
    if (!check.valid) {
      alert("❌ " + check.error);
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const result: any = await api.resetPassword("demo-token", resetNewPassword);
      if (result.success) {
        alert("Password has been reset successfully!");
        setShowForgotPassword(false);
        setResetStep(1);
        setShowLogin(true);
      } else {
        alert("❌ " + (result.message || "Failed to reset password"));
      }
    } catch (e: any) {
      alert("❌ " + (e.message || "Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  // ========== LOGIN ==========
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      alert("Please enter both email and password");
      return;
    }
    setLoading(true);
    try {
      const result: any = await api.login(loginEmail, loginPassword);
      if (result.success) {
        const userData: User = result.user;
        setUser(userData);
        setToken(result.token);
        localStorage.setItem("pharma_token", result.token);
        localStorage.setItem("pharma_current", JSON.stringify(userData));

        setIsLoggedIn(true);
        setShowHomePage(false);
        setLoginEmail("");
        setLoginPassword("");

        if (userData.role === "admin") setActiveTab("admin");
        else if (userData.role === "tmda") setActiveTab("tmda");
        else if (userData.role === "msd") setActiveTab("msd");
        else if (userData.role === "manufacturer") setActiveTab("manufacturer");
        else if (userData.role === "distributor") setActiveTab("distributor");
        else if (userData.role === "pharmacy") setActiveTab("pharmacy");
        else setActiveTab("dashboard");

        await fetchData(result.token, userData);
      } else {
        alert("❌ " + (result.message || "Login failed"));
      }
    } catch (e: any) {
      alert("❌ " + (e.message || "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  // ========== REGISTER ==========
  const validateRegisterForm = () => {
    const errs: any = {};
    const n = validators.name(regName);
    const e = validators.email(regEmail);
    const p = validators.phone(regPhone);
    const pw = validators.password(regPassword);
    if (!n.valid) errs.name = n.error;
    if (!e.valid) errs.email = e.error;
    if (!p.valid) errs.phone = p.error;
    if (!pw.valid) errs.password = pw.error;
    setRegErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validateRegisterForm()) return;

    const needsLicense = rolesNeedingLicense.includes(regRole);
    if (needsLicense && (!regLicense || !regBusiness)) {
      alert("License number and Business Name are required");
      return;
    }

    setLoading(true);
    try {
      const result: any = await api.register({
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: regPhone,
        password: regPassword,
        role: regRole,
        licenseNumber: regLicense || null,
        businessName: regBusiness || null,
      });

      if (result.success) {
        const instant = regRole === "pharmacy" || ["tmda", "msd"].includes(regRole);
        alert(
          instant
            ? "✅ Registration successful! You can login now."
            : "✅ Registration submitted. Pending admin verification."
        );
        setRegName("");
        setRegEmail("");
        setRegPhone("");
        setRegPassword("");
        setRegLicense("");
        setRegBusiness("");
        setRegErrors({});
        setShowLogin(true);
      } else {
        alert("❌ " + (result.message || "Registration failed"));
      }
    } catch (e: any) {
      alert("❌ " + (e.message || "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  // ========== LOGOUT ==========
  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setShowHomePage(true);
    localStorage.removeItem("pharma_token");
    localStorage.removeItem("pharma_current");
    setActiveTab("dashboard");
  };

  // ========== HELPERS ==========
  const getMyMedicines = (): Medicine[] => {
    if (!user) return [];
    if (user.role === "manufacturer") {
      return medicines.filter(
        (m) => m.manufacturer === user._id || m.manufacturerName === user.name
      );
    }
    if (user.role === "pharmacy") {
      return medicines.filter(
        (m) => m.status === "sold_to_pharmacy" || m.status === "msd_allocated"
      );
    }
    if (user.role === "distributor") {
      return medicines.filter((m) => m.status === "sold_to_distributor");
    }
    if (user.role === "tmda" || user.role === "msd") return medicines;
    return medicines;
  };

  const getStats = () => {
    const myMeds = getMyMedicines();
    return {
      total: myMeds.length,
      active: myMeds.filter((m) => m.status === "tmda_approved" || m.status === "listed").length,
      listed: myMeds.filter((m) => m.isListed).length,
    };
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      manufactured: "Manufactured",
      tmda_approved: "TMDA Approved",
      listed: "Available",
      sold_to_distributor: "With Distributor",
      sold_to_pharmacy: "With Pharmacy",
      msd_allocated: "MSD Allocated",
      dispensed: "Dispensed",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "tmda_approved": return { bg: "#d1fae5", color: "#065f46" };
      case "listed": return { bg: "#e0e7ff", color: "#3730a3" };
      case "sold_to_distributor": return { bg: "#fed7aa", color: "#9a3412" };
      case "sold_to_pharmacy": return { bg: "#d1fae5", color: "#065f46" };
      case "msd_allocated": return { bg: "#ede9fe", color: "#5b21b6" };
      default: return { bg: "#f1f5f9", color: "#64748b" };
    }
  };

  const stats = getStats();
  const myMedicines = getMyMedicines();

  // ============= HOME PAGE =============
  if (showHomePage && !isLoggedIn) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0e27, #1a1a3e)", position: "relative", overflow: "hidden" }}>
        <style>{`
          @keyframes float { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-30px) scale(1.1); } }
        `}</style>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", width: "400px", height: "400px", background: "#3b82f6", borderRadius: "50%", filter: "blur(80px)", opacity: 0.2, top: "-100px", left: "-100px", animation: "float 20s infinite" }} />
          <div style={{ position: "absolute", width: "500px", height: "500px", background: "#06b6d4", borderRadius: "50%", filter: "blur(80px)", opacity: 0.2, bottom: "-150px", right: "-150px", animation: "float 20s infinite 5s" }} />
        </div>

        <nav style={{ position: "relative", zIndex: 10, background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", background: "linear-gradient(135deg, #3b82f6, #06b6d4)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "20px" }}>💊</span>
              </div>
              <span style={{ fontSize: "20px", fontWeight: "bold", color: "white" }}>Pharma<span style={{ color: "#06b6d4" }}>Chain</span></span>
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              <button onClick={() => { setShowHomePage(false); setShowLogin(true); }} style={{ padding: "8px 20px", background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "white", borderRadius: "10px", cursor: "pointer" }}>Sign In</button>
              <button onClick={() => { setShowHomePage(false); setShowLogin(false); }} style={{ padding: "8px 20px", background: "linear-gradient(135deg, #3b82f6, #06b6d4)", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" }}>Get Started</button>
            </div>
          </div>
        </nav>

        <div style={{ position: "relative", zIndex: 10, maxWidth: "1200px", margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", borderRadius: "30px", padding: "6px 16px", marginBottom: "24px" }}>
            <div style={{ width: "8px", height: "8px", background: "#10b981", borderRadius: "50%" }} />
            <span style={{ fontSize: "14px", color: "white" }}>Blockchain Network Active</span>
          </div>
          <h1 style={{ fontSize: "56px", fontWeight: "bold", color: "white", marginBottom: "20px", lineHeight: 1.2 }}>
            Secure Pharmaceutical<br />
            <span style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4, #8b5cf6)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" }}>
              Supply Chain on Blockchain
            </span>
          </h1>
          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.7)", maxWidth: "600px", margin: "0 auto 32px" }}>
            Track medicines from manufacturer to patient with immutable blockchain records, QR verification, and real-time transparency.
          </p>
        </div>
      </div>
    );
  }

  // ============= AUTH PAGES =============
  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0e27, #1a1a3e)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ background: "white", borderRadius: "24px", maxWidth: "450px", width: "100%", padding: "32px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <button onClick={() => { setShowHomePage(true); setShowLogin(true); }} style={{ background: "none", border: "none", cursor: "pointer", marginBottom: "16px" }}>← Back to Home</button>
            <div style={{ width: "60px", height: "60px", background: "linear-gradient(135deg, #3b82f6, #06b6d4)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <span style={{ fontSize: "28px" }}>💊</span>
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>PharmaChain</h1>
            <p style={{ color: "#64748b" }}>Blockchain Pharmaceutical System</p>
          </div>

          {!showForgotPassword ? (
            showLogin ? (
              // ============ LOGIN FORM ============
              <div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "14px" }}
                  />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "14px" }}
                  />
                </div>
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #3b82f6, #06b6d4)", color: "white", border: "none", borderRadius: "12px", fontWeight: 600, cursor: "pointer", opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Loading..." : "Sign In"}
                </button>
                <div style={{ textAlign: "center", marginTop: "12px" }}>
                  <button onClick={handleForgotPassword} style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontSize: "13px" }}>
                    Forgot Password?
                  </button>
                </div>
                <p style={{ textAlign: "center", marginTop: "16px", fontSize: "14px" }}>
                  No account?{" "}
                  <button onClick={() => setShowLogin(false)} style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer" }}>
                    Register
                  </button>
                </p>
              </div>
            ) : (
              // ============ REGISTER FORM ============
              <div style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: "4px" }}>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, fontSize: "13px" }}>Full Name *</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => {
                      setRegName(e.target.value);
                      if (regErrors.name) setRegErrors({ ...regErrors, name: undefined });
                    }}
                    placeholder="e.g., Aziz Ali"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: `1px solid ${regErrors.name ? "#ef4444" : "#e2e8f0"}`,
                      borderRadius: "10px",
                      fontSize: "14px",
                    }}
                  />
                  {regErrors.name && <p style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>{regErrors.name}</p>}
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, fontSize: "13px" }}>Email Address *</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      if (regErrors.email) setRegErrors({ ...regErrors, email: undefined });
                    }}
                    placeholder="e.g., aziz@gmail.com"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: `1px solid ${regErrors.email ? "#ef4444" : "#e2e8f0"}`,
                      borderRadius: "10px",
                      fontSize: "14px",
                    }}
                  />
                  {regErrors.email && <p style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>{regErrors.email}</p>}
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, fontSize: "13px" }}>Phone Number *</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => {
                      setRegPhone(e.target.value);
                      if (regErrors.phone) setRegErrors({ ...regErrors, phone: undefined });
                    }}
                    onBlur={(e) => {
                      if (e.target.value) setRegPhone(formatPhone(e.target.value));
                    }}
                    placeholder="+255 672 622 405"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: `1px solid ${regErrors.phone ? "#ef4444" : "#e2e8f0"}`,
                      borderRadius: "10px",
                      fontSize: "14px",
                    }}
                  />
                  {regErrors.phone && <p style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>{regErrors.phone}</p>}
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, fontSize: "13px" }}>Password *</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (regErrors.password) setRegErrors({ ...regErrors, password: undefined });
                    }}
                    placeholder="Min 8 chars (uppercase + number or symbol)"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: `1px solid ${regErrors.password ? "#ef4444" : "#e2e8f0"}`,
                      borderRadius: "10px",
                      fontSize: "14px",
                    }}
                  />
                  <PasswordStrengthMeter password={regPassword} />
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, fontSize: "13px" }}>Role</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "14px" }}
                  >
                    <option value="pharmacy">Pharmacy</option>
                    <option value="manufacturer">Manufacturer</option>
                    <option value="distributor">Distributor</option>
                    <option value="msd">MSD</option>
                    <option value="tmda">TMDA</option>
                  </select>
                </div>

                {rolesNeedingLicense.includes(regRole) && (
                  <>
                    <div style={{ marginBottom: "12px" }}>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, fontSize: "13px" }}>License Number *</label>
                      <input
                        type="text"
                        value={regLicense}
                        onChange={(e) => setRegLicense(e.target.value)}
                        placeholder="e.g., TZ-MFG-2024-001"
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "14px" }}
                      />
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, fontSize: "13px" }}>Business Name *</label>
                      <input
                        type="text"
                        value={regBusiness}
                        onChange={(e) => setRegBusiness(e.target.value)}
                        placeholder="e.g., ABC Pharma Ltd"
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "14px" }}
                      />
                    </div>
                  </>
                )}

                <button
                  onClick={handleRegister}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 600,
                    cursor: "pointer",
                    opacity: loading ? 0.7 : 1,
                    fontSize: "14px",
                  }}
                >
                  {loading ? "Creating account..." : "Create Account"}
                </button>
                <p style={{ textAlign: "center", marginTop: "14px", fontSize: "13px" }}>
                  Already have an account?{" "}
                  <button onClick={() => setShowLogin(true)} style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer" }}>
                    Sign In
                  </button>
                </p>
              </div>
            )
          ) : (
            // ============ FORGOT PASSWORD ============
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <button onClick={() => setShowForgotPassword(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}>
                  ←
                </button>
                <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Reset Password</h2>
              </div>

              {resetStep === 1 && (
                <>
                  <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "14px" }}>
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>Email Address</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "14px" }}
                    />
                  </div>
                  <button
                    onClick={sendResetLink}
                    disabled={loading}
                    style={{ width: "100%", padding: "12px", background: "#3b82f6", color: "white", border: "none", borderRadius: "12px", fontWeight: 600, cursor: "pointer", opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                </>
              )}

              {resetStep === 2 && (
                <>
                  <p style={{ color: "#10b981", marginBottom: "8px", fontSize: "14px" }}>✅ A password reset link has been sent to your email.</p>
                  <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "14px" }}>Please check your inbox and click the link to reset your password.</p>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>New Password</label>
                    <input
                      type="password"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "14px" }}
                    />
                    <PasswordStrengthMeter password={resetNewPassword} />
                  </div>
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>Confirm New Password</label>
                    <input
                      type="password"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "14px" }}
                    />
                  </div>
                  <button
                    onClick={confirmResetPassword}
                    disabled={loading}
                    style={{ width: "100%", padding: "12px", background: "#10b981", color: "white", border: "none", borderRadius: "12px", fontWeight: 600, cursor: "pointer", opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============= MAIN DASHBOARD =============
  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f8", display: "flex" }}>
      {/* SIDEBAR */}
      <div
        style={{
          width: sidebarOpen ? "260px" : "80px",
          background: "linear-gradient(180deg, #0f172a, #1e293b)",
          transition: "0.3s",
          position: "fixed",
          left: 0,
          top: 0,
          height: "100%",
          zIndex: 100,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "24px" }}>💊</span>
            {sidebarOpen && <span style={{ color: "white", fontWeight: "bold" }}>PharmaChain</span>}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "18px" }}>
            ☰
          </button>
        </div>

        <nav style={{ padding: "16px", overflowY: "auto", height: "calc(100% - 120px)" }}>
          {user?.role === "admin" && (
            <>
              <SidebarButton active={activeTab === "admin"} onClick={() => setActiveTab("admin")} icon="🛡️" label="Admin Panel" open={sidebarOpen} />
              <SidebarButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon="⚙️" label="Settings" open={sidebarOpen} style={{ marginTop: "20px" }} />
              <LogoutButton onClick={handleLogout} open={sidebarOpen} />
            </>
          )}

          {user?.role === "tmda" && (
            <>
              <SidebarButton active={activeTab === "tmda"} onClick={() => setActiveTab("tmda")} icon="🔬" label="TMDA Dashboard" open={sidebarOpen} />
              <SidebarButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon="⚙️" label="Settings" open={sidebarOpen} style={{ marginTop: "20px" }} />
              <LogoutButton onClick={handleLogout} open={sidebarOpen} />
            </>
          )}

          {user?.role === "msd" && (
            <>
              <SidebarButton active={activeTab === "msd"} onClick={() => setActiveTab("msd")} icon="📋" label="MSD Dashboard" open={sidebarOpen} />
              <SidebarButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon="⚙️" label="Settings" open={sidebarOpen} style={{ marginTop: "20px" }} />
              <LogoutButton onClick={handleLogout} open={sidebarOpen} />
            </>
          )}

          {user?.role === "manufacturer" && (
            <>
              <SidebarButton active={activeTab === "manufacturer"} onClick={() => setActiveTab("manufacturer")} icon="🏭" label="Manufacturer" open={sidebarOpen} />
              <SidebarButton active={activeTab === "orders"} onClick={() => setActiveTab("orders")} icon="📋" label="Orders" open={sidebarOpen} />
              <SidebarButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon="⚙️" label="Settings" open={sidebarOpen} style={{ marginTop: "20px" }} />
              <LogoutButton onClick={handleLogout} open={sidebarOpen} />
            </>
          )}

          {user?.role === "distributor" && (
            <>
              <SidebarButton active={activeTab === "distributor"} onClick={() => setActiveTab("distributor")} icon="🚚" label="Distributor" open={sidebarOpen} />
              <SidebarButton active={activeTab === "orders"} onClick={() => setActiveTab("orders")} icon="📋" label="Orders" open={sidebarOpen} />
              <SidebarButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon="⚙️" label="Settings" open={sidebarOpen} style={{ marginTop: "20px" }} />
              <LogoutButton onClick={handleLogout} open={sidebarOpen} />
            </>
          )}

          {user?.role === "pharmacy" && (
            <>
              <SidebarButton active={activeTab === "pharmacy"} onClick={() => setActiveTab("pharmacy")} icon="🏥" label="Pharmacy" open={sidebarOpen} />
              <SidebarButton active={activeTab === "orders"} onClick={() => setActiveTab("orders")} icon="📋" label="My Orders" open={sidebarOpen} />
              <SidebarButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon="⚙️" label="Settings" open={sidebarOpen} style={{ marginTop: "20px" }} />
              <LogoutButton onClick={handleLogout} open={sidebarOpen} />
            </>
          )}
        </nav>

        <div style={{ position: "absolute", bottom: "20px", left: "20px", right: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", background: "linear-gradient(135deg, #3b82f6, #06b6d4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold" }}>
              {user?.name?.charAt(0) || "U"}
            </div>
            {sidebarOpen && (
              <div>
                <div style={{ color: "white", fontSize: "14px" }}>{user?.name}</div>
                <div style={{ color: "#94a3b8", fontSize: "12px" }}>{user?.role}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ marginLeft: sidebarOpen ? "260px" : "80px", flex: 1, padding: "24px", transition: "0.3s" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1e293b" }}>
            {activeTab === "admin" && "Admin Panel"}
            {activeTab === "tmda" && "TMDA Dashboard"}
            {activeTab === "msd" && "MSD Dashboard"}
            {activeTab === "manufacturer" && "Manufacturer Dashboard"}
            {activeTab === "distributor" && "Distributor Dashboard"}
            {activeTab === "pharmacy" && "Pharmacy Dashboard"}
            {activeTab === "orders" && "Orders"}
            {activeTab === "settings" && "Settings"}
            {activeTab === "dashboard" && "Dashboard"}
          </h1>
          <p style={{ color: "#64748b" }}>Welcome, {user?.name}</p>
        </div>

        {activeTab === "admin" && user?.role === "admin" && <AdminPage />}
        {activeTab === "tmda" && user?.role === "tmda" && <TMDAPage />}
        {activeTab === "msd" && user?.role === "msd" && <MSDPage />}
        {activeTab === "manufacturer" && user?.role === "manufacturer" && <ManufacturerPage />}
        {activeTab === "distributor" && user?.role === "distributor" && <DistributorPage />}
        {activeTab === "pharmacy" && user?.role === "pharmacy" && <PharmacyPage />}
        {activeTab === "orders" && <OrdersPage />}
        {activeTab === "settings" && <SettingsPage />}

        {activeTab === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "24px" }}>
              <div style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <p style={{ color: "#64748b", fontSize: "14px" }}>Total Medicines</p>
                <p style={{ fontSize: "32px", fontWeight: "bold" }}>{stats.total}</p>
              </div>
              <div style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <p style={{ color: "#64748b", fontSize: "14px" }}>Active Batches</p>
                <p style={{ fontSize: "32px", fontWeight: "bold", color: "#10b981" }}>{stats.active}</p>
              </div>
              <div style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <p style={{ color: "#64748b", fontSize: "14px" }}>Listed</p>
                <p style={{ fontSize: "32px", fontWeight: "bold", color: "#8b5cf6" }}>{stats.listed}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Small helpers to keep the sidebar DRY
function SidebarButton({ active, onClick, icon, label, open, style }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "10px 12px",
        borderRadius: "8px",
        marginBottom: "4px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: active ? "rgba(255,255,255,0.1)" : "transparent",
        color: active ? "white" : "#94a3b8",
        border: "none",
        cursor: "pointer",
        ...style,
      }}
    >
      <span>{icon}</span> {open && <span>{label}</span>}
    </button>
  );
}

function LogoutButton({ onClick, open }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "10px 12px",
        borderRadius: "8px",
        marginTop: "20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        color: "#ef4444",
        background: "none",
        border: "none",
        cursor: "pointer",
      }}
    >
      <span>🚪</span> {open && <span>Logout</span>}
    </button>
  );
}