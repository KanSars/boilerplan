import { SystemConnectionResolver } from "@/domain/piping/SystemConnectionResolver";
import type { ValidationRule } from "@/domain/validation/ValidationRule";

const resolver = new SystemConnectionResolver();

export const RequiredHydronicConnectionsRule: ValidationRule = {
  id: "required_hydronic_connections",
  name: "Подключение котлов к коллекторам подачи и обратки",
  category: "logical-system-connections",
  severity: "warning",
  validate(project, context) {
    const connections = resolver.resolve(project, context);
    return connections
      .filter((connection) => connection.status !== "connected")
      .map((connection) => ({
        id: `${this.id}_${connection.id}`,
        severity: "warning",
        message: connection.systemType === "supply"
          ? "Котёл не подключён к коллектору подачи"
          : "Котёл не подключён к коллектору обратки",
        entityIds: [
          connection.from.equipmentInstanceId,
          ...(connection.to ? [connection.to.equipmentInstanceId] : []),
        ],
        ruleId: this.id,
        suggestedFix: connection.issueMessage,
      }));
  },
};
