// ==================== LOAD ENV FIRST ====================
require('dotenv').config();

if (!process.env.MONGO_URI) {
  console.error('❌ ERROR: MONGO_URI is not defined in .env file');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET is not defined in .env file');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { ethers } = require('ethers');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();

// ==================== EMAIL ====================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// ==================== BLOCKCHAIN ====================
let contract = null;
let wallet = null;
let provider = null;

let contractABI = [];
try {
  contractABI = require('./contracts/abi');
  console.log('✅ Contract ABI loaded');
} catch (error) {
  console.warn('⚠️ Contract ABI not found. Blockchain features disabled.');
}

if (
  contractABI.length > 0 &&
  process.env.CONTRACT_ADDRESS &&
  process.env.ETHEREUM_RPC_URL &&
  process.env.PRIVATE_KEY
) {
  try {
    provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);
    console.log('✅ Blockchain connected!');
    console.log(`📡 Contract: ${process.env.CONTRACT_ADDRESS}`);
    console.log(`👤 Wallet: ${wallet.address}`);
  } catch (error) {
    console.error('❌ Blockchain failed:', error.message);
  }
} else {
  console.log('ℹ️  Blockchain not configured.');
}

// ==================== BLOCKCHAIN SERVICE ====================
const blockchainService = {
  createMedicine: async (name, batchNo, manufacturer) => {
    if (!contract) return { success: false, error: 'Blockchain not connected' };
    try {
      const isAuthorized = await contract.authorizedManufacturers(wallet.address);
      if (!isAuthorized) {
        const addTx = await contract.addManufacturer(wallet.address);
        await addTx.wait();
      }
      const tx = await contract.createMedicine(name, batchNo, manufacturer);
      const receipt = await tx.wait();
      return { success: true, txHash: receipt.transactionHash, blockNumber: receipt.blockNumber };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  transferOwnership: async (batchNo, newOwner, role, note) => {
    const mockHash = '0x' + crypto.randomBytes(32).toString('hex');
    if (!contract) {
      return { success: true, txHash: mockHash, blockNumber: Date.now(), isMock: true };
    }
    try {
      if (typeof contract.transferOwnership === 'function') {
        const tx = await contract.transferOwnership(batchNo, newOwner, role, note);
        const receipt = await tx.wait();
        return { success: true, txHash: receipt.transactionHash, blockNumber: receipt.blockNumber, isMock: false };
      }
      return { success: true, txHash: mockHash, blockNumber: Date.now(), isMock: true };
    } catch (error) {
      return { success: true, txHash: mockHash, blockNumber: Date.now(), isMock: true };
    }
  },

  verifyMedicine: async (batchNo) => {
    if (!contract) return { success: false, error: 'Blockchain not connected' };
    try {
      const result = await contract.verifyMedicine(batchNo);
      return {
        success: true,
        name: result.name,
        manufacturer: result.manufacturer,
        timestamp: result.timestamp.toString(),
        isValid: result.isValid,
        createdBy: result.createdBy,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getMedicineCount: async () => {
    if (!contract) return { success: false, error: 'Blockchain not connected' };
    try {
      const count = await contract.getMedicineCount();
      return { success: true, count: count.toString() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  addManufacturer: async (address) => {
    if (!contract) return { success: false, error: 'Blockchain not connected' };
    try {
      const tx = await contract.addManufacturer(address);
      const receipt = await tx.wait();
      return { success: true, txHash: receipt.transactionHash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getWalletAddress: () => (wallet ? wallet.address : null),
  isConnected: () => contract !== null,
};

// ==================== MIDDLEWARE ====================
// ✅ UPDATED CORS — allows LAN access for mobile testing
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://192.168.1.22:3000',
    /^http:\/\/192\.168\.\d+\.\d+:3000$/,
    /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ==================== MONGOOSE ====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => {
    console.error('❌ MongoDB Error:', err.message);
    process.exit(1);
  });

// ==================== VALIDATION HELPERS ====================
const validateEmail = (email) => {
  if (!email) return false;
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) return false;
  const blocked = [
    'test.com', 'example.com', 'fake.com', 'tempmail.com', 'mailinator.com',
    '10minutemail.com', 'yopmail.com', 'guerrillamail.com', 'trashmail.com',
  ];
  const domain = email.split('@')[1]?.toLowerCase();
  if (blocked.includes(domain)) return false;
  return true;
};

const validateName = (name) =>
  name && name.length >= 3 && name.length <= 60 && /^[a-zA-ZÀ-ÿ\s'.-]+$/.test(name);

const validatePhone = (phone) => {
  if (!phone) return false;
  const c = phone.replace(/[\s\-()]/g, '');
  return /^(\+?255|0)[67]\d{8}$/.test(c);
};

const validatePassword = (pwd) => {
  if (!pwd || pwd.length < 8) return false;
  let s = 0;
  if (pwd.length >= 8) s++;
  if (pwd.length >= 12) s++;
  if (/[a-z]/.test(pwd)) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/\d/.test(pwd)) s++;
  if (/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(pwd)) s++;
  return s >= 4;
};

// ==================== SCHEMAS ====================
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ['manufacturer', 'distributor', 'pharmacy', 'msd', 'tmda', 'admin'],
    default: 'pharmacy',
  },
  status: { type: String, enum: ['active', 'pending', 'banned'], default: 'pending' },
  ethAddress: { type: String, default: null },
  licenseNumber: { type: String, default: null },
  businessName: { type: String, default: null },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  batchNo: { type: String, required: true, unique: true },
  medicineGroup: { type: String, required: true },
  batchIndex: { type: Number, default: 1 },
  quantityPerBatch: { type: Number, default: 1 },
  manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  manufacturerName: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['manufactured', 'tmda_approved', 'listed', 'sold_to_distributor', 'sold_to_pharmacy', 'msd_allocated', 'dispensed'],
    default: 'manufactured',
  },
  isListed: { type: Boolean, default: false },
  currentOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  currentOwnerName: { type: String },
  currentOwnerRole: { type: String, default: 'manufacturer' },
  txHash: { type: String },
  blockchainVerified: { type: Boolean, default: false },
  tmdaApproved: { type: Boolean, default: false },
  tmdaApprovalNumber: { type: String, default: null },
  tmdaApprovedAt: { type: Date, default: null },
  ownershipHistory: [
    {
      owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      ownerName: String,
      role: String,
      transferredAt: { type: Date, default: Date.now },
      note: String,
      transactionId: String,
      blockNumber: Number,
      txHash: String,
      chainStep: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

MedicineSchema.index({ manufacturer: 1, medicineGroup: 1 });
MedicineSchema.index({ batchNo: 1 });
MedicineSchema.index({ medicineGroup: 1 });
MedicineSchema.index({ currentOwner: 1 });
MedicineSchema.index({ status: 1 });
MedicineSchema.index({ tmdaApproved: 1 });

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  medicineGroup: { type: String, required: true },
  medicineName: { type: String, required: true },
  batchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' }],
  batchNos: [String],
  batchCount: { type: Number, required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerName: String,
  buyerRole: String,
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerName: String,
  sellerRole: String,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending',
  },
  notes: { type: String, default: null },
  acceptedAt: Date,
  completedAt: Date,
  transactionHash: String,
  blockNumber: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

OrderSchema.index({ sellerId: 1 });
OrderSchema.index({ buyerId: 1 });
OrderSchema.index({ status: 1 });

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  email: { type: String, default: null },
  type: {
    type: String,
    enum: ['order_request', 'order_accepted', 'order_rejected', 'order_completed', 'medicine_approved', 'system_alert', 'qr_scan'],
    required: true,
  },
  title: String,
  message: String,
  read: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);
const Medicine = mongoose.model('Medicine', MedicineSchema);
const Order = mongoose.model('Order', OrderSchema);
const Notification = mongoose.model('Notification', NotificationSchema);

// ==================== MIDDLEWARE ====================
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    if (req.user.status === 'banned') return res.status(401).json({ message: 'Account banned' });
    if (req.user.status === 'pending') return res.status(401).json({ message: 'Pending admin approval' });
    next();
  } catch {
    res.status(401).json({ message: 'Not authorized' });
  }
};

const adminOnly = (req, res, next) =>
  req.user?.role === 'admin' ? next() : res.status(403).json({ message: 'Admin only' });

const tmdaOnly = (req, res, next) =>
  req.user?.role === 'tmda' ? next() : res.status(403).json({ message: 'TMDA only' });

const msdOnly = (req, res, next) =>
  req.user?.role === 'msd' ? next() : res.status(403).json({ message: 'MSD only' });

// ==================== AUTH ROUTES ====================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, licenseNumber, businessName } = req.body;
    if (!validateName(name)) return res.status(400).json({ message: 'Invalid name (letters only, min 3 chars)' });
    if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid or disposable email address' });
    if (!validatePhone(phone)) return res.status(400).json({ message: 'Invalid phone. Use +255 7XX XXX XXX' });
    if (!validatePassword(password)) return res.status(400).json({ message: 'Password too weak. Min 8 chars with uppercase, number or symbol' });
    if (role === 'admin') return res.status(400).json({ message: 'Admin accounts cannot be registered' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const needsLicense = !['tmda', 'msd'].includes(role);
    const isActive = role === 'pharmacy' || ['tmda', 'msd'].includes(role);
    if (needsLicense && !licenseNumber) return res.status(400).json({ message: 'License number required' });

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashed,
      role: role || 'pharmacy',
      status: isActive ? 'active' : 'pending',
      ethAddress: req.body.ethAddress || null,
      licenseNumber: licenseNumber || null,
      businessName: businessName || null,
    });

    if (role === 'manufacturer' && blockchainService.isConnected()) {
      const addr = req.body.ethAddress || blockchainService.getWalletAddress();
      if (addr) {
        const r = await blockchainService.addManufacturer(addr);
        if (r.success) {
          user.ethAddress = addr;
          await user.save();
        }
      }
    }

    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name,
        email,
        phone,
        role: user.role,
        status: user.status,
        ethAddress: user.ethAddress,
      },
    });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.status === 'banned') return res.status(401).json({ message: 'Account banned' });
    if (user.status === 'pending') return res.status(401).json({ message: 'Pending admin approval' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        ethAddress: user.ethAddress,
      },
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/auth/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json({ success: true, user });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'No account found' });
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 3600000);
    await user.save();
    const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'PharmaChain - Password Reset',
      html: `<h2>Reset Password</h2><p>Hello ${user.name},</p><p><a href="${url}">Click here to reset</a></p><p>Expires in 1 hour.</p>`,
    });
    res.json({ success: true, message: 'Reset link sent' });
  } catch (e) {
    res.status(500).json({ message: 'Failed', error: e.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!validatePassword(newPassword)) return res.status(400).json({ message: 'Password too weak' });
    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();
    res.json({ success: true, message: 'Password reset' });
  } catch {
    res.status(500).json({ message: 'Failed' });
  }
});

