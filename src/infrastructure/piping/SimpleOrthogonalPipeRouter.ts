import { transformConnectionPoint } from "@/domain/geometry/transforms";
import type { EquipmentInstance } from "@/domain/equipment/EquipmentInstance";
import type { PipeRoutingService } from "@/domain/piping/PipeRoutingService";
import type { PipingRoute, PipingSystemType } from "@/domain/piping/PipingRoute";
import type { Project } from "@/domain/project/Project";
import type { ValidationContext } from "@/domain/validation/ValidationRule";

export class SimpleOrthogonalPipeRouter implements PipeRoutingService {
  id = "simple-orthogonal-pipe-router";
  name = "Simple orthogonal pipe router";

  generateRoutes(project: Project, context: ValidationContext): PipingRoute[] {
    const definitions = context.equipmentDefinitions;
    const boilers = project.equipmentInstances.filter((instance) => {
      const definition = definitions.find((item) => item.id === instance.definitionId);
      return definition?.category === "boiler";
    });

    const supplyHeader = project.equipmentInstances.find((instance) => {
      const definition = definitions.find((item) => item.id === instance.definitionId);
      return definition?.category === "header" && definition.connectionPoints.some((point) => point.type === "supply");
    });
    const returnHeader = project.equipmentInstances.find((instance) => {
      const definition = definitions.find((item) => item.id === instance.definitionId);
      return definition?.category === "header" && definition.connectionPoints.some((point) => point.type === "return");
    });

    const routes: PipingRoute[] = [];
    for (const boiler of boilers) {
      routes.push(...this.routeOneSystem("supply", boiler, supplyHeader, project, context));
      routes.push(...this.routeOneSystem("return", boiler, returnHeader, project, context));
    }
    return routes;
  }

  private routeOneSystem(
    systemType: Extract<PipingSystemType, "supply" | "return">,
    boiler: EquipmentInstance,
    header: EquipmentInstance | undefined,
    _project: Project,
    context: ValidationContext,
  ): PipingRoute[] {
    if (!header) return [];
    const boilerDefinition = context.equipmentDefinitions.find((item) => item.id === boiler.definitionId);
    const headerDefinition = context.equipmentDefinitions.find((item) => item.id === header.definitionId);
    const boilerPoint = boilerDefinition?.connectionPoints.find((point) => point.type === systemType);
    const headerPoint = headerDefinition?.connectionPoints.find((point) => point.type === systemType);
    if (!boilerDefinition || !headerDefinition || !boilerPoint || !headerPoint) return [];

    const start = transformConnectionPoint(boiler, boilerDefinition, boilerPoint);
    const end = transformConnectionPoint(header, headerDefinition, headerPoint);
    const offsetMm = systemType === "supply" ? -250 : 250;
    const elbowY = Math.round((start.yMm + end.yMm) / 2 + offsetMm);

    return [{
      id: `route_${systemType}_${boiler.id}_${header.id}`,
      systemType,
      from: { equipmentInstanceId: boiler.id, connectionPointId: boilerPoint.id },
      to: { equipmentInstanceId: header.id, connectionPointId: headerPoint.id },
      polylinePoints: [
        start,
        { xMm: start.xMm, yMm: elbowY },
        { xMm: end.xMm, yMm: elbowY },
        end,
      ],
      calculationStatus: "not_calculated",
      warnings: [
        "Трасса v0 построена детерминированно: без обхода коллизий, уклонов, опор, арматуры и гидравлического расчёта.",
      ],
    }];
  }
}
