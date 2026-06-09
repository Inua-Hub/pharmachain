"use client";

import { useState, useEffect } from "react";
import { History, Package, ExternalLink, Clock, Hash } from "lucide-react";

export default function TransactionsPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedMedicines = localStorage.getItem("medicines");
    if (savedMedicines) setMedicines(JSON.parse(savedMedicines));
    const savedUser = localStorage.getItem("pharmaUser");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const getTransactions = () => {
    let txs: any[] = [];
    medicines.forEach(m => {
      txs.push({
        id: m.id,
        type: "CREATE",
        medicine: m.name,
        batch: m.batchNo,
        hash: m.txHash || `0x${Math.random().toString(36).substring(2, 10)}`,
        timestamp: m.createdAt || new Date().toISOString(),
        status: "confirmed"
      });
    });
    return txs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const transactions = getTransactions();

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>
        <p className="text-gray-500 text-sm mt-1">View all blockchain transactions</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Total {transactions.length} transactions</span>
          <span className="text-xs text-gray-400">Blockchain: Active</span>
        </div>
        <div className="divide-y divide-gray-100">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              No transactions yet
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{tx.medicine}</p>
                      <div className="flex gap-3 text-xs text-gray-500 mt-1">
                        <span>Batch: {tx.batch}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(tx.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">{tx.status}</span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </div>
                    <p className="text-xs font-mono text-gray-400 mt-1">{tx.hash}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}