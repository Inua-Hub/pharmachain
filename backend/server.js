const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB Error:', err));

// ==================== MODELS ====================

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['manufacturer', 'distributor', 'pharmacy', 'patient', 'admin'], default: 'patient' },
  status: { type: String, enum: ['active', 'banned'], default: 'active' },
  subscription: {
    plan: { type: String, enum: ['free', 'basic', 'standard', 'enterprise'], default: 'free' },
    expiresAt: { type: Date, default: null }
  },
  createdAt: { type: Date, default: Date.now }
});

const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  batchNo: { type: String, required: true, unique: true },
  manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  manufacturerName: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  status: { type: String, enum: ['active', 'transferred', 'dispensed'], default: 'active' },
  currentOwner: { type: String },
  txHash: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const PaymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  plan: { type: String, required: true },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  dueDate: { type: Date, required: true },
  paidAt: { type: Date },
  txHash: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Medicine = mongoose.model('Medicine', MedicineSchema);
const Payment = mongoose.model('Payment', PaymentSchema);

// ==================== MIDDLEWARE ====================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') next();
  else res.status(403).json({ message: 'Admin only' });
};

// ==================== AUTH ROUTES ====================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = await User.create({
      name, email, phone, password: hashedPassword, role: role || 'patient'
    });
    
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name, email, phone, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.status === 'banned') return res.status(401).json({ message: 'Account banned' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    
    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/auth/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// ==================== MEDICINE ROUTES ====================

app.post('/api/medicines/create', protect, async (req, res) => {
  try {
    if (req.user.role !== 'manufacturer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only manufacturers can create medicines' });
    }
    const { name, batchNo, expiryDate, price, quantity } = req.body;
    const existing = await Medicine.findOne({ batchNo });
    if (existing) return res.status(400).json({ message: 'Batch number exists' });
    
    const medicine = await Medicine.create({
      name, batchNo: batchNo.toUpperCase(), manufacturer: req.user._id,
      manufacturerName: req.user.name, expiryDate, price, quantity: quantity || 1,
      currentOwner: req.user.name, txHash: `0x${Math.random().toString(36).substring(2, 15)}`
    });
    res.status(201).json({ success: true, medicine });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/medicines', protect, async (req, res) => {
  try {
    let medicines;
    if (req.user.role === 'manufacturer') {
      medicines = await Medicine.find({ manufacturer: req.user._id });
    } else if (req.user.role === 'pharmacy') {
      medicines = await Medicine.find({ status: 'active' });
    } else {
      medicines = await Medicine.find({});
    }
    res.json({ success: true, medicines });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/medicines/verify', protect, async (req, res) => {
  try {
    const { batchNo } = req.body;
    const medicine = await Medicine.findOne({ batchNo: batchNo.toUpperCase() });
    if (!medicine) {
      return res.json({ success: true, verified: false, message: 'Medicine not found - Possible counterfeit!' });
    }
    res.json({
      success: true, verified: true,
      medicine: {
        name: medicine.name, batchNo: medicine.batchNo,
        manufacturer: medicine.manufacturerName, expiryDate: medicine.expiryDate,
        price: medicine.price, status: medicine.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/medicines/dispense', protect, async (req, res) => {
  try {
    if (req.user.role !== 'pharmacy') {
      return res.status(403).json({ message: 'Only pharmacies can dispense' });
    }
    const { medicineId, patientName } = req.body;
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    if (medicine.status !== 'active') return res.status(400).json({ message: 'Medicine not available' });
    
    medicine.status = 'dispensed';
    medicine.currentOwner = patientName;
    await medicine.save();
    
    res.json({ success: true, message: 'Medicine dispensed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== USER ROUTES (ADMIN) ====================

app.get('/api/users', protect, adminOnly, async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json({ success: true, users });
});

app.put('/api/users/:id/status', protect, adminOnly, async (req, res) => {
  const { status } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.status = status;
  await user.save();
  res.json({ success: true, message: `User ${status}` });
});

app.put('/api/users/:id/role', protect, adminOnly, async (req, res) => {
  const { role } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.role = role;
  await user.save();
  res.json({ success: true, message: 'Role updated' });
});

app.delete('/api/users/:id', protect, adminOnly, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.role === 'admin') return res.status(400).json({ message: 'Cannot delete admin' });
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted' });
});

// ==================== PAYMENT ROUTES ====================

app.post('/api/payments/create', protect, async (req, res) => {
  try {
    const { plan, amount } = req.body;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    
    const payment = await Payment.create({
      user: req.user._id, userName: req.user.name, userEmail: req.user.email,
      amount: amount || (plan === 'enterprise' ? 2500000 : plan === 'standard' ? 1500000 : 500000),
      plan, dueDate
    });
    res.status(201).json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/payments', protect, async (req, res) => {
  let payments;
  if (req.user.role === 'admin') {
    payments = await Payment.find({}).sort({ createdAt: -1 });
  } else {
    payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
  }
  res.json({ success: true, payments });
});

app.post('/api/payments/:id/confirm', protect, adminOnly, async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ message: 'Payment not found' });
  payment.status = 'paid';
  payment.paidAt = Date.now();
  await payment.save();
  
  // Update user subscription
  const user = await User.findById(payment.user);
  if (user) {
    user.subscription = { plan: payment.plan, expiresAt: new Date(Date.now() + 30*24*60*60*1000) };
    await user.save();
  }
  res.json({ success: true, message: 'Payment confirmed' });
});

app.get('/api/payments/overdue', protect, adminOnly, async (req, res) => {
  const overdue = await Payment.find({ status: 'pending', dueDate: { $lt: new Date() } });
  res.json({ success: true, overdue });
});

// ==================== ADMIN ROUTES ====================

app.get('/api/admin/dashboard', protect, adminOnly, async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalMedicines = await Medicine.countDocuments();
  const paidPayments = await Payment.find({ status: 'paid' });
  const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = await Payment.find({ status: 'pending' });
  const pendingRevenue = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  
  res.json({
    success: true,
    stats: { totalUsers, totalMedicines, totalRevenue, pendingRevenue },
    systemHealth: { uptime: process.uptime(), status: 'operational' }
  });
});

app.post('/api/admin/broadcast', protect, adminOnly, async (req, res) => {
  const { subject, message, role } = req.body;
  let query = {};
  if (role && role !== 'all') query.role = role;
  const users = await User.find(query).select('email');
  res.json({ success: true, message: `Broadcast sent to ${users.length} users` });
});

app.post('/api/admin/sync-blockchain', protect, adminOnly, async (req, res) => {
  const medicines = await Medicine.find({});
  for (const med of medicines) {
    med.txHash = `0x${Math.random().toString(36).substring(2, 15)}`;
    await med.save();
  }
  res.json({ success: true, message: `Synced ${medicines.length} medicines` });
});

// ==================== CREATE DEFAULT ADMIN ====================

const createDefaultAdmin = async () => {
  const adminExists = await User.findOne({ email: 'admin@pharmachain.com' });
  if (!adminExists) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    await User.create({
      name: 'System Admin',
      email: 'admin@pharmachain.com',
      phone: '+255 888 123 456',
      password: hashedPassword,
      role: 'admin',
      status: 'active'
    });
    console.log('✅ Default admin created: admin@pharmachain.com / admin123');
  }
};

// ==================== START SERVER ====================

mongoose.connection.once('open', async () => {
  await createDefaultAdmin();
  console.log('📦 Database ready');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
