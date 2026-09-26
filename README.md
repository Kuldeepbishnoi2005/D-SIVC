# D-SIVC

**Blockchain-Based Decentralized Student Identity and Authentication System with Verifiable Credentials**

D-SIVC is a secure, modern mobile application and blockchain architecture designed to digitize and safeguard academic credentials. By combining off-chain student profile management in Supabase PostgreSQL with cryptographic SHA-256 hash anchoring on the Polygon Amoy Testnet, D-SIVC provides tamper-evident, instant public verification of academic records without exposing sensitive Personally Identifiable Information (PII) on the public blockchain.

![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-000000?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.86.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20RLS-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity&logoColor=white)
![Polygon Amoy](https://img.shields.io/badge/Polygon-Amoy%20Testnet%20(80002)-8247E5?style=for-the-badge&logo=polygon&logoColor=white)
![Hardhat](https://img.shields.io/badge/Hardhat-2.22.2-FFF100?style=for-the-badge&logo=hardhat&logoColor=black)

---

## Overview

Traditional academic credential issuance and verification rely on paper certificates, manual registry lookups, or centralized institutional portals. These methods are susceptible to document forgery, fraudulent modifications, slow background checks, and single points of failure.

D-SIVC addresses these challenges by introducing a hybrid architecture:
- **Off-Chain Identity Storage**: Student personal information (full name, roll number, department, course) remains securely stored in a Supabase PostgreSQL database governed by Row Level Security (RLS).
- **On-Chain Cryptographic Anchoring**: A unique SHA-256 digest computed from the credential data is anchored directly to the Polygon Amoy blockchain.
- **On-Chain Verifiable Registry**: The smart contract records only the credential identifier, SHA-256 hash, issuer address, issuance timestamp, and revocation state.
- **Privacy Preservation**: No personal student information (PII) is ever published to the public blockchain ledger.

---

## Key Features

- **Student Authentication**: Secure sign-in and account registration linked to student profiles.
- **Admin Authentication**: Administrative portal for authorized institution personnel to manage and issue credentials.
- **Digital Student Credentials**: Structured academic records containing student name, roll number, degree, department, and issue date.
- **SHA-256 Credential Hashing**: Cryptographic generation of unique SHA-256 fingerprints using `expo-crypto`.
- **Blockchain Anchoring**: Automatic smart contract registration via server-side Supabase Edge Functions on Polygon Amoy.
- **Public Verification**: Open verifier screen enabling anyone to instantly validate credentials using a Credential ID or SHA-256 Hash.
- **Tamper Detection**: Instant detection of unauthorized modifications by comparing computed database digests against on-chain records.
- **Credential Revocation**: Administrative capability to revoke issued credentials directly on the smart contract.
- **Transaction Hash Tracking**: Transparent linking of database records to PolygonScan transaction explorer links.
- **Role-Based Access Control**: Strict separation between `admin` and `student` operational roles.
- **Supabase Row Level Security**: Fine-grained data access policies enforcing student privacy.

---

## System Architecture

```mermaid
flowchart TD
    subgraph Mobile Client [Expo React Native App]
        AdminUI[Admin Dashboard & Issuance Screen]
        StudentUI[Student Credential Screen]
        VerifierUI[Public Verifier Screen]
    end

    subgraph Backend Infrastructure [Supabase Platform]
        Auth[Supabase Auth]
        DB[(PostgreSQL Database + RLS)]
        EdgeFnIssue[Edge Function: issue-credential]
        EdgeFnRevoke[Edge Function: revoke-credential]
        RPC[RPC: verify_public_credential]
    end

    subgraph Blockchain Layer [Polygon Amoy Testnet]
        Ethers[Ethers.js Contract Interface]
        Contract[StudentCredentialRegistry.sol]
    end

    AdminUI -->|1. Authenticate / Issue Credential| Auth
    AdminUI -->|2. Save Credential record (PENDING)| DB
    DB -->|3. Invoke Server-Side Edge Function| EdgeFnIssue
    EdgeFnIssue -->|4. Sign & Broadcast Transaction| Ethers
    Ethers -->|5. Anchor Credential Hash| Contract

    AdminUI -->|6. Revoke Credential| EdgeFnRevoke
    EdgeFnRevoke -->|7. Execute revokeCredential()| Contract
    EdgeFnRevoke -->|8. Update Status (REVOKED)| DB

    StudentUI -->|View Personal Credentials| DB
    VerifierUI -->|Query Verification Status| RPC
    RPC -->|Lookup Database Record| DB
    VerifierUI -.->|Cross-Check On-Chain Registry| Contract
```

---

## How It Works

### 1. Credential Issuance Flow
1. **Creation**: An administrator inputs student details and selects the credential type in the Admin Portal.
2. **Hash Computation**: The application constructs the credential payload and computes a deterministic SHA-256 hash.
3. **Database Staging**: The credential is stored in Supabase with `blockchain_status = 'PENDING'`.
4. **On-Chain Anchoring**: The app triggers the `issue-credential` Supabase Edge Function. The Edge Function uses the institutional wallet key to execute `issueCredential()` on the Polygon Amoy smart contract.
5. **Confirmation**: Upon transaction confirmation, the database record is updated to `blockchain_status = 'ANCHORED'` with the resulting transaction hash.

### 2. Credential Verification Flow
1. **Query**: A verifier inputs a Credential ID (e.g., `DSIVC-1790381933069-760`) or SHA-256 Hash into the Public Verifier screen.
2. **Lookup**: The `verify_public_credential` RPC function retrieves the registered credential record.
3. **Validation**: The system cross-checks database fields against the smart contract state:
   - **`ANCHORED`**: Valid active credential matching on-chain cryptographic state.
   - **`REVOKED`**: Credential was invalidated on-chain by the issuing authority.
   - **`INVALID`**: Hash mismatch or credential record not found.

### 3. Credential Revocation Flow
1. **Initiation**: An administrator triggers revocation from the Credentials Management interface.
2. **On-Chain Execution**: The `revoke-credential` Edge Function calls `revokeCredential()` on the smart contract.
3. **State Sync**: Upon transaction completion, `blockchain_status` changes to `'REVOKED'` and `revoked_at` timestamp is recorded. Any future public verifications immediately flag the credential as **REVOKED**.

---

## Technology Stack

| Domain | Technology / Library | Version | Description |
| :--- | :--- | :--- | :--- |
| **Frontend** | React Native | 0.86.3 | Cross-platform mobile framework |
| | Expo SDK | 57.0.25 | Mobile development framework |
| | TypeScript | 6.0.3 | Static type safety |
| | Expo Router | 57.0.23 | File-based navigation |
| | expo-crypto | 57.0.3 | Native SHA-256 cryptographic hashing |
| **Backend** | Supabase Auth | - | User session & JWT authentication |
| | Supabase PostgreSQL | - | Managed relational database with RLS policies |
| | Supabase Edge Functions | Deno Runtime | Server-side TypeScript execution environment |
| **Blockchain** | Solidity | 0.8.20 | Smart contract programming language |
| | Polygon Amoy Testnet | Chain ID 80002 | Ethereum L2 scaling testnet |
| | Hardhat | 2.22.2 | Ethereum development environment |
| | Ethers.js | 6.17.0 | Ethereum wallet & contract interactions |
| | OpenZeppelin Contracts | 5.0.2 | Standardized contract security (`Ownable`) |

---

## Smart Contract

The `StudentCredentialRegistry.sol` smart contract manages the on-chain registry of academic credentials. It inherits OpenZeppelin's `Ownable` pattern to restrict issuance and revocation rights to the contract owner (institution wallet).

```solidity
// Key Contract Interface
function issueCredential(string calldata credentialId, bytes32 credentialHash) external onlyOwner;
function revokeCredential(string calldata credentialId) external onlyOwner;
function verifyCredential(string calldata credentialId, bytes32 expectedHash) external view returns (bool isValid, bool isRevoked);
function getCredential(string calldata credentialId) external view returns (string memory id, bytes32 hash, address issuer, uint256 timestamp, bool revoked, bool exists);
```

### On-Chain Data Model
Each credential is stored in a Solidity mapping as a lightweight struct:
```solidity
struct CredentialRecord {
    string credentialId;
    bytes32 credentialHash;
    address issuer;
    uint256 timestamp;
    bool revoked;
    bool exists;
}
```

> **Note**: No personal student information (name, roll number, email, or course details) is stored on the blockchain ledger.

---

## Database Schema

### `profiles` Table
Stores user account profiles and role assignments.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | References `auth.users.id` |
| `full_name` | TEXT | User's complete legal name |
| `email` | TEXT | Account email address |
| `role` | TEXT | User role (`student` or `admin`) |
| `roll_number` | TEXT | Institutional student roll number |
| `course` | TEXT | Academic degree / course name |
| `department` | TEXT | Academic department |
| `institution` | TEXT | Educational institution name |
| `created_at` | TIMESTAMPTZ | Profile creation timestamp |

### `credentials` Table
Stores structured credential data and blockchain status tracking.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Primary key record identifier |
| `credential_id` | TEXT (Unique) | Public unique ID (e.g. `DSIVC-1790381933069-760`) |
| `student_id` | UUID (FK) | References `profiles.id` |
| `credential_type` | TEXT | Type of credential (e.g. `Bachelor of Technology`) |
| `credential_data` | JSONB | Off-chain credential payload (grades, degree details) |
| `credential_hash` | TEXT | SHA-256 cryptographic hash of credential data |
| `blockchain_tx_hash` | TEXT | Polygon Amoy transaction hash |
| `blockchain_status` | TEXT | Status (`PENDING`, `ANCHORED`, `REVOKED`) |
| `issued_at` | TIMESTAMPTZ | Timestamp of issuance |
| `revoked_at` | TIMESTAMPTZ | Timestamp of revocation (nullable) |

---

## Blockchain Deployment

D-SIVC is deployed on the Polygon Amoy Testnet.

- **Network**: Polygon Amoy Testnet
- **Chain ID**: `80002`
- **Smart Contract Address**: [`0x9ee5cd0d9D08d07d5547b2402240aD11F9761cA0`](https://amoy.polygonscan.com/address/0x9ee5cd0d9D08d07d5547b2402240aD11F9761cA0)
- **Explorer**: [PolygonScan Amoy Explorer](https://amoy.polygonscan.com/)

---

## Verified Test Results

The D-SIVC implementation has undergone end-to-end verification across all core lifecycle states on the live Polygon Amoy Testnet:

| Test Scenario | Expected Outcome | Result | Live Testnet Transaction Hash |
| :--- | :--- | :--- | :--- |
| **Credential Issuance** | Status transitions to `ANCHORED` | **Passed** | [`0xd18fc704d4149fbc09a505a32e4baaf82389dd28a2e978c850ca60d233fccb59`](https://amoy.polygonscan.com/tx/0xd18fc704d4149fbc09a505a32e4baaf82389dd28a2e978c850ca60d233fccb59) |
| **Public Verification** | Validates on-chain hash & status | **Passed** | Verified against smart contract state |
| **Tamper Detection** | Flags invalid/altered hashes | **Passed** | `is_valid: false` reported by verifier |
| **Credential Revocation** | On-chain state transitions to `REVOKED` | **Passed** | [`0x2812a591be1ed7fc42eef45d03963280304d65e3f0c73aa915137ba508365730`](https://amoy.polygonscan.com/tx/0x2812a591be1ed7fc42eef45d03963280304d65e3f0c73aa915137ba508365730) |

---

## Project Structure

```
D-SIVC/
├── app/                        # Expo Router application screens & navigation
│   ├── (admin)/                # Administrative workspace
│   │   ├── _layout.tsx
│   │   ├── credentials.tsx    # Credential management & revocation
│   │   ├── dashboard.tsx      # Admin stats & navigation hub
│   │   ├── issue.tsx          # Credential issuance form
│   │   └── students.tsx       # Student registry list
│   ├── (auth)/                 # Authentication screens
│   │   ├── _layout.tsx
│   │   ├── login.tsx          # User login
│   │   └── register.tsx       # User registration
│   ├── (student)/              # Student workspace
│   │   ├── _layout.tsx
│   │   ├── [id].tsx           # Student credential detail view
│   │   ├── credentials.tsx    # Student credentials list
│   │   └── dashboard.tsx      # Student profile & dashboard
│   ├── verify/                 # Public verification screen
│   │   └── index.tsx          # Public credential authenticator
│   ├── _layout.tsx             # Root app navigator & AuthProvider
│   └── index.tsx               # App entry routing redirect
├── assets/                     # Application branding & image assets
├── blockchain/                 # Hardhat smart contract development workspace
│   ├── contracts/
│   │   └── StudentCredentialRegistry.sol
│   ├── deployment/
│   │   └── amoy-deployment.json
│   ├── scripts/
│   │   └── deploy.ts
│   ├── test/
│   │   └── StudentCredentialRegistry.test.ts
│   ├── hardhat.config.ts
│   └── package.json
├── components/                 # Shared React Native UI components
│   ├── CustomButton.tsx
│   ├── CustomInput.tsx
│   └── StatusBadge.tsx
├── constants/                  # Color theme & application constants
│   └── theme.ts
├── context/                    # React Context providers
│   └── AuthContext.tsx
├── lib/                        # Supabase client initialization
│   └── supabase.ts
├── services/                   # Frontend API services
│   ├── authService.ts
│   ├── credentialService.ts
│   └── verificationService.ts
├── supabase/                   # Database migrations & Edge Functions
│   ├── functions/
│   │   ├── issue-credential/   # Server-side anchoring Edge Function
│   │   └── revoke-credential/  # Server-side revocation Edge Function
│   └── migrations/
│       └── 20260925_init_schema.sql
├── types/                      # TypeScript interface definitions
│   └── index.ts
├── app.json                    # Expo configuration file
├── package.json                # React Native project dependencies
├── tsconfig.json               # TypeScript compiler configuration
└── README.md                   # Project documentation
```

---

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- [Expo Go](https://expo.dev/go) app on mobile or iOS/Android emulator

### Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Kuldeepbishnoi2005/D-SIVC.git
   cd D-SIVC
   ```

2. **Install Mobile Application Dependencies**:
   ```bash
   npm install
   ```

3. **Install Smart Contract Workspace Dependencies**:
   ```bash
   cd blockchain
   npm install
   cd ..
   ```

4. **Configure Environment Variables**:
   Create a `.env` file in the project root:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Create a `blockchain/.env` file for Hardhat development:
   ```env
   BLOCKCHAIN_PRIVATE_KEY=your_deployer_private_key
   POLYGON_AMOY_RPC_URL=https://polygon-amoy.drpc.org
   ```

5. **Start the Mobile Application**:
   ```bash
   npx expo start
   ```

---

## Environment Variables

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_SUPABASE_URL` | Mobile App | URL of the Supabase project backend |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mobile App | Public anon key for client-side Supabase authentication |
| `BLOCKCHAIN_PRIVATE_KEY` | Edge Function / Hardhat | Server-side private key used for smart contract interactions |
| `POLYGON_AMOY_RPC_URL` | Edge Function / Hardhat | RPC node URL for connecting to Polygon Amoy Testnet |
| `CONTRACT_ADDRESS` | Edge Function | Deployed `StudentCredentialRegistry` smart contract address |

> **Security Mandate**:
> - Never commit `.env` or `blockchain/.env` files to version control.
> - The blockchain private key MUST remain exclusively on the server (Supabase Edge Function secrets). It is NEVER bundled into client-side mobile app code.

---

## Running the Project

### Mobile App Development
```bash
# Start Expo development server
npx expo start

# Run on Android emulator / device
npx expo start --android

# Run on iOS simulator
npx expo start --ios
```

### Blockchain & Smart Contract Commands
```bash
cd blockchain

# Compile Solidity contracts
npm run compile

# Run Hardhat smart contract test suite
npm test

# Deploy to Polygon Amoy Testnet
npm run deploy:amoy
```

---

## Testing & Quality Assurance

The project codebase has passed all automated type-checking, linting, and health diagnostics:

```bash
# TypeScript Typecheck
npx tsc --noEmit
# Result: 0 errors

# Code Linting
npx expo lint
# Result: 0 errors, 0 warnings

# Project Health Check
npx expo-doctor
# Result: 21/21 checks passed

# Smart Contract Unit Tests
cd blockchain && npm test
# Result: 14/14 tests passed
```

---

## Security Considerations

- **Server-Side Key Management**: The institutional private key required for blockchain write operations (`issueCredential`, `revokeCredential`) is executed solely within Supabase Edge Functions.
- **Row Level Security (RLS)**: PostgreSQL tables strictly enforce user data segregation. Students can only read their own credential records.
- **Role-Based Authorization**: Administrative procedures check both JWT claims and database profile roles before authorizing issuance or revocation.
- **Data Privacy (Zero PII On-Chain)**: Only cryptographic SHA-256 hashes are recorded on-chain, preventing public exposure of personal student data.

---

## Limitations

- **Testnet Deployment**: The application is currently deployed on the Polygon Amoy Testnet (Chain ID 80002).
- **Off-Chain Dependency**: Full credential inspection (student name, roll number, course) relies on Supabase database availability.
- **Testnet Faucet Gas**: On-chain operations depend on testnet POL availability for gas fees.
- **Capstone Prototype**: Designed as an academic prototype for institutional credential verification.

---

## Future Scope

- **QR Code Verification**: Integration of native QR code generation and mobile camera scanning for offline verifier lookups.
- **Multi-Institution Support**: Support for multiple issuing universities under a federated smart contract authority.
- **W3C Verifiable Credentials Alignment**: Adapting payload structures to standard W3C VC data models.
- **Mainnet Production Deployment**: Transitioning to Polygon PoS Mainnet or Ethereum L2 scaling solutions.

---

## Screenshots

> *Placeholder: Screenshots of the application interface will be added here.*

<!--
![Login Screen](docs/screenshots/login.png)
![Student Dashboard](docs/screenshots/student_dashboard.png)
![Admin Issuance](docs/screenshots/admin_issue.png)
![Public Verification](docs/screenshots/verify.png)
-->

---

## Academic Project

**D-SIVC** was developed as a Capstone Project for the **B.Tech in Computer Science & Engineering (with AI Specialization)** degree program.

- **Developer**: Kuldeep Bishnoi
- **Academic Batch**: [Batch Year Placeholder]
- **Department**: Department of Computer Science & Engineering
- **Institution**: [Institution Name Placeholder]

---

## License

This project includes components under the **MIT License**. Refer to the [LICENSE](LICENSE) file for detailed licensing terms.

---

## Contributors

- **Kuldeep Bishnoi** - Lead Developer ([@Kuldeepbishnoi2005](https://github.com/Kuldeepbishnoi2005))
