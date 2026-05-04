"use client";

import type { ValidationIssue } from "@/domain/validation/ValidationIssue";

type Props = {
  issues: ValidationIssue[];
  aiExplanation: string;
};

export function ValidationPanel({ issues, aiExplanation }: Props) {
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
      </div>
      <p className="ai-note">{aiExplanation}</p>
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
    placeholder_engineering_compliance_warning: "Ограничения проверки v0",
  };
  return labels[ruleId] ?? ruleId;
};
