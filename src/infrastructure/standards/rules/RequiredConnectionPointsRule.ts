import type { ValidationRule } from "@/domain/validation/ValidationRule";

export const RequiredConnectionPointsRule: ValidationRule = {
  id: "required_connection_points",
  name: "Обязательные точки подключения котла",
  category: "equipment-data",
  severity: "error",
  validate(project, context) {
    return project.equipmentInstances.flatMap((instance) => {
      const definition = context.equipmentDefinitions.find((item) => item.id === instance.definitionId);
      if (!definition || definition.category !== "boiler") return [];
      const hasSupply = definition.connectionPoints.some((point) => point.type === "supply");
      const hasReturn = definition.connectionPoints.some((point) => point.type === "return");
      if (hasSupply && hasReturn) return [];
      return [{
        id: `${this.id}_${instance.id}`,
        severity: "error",
        message: `${instance.label}: в данных каталога нет обязательной точки подачи или обратки.`,
        entityIds: [instance.id, definition.id],
        ruleId: this.id,
        suggestedFix: "Добавьте в описание оборудования минимум одну точку подачи и одну точку обратки.",
      }];
    });
  },
};
