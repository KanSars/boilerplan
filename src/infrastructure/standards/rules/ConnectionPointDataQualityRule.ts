import { getAllWorldConnectionPoints } from "@/domain/geometry/transforms";
import type { ValidationRule } from "@/domain/validation/ValidationRule";

export const ConnectionPointDataQualityRule: ValidationRule = {
  id: "connection_point_data_quality",
  name: "Качество данных точки подключения",
  category: "connection-point-data",
  severity: "warning",
  validate(project, context) {
    return getAllWorldConnectionPoints(project, context.equipmentDefinitions)
      .filter((point) => point.source === "ai_extracted_pdf" && (point.confidence ?? 0) < 0.7)
      .map((point) => ({
        id: `${this.id}_${point.equipmentInstanceId}_${point.connectionPointId}`,
        severity: "warning",
        message: "Точка подключения извлечена автоматически и требует проверки",
        entityIds: [point.equipmentInstanceId],
        ruleId: this.id,
      }));
  },
};
