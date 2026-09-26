import { expect } from "chai";
import { ethers } from "hardhat";
import { StudentCredentialRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("StudentCredentialRegistry Smart Contract Tests", function () {
  let registry: StudentCredentialRegistry;
  let owner: HardhatEthersSigner;
  let nonOwner: HardhatEthersSigner;

  const testCredId = "DSIVC-2026-TEST-001";
  const rawHashHex = "0x8a9b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b";
  const wrongHashHex = "0x1111111111111111111111111111111111111111111111111111111111111111";

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    nonOwner = signers[1];

    const Factory = await ethers.getContractFactory("StudentCredentialRegistry");
    registry = await Factory.deploy();
    await registry.waitForDeployment();
  });

  it("1. Contract deployment succeeds", async function () {
    const address = await registry.getAddress();
    expect(address).to.be.a("string");
    expect(address).to.not.equal(ethers.ZeroAddress);
  });

  it("2. Owner is correct", async function () {
    const contractOwner = await registry.owner();
    expect(contractOwner).to.equal(owner.address);
  });

  it("3. Owner can issue credential", async function () {
    await expect(registry.issueCredential(testCredId, rawHashHex))
      .to.emit(registry, "CredentialIssued")
      .withArgs(testCredId, rawHashHex, owner.address, (val: any) => val > 0);
  });

  it("4. Credential exists after issuance", async function () {
    await registry.issueCredential(testCredId, rawHashHex);
    const result = await registry.getCredential(testCredId);
    expect(result.exists).to.be.true;
  });

  it("5. Stored hash matches issued hash", async function () {
    await registry.issueCredential(testCredId, rawHashHex);
    const result = await registry.getCredential(testCredId);
    expect(result.credentialHash).to.equal(rawHashHex);
  });

  it("6. Issuer address is recorded correctly", async function () {
    await registry.issueCredential(testCredId, rawHashHex);
    const result = await registry.getCredential(testCredId);
    expect(result.issuer).to.equal(owner.address);
  });

  it("7. Credential is not revoked initially", async function () {
    await registry.issueCredential(testCredId, rawHashHex);
    const result = await registry.getCredential(testCredId);
    expect(result.revoked).to.be.false;
  });

  it("8. Verification with correct hash returns valid", async function () {
    await registry.issueCredential(testCredId, rawHashHex);
    const [isValid, isRevoked, issuedAt] = await registry.verifyCredential(testCredId, rawHashHex);
    expect(isValid).to.be.true;
    expect(isRevoked).to.be.false;
    expect(issuedAt).to.be.gt(0);
  });

  it("9. Verification with wrong hash returns invalid", async function () {
    await registry.issueCredential(testCredId, rawHashHex);
    const [isValid, isRevoked] = await registry.verifyCredential(testCredId, wrongHashHex);
    expect(isValid).to.be.false;
    expect(isRevoked).to.be.false;
  });

  it("10. Non-owner cannot issue credential", async function () {
    await expect(
      registry.connect(nonOwner).issueCredential("DSIVC-UNAUTH", rawHashHex)
    ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
  });

  it("11. Owner can revoke credential", async function () {
    await registry.issueCredential(testCredId, rawHashHex);
    await expect(registry.revokeCredential(testCredId))
      .to.emit(registry, "CredentialRevoked")
      .withArgs(testCredId, owner.address, (val: any) => val > 0);
  });

  it("12. Verification after revoke reports revoked", async function () {
    await registry.issueCredential(testCredId, rawHashHex);
    await registry.revokeCredential(testCredId);

    const [isValid, isRevoked] = await registry.verifyCredential(testCredId, rawHashHex);
    expect(isValid).to.be.false;
    expect(isRevoked).to.be.true;

    const details = await registry.getCredential(testCredId);
    expect(details.revoked).to.be.true;
  });

  it("13. Non-owner cannot revoke credential", async function () {
    await registry.issueCredential(testCredId, rawHashHex);
    await expect(
      registry.connect(nonOwner).revokeCredential(testCredId)
    ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
  });

  it("14. Duplicate credential IDs are rejected", async function () {
    await registry.issueCredential(testCredId, rawHashHex);
    await expect(
      registry.issueCredential(testCredId, rawHashHex)
    ).to.be.revertedWith("Credential already exists");
  });
});
