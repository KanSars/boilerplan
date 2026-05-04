export type { ApplicabilityCondition } from "@/domain/evidence/ApplicabilityCondition";
export type { CompiledRule, CompiledRuleKind } from "@/domain/evidence/CompiledRule";
export type { DocumentCitation } from "@/domain/evidence/DocumentCitation";
export type { EvidenceLink, EvidenceLinkRelation } from "@/domain/evidence/EvidenceLink";
export type { EvidenceExtractionMethod, EvidenceStatus } from "@/domain/evidence/EvidenceStatus";
export type { EvidenceTarget, EvidenceTargetKind } from "@/domain/evidence/EvidenceTarget";
export type {
  EvidenceLinkRepository,
  RequirementRepository,
  RuleCompiler,
  RuleEvaluationContext,
  RuleEvaluator,
} from "@/domain/evidence/EvidenceRepository";
export type { Requirement, RequirementCategory } from "@/domain/evidence/Requirement";
export type { RuleEvaluation, RuleEvaluationOutcome } from "@/domain/evidence/RuleEvaluation";
export type { SourceDocument, SourceDocumentKind } from "@/domain/evidence/SourceDocument";
export {
  evidenceLinkTargetsEntity,
  requirementHasCitation,
  ruleEvaluationReferencesRequirement,
} from "@/domain/evidence/evidenceGuards";
