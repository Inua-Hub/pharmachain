"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/app/lib/api";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const result = await api.validateResetToken(token);
      setValid(result.valid);
      setValidating(false);
      if (!result.valid) {
        setMessage("❌ Invalid or expired reset link. Please request a new one.");
      }
    } catch (error) {
      setValid(false);
      setValidating(false);
      setMessage("❌ Error validating reset link");
    }
  };

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      setMessage("❌ Please fill all fields");
      return;
    }
    if (newPassword.length < 6) {
      setMessage("❌ Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("❌ Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const result = await api.resetPassword(token, newPassword);
      
      if (result.success) {
        setMessage("✅ Password reset successfully! Redirecting to login...");
        setTimeout(() => router.push('/'), 3000);
      } else {
        setMessage(`❌ ${result.message || "Failed to reset password"}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating your reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💊</span>
          </div>
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-gray-500">Enter your new password below</p>
        </div>

        {valid ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                placeholder="Min 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                placeholder="Confirm your password"
              />
            </div>
            {message && (
              <div className={`p-3 rounded-xl text-sm ${message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message}
              </div>
            )}
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-600">{message}</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}