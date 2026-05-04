import type { AiReportGenerator } from "@/domain/ai/AiAdapters";
import type { Project } from "@/domain/project/Project";
import type { ValidationIssue } from "@/domain/validation/ValidationIssue";

export class MockAiReportGenerator implements AiReportGenerator {
  generate(project: Project, issues: ValidationIssue[]): string {
    return `${project.name}: элементов оборудования ${project.equipmentInstances.length}, трасс ${project.pipingRoutes.length}, сообщений проверки ${issues.length}.`;
  }
}
