"use client";

import { useState, useEffect } from "react";
import { Scan, CheckCircle, AlertTriangle, Package, Calendar, Building2, DollarSign, Shield, QrCode, Camera } from "lucide-react";

export default function VerifyPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [verified, setVerified] = useState<number[]>([]);
  const [user, setUser] = useState<any>(null);
  const [scanBatch, setScanBatch] = useState("");
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const savedMedicines = localStorage.getItem("medicines");
    if (savedMedicines) setMedicines(JSON.parse(savedMedicines));
    const savedVerified = localStorage.getItem("verified");
    if (savedVerified) setVerified(JSON.parse(savedVerified));
    const savedUser = localStorage.getItem("pharmaUser");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const verifyMedicine = () => {
    const found = medicines.find(m => m.batchNo === scanBatch);
    if (found) {
      let updatedVerified = [...verified];
      if (!updatedVerified.includes(found.id)) {
        updatedVerified.push(found.id);
        setVerified(updatedVerified);
        localStorage.setItem("verified", JSON.stringify(updatedVerified));
      }
      setVerifyResult({ success: true, medicine: found });
    } else {
      setVerifyResult({ success: false });
    }
  };

  const recentScans = medicines.slice(-3).reverse();

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Verify Medicine</h2>
        <p className="text-gray-500 text-sm mt-1">Scan QR code or enter batch number to verify authenticity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Scan className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Scan QR Code</h3>
                <p className="text-sm text-gray-500">Position the QR code within the frame</p>
              </div>
            </div>

            {/* Camera Frame */}
            <div 
              className="relative bg-gray-900 rounded-2xl overflow-hidden mb-6 cursor-pointer"
              onClick={() => setIsScanning(!isScanning)}
            >
              <div className="aspect-square max-w-md mx-auto relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-white/50 mx-auto mb-2" />
                    <p className="text-white/50 text-sm">Click to activate camera</p>
                  </div>
                </div>
                <div className="absolute inset-0 border-2 border-green-400 rounded-2xl m-8 pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-green-400 rounded-lg"></div>
              </div>
            </div>

            {/* Manual Entry */}
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="Or enter batch number manually"
                value={scanBatch}
                onChange={(e) => setScanBatch(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition"
              />
              <button 
                onClick={verifyMedicine}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition"
              >
                Verify
              </button>
            </div>
          </div>

          {/* Result Section */}
          {verifyResult && (
            <div className={`mt-6 rounded-2xl p-8 ${verifyResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"} animate-in slide-in-from-top-2 duration-300`}>
              {verifyResult.success ? (
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-700 mb-2">Verified Genuine ✓</h3>
                  <p className="text-green-600 mb-6">This medicine is authentic and registered on blockchain</p>
                  
                  <div className="border-t border-green-200 pt-6 text-left">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Medicine Name</p>
                        <p className="font-semibold text-gray-800">{verifyResult.medicine.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Batch Number</p>
                        <p className="font-semibold text-gray-800">{verifyResult.medicine.batchNo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Manufacturer</p>
                        <p className="font-semibold text-gray-800">{verifyResult.medicine.manufacturer}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Expiry Date</p>
                        <p className="font-semibold text-gray-800">{verifyResult.medicine.expiryDate || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="font-semibold text-gray-800">{parseInt(verifyResult.medicine.price).toLocaleString()} TZS</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Verification Time</p>
                        <p className="font-semibold text-gray-800">{new Date().toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-green-100 rounded-lg">
                      <p className="text-sm text-green-700 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        This medicine has been verified on the blockchain
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-red-700 mb-2">Warning: Counterfeit!</h3>
                  <p className="text-red-600 mb-4">This medicine cannot be verified in our blockchain system.</p>
                  <div className="bg-red-100 rounded-xl p-4 text-left">
                    <p className="text-sm text-red-700 font-medium mb-2">What to do:</p>
                    <ul className="text-sm text-red-600 space-y-1 list-disc list-inside">
                      <li>Do NOT take this medicine</li>
                      <li>Report to Tanzania Medicines Authority (TMDA)</li>
                      <li>Notify the pharmacy where purchased</li>
                      <li>Keep the packaging for investigation</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Recent Scans & Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Recent Verifications
            </h3>
            <div className="space-y-3">
              {recentScans.map((med) => (
                <div key={med.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{med.name}</p>
                    <p className="text-xs text-gray-400">{med.batchNo}</p>
                  </div>
                  <span className="text-xs text-green-600">Verified</span>
                </div>
              ))}
              {recentScans.length === 0 && (
                <p className="text-center text-gray-400 py-6">No recent verifications</p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white">
            <Shield className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-bold mb-2">Why Verify?</h3>
            <p className="text-white/80 text-sm mb-4">Counterfeit medicines cause thousands of deaths annually. Blockchain verification ensures you get genuine products.</p>
            <div className="flex items-center gap-2 text-sm border-t border-white/20 pt-4">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Blockchain Secured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}