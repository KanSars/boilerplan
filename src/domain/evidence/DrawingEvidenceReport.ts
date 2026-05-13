import type { EvidenceStatus } from "@/domain/evidence/EvidenceStatus";
import type { EvidenceTarget } from "@/domain/evidence/EvidenceTarget";

export type DrawingEvidenceReportItemKind =
  | "project"
  | "equipment"
  | "connection_point"
  | "connection_review"
  | "pipe"
  | "valve"
  | "calculation"
  | "drawing";

export type DrawingEvidenceGapTopic =
  | "connection_geometry"
  | "collector_applicability"
  | "pipe_hydraulic_calculation"
  | "gas_system_review"
  | "standards_applicability"
  | "valve_selection";

export type DrawingEvidenceGapAnswerStatus =
  | "unknown"
  | "closed_from_model"
  | "closed_from_source"
  | "requires_engineer_review";

export type DrawingEvidenceGapAnswerFormat =
  | "text"
  | "number"
  | "yes_no"
  | "document_reference";

export type DrawingEvidenceGap = {
  id: string;
  topic: DrawingEvidenceGapTopic;
  text: string;
  reason: string;
  target: EvidenceTarget;
  status: EvidenceStatus;
  answerStatus: DrawingEvidenceGapAnswerStatus;
  suggestedAnswerFormat: DrawingEvidenceGapAnswerFormat;
};

export type DrawingEvidenceReportItem = {
  id: string;
  kind: DrawingEvidenceReportItemKind;
  label: string;
  target: EvidenceTarget;
  status: EvidenceStatus;
  sourceDocumentIds: string[];
  requirementIds: string[];
  citationIds: string[];
  facts: Record<string, string | number | boolean>;
  limitations: string[];
};

export type DrawingEvidenceReport = {
  id: string;
  drawingId: string;
  title: string;
  status: EvidenceStatus;
  disclaimer: string;
  projectPassport: Record<string, string | number | boolean>;
  sourceDocumentIds: string[];
  items: DrawingEvidenceReportItem[];
  structuredMissingData: DrawingEvidenceGap[];
  missingData: string[];
};
