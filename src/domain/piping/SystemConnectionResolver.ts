import type { EquipmentInstance } from "@/domain/equipment/EquipmentInstance";
import type { WorldConnectionPoint } from "@/domain/equipment/WorldConnectionPoint";
import { getAllWorldConnectionPoints } from "@/domain/geometry/transforms";
import { ConnectionCompatibilityService } from "@/domain/piping/ConnectionCompatibilityService";
import type { Project } from "@/domain/project/Project";
import type { SystemConnection } from "@/domain/piping/SystemConnection";
import type { ValidationContext } from "@/domain/validation/ValidationRule";

export class SystemConnectionResolver {
  private readonly compatibility = new ConnectionCompatibilityService();

  resolve(project: Project, context: ValidationContext): SystemConnection[] {
    const allWorldConnectionPoints = getAllWorldConnectionPoints(project, context.equipmentDefinitions);
    const boilers = project.equipmentInstances.filter((instance) =>
      this.getDefinitionCategory(instance, context) === "boiler",
    );

    return boilers.flatMap((boiler) => [
      this.resolveBoilerConnection(context, boiler, "supply", allWorldConnectionPoints),
      this.resolveBoilerConnection(context, boiler, "return", allWorldConnectionPoints),
    ]);
  }

  private resolveBoilerConnection(
    context: ValidationContext,
    boiler: EquipmentInstance,
    systemType: "supply" | "return",
    allWorldConnectionPoints: WorldConnectionPoint[],
  ): SystemConnection {
    const sourcePoint = allWorldConnectionPoints.find((point) =>
      point.equipmentInstanceId === boiler.id &&
      point.type === systemType,
    );

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

    const compatibleTargets = allWorldConnectionPoints
      .filter((point) =>
        point.equipmentInstanceId !== boiler.id &&
        this.getDefinitionCategoryByDefinitionId(point.definitionId, context) === "header",
      )
      .map((point) => ({
        point,
        compatibility: this.compatibility.canConnect(sourcePoint, point),
      }))
      .filter((candidate) => candidate.compatibility.compatible)
      .sort((a, b) => this.getDistance(sourcePoint, a.point) - this.getDistance(sourcePoint, b.point));

    if (compatibleTargets.length === 0) {
      return {
        id: `system_${systemType}_${boiler.id}_missing_target`,
        systemType,
        from: { equipmentInstanceId: boiler.id, connectionPointId: sourcePoint.connectionPointId },
        status: "missing_target",
        issueMessage: systemType === "supply"
          ? "Нет подходящей точки подключения для подачи"
          : "Нет подходящей точки подключения для обратки",
      };
    }

    const selectedTarget = compatibleTargets[0].point;
    const issueMessage = compatibleTargets.length > 1
      ? "Найдено несколько подходящих точек подключения, выбран ближайший вариант"
      : undefined;

    return {
      id: `system_${systemType}_${boiler.id}_${selectedTarget.equipmentInstanceId}_${selectedTarget.connectionPointId}`,
      systemType,
      from: { equipmentInstanceId: boiler.id, connectionPointId: sourcePoint.connectionPointId },
      to: {
        equipmentInstanceId: selectedTarget.equipmentInstanceId,
        connectionPointId: selectedTarget.connectionPointId,
      },
      status: issueMessage ? "ambiguous" : "connected",
      issueMessage,
      warnings: issueMessage ? [issueMessage] : [],
    };
  }

  private getDefinitionCategory(instance: EquipmentInstance, context: ValidationContext) {
    return context.equipmentDefinitions.find((definition) => definition.id === instance.definitionId)?.category;
  }

  private getDefinitionCategoryByDefinitionId(definitionId: string, context: ValidationContext) {
    return context.equipmentDefinitions.find((definition) => definition.id === definitionId)?.category;
  }

  private getDistance(from: WorldConnectionPoint, to: WorldConnectionPoint): number {
    return Math.hypot(
      from.worldPosition.xMm - to.worldPosition.xMm,
      from.worldPosition.yMm - to.worldPosition.yMm,
    );
  }
}
