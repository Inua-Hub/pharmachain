# PharmaChain

PharmaChain is a pharmaceutical supply-chain tracking system built for the Tanzanian market. It records each medicine batch from the manufacturer through regulatory approval, distribution and the pharmacy. Anyone can check a batch's authenticity and custody history by scanning its QR code or entering its batch number.

Batch records and custody history are stored in MongoDB. The system can also register batches on an EVM-compatible blockchain through the `PharmaChain` Solidity contract. See [Project status](#project-status--known-limitations) for how much of the on-chain integration works today.

---

## Features

### Role-based portals

| Role | Who | What they can do |
|---|---|---|
| **Manufacturer** | Licensed producers | Create batch groups (1–1000 serialised batches per group), list and unlist groups for sale, accept or reject distributor orders, and download or print batch QR labels |
| **TMDA** | Tanzania Medicines & Medical Devices Authority | View all products and approve medicine groups, attaching a TMDA approval number |
| **Distributor** | Licensed wholesalers | Browse and order listed stock from manufacturers, re-list owned stock, and accept or reject pharmacy orders |
| **MSD** | Medical Stores Department | View all products and allocate batches it owns directly to pharmacies |
| **Pharmacy** | Licensed retailers | Browse and order listed stock from distributors (or MSD) and view owned batches and order history |
| **Admin** | System operator | Approve, ban or delete users, change roles, view system and blockchain stats, view all orders, and run data-repair utilities |

### Supply-chain flow

```
Manufacturer ──create batches──▶ TMDA approval ──▶ Listed for sale
      │                                                  │
      │                         Distributor orders ◀─────┘
      │                                │ (manufacturer accepts → ownership transfers)
      │                                ▼
      │                         Distributor lists ──▶ Pharmacy orders
      │                                                  │ (distributor accepts → ownership transfers)
      │                                                  ▼
      └──────────────────────── MSD allocation ──────▶ Pharmacy
```

- **Batch groups**: a manufacturer enters a name, a batch prefix, a count, an expiry date and the units per batch. The system then generates serial numbers such as `AMOX500-0001`, `AMOX500-0002`, and so on.
- **Approval gate**: a group can only be listed for sale once at least one of its batches is TMDA-approved. Buyers only see batches that are both listed and approved.
- **Trade rules enforced by the API**: distributors buy only from manufacturers, and pharmacies buy only from distributors or MSD.
- **Orders** go through the states `pending → accepted | rejected → completed`. When an order is accepted, ownership of each batch moves to the buyer and an entry is added to the batch's custody history.
- **Batch status lifecycle**: `manufactured → tmda_approved → listed → sold_to_distributor → sold_to_pharmacy` (or `msd_allocated`).
- **Notifications** are created in the app for order events and QR scans.

### Public verification

- `/verify` lets anyone enter a batch number without logging in.
- `/verify/<batchNo>` is the page that batch QR codes point to. It shows the medicine details, TMDA approval, current owner and the full custody timeline.
- A verifier can have the results emailed to them. The email is sent through Nodemailer using Gmail.

### Accounts and security

- JWT authentication with bcrypt-hashed passwords.
- Registration validates the name, rejects disposable email domains, requires a Tanzanian phone number (`+255 6XX/7XX…`) and enforces a minimum password strength.
- Manufacturers and distributors must provide a licence number and start in the `pending` state until an admin activates them.
- Password reset works through a time-limited emailed token.
- A default admin account is created on the backend's first start (see [Getting started](#getting-started)).

---

## Architecture

```
┌──────────────────────┐   REST/JSON   ┌───────────────────────┐   ethers v5   ┌──────────────────────┐
│  Next.js 16 frontend │ ────────────▶ │ Express API (Node.js) │ ────────────▶ │ PharmaChain.sol      │
│  React 19, Tailwind 4│   JWT bearer  │ backend/server.js     │  server-held  │ (Sepolia / local EVM)│
└──────────────────────┘               └──────────┬────────────┘    wallet     └──────────────────────┘
                                                  │ Mongoose
                                                  ▼
                                           ┌─────────────┐
                                           │  MongoDB    │  Users · Medicines · Orders · Notifications
                                           └─────────────┘
```

- **Frontend**: Next.js 16 with the App Router, React 19, Tailwind CSS 4, shadcn/Radix UI, `react-qr-code` and `lucide-react`. The main page ([app/page.tsx](app/page.tsx)) holds the landing page, login and registration, and renders the dashboard for the user's role. Each role's dashboard also exists as its own route under [app/dashboard/](app/dashboard/).
- **Backend**: a single Express server ([backend/server.js](backend/server.js)) containing the Mongoose models, auth middleware, role guards and all REST routes.
- **Blockchain**: the backend signs every contract transaction with one wallet it holds (`PRIVATE_KEY`). Users do not connect their own wallets. If the contract settings are not configured, the backend runs without the blockchain.

### Smart contract

[backend/contracts/PharmaChain.sol](backend/contracts/PharmaChain.sol) stores a `Medicine` record for each batch number and keeps an allowlist of authorised manufacturer addresses.

| Function | Purpose |
|---|---|
| `addManufacturer(address)` | Authorise a manufacturer address (only callable by an address that is already authorised; the deployer is authorised automatically) |
| `createMedicine(name, batchNo, manufacturer, price)` | Register a batch (authorised manufacturers only; each batch number can be registered once) |
| `verifyMedicine(batchNo)` | Return the stored record, or revert if the batch doesn't exist |
| `isMedicineValid(batchNo)` | Return `true` if the batch exists and is valid |
| `getMedicineCount()` | Return the total number of registered batches |

The ABI the backend uses is in [backend/contracts/abi.js](backend/contracts/abi.js). It must be regenerated whenever the contract changes.

---

## Project structure

```
pharmachain/
├── app/                          # Next.js frontend
│   ├── page.tsx                  # Landing, auth, and role-based dashboard shell
│   ├── dashboard/
│   │   ├── admin/ tmda/ msd/ manufacturer/ distributor/ pharmacy/
│   │   ├── orders/ settings/
│   │   └── page.tsx              # Redirects to the logged-in user's role dashboard
│   ├── verify/                   # Public verification (form + per-batch page)
│   ├── reset-password/           # Password reset page
│   ├── components/               # QRCodeGenerator, PasswordStrengthMeter
│   └── lib/
│       ├── api.ts                # Typed API client
│       └── validation.ts         # Client-side validators
├── backend/
│   ├── server.js                 # Express API, models, blockchain service
│   └── contracts/
│       ├── PharmaChain.sol       # Solidity contract
│       └── abi.js                # Contract ABI used by the backend
├── scripts/deploy.js             # Hardhat deployment script
├── hardhat.config.js             # Hardhat networks (sepolia, localhost)
└── lib/utils.ts                  # Tailwind class-merge helper
```

---

## Getting started

### Prerequisites

- Node.js 20 or later
- MongoDB (local or Atlas)
- Optional: a Gmail account with an app password, for password-reset and verification emails
- Optional: an EVM RPC endpoint (e.g. Sepolia through Infura or Alchemy) and a funded deployer key

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```ini
# Required
MONGO_URI=mongodb://localhost:27017/pharmachain
JWT_SECRET=change-me

# Optional
PORT=5000
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:3000

# Email (password reset, verification results)
EMAIL_USER=you@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM="PharmaChain <you@gmail.com>"

# Blockchain (omit all four to run without a chain)
CONTRACT_ADDRESS=0x...
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/<key>
PRIVATE_KEY=0x...
NETWORK=sepolia
```

Start the API:

```bash
npm run dev      # nodemon
# or
npm start
```

On first start the backend creates a default admin account: **`admin@pharmachain.com` / `Admin@2024!`**. Change this password before deploying anywhere public. The credentials are hard-coded in `server.js`.

### 2. Frontend

From the repository root:

```bash
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
npm run dev
```

Open http://localhost:3000.

The backend's CORS settings allow `localhost:3000` and private LAN addresses (`192.168.x.x`, `10.x.x.x`), so you can test QR scanning from a phone on the same network. To do that, set `NEXT_PUBLIC_API_URL` to your machine's LAN IP.

### 3. Smart contract (optional)

`hardhat.config.js` and `scripts/deploy.js` are included, but Hardhat is **not** listed in `package.json` yet. Before you can deploy with Hardhat:

1. Install Hardhat and an ethers plugin (`npm i -D hardhat @nomicfoundation/hardhat-ethers`). The deploy script uses the ethers v6 API (`waitForDeployment`), but the config still loads `@nomiclabs/hardhat-waffle`, which uses ethers v5. Pick one and update the config to match.
2. Set `paths.sources` to `./backend/contracts`, or move the `.sol` file into `./contracts`.
3. Add your RPC URL and deployer key to the `sepolia` network in `hardhat.config.js`.
4. Run `npx hardhat run scripts/deploy.js --network sepolia`.

Alternatively, you can deploy `PharmaChain.sol` from Remix. Either way, put the resulting address into `CONTRACT_ADDRESS`, and use the deployer's key as `PRIVATE_KEY` so the backend wallet is an authorised manufacturer.

---

## API overview

All routes are prefixed with `/api`. Routes marked 🔒 require an `Authorization: Bearer <jwt>` header.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, 🔒 `GET /auth/me`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/validate-reset-token/:token` |
| Medicines | 🔒 `POST /medicines/create-bulk`, 🔒 `GET /medicines/groups?scope=owned\|marketplace`, 🔒 `PUT /medicines/group/:group/list`, 🔒 `PUT /medicines/group/:group/unlist`, 🔒 `GET /medicines` |
| Verification (public) | `POST /medicines/verify`, `GET /medicines/batch/:batchNo` |
| TMDA | 🔒 `POST /tmda/approve` |
| MSD | 🔒 `POST /medicines/msd-allocate` |
| Orders | 🔒 `POST /orders/create`, 🔒 `GET /orders/manufacturer` (seller view), 🔒 `GET /orders/buyer`, 🔒 `PUT /orders/:id/accept`, 🔒 `PUT /orders/:id/reject`, 🔒 `PUT /orders/:id/complete`, 🔒 `GET /orders/all` (admin) |
| Notifications | 🔒 `GET /notifications`, 🔒 `PUT /notifications/:id/read`, 🔒 `PUT /notifications/read-all` |
| Admin | 🔒 `GET /users`, 🔒 `PUT /users/:id/status`, 🔒 `PUT /users/:id/role`, 🔒 `DELETE /users/:id`, 🔒 `GET /blockchain/status`, 🔒 `GET /admin/dashboard`, 🔒 `POST /admin/fix-medicine-ownership`, 🔒 `POST /admin/fix-order-roles` |

---

## Project status & known limitations

PharmaChain is a working prototype. The off-chain supply-chain workflow works from start to finish. The blockchain layer is only partly connected, and several issues should be fixed before a production pilot.

**Blockchain integration**
- **Contract signature mismatch.** `createMedicine` in the contract takes four arguments (including `price`), but the backend calls it with three. As a result, on-chain registration fails and new batches are saved with `blockchainVerified: false`.
- **Ownership transfers are not on-chain.** The contract has no `transferOwnership` function. When an order is accepted or MSD allocates stock, the backend records a randomly generated placeholder transaction hash and still sets `blockchainVerified: true`. For now, the custody history exists only in MongoDB.
- The Hardhat tooling is incomplete (see [step 3](#3-smart-contract-optional)).

**Workflow gaps**
- `dispensed` is a defined batch status, but no endpoint or UI action sets it.
- MSD can allocate stock to pharmacies but has no way to acquire stock, because only distributors and pharmacies can place orders.
- The Settings page calls `GET /blockchain/status`, which only admins can access, so the page shows no blockchain status for other roles.

**Frontend bugs**
- The per-batch verification route is in the folder `app/verify/[batchId]/`, but the page reads `params.batchNo`. The page therefore doesn't load, including when opened from a scanned QR code.
- The password-reset page is at `app/reset-password/token/` (a literal folder name), but the emailed link goes to `/reset-password/<token>`. That link returns a 404.
- `app/lib/api.ts` calls endpoints the backend doesn't implement: `/medicines/owned`, `/marketplace` and `/orders/debug`.

**Security**
- Anyone can register as **TMDA** or **MSD**, and those accounts are activated immediately, so any self-registered user could approve medicines. Accounts for these regulator roles should be created or approved by an admin.
- The default admin credentials are hard-coded in `server.js`.
- The JWT is stored in `localStorage`.
- There are no automated tests.

---

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/Radix UI, react-qr-code, lucide-react, sonner / react-hot-toast |
| Backend | Node.js, Express 4, Mongoose 8, jsonwebtoken, bcryptjs, Nodemailer, ethers v5 |
| Blockchain | Solidity ^0.8, Hardhat (config only), Sepolia / local EVM |
| Data | MongoDB |
