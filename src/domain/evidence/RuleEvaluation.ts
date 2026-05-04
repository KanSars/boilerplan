import type { EvidenceStatus } from "@/domain/evidence/EvidenceStatus";
import type { EvidenceTarget } from "@/domain/evidence/EvidenceTarget";
import type { ValidationSeverity } from "@/domain/validation/ValidationIssue";

export type RuleEvaluationOutcome =
  | "passed"
  | "failed"
  | "not_applicable"
  | "manual_review_required"
  | "not_evaluated";

export type RuleEvaluation = {
  id: string;
  compiledRuleId: string;
  requirementId: string;
  outcome: RuleEvaluationOutcome;
  severity: ValidationSeverity;
  status: EvidenceStatus;
  target: EvidenceTarget;
  message: string;
  citationIds: string[];
};
