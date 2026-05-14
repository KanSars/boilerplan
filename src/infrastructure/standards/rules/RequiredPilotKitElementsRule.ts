import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import type { Project } from "@/domain/project/Project";
import type { ValidationRule } from "@/domain/validation/ValidationRule";

export const RequiredPilotKitElementsRule: ValidationRule = {
  id: "required_pilot_kit_elements",
  name: "Обязательные элементы минимального состава",
  category: "pilot-kit-completeness",
  severity: "error",
  validate(project, context) {
    const missing = getMissingElements(project.equipmentInstances, context.equipmentDefinitions);
    if (missing.length === 0) return [];
    return [{
      id: this.id,
      severity: "error",
      message: `Для минимального сценария не хватает: ${missing.join(", ")}.`,
      entityIds: [],
      ruleId: this.id,
      suggestedFix: "Добавьте недостающие элементы на план, затем повторите команды «Соединить автоматически» и «Проверить».",
    }];
  },
};

const getMissingElements = (
  equipmentInstances: Project["equipmentInstances"],
  definitions: EquipmentDefinition[],
): string[] => {
  const hasCategory = (category: EquipmentDefinition["category"]) =>
    equipmentInstances.some((instance) => definitions.find((definition) => definition.id === instance.definitionId)?.category === category);
  const hasDefinition = (definitionId: string) =>
    equipmentInstances.some((instance) => instance.definitionId === definitionId);
  const hasValve = (type: "supply" | "return" | "gas") =>
    equipmentInstances.some((instance) => {
      const definition = definitions.find((item) => item.id === instance.definitionId);
      return definition?.category === "valve" && definition.connectionPoints.some((point) => point.type === type);
    });

  const missing: string[] = [];
  if (!hasCategory("boiler")) missing.push("котёл");
  if (!hasDefinition("supply-header")) missing.push("коллектор подачи");
  if (!hasDefinition("return-header")) missing.push("коллектор обратки");
  if (!hasValve("supply")) missing.push("кран подачи");
  if (!hasValve("return")) missing.push("кран обратки");
  if (!hasValve("gas")) missing.push("газовый кран");
  return missing;
};
