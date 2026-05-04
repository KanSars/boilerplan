import { getEquipmentBodyRect, rectanglesOverlap } from "@/domain/geometry/rectangles";
import type { ValidationRule } from "@/domain/validation/ValidationRule";

export const EquipmentBodyCollisionRule: ValidationRule = {
  id: "equipment_body_collision",
  name: "Пересечение корпусов оборудования",
  category: "geometry",
  severity: "error",
  validate(project, context) {
    const issues = [];
    for (let i = 0; i < project.equipmentInstances.length; i += 1) {
      for (let j = i + 1; j < project.equipmentInstances.length; j += 1) {
        const first = project.equipmentInstances[i];
        const second = project.equipmentInstances[j];
        const firstDefinition = context.equipmentDefinitions.find((item) => item.id === first.definitionId);
        const secondDefinition = context.equipmentDefinitions.find((item) => item.id === second.definitionId);
        if (!firstDefinition || !secondDefinition) continue;
        if (!rectanglesOverlap(getEquipmentBodyRect(first, firstDefinition), getEquipmentBodyRect(second, secondDefinition))) continue;
        issues.push({
          id: `${this.id}_${first.id}_${second.id}`,
          severity: "error" as const,
          message: `${first.label}: корпус пересекается с ${second.label}.`,
          entityIds: [first.id, second.id],
          ruleId: this.id,
          suggestedFix: "Переместите один из элементов так, чтобы корпуса оборудования не пересекались.",
        });
      }
    }
    return issues;
  },
};
