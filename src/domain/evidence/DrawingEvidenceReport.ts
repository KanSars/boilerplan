import type { EvidenceStatus } from "@/domain/evidence/EvidenceStatus";
import type { EvidenceTarget } from "@/domain/evidence/EvidenceTarget";

export type DrawingEvidenceReportItemKind =
  | "equipment"
  | "connection_point"
  | "pipe"
  | "valve"
  | "calculation"
  | "drawing";

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
  sourceDocumentIds: string[];
  items: DrawingEvidenceReportItem[];
  missingData: string[];
};
