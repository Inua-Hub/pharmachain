"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "../../lib/api";
import QRCode from "react-qr-code";

interface MedicineData {
  id: string;
  name: string;
  batchNo: string;
  manufacturer: string;
  currentOwner: string;
  expiryDate: string;
  status: string;
  tmdaApproved: boolean;
  tmdaApprovalNumber?: string;
  quantity: number;
  createdAt: string;
}

interface TimelineItem {
  owner: string;
  role: string;
  date: string;
  note: string;
}

export default function VerifyBatchPage() {
  const params = useParams();
  const batchNo = params.batchNo as string;
  
  const [loading, setLoading] = useState(true);
  const [medicine, setMedicine] = useState<MedicineData | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [blockchainData, setBlockchainData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (batchNo) {
      fetchMedicineData();
    }
  }, [batchNo]);

  const fetchMedicineData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await api.getMedicineByBatch(batchNo);
      
      if (result.success) {
        setMedicine(result.medicine);
        setTimeline(result.timeline || []);
        setBlockchainData(result.blockchain || null);
      } else {
        setError(result.message || "Medicine not found");
      }
    } catch (error) {
      console.error("Error fetching medicine:", error);
      setError("Failed to fetch medicine data");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!email) {
      alert("Please enter your email address");
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      alert("Please enter a valid email address");
      return;
    }

    setSending(true);
    try {
      const result = await api.verifyMedicine(batchNo, email);
      if (result.success) {
        setEmailSent(true);
        alert(`Verification report has been sent to ${email}`);
      } else {
        alert("Failed to send verification email");
      }
    } catch (error) {
      alert("Error sending email");
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying medicine...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Medicine Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Please verify the batch number and try again.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">No Data Available</h1>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Medicine Verification</h1>
          <p className="text-gray-600 mt-2">Verify the authenticity of this pharmaceutical product</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* QR Code Section */}
          <div className="bg-gray-50 p-6 border-b border-gray-200 flex flex-col items-center">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <QRCode
                value={JSON.stringify({
                  batchNo: medicine.batchNo,
                  name: medicine.name,
                  manufacturer: medicine.manufacturer,
                  expiryDate: medicine.expiryDate,
                  status: medicine.status,
                  verifyUrl: `${window.location.origin}/verify/${medicine.batchNo}`
                })}
                size={160}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
              />
            </div>
            <p className="text-sm text-gray-500 mt-3">Scan this QR code again to verify</p>
          </div>

          {/* Medicine Details */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Medicine Name</p>
                <p className="font-semibold text-gray-900">{medicine.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Batch Number</p>
                <p className="font-mono font-semibold text-gray-900">{medicine.batchNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Manufacturer</p>
                <p className="font-semibold text-gray-900">{medicine.manufacturer}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Owner</p>
                <p className="font-semibold text-gray-900">{medicine.currentOwner}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Expiry Date</p>
                <p className="font-semibold text-gray-900">{new Date(medicine.expiryDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-semibold text-gray-900">{medicine.status.replace(/_/g, ' ').toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">TMDA Approved</p>
                <p className={`font-semibold ${medicine.tmdaApproved ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {medicine.tmdaApproved ? 'Yes' : 'Pending'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Quantity</p>
                <p className="font-semibold text-gray-900">{medicine.quantity} units</p>
              </div>
            </div>

            {blockchainData?.isValid && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-emerald-700 font-medium">Blockchain Verified</p>
                <p className="text-sm text-emerald-600 mt-1">
                  This medicine has been verified on the blockchain.
                </p>
              </div>
            )}

            {/* Timeline */}
            {timeline.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Supply Chain Timeline</h3>
                <div className="space-y-3">
                  {timeline.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-blue-600 text-xs font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.role}</p>
                        <p className="text-sm text-gray-600">{item.owner}</p>
                        <p className="text-xs text-gray-400">{new Date(item.date).toLocaleString()}</p>
                        <p className="text-sm text-gray-500 mt-1">{item.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Email Report Section */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Get Detailed Report</h3>
          <p className="text-sm text-gray-600 mb-4">
            Enter your email to receive a complete verification report with blockchain data.
          </p>
          
          {emailSent ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
              <p className="text-emerald-700 font-medium">Verification report sent!</p>
              <p className="text-sm text-emerald-600 mt-1">Check your inbox for detailed information.</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSendEmail}
                disabled={sending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-70 font-medium"
              >
                {sending ? "Sending..." : "Send Report"}
              </button>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Your email will only be used for this verification report.
          </p>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Return Home
          </button>
        </div>
      </div>
    </div>
  );
}