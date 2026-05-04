import type { ApplicabilityCondition } from "@/domain/evidence/ApplicabilityCondition";
import type { DocumentCitation } from "@/domain/evidence/DocumentCitation";
import type { EvidenceExtractionMethod, EvidenceStatus } from "@/domain/evidence/EvidenceStatus";

export type RequirementCategory =
  | "clearance"
  | "placement"
  | "connection"
  | "routing"
  | "ventilation"
  | "gas_safety"
  | "electrical_safety"
  | "fire_safety"
  | "documentation"
  | "demo";

export type Requirement = {
  id: string;
  title: string;
  text: string;
  category: RequirementCategory;
  status: EvidenceStatus;
  extractionMethod: EvidenceExtractionMethod;
  citations: DocumentCitation[];
  applicability: ApplicabilityCondition[];
  confidence?: number;
  notes?: string;
};
