export type PilotCalculationStatus =
  | "calculated_review_required"
  | "insufficient_data"
  | "not_applicable";

export type PilotCalculationResult = {
  id: string;
  title: string;
  status: PilotCalculationStatus;
  sourceDocumentIds: string[];
  formula: string;
  inputs: Record<string, number | string>;
  outputs: Record<string, number | string>;
  limitations: string[];
};
