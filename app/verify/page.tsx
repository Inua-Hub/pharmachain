"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeGenerator } from "../components";

export default function VerifyPage() {
  const router = useRouter();
  const [batchNo, setBatchNo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!batchNo) {
      alert("Please enter a batch number");
      return;
    }
    router.push(`/verify/${batchNo}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Verify Medicine</h1>
          <p className="text-gray-600 mt-2">Enter batch number or scan QR code to verify</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-300">
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                <span className="text-4xl">📷</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Scan QR code from medicine packaging</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
              <input
                type="text"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value.toUpperCase())}
                placeholder="Enter batch number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-70 font-medium"
            >
              {loading ? "Verifying..." : "Verify Medicine"}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Return Home
          </button>
        </div>
      </div>
    </div>
  );
}