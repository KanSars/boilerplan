import type { Requirement } from "@/domain/evidence/Requirement";
import type { RuleEvaluation } from "@/domain/evidence/RuleEvaluation";
import type { EvidenceLink } from "@/domain/evidence/EvidenceLink";

export const requirementHasCitation = (requirement: Requirement): boolean =>
  requirement.citations.length > 0;

export const ruleEvaluationReferencesRequirement = (
  evaluation: RuleEvaluation,
  requirement: Requirement,
): boolean => evaluation.requirementId === requirement.id;

export const evidenceLinkTargetsEntity = (
  link: EvidenceLink,
  targetKind: EvidenceLink["target"]["kind"],
  targetId: string,
): boolean => link.target.kind === targetKind && link.target.id === targetId;