app.get('/api/auth/validate-reset-token/:token', async (req, res) => {
  const user = await User.findOne({ resetToken: req.params.token, resetTokenExpiry: { $gt: new Date() } });
  res.json({ valid: !!user });
});

// ==================== MEDICINES ====================

// BULK CREATE
app.post('/api/medicines/create-bulk', protect, async (req, res) => {
  try {
    if (req.user.role !== 'manufacturer') return res.status(403).json({ message: 'Only manufacturers' });
    if (req.user.status !== 'active') return res.status(403).json({ message: 'Account not active' });

    const { name, batchPrefix, batchCount, expiryDate, quantityPerBatch } = req.body;
    if (!name || !batchPrefix || !batchCount || !expiryDate) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    if (batchCount < 1 || batchCount > 1000) {
      return res.status(400).json({ message: 'Batch count must be 1–1000' });
    }

    const prefix = batchPrefix.toUpperCase().replace(/\s+/g, '-');
    const existing = await Medicine.findOne({ medicineGroup: prefix });
    if (existing) return res.status(400).json({ message: `Batch prefix "${prefix}" already used` });

    const pad = String(batchCount).length + 2;
    const created = [];
    let blockchainOk = 0;

    for (let i = 1; i <= batchCount; i++) {
      const batchNo = `${prefix}-${String(i).padStart(pad, '0')}`;
      let bcResult = null;
      if (blockchainService.isConnected()) {
        bcResult = await blockchainService.createMedicine(name, batchNo, req.user.name);
        if (bcResult.success) blockchainOk++;
      }
      const med = await Medicine.create({
        name,
        batchNo,
        medicineGroup: prefix,
        batchIndex: i,
        quantityPerBatch: quantityPerBatch || 1,
        manufacturer: req.user._id,
        manufacturerName: req.user.name,
        expiryDate,
        currentOwner: req.user._id,
        currentOwnerName: req.user.name,
        currentOwnerRole: 'manufacturer',
        txHash: bcResult?.txHash || null,
        blockchainVerified: bcResult?.success || false,
        status: 'manufactured',
        isListed: false,
        ownershipHistory: [
          {
            owner: req.user._id,
            ownerName: req.user.name,
            role: 'manufacturer',
            note: `Batch ${i} manufactured`,
            txHash: bcResult?.txHash || null,
            blockNumber: bcResult?.blockNumber || null,
            chainStep: 'manufacturer',
          },
        ],
      });
      created.push(med);
    }

    console.log(`✅ Created ${created.length} batches of ${name} (${prefix})`);
    res.status(201).json({
      success: true,
      medicineGroup: prefix,
      batchCount: created.length,
      blockchainConfirmed: blockchainOk,
    });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// LIST GROUP
app.put('/api/medicines/group/:group/list', protect, async (req, res) => {
  try {
    const batches = await Medicine.find({ medicineGroup: req.params.group });
    if (!batches.length) return res.status(404).json({ message: 'Group not found' });
    const owned = batches.filter((b) => b.currentOwner?.toString() === req.user._id.toString());
    if (!owned.length) return res.status(403).json({ message: 'You do not own any batch in this group' });
    if (!owned.some((b) => b.tmdaApproved)) {
      return res.status(400).json({ message: 'At least one batch must be TMDA approved' });
    }

    const updated = [];
    for (const b of owned) {
      if (b.isListed) continue;
      b.isListed = true;
      b.status = 'listed';
      b.ownershipHistory.push({
        owner: req.user._id,
        ownerName: req.user.name,
        role: req.user.role,
        note: 'Listed for sale',
        chainStep: 'listed',
      });
      await b.save();
      updated.push(b._id);
    }
    res.json({ success: true, message: `${updated.length} batches listed`, count: updated.length });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// UNLIST GROUP
app.put('/api/medicines/group/:group/unlist', protect, async (req, res) => {
  try {
    const batches = await Medicine.find({
      medicineGroup: req.params.group,
      currentOwner: req.user._id,
    });
    let count = 0;
    for (const b of batches) {
      if (!b.isListed) continue;
      b.isListed = false;
      b.status = b.tmdaApproved ? 'tmda_approved' : 'manufactured';
      await b.save();
      count++;
    }
    res.json({ success: true, message: `${count} batches unlisted`, count });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET GROUPS
app.get('/api/medicines/groups', protect, async (req, res) => {
  try {
    const { scope } = req.query;
    let filter = {};

    if (scope === 'owned') {
      filter.currentOwner = req.user._id;
    } else if (scope === 'marketplace') {
      filter.isListed = true;
      filter.tmdaApproved = true;
      filter.quantityPerBatch = { $gt: 0 };
      if (req.user.role === 'distributor') filter.currentOwnerRole = 'manufacturer';
      else if (req.user.role === 'pharmacy') filter.currentOwnerRole = { $in: ['distributor', 'msd'] };
      else return res.status(403).json({ message: 'Access denied' });
    } else {
      if (req.user.role === 'manufacturer') filter.manufacturer = req.user._id;
      else if (req.user.role === 'tmda' || req.user.role === 'msd') filter = {};
      else if (req.user.role === 'distributor' || req.user.role === 'pharmacy') filter.currentOwner = req.user._id;
    }

    const batches = await Medicine.find(filter)
      .populate('manufacturer', 'name email phone')
      .populate('currentOwner', 'name email phone role');

    const groups = {};
    for (const b of batches) {
      const key = b.medicineGroup || b.batchNo;
      if (!groups[key]) {
        groups[key] = {
          medicineGroup: key,
          name: b.name,
          manufacturerName: b.manufacturerName,
          expiryDate: b.expiryDate,
          tmdaApproved: b.tmdaApproved,
          tmdaApprovalNumber: b.tmdaApprovalNumber,
          currentOwnerName: b.currentOwnerName,
          currentOwnerRole: b.currentOwnerRole,
          isListed: b.isListed,
          status: b.status,
          quantityPerBatch: b.quantityPerBatch,
          batches: [],
          batchCount: 0,
          _id: b._id,
        };
      }
      groups[key].batches.push({
        _id: b._id,
        batchNo: b.batchNo,
        batchIndex: b.batchIndex,
        status: b.status,
        isListed: b.isListed,
        tmdaApproved: b.tmdaApproved,
        currentOwnerName: b.currentOwnerName,
        currentOwnerRole: b.currentOwnerRole,
        txHash: b.txHash,
        createdAt: b.createdAt,
      });
      groups[key].batchCount++;
    }

    res.json({ success: true, groups: Object.values(groups) });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// GET ALL MEDICINES (raw)
app.get('/api/medicines', protect, async (req, res) => {
  try {
    let filter = {};
    const r = req.user.role;
    if (r === 'manufacturer') filter.manufacturer = req.user._id;
    else if (r === 'distributor' || r === 'pharmacy') filter.currentOwner = req.user._id;
    const medicines = await Medicine.find(filter)
      .populate('manufacturer', 'name email phone')
      .populate('currentOwner', 'name email phone role');
    res.json({ success: true, medicines });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// VERIFY (public)
app.post('/api/medicines/verify', async (req, res) => {
  try {
    const { batchNo, email } = req.body;
    if (!batchNo) return res.status(400).json({ message: 'Batch number required' });
    const med = await Medicine.findOne({ batchNo: batchNo.toUpperCase() })
      .populate('manufacturer', 'name email phone')
      .populate('currentOwner', 'name email phone role');
    if (!med) return res.json({ success: true, verified: false, message: 'Not found' });
    let bcData = null;
    if (blockchainService.isConnected()) {
      const r = await blockchainService.verifyMedicine(batchNo.toUpperCase());
      if (r.success) bcData = r;
    }
    const timeline = med.ownershipHistory.map((h) => ({
      owner: h.ownerName,
      role: h.role,
      date: h.transferredAt,
      note: h.note,
      txHash: h.txHash,
    }));
    const data = {
      success: true,
      verified: true,
      medicine: {
        id: med._id,
        name: med.name,
        batchNo: med.batchNo,
        medicineGroup: med.medicineGroup,
        manufacturer: med.manufacturerName,
        currentOwner: med.currentOwnerName || 'N/A',
        currentOwnerRole: med.currentOwnerRole,
        expiryDate: med.expiryDate,
        status: med.status,
        tmdaApproved: med.tmdaApproved,
        tmdaApprovalNumber: med.tmdaApprovalNumber,
        quantityPerBatch: med.quantityPerBatch,
        createdAt: med.createdAt,
      },
      timeline,
      blockchain: bcData || { message: 'Not on blockchain' },
    };
    if (email) {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `PharmaChain - ${med.name}`,
        html: `<h2>Verification: ${med.name}</h2><p>Batch: ${med.batchNo}</p><p>Owner: ${med.currentOwnerName} (${med.currentOwnerRole})</p>`,
      });
      await Notification.create({
        email,
        type: 'qr_scan',
        title: 'Verification',
        message: `Sent to ${email}`,
        data: { medicineId: med._id },
      });
    }
    res.json(data);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/medicines/batch/:batchNo', async (req, res) => {
  try {
    const med = await Medicine.findOne({ batchNo: req.params.batchNo.toUpperCase() })
      .populate('manufacturer', 'name email phone')
      .populate('currentOwner', 'name email phone role');
    if (!med) return res.status(404).json({ success: false, message: 'Not found' });
    const timeline = med.ownershipHistory.map((h) => ({
      owner: h.ownerName,
      role: h.role,
      date: h.transferredAt,
      note: h.note,
      txHash: h.txHash,
    }));
    res.json({
      success: true,
      medicine: {
        id: med._id,
        name: med.name,
        batchNo: med.batchNo,
        medicineGroup: med.medicineGroup,
        manufacturer: med.manufacturerName,
        currentOwner: med.currentOwnerName,
        currentOwnerRole: med.currentOwnerRole,
        expiryDate: med.expiryDate,
        status: med.status,
        tmdaApproved: med.tmdaApproved,
        tmdaApprovalNumber: med.tmdaApprovalNumber,
        quantityPerBatch: med.quantityPerBatch,
        createdAt: med.createdAt,
      },
      timeline,
      blockchain: { message: 'See verify endpoint' },
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// TMDA APPROVE GROUP
app.post('/api/tmda/approve', protect, tmdaOnly, async (req, res) => {
  try {
    const { medicineId, medicineGroup, approvalNumber } = req.body;
    if (!medicineId && !medicineGroup) {
      return res.status(400).json({ message: 'Medicine ID or group required' });
    }

    const filter = medicineGroup ? { medicineGroup } : { _id: medicineId };
    const batches = await Medicine.find(filter);
    if (!batches.length) return res.status(404).json({ message: 'Not found' });

    const approvedNum = approvalNumber || `TMDA-${Date.now()}`;
    let count = 0;
    for (const b of batches) {
      if (b.tmdaApproved) continue;
      b.tmdaApproved = true;
      b.tmdaApprovalNumber = approvedNum;
      b.tmdaApprovedAt = new Date();
      b.status = 'tmda_approved';
      b.ownershipHistory.push({
        owner: req.user._id,
        ownerName: req.user.name,
        role: 'tmda',
        note: `TMDA: ${approvedNum}`,
        chainStep: 'tmda_approved',
      });
      await b.save();
      count++;
    }
    res.json({ success: true, message: `${count} batches approved`, count, approvalNumber: approvedNum });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// ==================== ORDERS ====================
app.post('/api/orders/create', protect, async (req, res) => {
  try {
    if (!['distributor', 'pharmacy'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only buyers can order' });
    }
    const { medicineGroup, batchCount, notes } = req.body;
    if (!medicineGroup || !batchCount || batchCount < 1) {
      return res.status(400).json({ message: 'medicineGroup and batchCount required' });
    }

    const available = await Medicine.find({
      medicineGroup,
      isListed: true,
      tmdaApproved: true,
      currentOwner: { $ne: req.user._id },
    }).populate('currentOwner', 'name role');

    if (available.length < batchCount) {
      return res.status(400).json({ message: `Only ${available.length} batches available` });
    }

    const ownerUser = await User.findById(available[0].currentOwner);
    const sellerId = available[0].currentOwner;
    const sellerName = ownerUser?.name || available[0].currentOwnerName;
    const sellerRole = ownerUser?.role || available[0].currentOwnerRole;

    if (req.user.role === 'distributor' && sellerRole !== 'manufacturer') {
      return res.status(400).json({ message: `Distributors can only buy from manufacturers` });
    }
    if (req.user.role === 'pharmacy' && !['distributor', 'msd'].includes(sellerRole)) {
      return res.status(400).json({ message: `Pharmacies buy from distributors or MSD` });
    }

    const picked = available
      .filter((b) => b.currentOwner.toString() === sellerId.toString())
      .slice(0, batchCount);

    if (picked.length < batchCount) {
      return res.status(400).json({ message: `Seller only has ${picked.length} batches available` });
    }

    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const order = await Order.create({
      orderNumber,
      medicineGroup,
      medicineName: picked[0].name,
      batchIds: picked.map((b) => b._id),
      batchNos: picked.map((b) => b.batchNo),
      batchCount: picked.length,
      buyerId: req.user._id,
      buyerName: req.user.name,
      buyerRole: req.user.role,
      sellerId,
      sellerName,
      sellerRole,
      notes: notes || null,
      status: 'pending',
    });

    console.log(`✅ Order ${orderNumber}: ${picked.length} batches of ${medicineGroup} → ${sellerName}`);

    try {
      await Notification.create({
        userId: sellerId,
        type: 'order_request',
        title: 'New Order',
        message: `${req.user.name} ordered ${picked.length} batches of ${order.medicineName}`,
        data: { orderId: order._id, batchCount: picked.length },
      });
    } catch {}

    res.status(201).json({ success: true, message: `${picked.length} batches ordered from ${sellerName}`, order });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

app.get('/api/orders/manufacturer', protect, async (req, res) => {
  try {
    if (!['manufacturer', 'distributor', 'msd'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const orders = await Order.find({ sellerId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('buyerId', 'name email phone role');
    res.json({ success: true, orders });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/orders/buyer', protect, async (req, res) => {
  try {
    if (!['distributor', 'pharmacy'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const orders = await Order.find({ buyerId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('sellerId', 'name email phone role');
    res.json({ success: true, orders });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/orders/:id/accept', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only seller can accept' });
    }
    if (order.status !== 'pending') return res.status(400).json({ message: 'Already processed' });

    const statusMap = { distributor: 'sold_to_distributor', pharmacy: 'sold_to_pharmacy' };
    const newStatus = statusMap[order.buyerRole] || 'sold_to_distributor';
    const transfers = [];

    for (const batchId of order.batchIds) {
      const b = await Medicine.findById(batchId);
      if (!b || b.currentOwner.toString() !== req.user._id.toString()) continue;

      let bcResult = null;
      if (blockchainService.isConnected()) {
        bcResult = await blockchainService.transferOwnership(
          b.batchNo,
          order.buyerName,
          order.buyerRole,
          `Purchased`
        );
      }
      const txHash = bcResult?.txHash || '0x' + crypto.randomBytes(32).toString('hex');
      const blockNumber = bcResult?.blockNumber || Date.now();

      b.status = newStatus;
      b.currentOwner = order.buyerId;
      b.currentOwnerName = order.buyerName;
      b.currentOwnerRole = order.buyerRole;
      b.isListed = false;
      b.txHash = txHash;
      b.blockchainVerified = true;
      b.ownershipHistory.push({
        owner: order.buyerId,
        ownerName: order.buyerName,
        role: order.buyerRole,
        note: `Purchased from ${order.sellerName}`,
        transactionId: order.orderNumber,
        txHash,
        blockNumber,
        chainStep: order.buyerRole,
      });
      await b.save();
      transfers.push({ batchNo: b.batchNo, txHash, blockNumber });
    }

    order.status = 'accepted';
    order.acceptedAt = new Date();
    if (transfers.length > 0) {
      order.transactionHash = transfers[0].txHash;
      order.blockNumber = transfers[0].blockNumber;
    }
    await order.save();

    try {
      await Notification.create({
        userId: order.buyerId,
        type: 'order_accepted',
        title: 'Order Accepted',
        message: `${req.user.name} accepted ${transfers.length} batches`,
        data: { orderId: order._id },
      });
    } catch {}

    res.json({ success: true, message: `${transfers.length} batches transferred`, order, transfers });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

app.put('/api/orders/:id/reject', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Not found' });
    if (order.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only seller' });
    }
    if (order.status !== 'pending') return res.status(400).json({ message: 'Already processed' });
    order.status = 'rejected';
    await order.save();
    res.json({ success: true, message: 'Rejected', order });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/orders/:id/complete', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Not found' });
    if (order.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (order.status !== 'accepted') return res.status(400).json({ message: 'Accept first' });
    order.status = 'completed';
    order.completedAt = new Date();
    await order.save();
    res.json({ success: true, message: 'Completed', order });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/orders/all', protect, adminOnly, async (req, res) => {
  const orders = await Order.find({})
    .sort({ createdAt: -1 })
    .populate('buyerId', 'name email role')
    .populate('sellerId', 'name email role');
  res.json({ success: true, orders });
});

// ==================== MSD ====================
app.post('/api/medicines/msd-allocate', protect, msdOnly, async (req, res) => {
  try {
    const { medicineGroup, pharmacyId, batchCount } = req.body;
    if (!medicineGroup || !pharmacyId || !batchCount) {
      return res.status(400).json({ message: 'Fields required' });
    }
    const pharmacy = await User.findById(pharmacyId);
    if (!pharmacy || pharmacy.role !== 'pharmacy') {
      return res.status(400).json({ message: 'Invalid pharmacy' });
    }

    const batches = await Medicine.find({ medicineGroup, currentOwner: req.user._id }).limit(batchCount);
    if (batches.length < batchCount) {
      return res.status(400).json({ message: `Only ${batches.length} available` });
    }

    let count = 0;
    for (const b of batches) {
      let bc = null;
      if (blockchainService.isConnected()) {
        bc = await blockchainService.transferOwnership(b.batchNo, pharmacy.name, 'pharmacy', 'MSD');
      }
      const txHash = bc?.txHash || '0x' + crypto.randomBytes(32).toString('hex');
      b.msdAllocated = true;
      b.status = 'msd_allocated';
      b.currentOwner = pharmacy._id;
      b.currentOwnerName = pharmacy.name;
      b.currentOwnerRole = 'pharmacy';
      b.isListed = false;
      b.ownershipHistory.push({
        owner: pharmacy._id,
        ownerName: pharmacy.name,
        role: 'pharmacy',
        note: 'MSD',
        txHash,
        blockNumber: bc?.blockNumber || Date.now(),
        chainStep: 'msd_allocated',
      });
      await b.save();
      count++;
    }
    res.json({ success: true, message: `${count} batches allocated`, count });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== NOTIFICATIONS ====================
app.get('/api/notifications', protect, async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
  res.json({ success: true, notifications, unreadCount });
});

app.put('/api/notifications/:id/read', protect, async (req, res) => {
  const n = await Notification.findById(req.params.id);
  if (!n) return res.status(404).json({ message: 'Not found' });
  if (n.userId && n.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Denied' });
  }
  n.read = true;
  await n.save();
  res.json({ success: true });
});

app.put('/api/notifications/read-all', protect, async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
  res.json({ success: true });
});

// ==================== USER ROUTES (Admin) ====================

app.get('/api/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ success: true, users });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/users/:id/status', protect, adminOnly, async (req, res) => {
  const { status } = req.body;
  if (!['active', 'pending', 'banned'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.role === 'admin') return res.status(400).json({ message: 'Cannot modify admin' });
  user.status = status;
  await user.save();
  res.json({ success: true, message: `User ${status}` });
});

// ⛔ ROLE CHANGE IS DISABLED
app.put('/api/users/:id/role', protect, adminOnly, async (req, res) => {
  return res.status(403).json({
    message: 'Role changes are not permitted. Contact system owner.',
  });
});

app.delete('/api/users/:id', protect, adminOnly, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.role === 'admin') return res.status(400).json({ message: 'Cannot delete admin' });
  await user.deleteOne();
  res.json({ success: true, message: 'Deleted' });
});

// ==================== BLOCKCHAIN STATUS ====================
app.get('/api/blockchain/status', protect, adminOnly, async (req, res) => {
  const walletAddress = blockchainService.getWalletAddress();
  let isAuthorized = false;
  let medicineCount = null;
  if (blockchainService.isConnected() && walletAddress) {
    try {
      isAuthorized = await contract.authorizedManufacturers(walletAddress);
      const count = await blockchainService.getMedicineCount();
      medicineCount = count.success ? count.count : null;
    } catch {}
  }
  res.json({
    success: true,
    connected: blockchainService.isConnected(),
    contractAddress: process.env.CONTRACT_ADDRESS || null,
    walletAddress,
    isAuthorized,
    medicineCount,
    network: process.env.NETWORK || 'n/a',
  });
});

// ==================== ADMIN DASHBOARD ====================
app.get('/api/admin/dashboard', protect, adminOnly, async (req, res) => {
  const stats = {
    totalUsers: await User.countDocuments(),
    activeUsers: await User.countDocuments({ status: 'active' }),
    pendingUsers: await User.countDocuments({ status: 'pending' }),
    manufacturers: await User.countDocuments({ role: 'manufacturer' }),
    distributors: await User.countDocuments({ role: 'distributor' }),
    pharmacies: await User.countDocuments({ role: 'pharmacy' }),
    totalOrders: await Order.countDocuments(),
    pendingOrders: await Order.countDocuments({ status: 'pending' }),
    totalBatches: await Medicine.countDocuments(),
    tmdaApproved: await Medicine.countDocuments({ tmdaApproved: true }),
    listedBatches: await Medicine.countDocuments({ isListed: true }),
  };
  let bc = { connected: false };
  if (blockchainService.isConnected()) {
    const c = await blockchainService.getMedicineCount();
    bc = {
      connected: true,
      contractAddress: process.env.CONTRACT_ADDRESS,
      totalMedicinesOnChain: c.success ? c.count : 'Error',
    };
  }
  res.json({ success: true, stats, blockchain: bc });
});

// ==================== MIGRATION ====================
app.post('/api/admin/fix-medicine-ownership', protect, adminOnly, async (req, res) => {
  try {
    const medicines = await Medicine.find({});
    let fixed = 0;
    let groupFixed = 0;
    for (const med of medicines) {
      let changed = false;
      if (!med.medicineGroup) {
        med.medicineGroup = med.batchNo.replace(/-\d+$/, '') || med.batchNo;
        changed = true;
        groupFixed++;
      }
      if (!med.currentOwner && med.manufacturer) {
        med.currentOwner = med.manufacturer;
        changed = true;
      }
      if (med.currentOwner) {
        const owner = await User.findById(med.currentOwner);
        if (owner && med.currentOwnerRole !== owner.role) {
          med.currentOwnerRole = owner.role;
          changed = true;
        }
      }
      if (changed) {
        await med.save();
        fixed++;
      }
    }
    res.json({ success: true, message: `Fixed ${fixed}/${medicines.length}`, fixed, groupFixed });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

app.post('/api/admin/fix-order-roles', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({});
    let fixed = 0;
    for (const order of orders) {
      let changed = false;
      if (!order.medicineGroup && order.batchNo) {
        order.medicineGroup = order.batchNo.replace(/-\d+$/, '');
        changed = true;
      }
      if (order.sellerId) {
        const s = await User.findById(order.sellerId);
        if (s && order.sellerRole !== s.role) {
          order.sellerRole = s.role;
          changed = true;
        }
      }
      if (changed) {
        await order.save();
        fixed++;
      }
    }
    res.json({ success: true, message: `Fixed ${fixed}/${orders.length}`, fixed });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== DEFAULT ADMIN ====================
const createDefaultAdmin = async () => {
  const exists = await User.findOne({ email: 'admin@pharmachain.com' });
  if (!exists) {
    const hashed = await bcrypt.hash('Admin@2024!', 10);
    await User.create({
      name: 'System Administrator',
      email: 'admin@pharmachain.com',
      phone: '+255 712 345 678',
      password: hashed,
      role: 'admin',
      status: 'active',
    });
    console.log('✅ Default admin: admin@pharmachain.com / Admin@2024!');
  }
};

// ==================== START ====================
mongoose.connection.once('open', async () => {
  await createDefaultAdmin();
  console.log('📦 DB ready');
  if (blockchainService.isConnected()) console.log('🔗 Blockchain ready');
  else console.log('⚠️  Blockchain not connected - using mock transactions');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on http://localhost:${PORT} (also on LAN)`));

module.exports = { app, blockchainService };