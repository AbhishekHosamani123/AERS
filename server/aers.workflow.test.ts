import { describe, expect, it } from "vitest";
import {
  canTransitionEvidenceStatus,
  isHumanVerified,
  learnerCanRevise,
  nextEvidenceVersion,
  requiresRevisionFeedback,
} from "../shared/aers-workflow";

describe("AERS evidence workflow", () => {
  it("allows the golden path from draft through human approval", () => {
    expect(canTransitionEvidenceStatus("DRAFT", "SUBMITTED")).toBe(true);
    expect(canTransitionEvidenceStatus("SUBMITTED", "UNDER_REVIEW")).toBe(true);
    expect(canTransitionEvidenceStatus("UNDER_REVIEW", "REVISION_REQUIRED")).toBe(true);
    expect(canTransitionEvidenceStatus("REVISION_REQUIRED", "RESUBMITTED")).toBe(true);
    expect(canTransitionEvidenceStatus("RESUBMITTED", "UNDER_REVIEW")).toBe(true);
    expect(canTransitionEvidenceStatus("UNDER_REVIEW", "APPROVED")).toBe(true);
    expect(isHumanVerified("APPROVED")).toBe(true);
  });

  it("rejects invalid historical state changes", () => {
    expect(canTransitionEvidenceStatus("APPROVED", "DRAFT")).toBe(false);
    expect(canTransitionEvidenceStatus("APPROVED", "REVISION_REQUIRED")).toBe(false);
    expect(canTransitionEvidenceStatus("DRAFT", "APPROVED")).toBe(false);
    expect(isHumanVerified("UNDER_REVIEW")).toBe(false);
  });

  it("requires useful feedback before a learner revision", () => {
    expect(requiresRevisionFeedback("REVISION_REQUIRED")).toBe(true);
    expect(learnerCanRevise("REVISION_REQUIRED")).toBe(true);
    expect(learnerCanRevise("UNDER_REVIEW")).toBe(false);
  });

  it("creates an append-only next version", () => {
    expect(nextEvidenceVersion([])).toBe(1);
    expect(nextEvidenceVersion([1])).toBe(2);
    expect(nextEvidenceVersion([1, 3, 2])).toBe(4);
  });
});
