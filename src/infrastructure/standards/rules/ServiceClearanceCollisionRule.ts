import { getEquipmentClearanceRect, rectanglesOverlap } from "@/domain/geometry/rectangles";
import type { ValidationRule } from "@/domain/validation/ValidationRule";

export const ServiceClearanceCollisionRule: ValidationRule = {
  id: "service_clearance_collision_demo",
  name: "Демо-правило пересечения зон обслуживания",
  category: "placeholder-clearance",
  severity: "warning",
  standardReference: "Демо-значение; не является юридическим или инженерным нормативом.",
  validate(project, context) {
    const issues = [];
    for (let i = 0; i < project.equipmentInstances.length; i += 1) {
      for (let j = i + 1; j < project.equipmentInstances.length; j += 1) {
        const first = project.equipmentInstances[i];
        const second = project.equipmentInstances[j];
        const firstDefinition = context.equipmentDefinitions.find((item) => item.id === first.definitionId);
        const secondDefinition = context.equipmentDefinitions.find((item) => item.id === second.definitionId);
        if (!firstDefinition || !secondDefinition) continue;
        if (!rectanglesOverlap(getEquipmentClearanceRect(first, firstDefinition), getEquipmentClearanceRect(second, secondDefinition))) continue;
        issues.push({
          id: `${this.id}_${first.id}_${second.id}`,
          severity: "warning" as const,
          message: `${first.label}: зона обслуживания пересекается с ${second.label}. Это демо-правило; реальные нормы могут трактовать такую ситуацию иначе.`,
          entityIds: [first.id, second.id],
          ruleId: this.id,
          standardReference: this.standardReference,
          suggestedFix: "Проверьте требования к доступу для обслуживания и при необходимости разнесите оборудование.",
        });
      }
    }
    return issues;
  },
};
