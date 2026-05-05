import { getAllWorldConnectionPoints } from "@/domain/geometry/transforms";
import type { PipeRoutingService } from "@/domain/piping/PipeRoutingService";
import type { PipingRoute, PipingSystemType } from "@/domain/piping/PipingRoute";
import { SystemConnectionResolver } from "@/domain/piping/SystemConnectionResolver";
import type { Project } from "@/domain/project/Project";
import type { ValidationContext } from "@/domain/validation/ValidationRule";

export class SimpleOrthogonalPipeRouter implements PipeRoutingService {
  id = "simple-orthogonal-pipe-router";
  name = "Simple orthogonal pipe router";
  private readonly resolver = new SystemConnectionResolver();

  generateRoutes(project: Project, context: ValidationContext): PipingRoute[] {
    const worldConnectionPoints = getAllWorldConnectionPoints(project, context.equipmentDefinitions);
    const systemConnections = this.resolver.resolve(project, context);

    return systemConnections.flatMap((connection) => {
      if (!connection.to) return [];
      if (connection.status !== "connected" && connection.status !== "ambiguous") return [];
      if (connection.systemType !== "supply" && connection.systemType !== "return") return [];
      const start = worldConnectionPoints.find((point) =>
        point.equipmentInstanceId === connection.from.equipmentInstanceId &&
        point.connectionPointId === connection.from.connectionPointId,
      );
      const end = worldConnectionPoints.find((point) =>
        point.equipmentInstanceId === connection.to?.equipmentInstanceId &&
        point.connectionPointId === connection.to?.connectionPointId,
      );
      if (!start || !end) return [];
      const valvePoints = this.findValvePoints(connection.systemType, worldConnectionPoints, context);
      return [this.routeOneSystem(
        connection.systemType,
        connection.id,
        { xMm: start.worldPosition.xMm, yMm: start.worldPosition.yMm },
        { xMm: end.worldPosition.xMm, yMm: end.worldPosition.yMm },
        start.nominalDiameterMm ?? end.nominalDiameterMm,
        valvePoints,
        connection,
      )];
    });
  }

  private routeOneSystem(
    systemType: Extract<PipingSystemType, "supply" | "return">,
    routeId: string,
    start: { xMm: number; yMm: number },
    end: { xMm: number; yMm: number },
    nominalDiameterMm: number | undefined,
    valvePoints: ValveRoutePoints | undefined,
    connection: {
      from: { equipmentInstanceId: string; connectionPointId: string };
      to?: { equipmentInstanceId: string; connectionPointId: string };
    },
  ): PipingRoute {
    const offsetMm = systemType === "supply" ? -250 : 250;
    const elbowY = Math.round((start.yMm + end.yMm) / 2 + offsetMm);
    const polylinePoints = valvePoints
      ? [
        start,
        { xMm: start.xMm, yMm: valvePoints.inlet.yMm },
        valvePoints.inlet,
        valvePoints.outlet,
        { xMm: end.xMm, yMm: valvePoints.outlet.yMm },
        end,
      ]
      : [
        start,
        { xMm: start.xMm, yMm: elbowY },
        { xMm: end.xMm, yMm: elbowY },
        end,
      ];

    return {
      id: `route_${routeId}`,
      systemType,
      from: connection.from,
      to: connection.to ?? connection.from,
      polylinePoints,
      nominalDiameterMm,
      metadata: {
        pipeSpecId: systemType === "supply" ? "pipe-vgp-dn32-supply" : "pipe-vgp-dn32-return",
        sourceDocumentId: "src-gost-3262-75",
        reviewStatus: "review_required",
        valveEquipmentInstanceId: valvePoints?.equipmentInstanceId ?? "",
      },
      calculationStatus: "preliminary",
      warnings: [
        "Предварительная трасса: не выполнен гидравлический расчёт и проверка коллизий",
      ],
    };
  }

  private findValvePoints(
    systemType: Extract<PipingSystemType, "supply" | "return">,
    worldConnectionPoints: ReturnType<typeof getAllWorldConnectionPoints>,
    context: ValidationContext,
  ): ValveRoutePoints | undefined {
    const valveDefinitions = new Set(context.equipmentDefinitions
      .filter((definition) => definition.category === "valve")
      .map((definition) => definition.id));
    const candidates = worldConnectionPoints.filter((point) =>
      valveDefinitions.has(point.definitionId) && point.type === systemType,
    );
    const inlet = candidates.find((point) => point.connectionPointId === "inlet") ?? candidates[0];
    const outlet = candidates.find((point) => point.connectionPointId === "outlet") ?? candidates[1];
    if (!inlet || !outlet) return undefined;
    return {
      equipmentInstanceId: inlet.equipmentInstanceId,
      inlet: { xMm: inlet.worldPosition.xMm, yMm: inlet.worldPosition.yMm },
      outlet: { xMm: outlet.worldPosition.xMm, yMm: outlet.worldPosition.yMm },
    };
  }
}

type ValveRoutePoints = {
  equipmentInstanceId: string;
  inlet: { xMm: number; yMm: number };
  outlet: { xMm: number; yMm: number };
};
