"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Package, Plus, QrCode, Send, TrendingUp } from "lucide-react";

interface Medicine {
  id: number;
  name: string;
  batchNo: string;
  expiryDate: string;
  price: number;
  status: "active" | "transferred" | "dispensed";
  qrCode: string;
}

export default function ManufacturerDashboard() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [newMedicine, setNewMedicine] = useState({
    name: "",
    batchNo: "",
    expiryDate: "",
    price: 0,
  });

  const createMedicine = async () => {
    const medicine: Medicine = {
      id: Date.now(),
      ...newMedicine,
      status: "active",
      qrCode: `https://pharmachain.vercel.app/verify/${newMedicine.batchNo}`,
    };
    
    setMedicines([...medicines, medicine]);
    
    // Simulate blockchain transaction
    toast.success(`Medicine ${medicine.name} created on blockchain!`);
    setNewMedicine({ name: "", batchNo: "", expiryDate: "", price: 0 });
  };

  const transferMedicine = (id: number) => {
    setMedicines(medicines.map(m => 
      m.id === id ? { ...m, status: "transferred" } : m
    ));
    toast.success("Medicine transferred to distributor");
  };

  const stats = {
    total: medicines.length,
    active: medicines.filter(m => m.status === "active").length,
    transferred: medicines.filter(m => m.status === "transferred").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-72 bg-gradient-to-b from-blue-900 to-blue-950 min-h-screen p-6">
          <div className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
            <Package className="h-6 w-6" />
            PharmaChain
          </div>
          
          <nav className="space-y-2">
            {["Dashboard", "Create Medicine", "My Medicines", "Reports", "Settings"].map((item) => (
              <Button key={item} variant="ghost" className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10">
                {item}
              </Button>
            ))}
            <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-400 hover:bg-red-500/10 mt-20">
              Logout
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Manufacturer Dashboard</h1>
              <p className="text-gray-500">Manage your pharmaceutical products</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  New Medicine
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Create New Medicine on Blockchain</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Medicine Name</Label>
                    <Input 
                      value={newMedicine.name}
                      onChange={(e) => setNewMedicine({...newMedicine, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Batch Number</Label>
                    <Input 
                      value={newMedicine.batchNo}
                      onChange={(e) => setNewMedicine({...newMedicine, batchNo: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Expiry Date</Label>
                    <Input 
                      type="date"
                      value={newMedicine.expiryDate}
                      onChange={(e) => setNewMedicine({...newMedicine, expiryDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Price (TZS)</Label>
                    <Input 
                      type="number"
                      value={newMedicine.price}
                      onChange={(e) => setNewMedicine({...newMedicine, price: Number(e.target.value)})}
                    />
                  </div>
                  <Button onClick={createMedicine} className="w-full">
                    Create on Blockchain
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500">Total Medicines</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500">Active Batches</p>
                    <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500">Transferred</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.transferred}</p>
                  </div>
                  <Send className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Medicines Table */}
          <Card>
            <CardHeader>
              <CardTitle>Medicine Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine Name</TableHead>
                    <TableHead>Batch No</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>QR Code</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines.map((med) => (
                    <TableRow key={med.id}>
                      <TableCell className="font-medium">{med.name}</TableCell>
                      <TableCell>{med.batchNo}</TableCell>
                      <TableCell>{med.expiryDate}</TableCell>
                      <TableCell>{med.price.toLocaleString()} TZS</TableCell>
                      <TableCell>
                        <Badge variant={med.status === "active" ? "default" : "secondary"}>
                          {med.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <QrCode className="h-4 w-4 mr-1" />
                              Show QR
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <div className="text-center">
                              <div className="bg-white p-4 inline-block rounded-lg mb-4">
                                {/* QR code would render here */}
                                <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                                  QR: {med.batchNo}
                                </div>
                              </div>
                              <p className="text-sm text-gray-500">Scan to verify medicine</p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          onClick={() => transferMedicine(med.id)}
                          disabled={med.status !== "active"}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Transfer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}