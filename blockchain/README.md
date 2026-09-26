# D-SIVC Blockchain Subsystem

Decentralized Student Identity & Verifiable Credentials Registry Smart Contract on Polygon Amoy Testnet.

## Overview
This module contains the Solidity smart contract, Hardhat configuration, automated tests, and deployment scripts for `StudentCredentialRegistry.sol`.

---

## Deployment Record (Polygon Amoy Testnet)

```yaml
Network: Polygon Amoy Testnet
Chain ID: 80002
Contract Address: 0x9ee5cd0d9D08d07d5547b2402240aD11F9761cA0
Deployment TX: 0x4eee6965499d88482e4cd4805916e7e88701c224c0aa60c29c3646023ef8df23
Contract Explorer: https://amoy.polygonscan.com/address/0x9ee5cd0d9D08d07d5547b2402240aD11F9761cA0
Transaction Explorer: https://amoy.polygonscan.com/tx/0x4eee6965499d88482e4cd4805916e7e88701c224c0aa60c29c3646023ef8df23
Deployer Address: 0x1CAC754CcEecfBb449ebc5F52D7bA3af2B80a26b
```

---

## Hash Conversion Specification
The D-SIVC mobile app generates standard **SHA-256** hashes of credential payloads.

```
SHA-256 hexadecimal string (64 characters)
       ↓
Ensure "0x" prefix present (66 characters total)
       ↓
Pass as bytes32 parameter to Solidity functions
```

*Example:*
- **Payload SHA-256**: `8a9b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b`
- **Solidity `bytes32`**: `0x8a9b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b`

---

## Contract Architecture

### `StudentCredentialRegistry.sol`
- **Base**: OpenZeppelin `Ownable`
- **Data Structure**:
  ```solidity
  struct CredentialRecord {
      bytes32 credentialHash;
      address issuer;
      uint256 issuedAt;
      bool revoked;
      bool exists;
  }
  ```
- **Functions**:
  - `issueCredential(string credentialId, bytes32 credentialHash)`: Only owner. Emits `CredentialIssued`.
  - `revokeCredential(string credentialId)`: Only owner. Emits `CredentialRevoked`.
  - `verifyCredential(string credentialId, bytes32 expectedHash)`: Public view. Returns `(isValid, isRevoked, issuedAt)`.
  - `getCredential(string credentialId)`: Public view. Returns record details.

---

## Environment Configuration

Copy `.env.example` to `.env` inside the `blockchain` folder or set environment variables:

```env
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
BLOCKCHAIN_PRIVATE_KEY=your_private_key_without_or_with_0x
```

> **Security Note:** Never commit private keys to GitHub or expose them in source code.

---

## Quick Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Compile Contract
```bash
npm run compile
```

### 3. Run Automated Tests
```bash
npm run test
```

### 4. Deploy Locally
```bash
npm run deploy:local
```

### 5. Deploy to Polygon Amoy Testnet
```bash
npm run deploy:amoy
```
