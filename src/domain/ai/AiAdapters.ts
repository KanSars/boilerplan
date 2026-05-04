import type { Project } from "@/domain/project/Project";
import type { ValidationIssue } from "@/domain/validation/ValidationIssue";

export interface AiProjectInterpreter {
  interpret(input: string): { summary: string };
}

export interface AiLayoutAssistant {
  suggestNextAction(project: Project): string;
}

export interface AiValidationExplainer {
  explain(issues: ValidationIssue[]): string;
}

export interface AiReportGenerator {
  generate(project: Project, issues: ValidationIssue[]): string;
}
