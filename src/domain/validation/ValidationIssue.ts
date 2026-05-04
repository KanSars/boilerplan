export type ValidationSeverity = "info" | "warning" | "error";

export type ValidationIssue = {
  id: string;
  severity: ValidationSeverity;
  message: string;
  entityIds: string[];
  ruleId: string;
  standardReference?: string;
  suggestedFix?: string;
};
