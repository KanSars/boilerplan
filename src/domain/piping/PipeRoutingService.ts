import type { Project } from "@/domain/project/Project";
import type { PipingRoute } from "@/domain/piping/PipingRoute";
import type { ValidationContext } from "@/domain/validation/ValidationRule";

export type PipeRoutingService = {
  id: string;
  name: string;
  generateRoutes(project: Project, context: ValidationContext): PipingRoute[];
};
