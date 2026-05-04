import type { WorldConnectionPoint } from "@/domain/equipment/WorldConnectionPoint";

export type ConnectionCompatibilityResult = {
  compatible: boolean;
  reason?: string;
  severity?: "info" | "warning" | "error";
};

export class ConnectionCompatibilityService {
  canConnect(
    from: WorldConnectionPoint,
    to: WorldConnectionPoint,
  ): ConnectionCompatibilityResult {
    if (from.type !== to.type) {
      return {
        compatible: false,
        reason: "Типы точек подключения не совпадают",
        severity: "error",
      };
    }

    const sourceOk = !from.systemRole || from.systemRole === "source" || from.systemRole === "bidirectional" || from.systemRole === "unknown";
    const targetOk = !to.systemRole || to.systemRole === "target" || to.systemRole === "bidirectional" || to.systemRole === "unknown";
    if (!sourceOk || !targetOk) {
      return {
        compatible: false,
        reason: "Роли точек подключения не позволяют выполнить соединение",
        severity: "warning",
      };
    }

    return {
      compatible: true,
      reason: "Точки подключения совместимы",
      severity: "info",
    };
  }
}
