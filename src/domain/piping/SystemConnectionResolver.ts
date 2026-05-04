import type { ConnectionPoint } from "@/domain/equipment/ConnectionPoint";
import type { EquipmentInstance } from "@/domain/equipment/EquipmentInstance";
import type { Project } from "@/domain/project/Project";
import type { SystemConnection } from "@/domain/piping/SystemConnection";
import type { ValidationContext } from "@/domain/validation/ValidationRule";

export class SystemConnectionResolver {
  resolve(project: Project, context: ValidationContext): SystemConnection[] {
    const boilers = project.equipmentInstances.filter((instance) =>
      this.getDefinitionCategory(instance, context) === "boiler",
    );
    const supplyHeaders = this.findHeaders(project, context, "supply");
    const returnHeaders = this.findHeaders(project, context, "return");

    return boilers.flatMap((boiler) => [
      this.resolveBoilerConnection(project, context, boiler, "supply", supplyHeaders),
      this.resolveBoilerConnection(project, context, boiler, "return", returnHeaders),
    ]);
  }

  private resolveBoilerConnection(
    project: Project,
    context: ValidationContext,
    boiler: EquipmentInstance,
    systemType: "supply" | "return",
    headers: EquipmentInstance[],
  ): SystemConnection {
    const boilerDefinition = context.equipmentDefinitions.find((definition) => definition.id === boiler.definitionId);
    const sourcePoint = boilerDefinition?.connectionPoints.find((point) => point.type === systemType);

    if (!sourcePoint) {
      return {
        id: `system_${systemType}_${boiler.id}_missing_source`,
        systemType,
        from: { equipmentInstanceId: boiler.id, connectionPointId: `${systemType}_missing` },
        status: "missing_source",
        issueMessage: systemType === "supply"
          ? "У котла нет точки подключения подачи"
          : "У котла нет точки подключения обратки",
      };
    }

    const header = headers[0];
    if (!header) {
      return {
        id: `system_${systemType}_${boiler.id}_missing_target`,
        systemType,
        from: { equipmentInstanceId: boiler.id, connectionPointId: sourcePoint.id },
        status: "missing_target",
        issueMessage: systemType === "supply"
          ? "Нет коллектора подачи для подключения котла"
          : "Нет коллектора обратки для подключения котла",
      };
    }

    const headerPoint = this.getHeaderPoint(header, context, systemType);
    if (!headerPoint) {
      return {
        id: `system_${systemType}_${boiler.id}_${header.id}_invalid`,
        systemType,
        from: { equipmentInstanceId: boiler.id, connectionPointId: sourcePoint.id },
        status: "invalid",
        issueMessage: systemType === "supply"
          ? "Коллектор подачи не имеет точки подключения подачи"
          : "Коллектор обратки не имеет точки подключения обратки",
      };
    }

    const issueMessage = headers.length > 1
      ? "Найдено несколько подходящих коллекторов, выбран первый"
      : undefined;

    return {
      id: `system_${systemType}_${boiler.id}_${header.id}`,
      systemType,
      from: { equipmentInstanceId: boiler.id, connectionPointId: sourcePoint.id },
      to: { equipmentInstanceId: header.id, connectionPointId: headerPoint.id },
      status: issueMessage ? "ambiguous" : "connected",
      issueMessage,
    };
  }

  private findHeaders(
    project: Project,
    context: ValidationContext,
    systemType: "supply" | "return",
  ): EquipmentInstance[] {
    return project.equipmentInstances.filter((instance) => {
      const definition = context.equipmentDefinitions.find((item) => item.id === instance.definitionId);
      return definition?.category === "header" &&
        definition.connectionPoints.some((point) => point.type === systemType);
    });
  }

  private getHeaderPoint(
    instance: EquipmentInstance,
    context: ValidationContext,
    systemType: "supply" | "return",
  ): ConnectionPoint | undefined {
    return context.equipmentDefinitions
      .find((definition) => definition.id === instance.definitionId)
      ?.connectionPoints.find((point) => point.type === systemType);
  }

  private getDefinitionCategory(instance: EquipmentInstance, context: ValidationContext) {
    return context.equipmentDefinitions.find((definition) => definition.id === instance.definitionId)?.category;
  }
}
