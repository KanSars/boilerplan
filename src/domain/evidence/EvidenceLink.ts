import type { EvidenceStatus } from "@/domain/evidence/EvidenceStatus";
import type { EvidenceTarget } from "@/domain/evidence/EvidenceTarget";

export type EvidenceLinkRelation =
  | "supports"
  | "restricts"
  | "requires_review"
  | "conflicts_with"
  | "documents_source";

export type EvidenceLink = {
  id: string;
  target: EvidenceTarget;
  requirementId: string;
  citationIds: string[];
  relation: EvidenceLinkRelation;
  status: EvidenceStatus;
  note?: string;
};
