import type { EvidenceStatus } from "@/domain/evidence/EvidenceStatus";

export type SourceDocumentKind =
  | "gost"
  | "sp"
  | "snip"
  | "manufacturer_manual"
  | "datasheet"
  | "internal_standard"
  | "demo";

export type SourceDocument = {
  id: string;
  kind: SourceDocumentKind;
  title: string;
  version?: string;
  publisher?: string;
  language: "ru" | "en" | "unknown";
  sourceUri?: string;
  retrievedAtIso?: string;
  status: EvidenceStatus;
  notes?: string;
};
