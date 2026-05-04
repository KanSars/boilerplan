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
      return [this.routeOneSystem(
        connection.systemType,
        connection.id,
        { xMm: start.worldPosition.xMm, yMm: start.worldPosition.yMm },
        { xMm: end.worldPosition.xMm, yMm: end.worldPosition.yMm },
        connection,
      )];
    });
  }

  private routeOneSystem(
    systemType: Extract<PipingSystemType, "supply" | "return">,
    routeId: string,
    start: { xMm: number; yMm: number },
    end: { xMm: number; yMm: number },
    connection: {
      from: { equipmentInstanceId: string; connectionPointId: string };
      to?: { equipmentInstanceId: string; connectionPointId: string };
    },
  ): PipingRoute {
    const offsetMm = systemType === "supply" ? -250 : 250;
    const elbowY = Math.round((start.yMm + end.yMm) / 2 + offsetMm);

    return {
      id: `route_${routeId}`,
      systemType,
      from: connection.from,
      to: connection.to ?? connection.from,
      polylinePoints: [
        start,
        { xMm: start.xMm, yMm: elbowY },
        { xMm: end.xMm, yMm: elbowY },
        end,
      ],
      calculationStatus: "preliminary",
      warnings: [
        "Предварительная трасса: не выполнен гидравлический расчёт и проверка коллизий",
      ],
    };
  }
}
