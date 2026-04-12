/**
 * Guardian AI — TrustLedger Cryptographic Hashing
 * SHA-256 audit trail hashing using Web Crypto API
 */

/**
 * Generate SHA-256 hash of any data payload
 * Used for TrustLedger audit trail integrity
 */
export async function generateHash(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(typeof data === 'string' ? data : JSON.stringify(data));
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a payload against a stored hash
 */
export async function verifyHash(data, expectedHash) {
  const computedHash = await generateHash(data);
  return computedHash === expectedHash;
}

/**
 * Generate a chain hash — links current action to previous
 * This creates the immutable audit chain for TrustLedger
 */
export async function generateChainHash(payload, previousHash) {
  const chainData = JSON.stringify({
    payload,
    previousHash: previousHash || 'GENESIS',
    timestamp: Date.now(),
  });
  return generateHash(chainData);
}

/**
 * Create a complete audit entry with hash
 */
export async function createAuditEntry({
  userId,
  orgId,
  actionType,
  entityType,
  entityId,
  payload,
  previousHash,
}) {
  const payloadHash = await generateHash(payload);
  const chainHash = await generateChainHash(
    { actionType, entityType, entityId, payloadHash },
    previousHash
  );

  return {
    userId,
    orgId,
    actionType,
    entityType,
    entityId,
    payloadHash,
    chainHash,
    loggedAt: new Date().toISOString(),
    verified: true,
  };
}
