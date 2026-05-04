import type { Project } from "@/domain/project/Project";
import type { ValidationContext } from "@/domain/validation/ValidationRule";

export type ExportContext = ValidationContext;

export interface Exporter<TOutput> {
  id: string;
  name: string;
  export(project: Project, context: ExportContext): TOutput;
}
