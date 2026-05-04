import { getEquipmentBodyRect, rectangleInsideRoom } from "@/domain/geometry/rectangles";
import type { ValidationRule } from "@/domain/validation/ValidationRule";

export const EquipmentInsideRoomRule: ValidationRule = {
  id: "equipment_inside_room",
  name: "Оборудование внутри границ помещения",
  category: "geometry",
  severity: "error",
  validate(project, context) {
    return project.equipmentInstances.flatMap((instance) => {
      const definition = context.equipmentDefinitions.find((item) => item.id === instance.definitionId);
      if (!definition) return [];
      const rect = getEquipmentBodyRect(instance, definition);
      if (rectangleInsideRoom(rect, project.room)) return [];
      return [{
        id: `${this.id}_${instance.id}`,
        severity: "error",
        message: `${instance.label}: корпус находится за границами котельной.`,
        entityIds: [instance.id],
        ruleId: this.id,
        suggestedFix: "Переместите оборудование полностью внутрь помещения или увеличьте размеры котельной.",
      }];
    });
  },
};
