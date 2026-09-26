// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StudentCredentialRegistry
 * @dev Decentralized Student Identity and Authentication Registry for Verifiable Credentials.
 * Allows an authorized college/institution admin (contract owner) to issue and revoke credentials,
 * and enables public verification of SHA-256 credential hashes against stored on-chain anchors.
 */
contract StudentCredentialRegistry is Ownable {

    struct CredentialRecord {
        bytes32 credentialHash;
        address issuer;
        uint256 issuedAt;
        bool revoked;
        bool exists;
    }

    // Mapping from unique credential ID (e.g. "DSIVC-1710000000-123") to its on-chain CredentialRecord
    mapping(string => CredentialRecord) private _credentials;

    // Events
    event CredentialIssued(
        string indexed credentialId,
        bytes32 credentialHash,
        address indexed issuer,
        uint256 timestamp
    );

    event CredentialRevoked(
        string indexed credentialId,
        address indexed revoker,
        uint256 timestamp
    );

    /**
     * @dev Initializes the contract setting msg.sender as initial owner.
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Issue a new verifiable credential record on-chain.
     * @param credentialId Unique string identifier for the credential (e.g. DSIVC-...)
     * @param credentialHash SHA-256 hash of the credential payload formatted as bytes32
     */
    function issueCredential(
        string calldata credentialId,
        bytes32 credentialHash
    ) external onlyOwner {
        require(bytes(credentialId).length > 0, "Invalid credential ID");
        require(credentialHash != bytes32(0), "Invalid credential hash");
        require(!_credentials[credentialId].exists, "Credential already exists");

        _credentials[credentialId] = CredentialRecord({
            credentialHash: credentialHash,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            revoked: false,
            exists: true
        });

        emit CredentialIssued(
            credentialId,
            credentialHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @dev Revoke an existing credential.
     * @param credentialId Unique string identifier for the credential
     */
    function revokeCredential(string calldata credentialId) external onlyOwner {
        require(_credentials[credentialId].exists, "Credential does not exist");
        require(!_credentials[credentialId].revoked, "Credential already revoked");

        _credentials[credentialId].revoked = true;

        emit CredentialRevoked(credentialId, msg.sender, block.timestamp);
    }

    /**
     * @dev Public function to verify a credential against an expected SHA-256 hash.
     * @param credentialId Unique string identifier
     * @param expectedHash SHA-256 hash to verify against
     * @return isValid True if credential exists, hash matches, and is not revoked
     * @return isRevoked True if credential exists and has been revoked
     * @return issuedAt Unix timestamp when the credential was anchored
     */
    function verifyCredential(
        string calldata credentialId,
        bytes32 expectedHash
    )
        external
        view
        returns (
            bool isValid,
            bool isRevoked,
            uint256 issuedAt
        )
    {
        CredentialRecord memory record = _credentials[credentialId];
        if (!record.exists) {
            return (false, false, 0);
        }

        bool valid = (record.credentialHash == expectedHash && !record.revoked);
        return (valid, record.revoked, record.issuedAt);
    }

    /**
     * @dev Public function to inspect raw credential metadata on-chain.
     * @param credentialId Unique string identifier
     */
    function getCredential(string calldata credentialId)
        external
        view
        returns (
            bytes32 credentialHash,
            address issuer,
            uint256 issuedAt,
            bool revoked,
            bool exists
        )
    {
        CredentialRecord memory record = _credentials[credentialId];
        return (
            record.credentialHash,
            record.issuer,
            record.issuedAt,
            record.revoked,
            record.exists
        );
    }
}
