"use client";

import type { EngineeringReviewReport } from "@/domain/review/EngineeringReviewReport";
import type { ValidationIssue } from "@/domain/validation/ValidationIssue";

type Props = {
  issues: ValidationIssue[];
  aiExplanation: string;
  reviewReport: EngineeringReviewReport;
};

export function ValidationPanel({ issues, aiExplanation, reviewReport }: Props) {
  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.filter((issue) => issue.severity === "warning").length;
  const info = issues.filter((issue) => issue.severity === "info").length;

  return (
    <section className="panel-section validation-panel">
      <h2>Отчёт проверки</h2>
      <div className="validation-summary">
        <span className="badge error">Ошибки: {errors}</span>
        <span className="badge warning">Предупреждения: {warnings}</span>
        <span className="badge info">Информация: {info}</span>
        <span className={`badge ${reviewReport.overallStatus === "blocked" ? "error" : "warning"}`}>
          Review: {reviewReport.overallStatus === "blocked" ? "нужна доработка" : "можно в CAD с ограничениями"}
        </span>
      </div>
      <p className="ai-note">{aiExplanation}</p>
      <article className={`review-summary ${reviewReport.overallStatus === "blocked" ? "error" : "warning"}`}>
        <strong>{reviewReport.title}</strong>
        <p>{reviewReport.summary}</p>
      </article>
      <div className="issue-list">
        {reviewReport.findings.map((finding) => (
          <article className={`issue ${toIssueSeverity(finding.status)}`} key={finding.id}>
            <strong>{translateFindingStatus(finding.status)}</strong>
            <p>{finding.title}</p>
            <small>{finding.summary}</small>
          </article>
        ))}
      </div>
      <div className="cad-checklist">
        <h3>Что вручную добить в CAD</h3>
        <div className="issue-list">
          {reviewReport.manualCadActions.map((action) => (
            <article className={`issue ${action.priority === "required" ? "warning" : "info"}`} key={action.id}>
              <strong>{action.title}</strong>
              <p>{action.details}</p>
              <small>{action.priority === "required" ? "Обязательно" : "Рекомендуется"}</small>
            </article>
          ))}
        </div>
      </div>
      <div className="issue-list">
        {issues.map((issue) => (
          <article className={`issue ${issue.severity}`} key={issue.id}>
            <strong>{translateRuleId(issue.ruleId)}</strong>
            <p>{issue.message}</p>
            {issue.entityIds.length > 0 && <small>Затронутые элементы: {issue.entityIds.join(", ")}</small>}
          </article>
        ))}
      </div>
    </section>
  );
}

const translateRuleId = (ruleId: string): string => {
  const labels: Record<string, string> = {
    equipment_inside_room: "Оборудование внутри границ помещения",
    equipment_body_collision: "Пересечение корпусов оборудования",
    service_clearance_collision_demo: "Пересечение зон обслуживания",
    required_connection_points: "Обязательные точки подключения",
    missing_required_connection_target: "Отсутствуют точки подключения",
    ambiguous_connection: "Несколько вариантов подключения",
    connection_point_data_quality: "Качество данных точки подключения",
    placeholder_engineering_compliance_warning: "Ограничения проверки v0",
    required_pilot_kit_elements: "Обязательные элементы минимального состава",
  };
  return labels[ruleId] ?? ruleId;
};

const translateFindingStatus = (status: EngineeringReviewReport["findings"][number]["status"]): string => {
  const labels: Record<EngineeringReviewReport["findings"][number]["status"], string> = {
    confirmed_by_model: "Подтверждено моделью",
    confirmed_by_source: "Подтверждено источником",
    requires_document: "Нужен документ",
    requires_calculation: "Нужен расчёт",
    requires_engineer: "Нужен инженер",
  };
  return labels[status];
};

const toIssueSeverity = (status: EngineeringReviewReport["findings"][number]["status"]): ValidationIssue["severity"] => {
  if (status === "confirmed_by_model" || status === "confirmed_by_source") return "info";
  if (status === "requires_document" || status === "requires_calculation") return "warning";
  return "error";
};
