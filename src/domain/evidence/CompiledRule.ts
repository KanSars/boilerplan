import type { EvidenceStatus } from "@/domain/evidence/EvidenceStatus";
import type { ValidationSeverity } from "@/domain/validation/ValidationIssue";

export type CompiledRuleKind =
  | "minimum_distance"
  | "maximum_distance"
  | "required_connection"
  | "forbidden_overlap"
  | "required_presence"
  | "manual_review"
  | "demo";

export type CompiledRule = {
  id: string;
  requirementId: string;
  kind: CompiledRuleKind;
  status: EvidenceStatus;
  severity: ValidationSeverity;
  parameters: Record<string, string | number | boolean>;
  description: string;
};
