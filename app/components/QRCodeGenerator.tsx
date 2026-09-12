"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { Download, Copy, Check, X, Printer, RefreshCw, Eye } from "lucide-react";
import api from "../lib/api";

interface QRCodeGeneratorProps {
  batchNo: string;
  medicineName: string;
  manufacturer: string;
  expiryDate: string;
  status?: string;
  currentOwner?: string;
  size?: number;
  onScan?: () => void;
  canDownload?: boolean;
}

export default function QRCodeGenerator({
  batchNo,
  medicineName,
  manufacturer,
  expiryDate,
  status = "unknown",
  currentOwner = "Unknown",
  size = 200,
  onScan,
  canDownload = false
}: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [currentData, setCurrentData] = useState({
    batchNo,
    name: medicineName,
    manufacturer,
    expiryDate,
    status,
    currentOwner,
    verifyUrl: `${window.location.origin}/verify/${batchNo}`
  });

  const fetchLatestData = async () => {
    setIsRefreshing(true);
    try {
      const result = await api.getMedicineByBatch(batchNo);
      if (result.success) {
        const med = result.medicine;
        setCurrentData({
          batchNo: med.batchNo,
          name: med.name,
          manufacturer: med.manufacturer,
          expiryDate: med.expiryDate,
          status: med.status,
          currentOwner: med.currentOwner || "Unknown",
          verifyUrl: `${window.location.origin}/verify/${med.batchNo}`
        });
      }
    } catch (error) {
      console.error("Error fetching latest data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      fetchLatestData();
      const interval = setInterval(fetchLatestData, 30000);
      return () => clearInterval(interval);
    }
  }, [showModal, batchNo]);

  const handleDownload = async () => {
    if (!canDownload) {
      alert("Only manufacturers can download QR codes.");
      return;
    }
    const svg = document.getElementById(`qr-${batchNo}`);
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const png = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `QR-${batchNo}.png`;
        link.href = png;
        link.click();
      };
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;
    }
  };

  const handleCopy = async () => {
    const data = JSON.stringify(currentData);
    await navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (!canDownload) {
      alert("Only manufacturers can print QR codes.");
      return;
    }
    window.print();
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const result = await api.getMedicineByBatch(batchNo);
      if (result.success) {
        setVerificationResult(result);
        setShowEmailPrompt(true);
      } else {
        alert("Medicine not found. Please verify the batch number.");
      }
    } catch (error) {
      alert("Error verifying medicine");
      console.error(error);
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

    setLoading(true);
    try {
      const result = await api.verifyMedicine(batchNo, email);
      if (result.success) {
        setEmailSent(true);
        alert(`Verification report has been sent to ${email}`);
        if (onScan) onScan();
      } else {
        alert("Failed to send verification email");
      }
    } catch (error) {
      alert("Error sending email");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const qrValue = JSON.stringify(currentData);

  return (
    <>
      <div 
        onClick={() => setShowModal(true)}
        className="cursor-pointer hover:opacity-80 transition relative inline-block"
        title={canDownload ? "Click to view and download QR code" : "Click to view QR code"}
      >
        <QRCode
          id={`qr-${batchNo}`}
          value={qrValue}
          size={size}
          bgColor="#ffffff"
          fgColor="#000000"
          level="H"
        />
        {isRefreshing && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {canDownload ? "QR Code Management" : "Medicine Verification"}
              </h3>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setShowEmailPrompt(false);
                  setVerificationResult(null);
                  setEmailSent(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-200 relative">
                <QRCode
                  value={qrValue}
                  size={280}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="H"
                />
                {isRefreshing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                )}
                <button
                  onClick={fetchLatestData}
                  className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1 hover:bg-blue-700 transition"
                  title="Refresh data"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-1">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Medicine:</span>
                <span className="font-semibold">{currentData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Batch Number:</span>
                <span className="font-mono">{currentData.batchNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Manufacturer:</span>
                <span>{currentData.manufacturer}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Current Owner:</span>
                <span className="text-blue-600 font-medium">{currentData.currentOwner}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  currentData.status === 'dispensed' ? 'bg-green-100 text-green-800' :
                  currentData.status === 'tmda_approved' ? 'bg-blue-100 text-blue-800' :
                  currentData.status === 'listed' ? 'bg-purple-100 text-purple-800' :
                  currentData.status === 'sold_to_distributor' ? 'bg-orange-100 text-orange-800' :
                  currentData.status === 'sold_to_pharmacy' ? 'bg-teal-100 text-teal-800' :
                  currentData.status === 'msd_allocated' ? 'bg-indigo-100 text-indigo-800' :
                  currentData.status === 'manufactured' ? 'bg-gray-100 text-gray-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {currentData.status?.replace(/_/g, ' ').toUpperCase() || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Expiry Date:</span>
                <span>{new Date(currentData.expiryDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {canDownload && (
                <>
                  <button
                    onClick={handleDownload}
                    className="flex-1 min-w-[80px] px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex-1 min-w-[80px] px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                </>
              )}
              <button
                onClick={handleCopy}
                className="flex-1 min-w-[80px] px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2 text-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={handleVerify}
                disabled={loading}
                className="flex-1 min-w-[80px] px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 text-sm disabled:opacity-70"
              >
                <Eye className="w-4 h-4" />
                {loading ? "Verifying..." : "Verify"}
              </button>
            </div>

            {!canDownload && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700 text-center">
                  Only the manufacturer can download and print this QR code for product labeling.
                </p>
              </div>
            )}

            {showEmailPrompt && verificationResult && !emailSent && (
              <div className="mt-4 p-4 border-2 border-purple-200 rounded-lg bg-purple-50">
                <h4 className="font-semibold text-purple-800 mb-2">Get Detailed Report</h4>
                <p className="text-sm text-purple-700 mb-3">
                  Enter your email to receive a complete verification report.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleSendEmail}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-70"
                  >
                    {loading ? "Sending..." : "Send Report"}
                  </button>
                </div>
                <p className="text-xs text-purple-500 mt-2">
                  Your email will only be used for this verification report.
                </p>
              </div>
            )}

            {emailSent && (
              <div className="mt-4 p-4 border-2 border-green-200 rounded-lg bg-green-50">
                <p className="text-green-800 font-medium">Verification report sent to {email}</p>
                <p className="text-sm text-green-600 mt-1">Check your inbox for detailed information.</p>
              </div>
            )}

            {verificationResult && !showEmailPrompt && (
              <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                <h4 className="font-semibold mb-2">Verification Result</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-green-600 font-medium">Verified</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">TMDA Approved:</span>
                    <span>{verificationResult.medicine?.tmdaApproved ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Blockchain Verified:</span>
                    <span>{verificationResult.blockchain?.isValid ? 'Yes' : 'No'}</span>
                  </div>
                  {verificationResult.timeline && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600">View Supply Chain Timeline</summary>
                      <div className="mt-2 max-h-40 overflow-y-auto">
                        {verificationResult.timeline.map((item: any, idx: number) => (
                          <div key={idx} className="border-b border-gray-100 py-1 text-xs">
                            <span className="font-medium">{item.role}</span> - {item.owner}
                            <br />
                            <span className="text-gray-500">{new Date(item.date).toLocaleString()}</span>
                            <br />
                            <span className="text-gray-600">{item.note}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            )}

            <div className="text-center text-xs text-gray-400 mt-4">
              Scan this QR code to verify medicine authenticity
            </div>
          </div>
        </div>
      )}
    </>
  );
}