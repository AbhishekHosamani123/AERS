export const evidenceStatuses = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "REVISION_REQUIRED",
  "RESUBMITTED",
  "APPROVED",
] as const;

export type EvidenceStatus = (typeof evidenceStatuses)[number];

const allowedTransitions: Record<EvidenceStatus, readonly EvidenceStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED", "REVISION_REQUIRED"],
  REVISION_REQUIRED: ["RESUBMITTED"],
  RESUBMITTED: ["UNDER_REVIEW"],
  APPROVED: [],
};

export function canTransitionEvidenceStatus(from: EvidenceStatus, to: EvidenceStatus): boolean {
  return allowedTransitions[from].includes(to);
}

export function requiresRevisionFeedback(to: EvidenceStatus): boolean {
  return to === "REVISION_REQUIRED";
}

export function isHumanVerified(status: EvidenceStatus): boolean {
  return status === "APPROVED";
}

/**
 * Versions are append-only. A revision always creates a new version instead
 * of mutating the historical record that was previously reviewed.
 */
export function nextEvidenceVersion(existingVersions: readonly number[]): number {
  if (existingVersions.length === 0) return 1;
  return Math.max(...existingVersions) + 1;
}

export function learnerCanRevise(status: EvidenceStatus): boolean {
  return status === "REVISION_REQUIRED";
}
