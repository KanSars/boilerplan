export type EngineeringReviewFindingStatus =
  | "confirmed_by_model"
  | "confirmed_by_source"
  | "requires_document"
  | "requires_calculation"
  | "requires_engineer";

export type EngineeringReviewOverallStatus =
  | "ready_with_limitations"
  | "blocked";

export type EngineeringReviewFinding = {
  id: string;
  title: string;
  status: EngineeringReviewFindingStatus;
  summary: string;
  targetLabel: string;
};

export type CadManualActionPriority = "required" | "recommended";

export type CadManualAction = {
  id: string;
  title: string;
  details: string;
  priority: CadManualActionPriority;
};

export type EngineeringReviewReport = {
  id: string;
  title: string;
  overallStatus: EngineeringReviewOverallStatus;
  summary: string;
  findings: EngineeringReviewFinding[];
  manualCadActions: CadManualAction[];
};
