import { SystemConnectionResolver } from "@/domain/piping/SystemConnectionResolver";
import type { ValidationRule } from "@/domain/validation/ValidationRule";

const resolver = new SystemConnectionResolver();

export const AmbiguousConnectionRule: ValidationRule = {
  id: "ambiguous_connection",
  name: "Найдено несколько возможных подключений",
  category: "logical-system-connections",
  severity: "warning",
  validate(project, context) {
    return resolver.resolve(project, context)
      .filter((connection) => connection.status === "ambiguous")
      .map((connection) => ({
        id: `${this.id}_${connection.id}`,
        severity: "warning",
        message: "Найдено несколько возможных подключений, выбран предварительный вариант",
        entityIds: [
          connection.from.equipmentInstanceId,
          ...(connection.to ? [connection.to.equipmentInstanceId] : []),
        ],
        ruleId: this.id,
        suggestedFix: connection.issueMessage,
      }));
  },
};
