export type EvidenceStatus =
  | "extracted"
  | "review_required"
  | "verified"
  | "conflict"
  | "deprecated";

export type EvidenceExtractionMethod =
  | "manual"
  | "ai_extraction"
  | "manufacturer_catalog"
  | "standards_database"
  | "demo_fixture";
