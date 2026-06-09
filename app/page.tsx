"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showHomePage, setShowHomePage] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSecurityAnswer, setResetSecurityAnswer] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetUser, setResetUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auth state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("patient");
  const [regLicense, setRegLicense] = useState("");
  const [regBusiness, setRegBusiness] = useState("");
  const [regSecurityQuestion, setRegSecurityQuestion] = useState("");
  const [regSecurityAnswer, setRegSecurityAnswer] = useState("");
  
  // Medicine state
  const [medicines, setMedicines] = useState<any[]>([]);
  const [verified, setVerified] = useState<number[]>([]);
  const [medName, setMedName] = useState("");
  const [medBatch, setMedBatch] = useState("");
  const [medExpiry, setMedExpiry] = useState("");
  const [medPrice, setMedPrice] = useState("");
  const [scanBatch, setScanBatch] = useState("");
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [patientName, setPatientName] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Admin state
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const securityQuestions = [
    "What is your mother's maiden name?",
    "What was the name of your first pet?",
    "What is your favorite book?",
    "What city were you born in?",
    "What is your favorite color?",
    "What was your first car?",
    "Who is your childhood hero?"
  ];

  // Initialize data
  useEffect(() => {
    let users = localStorage.getItem("pharma_users");
    if (!users) {
      const defaultUsers = [
        { 
          id: 1, 
          name: "Administrator", 
          email: "admin@pharmachain.com", 
          password: "Admin@2024", 
          phone: "", 
          role: "admin", 
          status: "approved", 
          license: "", 
          business: "",
          securityQuestion: "What is your favorite color?",
          securityAnswer: "blue",
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem("pharma_users", JSON.stringify(defaultUsers));
      users = JSON.stringify(defaultUsers);
    }
    setAllUsers(JSON.parse(users));
    
    let meds = localStorage.getItem("pharma_medicines");
    if (!meds) {
      localStorage.setItem("pharma_medicines", JSON.stringify([]));
      meds = "[]";
    }
    setMedicines(JSON.parse(meds));
    
    let ver = localStorage.getItem("pharma_verified");
    if (!ver) {
      localStorage.setItem("pharma_verified", JSON.stringify([]));
      ver = "[]";
    }
    setVerified(JSON.parse(ver));
    
    const savedUser = localStorage.getItem("pharma_current");
    if (savedUser) {
      const u = JSON.parse(savedUser);
      if (u.status === "approved" || u.role === "patient") {
        setUser(u);
        setIsLoggedIn(true);
        setShowHomePage(false);
      }
    }
  }, []);

  // Password Reset Functions
  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setResetStep(1);
    setResetEmail("");
    setResetSecurityAnswer("");
    setResetNewPassword("");
    setResetConfirmPassword("");
    setResetUser(null);
  };

  const checkEmailForReset = () => {
    if (!resetEmail) {
      alert("Please enter your email address");
      return;
    }
    const foundUser = allUsers.find(u => u.email === resetEmail);
    if (!foundUser) {
      alert("No account found with this email address");
      return;
    }
    setResetUser(foundUser);
    setResetStep(2);
  };

  const verifySecurityAnswer = () => {
    if (!resetSecurityAnswer) {
      alert("Please answer the security question");
      return;
    }
    if (resetUser.securityAnswer?.toLowerCase() !== resetSecurityAnswer.toLowerCase()) {
      alert("Incorrect answer. Please try again.");
      return;
    }
    setResetStep(3);
  };

  const resetPassword = () => {
    if (!resetNewPassword) {
      alert("Please enter a new password");
      return;
    }
    if (resetNewPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      alert("Passwords do not match");
      return;
    }
    
    const updatedUsers = allUsers.map(u => 
      u.id === resetUser.id ? { ...u, password: resetNewPassword } : u
    );
    setAllUsers(updatedUsers);
    localStorage.setItem("pharma_users", JSON.stringify(updatedUsers));
    
    alert("✅ Password has been reset successfully! Please login with your new password.");
    setShowForgotPassword(false);
    setResetStep(1);
    setShowLogin(true);
  };

  const handleLogin = () => {
    const userFound = allUsers.find(u => u.email === loginEmail && u.password === loginPassword);
    if (!userFound) {
      alert("Invalid email or password");
      return;
    }
    if (userFound.status === "pending") {
      alert("Account pending admin approval");
      return;
    }
    if (userFound.status === "rejected") {
      alert("Account rejected. Contact administrator.");
      return;
    }
    setUser(userFound);
    localStorage.setItem("pharma_current", JSON.stringify(userFound));
    setIsLoggedIn(true);
    setShowHomePage(false);
    setLoginEmail("");
    setLoginPassword("");
  };

  const handleRegister = () => {
    if (!regName || !regEmail || !regPassword) {
      alert("Please fill all required fields");
      return;
    }
    if (regPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    if (!regSecurityQuestion || !regSecurityAnswer) {
      alert("Please select a security question and provide an answer");
      return;
    }
    if (allUsers.find(u => u.email === regEmail)) {
      alert("Email already registered");
      return;
    }
    
    const isPatient = regRole === "patient";
    const status = isPatient ? "approved" : "pending";
    
    if (!isPatient && (!regLicense || !regBusiness)) {
      alert("License number and business name are required for verification");
      return;
    }
    
    const newUser = {
      id: Date.now(),
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      role: regRole,
      status: status,
      license: regLicense,
      business: regBusiness,
      securityQuestion: regSecurityQuestion,
      securityAnswer: regSecurityAnswer.toLowerCase(),
      createdAt: new Date().toISOString()
    };
    
    const updated = [...allUsers, newUser];
    setAllUsers(updated);
    localStorage.setItem("pharma_users", JSON.stringify(updated));
    
    if (isPatient) {
      alert("Registration successful. Please login.");
    } else {
      alert("Registration submitted. Your license is pending admin verification.");
    }
    
    setRegName("");
    setRegEmail("");
    setRegPhone("");
    setRegPassword("");
    setRegLicense("");
    setRegBusiness("");
    setRegSecurityQuestion("");
    setRegSecurityAnswer("");
    setShowLogin(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setShowHomePage(true);
    localStorage.removeItem("pharma_current");
    setActiveTab("dashboard");
  };

  const approveUser = (userId: number) => {
    const updated = allUsers.map(u => u.id === userId ? { ...u, status: "approved" } : u);
    setAllUsers(updated);
    localStorage.setItem("pharma_users", JSON.stringify(updated));
    alert("User approved successfully");
  };

  const rejectUser = (userId: number) => {
    const updated = allUsers.map(u => u.id === userId ? { ...u, status: "rejected" } : u);
    setAllUsers(updated);
    localStorage.setItem("pharma_users", JSON.stringify(updated));
    alert("User rejected");
  };

  const deleteUser = (userId: number) => {
    const toDelete = allUsers.find(u => u.id === userId);
    if (toDelete?.role === "admin") {
      alert("Cannot delete administrator account");
      return;
    }
    if (confirm(`Delete user "${toDelete?.name}"? This action cannot be undone.`)) {
      const updated = allUsers.filter(u => u.id !== userId);
      setAllUsers(updated);
      localStorage.setItem("pharma_users", JSON.stringify(updated));
      alert("User deleted");
    }
  };

  const createMedicine = () => {
    if (!medName || !medBatch || !medExpiry || !medPrice) {
      alert("Please fill all medicine fields");
      return;
    }
    if (medicines.find(m => m.batchNo === medBatch.toUpperCase())) {
      alert("Batch number already exists");
      return;
    }
    const newMed = {
      id: Date.now(),
      name: medName,
      batchNo: medBatch.toUpperCase(),
      expiryDate: medExpiry,
      price: parseInt(medPrice),
      manufacturer: user.name,
      manufacturerId: user.id,
      status: "active",
      createdAt: new Date().toISOString(),
      txHash: "0x" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    };
    const updated = [...medicines, newMed];
    setMedicines(updated);
    localStorage.setItem("pharma_medicines", JSON.stringify(updated));
    alert(`Medicine "${medName}" created on blockchain`);
    setMedName("");
    setMedBatch("");
    setMedExpiry("");
    setMedPrice("");
  };

  const verifyMedicine = () => {
    if (!scanBatch) {
      alert("Enter batch number");
      return;
    }
    const found = medicines.find(m => m.batchNo === scanBatch.toUpperCase());
    if (found) {
      if (user?.role === "patient" && !verified.includes(found.id)) {
        const updated = [...verified, found.id];
        setVerified(updated);
        localStorage.setItem("pharma_verified", JSON.stringify(updated));
      }
      setVerifyResult({ success: true, medicine: found });
    } else {
      setVerifyResult({ success: false });
    }
  };

  const dispenseMedicine = () => {
    if (!selectedMedicine) {
      alert("Select a medicine first");
      return;
    }
    if (!patientName) {
      alert("Enter patient name");
      return;
    }
    const updated = medicines.map(m => m.id === selectedMedicine.id ? { ...m, status: "dispensed", dispensedTo: patientName, dispensedAt: new Date().toISOString() } : m);
    setMedicines(updated);
    localStorage.setItem("pharma_medicines", JSON.stringify(updated));
    alert(`${selectedMedicine.name} dispensed to ${patientName}`);
    setSelectedMedicine(null);
    setPatientName("");
  };

  const getMyMedicines = () => {
    if (user?.role === "manufacturer") return medicines.filter(m => m.manufacturerId === user.id);
    if (user?.role === "pharmacy") return medicines.filter(m => m.status === "active");
    if (user?.role === "patient") return medicines.filter(m => verified.includes(m.id));
    return medicines;
  };

  const getStats = () => {
    const myMeds = getMyMedicines();
    return {
      total: myMeds.length,
      active: myMeds.filter(m => m.status === "active").length,
      verified: verified.length,
      value: myMeds.reduce((s, m) => s + (m.price || 0), 0)
    };
  };

  const stats = getStats();
  const myMedicines = getMyMedicines();
  const regularUsers = allUsers.filter(u => u.role !== "admin");
  const pendingUsers = allUsers.filter(u => u.status === "pending");

  // ==================== HOMEPAGE ====================
  if (showHomePage && !isLoggedIn) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0e27, #1a1a3e)", position: "relative", overflow: "hidden" }}>
        {/* Animated Background */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", width: "400px", height: "400px", background: "#3b82f6", borderRadius: "50%", filter: "blur(80px)", opacity: 0.2, top: "-100px", left: "-100px", animation: "float 20s infinite" }} />
          <div style={{ position: "absolute", width: "500px", height: "500px", background: "#06b6d4", borderRadius: "50%", filter: "blur(80px)", opacity: 0.2, bottom: "-150px", right: "-150px", animation: "float 20s infinite 5s" }} />
          <div style={{ position: "absolute", width: "300px", height: "300px", background: "#8b5cf6", borderRadius: "50%", filter: "blur(80px)", opacity: 0.15, top: "50%", left: "50%", transform: "translate(-50%, -50%)", animation: "float 20s infinite 10s" }} />
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(30px, -30px) scale(1.1); }
          }
        `}</style>

        {/* Navigation */}
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

        {/* Hero Section - Simplified */}
        <div style={{ position: "relative", zIndex: 10, maxWidth: "1200px", margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", borderRadius: "30px", padding: "6px 16px", marginBottom: "24px" }}>
            <div style={{ width: "8px", height: "8px", background: "#10b981", borderRadius: "50%" }} />
            <span style={{ fontSize: "14px", color: "white" }}>Blockchain Network Active</span>
          </div>
          
          <h1 style={{ fontSize: "56px", fontWeight: "bold", color: "white", marginBottom: "20px", lineHeight: "1.2" }}>
            Secure Pharmaceutical<br />
            <span style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4, #8b5cf6)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" }}>Supply Chain on Blockchain</span>
          </h1>
          
          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.7)", maxWidth: "600px", margin: "0 auto 32px" }}>
            Track medicines from manufacturer to patient with immutable blockchain records, QR verification, and real-time transparency.
          </p>
        </div>
      </div>
    );
  }

  // ==================== LOGIN/AUTH SCREEN ====================
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
              <div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Email</label>
                  <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Password</label>
                  <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                </div>
                <button onClick={handleLogin} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #3b82f6, #06b6d4)", color: "white", border: "none", borderRadius: "12px", fontWeight: "600", cursor: "pointer" }}>Sign In</button>
                <div style={{ textAlign: "center", marginTop: "12px" }}>
                  <button onClick={handleForgotPassword} style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontSize: "13px" }}>Forgot Password?</button>
                </div>
                <p style={{ textAlign: "center", marginTop: "16px", fontSize: "14px" }}>No account? <button onClick={() => setShowLogin(false)} style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer" }}>Register</button></p>
              </div>
            ) : (
              <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Full Name</label>
                  <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Email</label>
                  <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Phone</label>
                  <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Password</label>
                  <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Role</label>
                  <select value={regRole} onChange={(e) => setRegRole(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
                    <option value="patient">Patient (Instant Access)</option>
                    <option value="manufacturer">Manufacturer (License Required)</option>
                    <option value="pharmacy">Pharmacy (License Required)</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Security Question</label>
                  <select value={regSecurityQuestion} onChange={(e) => setRegSecurityQuestion(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
                    <option value="">Select a security question</option>
                    {securityQuestions.map((q, i) => (
                      <option key={i} value={q}>{q}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Used to recover your password if forgotten</p>
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Security Answer</label>
                  <input type="text" value={regSecurityAnswer} onChange={(e) => setRegSecurityAnswer(e.target.value)} placeholder="Your answer" style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                </div>
                
                {regRole !== "patient" && (
                  <>
                    <div style={{ marginBottom: "12px" }}>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>License Number</label>
                      <input type="text" value={regLicense} onChange={(e) => setRegLicense(e.target.value)} placeholder="Required for verification" style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Registered Business Name</label>
                      <input type="text" value={regBusiness} onChange={(e) => setRegBusiness(e.target.value)} placeholder="Required for verification" style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                    </div>
                  </>
                )}
                <button onClick={handleRegister} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #3b82f6, #06b6d4)", color: "white", border: "none", borderRadius: "12px", fontWeight: "600", cursor: "pointer", marginTop: "16px" }}>
                  {regRole === "patient" ? "Register" : "Submit License"}
                </button>
                <p style={{ textAlign: "center", marginTop: "16px", fontSize: "14px" }}>Already have an account? <button onClick={() => setShowLogin(true)} style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer" }}>Sign In</button></p>
              </div>
            )
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <button onClick={() => setShowForgotPassword(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}>←</button>
                <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Reset Password</h2>
              </div>
              
              {resetStep === 1 && (
                <>
                  <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "14px" }}>Enter your email address to reset your password.</p>
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Email Address</label>
                    <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                  </div>
                  <button onClick={checkEmailForReset} style={{ width: "100%", padding: "12px", background: "#3b82f6", color: "white", border: "none", borderRadius: "12px", fontWeight: "600", cursor: "pointer" }}>Continue</button>
                </>
              )}
              
              {resetStep === 2 && resetUser && (
                <>
                  <p style={{ color: "#64748b", marginBottom: "8px", fontSize: "14px" }}>Account found for: <strong>{resetUser.email}</strong></p>
                  <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "14px" }}>Answer your security question to reset your password.</p>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Security Question</label>
                    <input type="text" value={resetUser.securityQuestion} disabled style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#f1f5f9" }} />
                  </div>
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Your Answer</label>
                    <input type="text" value={resetSecurityAnswer} onChange={(e) => setResetSecurityAnswer(e.target.value)} placeholder="Enter your answer" style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                  </div>
                  <button onClick={verifySecurityAnswer} style={{ width: "100%", padding: "12px", background: "#3b82f6", color: "white", border: "none", borderRadius: "12px", fontWeight: "600", cursor: "pointer" }}>Verify & Continue</button>
                </>
              )}
              
              {resetStep === 3 && (
                <>
                  <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "14px" }}>Create a new password for your account.</p>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>New Password</label>
                    <input type="password" value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} placeholder="Min. 6 characters" style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                  </div>
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Confirm New Password</label>
                    <input type="password" value={resetConfirmPassword} onChange={(e) => setResetConfirmPassword(e.target.value)} placeholder="Confirm your new password" style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                  </div>
                  <button onClick={resetPassword} style={{ width: "100%", padding: "12px", background: "#10b981", color: "white", border: "none", borderRadius: "12px", fontWeight: "600", cursor: "pointer" }}>Reset Password</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================== DASHBOARD ====================
  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f8", display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: sidebarOpen ? "260px" : "80px", background: "linear-gradient(180deg, #0f172a, #1e293b)", transition: "0.3s", position: "fixed", left: 0, top: 0, height: "100%", zIndex: 100 }}>
        <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "24px" }}>💊</span>
            {sidebarOpen && <span style={{ color: "white", fontWeight: "bold" }}>PharmaChain</span>}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "18px" }}>☰</button>
        </div>
        
        <nav style={{ padding: "16px" }}>
          <button onClick={() => setActiveTab("dashboard")} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: "8px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "12px", background: activeTab === "dashboard" ? "rgba(255,255,255,0.1)" : "transparent", color: activeTab === "dashboard" ? "white" : "#94a3b8", border: "none", cursor: "pointer" }}>
            <span>📊</span> {sidebarOpen && <span>Dashboard</span>}
          </button>
          
          {user?.role === "manufacturer" && user?.status === "approved" && (
            <button onClick={() => setActiveTab("create")} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: "8px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "12px", background: activeTab === "create" ? "rgba(255,255,255,0.1)" : "transparent", color: activeTab === "create" ? "white" : "#94a3b8", border: "none", cursor: "pointer" }}>
              <span>➕</span> {sidebarOpen && <span>Create Medicine</span>}
            </button>
          )}
          
          {user?.role === "patient" && (
            <button onClick={() => setActiveTab("verify")} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: "8px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "12px", background: activeTab === "verify" ? "rgba(255,255,255,0.1)" : "transparent", color: activeTab === "verify" ? "white" : "#94a3b8", border: "none", cursor: "pointer" }}>
              <span>🔍</span> {sidebarOpen && <span>Verify Medicine</span>}
            </button>
          )}
          
          {user?.role === "pharmacy" && user?.status === "approved" && (
            <button onClick={() => setActiveTab("dispense")} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: "8px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "12px", background: activeTab === "dispense" ? "rgba(255,255,255,0.1)" : "transparent", color: activeTab === "dispense" ? "white" : "#94a3b8", border: "none", cursor: "pointer" }}>
              <span>💊</span> {sidebarOpen && <span>Dispense</span>}
            </button>
          )}
          
          {(user?.role === "manufacturer" || user?.role === "pharmacy") && user?.status === "approved" && (
            <button onClick={() => setActiveTab("inventory")} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: "8px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "12px", background: activeTab === "inventory" ? "rgba(255,255,255,0.1)" : "transparent", color: activeTab === "inventory" ? "white" : "#94a3b8", border: "none", cursor: "pointer" }}>
              <span>📦</span> {sidebarOpen && <span>Inventory</span>}
            </button>
          )}
          
          {user?.role === "patient" && (
            <button onClick={() => setActiveTab("history")} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: "8px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "12px", background: activeTab === "history" ? "rgba(255,255,255,0.1)" : "transparent", color: activeTab === "history" ? "white" : "#94a3b8", border: "none", cursor: "pointer" }}>
              <span>📜</span> {sidebarOpen && <span>History</span>}
            </button>
          )}
          
          {user?.role === "admin" && (
            <>
              <button onClick={() => setActiveTab("admin")} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: "8px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "12px", background: activeTab === "admin" ? "rgba(255,255,255,0.1)" : "transparent", color: activeTab === "admin" ? "white" : "#94a3b8", border: "none", cursor: "pointer" }}>
                <span>🛡️</span> {sidebarOpen && <span>Admin Panel</span>}
              </button>
              <button onClick={() => setActiveTab("pending")} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: "8px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "12px", background: activeTab === "pending" ? "rgba(255,255,255,0.1)" : "transparent", color: activeTab === "pending" ? "white" : "#94a3b8", border: "none", cursor: "pointer" }}>
                <span>⏳</span> {sidebarOpen && <span>Pending Approvals</span>}
                {pendingUsers.length > 0 && <span style={{ marginLeft: "auto", background: "#ef4444", color: "white", fontSize: "10px", padding: "2px 6px", borderRadius: "10px" }}>{pendingUsers.length}</span>}
              </button>
            </>
          )}
          
          <button onClick={() => setActiveTab("settings")} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: "8px", marginBottom: "4px", marginTop: "20px", display: "flex", alignItems: "center", gap: "12px", background: activeTab === "settings" ? "rgba(255,255,255,0.1)" : "transparent", color: activeTab === "settings" ? "white" : "#94a3b8", border: "none", cursor: "pointer" }}>
            <span>⚙️</span> {sidebarOpen && <span>Settings</span>}
          </button>
          
          <button onClick={handleLogout} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: "8px", marginTop: "20px", display: "flex", alignItems: "center", gap: "12px", color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
            <span>🚪</span> {sidebarOpen && <span>Logout</span>}
          </button>
        </nav>
        
        <div style={{ position: "absolute", bottom: "20px", left: "20px", right: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", background: "linear-gradient(135deg, #3b82f6, #06b6d4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold" }}>{user?.name?.charAt(0) || "U"}</div>
            {sidebarOpen && <div><div style={{ color: "white", fontSize: "14px" }}>{user?.name}</div><div style={{ color: "#94a3b8", fontSize: "12px" }}>{user?.role}</div></div>}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div style={{ marginLeft: sidebarOpen ? "260px" : "80px", flex: 1, padding: "24px", transition: "0.3s" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1e293b" }}>
            {activeTab === "dashboard" && "Dashboard"}
            {activeTab === "create" && "Create Medicine"}
            {activeTab === "verify" && "Verify Medicine"}
            {activeTab === "dispense" && "Dispense Medicine"}
            {activeTab === "inventory" && "Inventory"}
            {activeTab === "history" && "Verification History"}
            {activeTab === "admin" && "Admin Panel"}
            {activeTab === "pending" && "Pending Approvals"}
            {activeTab === "settings" && "Settings"}
          </h1>
          <p style={{ color: "#64748b" }}>Welcome, {user?.name}</p>
        </div>
        
        {/* Dashboard - Admin */}
        {activeTab === "dashboard" && user?.role === "admin" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            <div style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}><p style={{ color: "#64748b" }}>Total Users</p><p style={{ fontSize: "32px", fontWeight: "bold" }}>{regularUsers.length}</p></div>
            <div style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}><p style={{ color: "#64748b" }}>Manufacturers</p><p style={{ fontSize: "32px", fontWeight: "bold" }}>{regularUsers.filter(u => u.role === "manufacturer").length}</p></div>
            <div style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}><p style={{ color: "#64748b" }}>Pharmacies</p><p style={{ fontSize: "32px", fontWeight: "bold" }}>{regularUsers.filter(u => u.role === "pharmacy").length}</p></div>
            <div style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}><p style={{ color: "#64748b" }}>Patients</p><p style={{ fontSize: "32px", fontWeight: "bold" }}>{regularUsers.filter(u => u.role === "patient").length}</p></div>
          </div>
        )}
        
        {/* Dashboard - Patient */}
        {activeTab === "dashboard" && user?.role === "patient" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            <div style={{ background: "white", borderRadius: "16px", padding: "20px" }}><p style={{ color: "#64748b" }}>Verified Medicines</p><p style={{ fontSize: "32px", fontWeight: "bold", color: "#10b981" }}>{stats.verified}</p></div>
            <div style={{ background: "white", borderRadius: "16px", padding: "20px" }}><p style={{ color: "#64748b" }}>Total Value</p><p style={{ fontSize: "32px", fontWeight: "bold", color: "#8b5cf6" }}>{stats.value.toLocaleString()} TZS</p></div>
          </div>
        )}
        
        {/* Dashboard - Manufacturer/Pharmacy */}
        {activeTab === "dashboard" && (user?.role === "manufacturer" || user?.role === "pharmacy") && user?.status === "approved" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            <div style={{ background: "white", borderRadius: "16px", padding: "20px" }}><p style={{ color: "#64748b" }}>Total Medicines</p><p style={{ fontSize: "32px", fontWeight: "bold" }}>{stats.total}</p></div>
            <div style={{ background: "white", borderRadius: "16px", padding: "20px" }}><p style={{ color: "#64748b" }}>Active Batches</p><p style={{ fontSize: "32px", fontWeight: "bold", color: "#10b981" }}>{stats.active}</p></div>
            <div style={{ background: "white", borderRadius: "16px", padding: "20px" }}><p style={{ color: "#64748b" }}>Total Value</p><p style={{ fontSize: "32px", fontWeight: "bold", color: "#8b5cf6" }}>{stats.value.toLocaleString()} TZS</p></div>
          </div>
        )}
        
        {/* Dashboard - Pending */}
        {activeTab === "dashboard" && user?.status === "pending" && (
          <div style={{ background: "#fef3c7", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
            <span style={{ fontSize: "48px" }}>⏳</span>
            <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#92400e", marginTop: "12px" }}>License Pending Verification</h3>
            <p style={{ color: "#92400e", marginTop: "8px" }}>Your license is being reviewed by an administrator.</p>
          </div>
        )}
        
        {/* Create Medicine */}
        {activeTab === "create" && (
          <div style={{ background: "white", borderRadius: "16px", padding: "24px", maxWidth: "500px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px" }}>New Medicine</h2>
            <input type="text" placeholder="Medicine Name" value={medName} onChange={(e) => setMedName(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px", marginBottom: "12px" }} />
            <input type="text" placeholder="Batch Number" value={medBatch} onChange={(e) => setMedBatch(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px", marginBottom: "12px" }} />
            <input type="date" value={medExpiry} onChange={(e) => setMedExpiry(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px", marginBottom: "12px" }} />
            <input type="number" placeholder="Price (TZS)" value={medPrice} onChange={(e) => setMedPrice(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px", marginBottom: "20px" }} />
            <button onClick={createMedicine} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #3b82f6, #06b6d4)", color: "white", border: "none", borderRadius: "12px", fontWeight: "600", cursor: "pointer" }}>Create on Blockchain</button>
          </div>
        )}
        
        {/* Verify Medicine */}
        {activeTab === "verify" && (
          <div style={{ background: "white", borderRadius: "16px", padding: "24px", maxWidth: "500px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px" }}>Verify Medicine</h2>
            <input type="text" placeholder="Batch Number" value={scanBatch} onChange={(e) => setScanBatch(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px", marginBottom: "16px" }} />
            <button onClick={verifyMedicine} style={{ width: "100%", padding: "12px", background: "#10b981", color: "white", border: "none", borderRadius: "12px", fontWeight: "600", cursor: "pointer" }}>Verify</button>
            {verifyResult && (
              <div style={{ marginTop: "20px", padding: "16px", borderRadius: "12px", background: verifyResult.success ? "#dcfce7" : "#fee2e2", border: verifyResult.success ? "1px solid #bbf7d0" : "1px solid #fecaca" }}>
                {verifyResult.success ? (
                  <>
                    <div style={{ textAlign: "center", fontSize: "32px" }}>✅</div>
                    <h3 style={{ fontWeight: "bold", color: "#166534", textAlign: "center", marginTop: "8px" }}>Verified Genuine</h3>
                    <p style={{ marginTop: "8px" }}><strong>{verifyResult.medicine.name}</strong></p>
                    <p>Batch: {verifyResult.medicine.batchNo}</p>
                    <p>Manufacturer: {verifyResult.medicine.manufacturer}</p>
                    <p>Price: {verifyResult.medicine.price.toLocaleString()} TZS</p>
                  </>
                ) : (
                  <>
                    <div style={{ textAlign: "center", fontSize: "32px" }}>⚠️</div>
                    <h3 style={{ fontWeight: "bold", color: "#991b1b", textAlign: "center", marginTop: "8px" }}>Warning: Counterfeit</h3>
                    <p style={{ textAlign: "center" }}>This medicine cannot be verified.</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Dispense */}
        {activeTab === "dispense" && (
          <div>
            <div style={{ background: "white", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}>Select Medicine</h2>
              <input type="text" placeholder="Search by name or batch..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px", marginBottom: "16px" }} />
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {myMedicines.filter(m => m.status === "active").map(med => (
                  <div key={med.id} onClick={() => setSelectedMedicine(med)} style={{ padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px", marginBottom: "8px", cursor: "pointer", background: selectedMedicine?.id === med.id ? "#f3e8ff" : "white" }}>
                    <p style={{ fontWeight: "bold" }}>{med.name}</p>
                    <p style={{ fontSize: "12px", color: "#64748b" }}>Batch: {med.batchNo}</p>
                    <p style={{ fontSize: "12px", color: "#64748b" }}>Expiry: {new Date(med.expiryDate).toLocaleDateString()}</p>
                    <p style={{ fontWeight: "bold", color: "#10b981" }}>{med.price.toLocaleString()} TZS</p>
                  </div>
                ))}
                {myMedicines.filter(m => m.status === "active").length === 0 && <p style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>No medicines available</p>}
              </div>
            </div>
            {selectedMedicine && (
              <div style={{ background: "white", borderRadius: "16px", padding: "24px" }}>
                <h3 style={{ fontWeight: "bold", marginBottom: "16px" }}>Patient Information</h3>
                <input type="text" placeholder="Patient Name" value={patientName} onChange={(e) => setPatientName(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px", marginBottom: "16px" }} />
                <button onClick={dispenseMedicine} style={{ width: "100%", padding: "12px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "12px", fontWeight: "600", cursor: "pointer" }}>Confirm Dispense</button>
              </div>
            )}
          </div>
        )}
        
        {/* Inventory */}
        {activeTab === "inventory" && (
          <div style={{ background: "white", borderRadius: "16px", padding: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}>Inventory</h2>
            {myMedicines.length === 0 ? <p style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>No medicines in inventory</p> : (
              myMedicines.map(med => (
                <div key={med.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderBottom: "1px solid #e2e8f0" }}>
                  <div><p style={{ fontWeight: "bold" }}>{med.name}</p><p style={{ fontSize: "12px", color: "#64748b" }}>Batch: {med.batchNo} | Expiry: {new Date(med.expiryDate).toLocaleDateString()}</p></div>
                  <div><span style={{ padding: "4px 8px", background: "#dcfce7", borderRadius: "20px", fontSize: "12px" }}>{med.status}</span><p style={{ fontWeight: "bold", marginTop: "4px" }}>{med.price.toLocaleString()} TZS</p></div>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* History */}
        {activeTab === "history" && (
          <div style={{ background: "white", borderRadius: "16px", padding: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}>Verification History</h2>
            {verified.length === 0 ? <p style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>No verification history</p> : (
              medicines.filter(m => verified.includes(m.id)).map(med => (
                <div key={med.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderBottom: "1px solid #e2e8f0" }}>
                  <div><p style={{ fontWeight: "bold" }}>{med.name}</p><p style={{ fontSize: "12px", color: "#64748b" }}>Batch: {med.batchNo}</p></div>
                  <div><span style={{ color: "#10b981" }}>✓ Verified</span><p style={{ fontSize: "10px", color: "#94a3b8" }}>{new Date(med.createdAt).toLocaleDateString()}</p></div>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* Admin Panel */}
        {activeTab === "admin" && (
          <div style={{ background: "white", borderRadius: "16px", padding: "24px", overflowX: "auto" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}>User Management</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f8fafc" }}>
                <tr><th style={{ padding: "12px", textAlign: "left" }}>Name</th><th style={{ padding: "12px", textAlign: "left" }}>Email</th><th style={{ padding: "12px", textAlign: "left" }}>Role</th><th style={{ padding: "12px", textAlign: "left" }}>License</th><th style={{ padding: "12px", textAlign: "left" }}>Status</th><th style={{ padding: "12px", textAlign: "left" }}>Action</th></tr>
              </thead>
              <tbody>
                {regularUsers.map(u => (
                  <tr key={u.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px" }}>{u.name}</td>
                    <td style={{ padding: "12px" }}>{u.email}</td>
                    <td style={{ padding: "12px", textTransform: "capitalize" }}>{u.role}</td>
                    <td style={{ padding: "12px", fontSize: "12px", fontFamily: "monospace" }}>{u.license || "-"}</td>
                    <td style={{ padding: "12px" }}><span style={{ padding: "4px 8px", borderRadius: "20px", fontSize: "12px", background: u.status === "approved" ? "#dcfce7" : "#fef3c7", color: u.status === "approved" ? "#166534" : "#92400e" }}>{u.status}</span></td>
                    <td style={{ padding: "12px" }}><button onClick={() => deleteUser(u.id)} style={{ padding: "6px 12px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pending Approvals */}
        {activeTab === "pending" && (
          <div style={{ background: "white", borderRadius: "16px", padding: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}>License Verification Requests</h2>
            {pendingUsers.length === 0 ? <p style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>No pending requests</p> : (
              pendingUsers.map(u => (
                <div key={u.id} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                  <p style={{ fontWeight: "bold", fontSize: "16px" }}>{u.name}</p>
                  <p style={{ fontSize: "14px", color: "#64748b" }}>{u.email} | {u.phone}</p>
                  <p><span style={{ padding: "2px 8px", background: "#fef3c7", borderRadius: "20px", fontSize: "12px" }}>{u.role}</span></p>
                  <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginTop: "12px" }}>
                    <p><strong>License Number:</strong> {u.license || "Not provided"}</p>
                    <p><strong>Business Name:</strong> {u.business || "Not provided"}</p>
                    <p><strong>Submitted:</strong> {new Date(u.createdAt).toLocaleString()}</p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                    <button onClick={() => approveUser(u.id)} style={{ padding: "6px 16px", background: "#10b981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>Approve</button>
                    <button onClick={() => rejectUser(u.id)} style={{ padding: "6px 16px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* Settings */}
        {activeTab === "settings" && (
          <div style={{ background: "white", borderRadius: "16px", padding: "24px", maxWidth: "500px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px" }}>Profile Settings</h2>
            <div style={{ marginBottom: "16px" }}><label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Full Name</label><input type="text" defaultValue={user?.name} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px" }} /></div>
            <div style={{ marginBottom: "16px" }}><label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Email</label><input type="email" defaultValue={user?.email} disabled style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#f1f5f9" }} /></div>
            <div style={{ marginBottom: "16px" }}><label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Phone</label><input type="tel" defaultValue={user?.phone} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px" }} /></div>
            <button style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #3b82f6, #06b6d4)", color: "white", border: "none", borderRadius: "12px", fontWeight: "600", cursor: "pointer" }}>Save Changes</button>
          </div>
        )}
      </div>
    </div>
  );
}