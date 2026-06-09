"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, Calendar, Building2, DollarSign } from "lucide-react";

export default function VerifyMedicine() {
  const { batchId } = useParams();
  
  // Fetch from blockchain in production
  const medicineData = {
    verified: true,
    name: "Paracetamol 500mg",
    batchNo: batchId,
    manufacturer: "Tanzania Pharmaceutical Ltd",
    manufacturedDate: "2025-01-15",
    expiryDate: "2027-01-14",
    price: "5,000 TZS",
    journey: [
      { step: "Manufactured", date: "2025-01-15", location: "Dar es Salaam", status: "completed" },
      { step: "Distributed", date: "2025-01-20", location: "MSD Central Warehouse", status: "completed" },
      { step: "Received by Pharmacy", date: "2025-01-25", location: "City Pharmacy - Dar es Salaam", status: "completed" },
      { step: "Dispensed to Patient", date: "2025-02-01", location: "Patient", status: "current" },
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-3xl mx-auto">
        <Card className="border-green-200 shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16" />
            </div>
            <CardTitle className="text-2xl">Medicine Verified ✓</CardTitle>
            <p className="text-green-100">This medicine is authentic and safe</p>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Medicine</p>
                  <p className="font-semibold">{medicineData.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Manufacturer</p>
                  <p className="font-semibold">{medicineData.manufacturer}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Batch No / Expiry</p>
                  <p className="font-semibold">{medicineData.batchNo} / {medicineData.expiryDate}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-semibold">{medicineData.price}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Supply Chain Journey</h3>
              <div className="space-y-0">
                {medicineData.journey.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full ${step.status === "completed" ? "bg-green-500" : "bg-blue-500"}`} />
                      {idx < medicineData.journey.length - 1 && (
                        <div className="w-0.5 h-12 bg-gray-300" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-medium">{step.step}</p>
                      <p className="text-sm text-gray-500">{step.date} • {step.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full bg-green-600 hover:bg-green-700">
              Report Issue (If counterfeit)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}