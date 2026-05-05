import type { CompiledRule } from "@/domain/evidence/CompiledRule";
import type { EvidenceLink } from "@/domain/evidence/EvidenceLink";
import type { Requirement } from "@/domain/evidence/Requirement";
import type { SourceDocument } from "@/domain/evidence/SourceDocument";

export type EvidenceDataset = {
  sourceDocuments: SourceDocument[];
  requirements: Requirement[];
  compiledRules: CompiledRule[];
  evidenceLinks: EvidenceLink[];
};
