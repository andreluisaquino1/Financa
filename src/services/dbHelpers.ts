/**
 * Database helpers for consistent query patterns across all services.
 * These utilities enforce soft delete as a domain rule.
 */

/**
 * Standard soft delete timestamp
 * @returns ISO timestamp string for deleted_at column
 */
export const getSoftDeleteTimestamp = (): string => new Date().toISOString();

/**
 * Build the standard soft delete update payload
 */
export const softDeletePayload = () => ({
    deleted_at: getSoftDeleteTimestamp()
});

/**
 * Build the restore payload (remove soft delete)
 */
export const restorePayload = () => ({
    deleted_at: null
});

/**
 * Type guard to check if a record has been soft deleted
 */
export const isSoftDeleted = (record: { deleted_at?: string | null }): boolean => {
    return record.deleted_at != null;
};

/**
 * Filter an array to exclude soft deleted records
 */
export const excludeSoftDeleted = <T extends { deleted_at?: string | null }>(records: T[]): T[] => {
    return records.filter(r => !isSoftDeleted(r));
};
