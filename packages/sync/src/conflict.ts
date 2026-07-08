export interface SyncRecord {
  id: string;
  hlcTimestamp: string;
  updatedAt: Date;
  deletedAt?: Date | null;
  [key: string]: any; // Payload fields
}

export interface ConflictResolutionResult<T> {
  resolved: T;
  hasConflict: boolean;
  action: 'local_win' | 'remote_win' | 'merged';
}

/**
 * Platform-agnostic conflict resolution helper.
 * Enforces the core rules:
 * 1. Delete wins: If either record is soft-deleted, the record remains deleted.
 * 2. Last Write Wins: Higher HLC timestamp wins.
 */
export function resolveConflict<T extends SyncRecord>(
  local: T,
  remote: T
): ConflictResolutionResult<T> {
  // Rule 1: Delete wins
  const localIsDeleted = !!local.deletedAt;
  const remoteIsDeleted = !!remote.deletedAt;

  if (localIsDeleted || remoteIsDeleted) {
    const resolved = localIsDeleted ? { ...local } : { ...remote };
    // Maintain deleted status
    resolved.deletedAt = local.deletedAt || remote.deletedAt;
    
    return {
      resolved,
      hasConflict: true,
      action: localIsDeleted ? 'local_win' : 'remote_win',
    };
  }

  // Rule 2: Last Write Wins by HLC timestamp comparison
  const hlcCompare = local.hlcTimestamp.localeCompare(remote.hlcTimestamp);

  if (hlcCompare > 0) {
    // Local wins because its HLC is newer
    return {
      resolved: { ...local },
      hasConflict: true,
      action: 'local_win',
    };
  } else if (hlcCompare < 0) {
    // Remote wins because its HLC is newer
    return {
      resolved: { ...remote },
      hasConflict: true,
      action: 'remote_win',
    };
  }

  // If HLCs are equal (which should only happen if clientIDs and counters match),
  // fallback to physical updatedAt timestamp comparison
  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();

  if (localTime >= remoteTime) {
    return {
      resolved: { ...local },
      hasConflict: false,
      action: 'local_win',
    };
  } else {
    return {
      resolved: { ...remote },
      hasConflict: false,
      action: 'remote_win',
    };
  }
}
