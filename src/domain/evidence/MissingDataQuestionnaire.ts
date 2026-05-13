import type { EvidenceStatus } from "@/domain/evidence/EvidenceStatus";
import type { EvidenceTarget } from "@/domain/evidence/EvidenceTarget";

export type MissingDataQuestionAnswerStatus =
  | "unknown"
  | "closed_from_model"
  | "closed_from_source"
  | "provided_by_user"
  | "provided_by_customer"
  | "requires_engineer_review";

export type MissingDataQuestionTopic =
  | "connection_geometry"
  | "collector_applicability"
  | "pipe_hydraulic_calculation"
  | "gas_system_review"
  | "standards_applicability"
  | "valve_selection";

export type MissingDataQuestion = {
  id: string;
  topic: MissingDataQuestionTopic;
  text: string;
  reason: string;
  target: EvidenceTarget;
  status: EvidenceStatus;
  answerStatus: MissingDataQuestionAnswerStatus;
  suggestedAnswerFormat: "text" | "number" | "yes_no" | "document_reference";
};

export type MissingDataQuestionnaire = {
  id: string;
  title: string;
  status: EvidenceStatus;
  projectPassport?: Record<string, string | number | boolean>;
  questions: MissingDataQuestion[];
  closedQuestions: MissingDataQuestion[];
  fullReportQuestions: MissingDataQuestion[];
};
