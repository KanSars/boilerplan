import type { AiValidationExplainer } from "@/domain/ai/AiAdapters";
import type { ValidationIssue } from "@/domain/validation/ValidationIssue";

export class MockAiValidationExplainer implements AiValidationExplainer {
  explain(issues: ValidationIssue[]): string {
    const errors = issues.filter((issue) => issue.severity === "error").length;
    const warnings = issues.filter((issue) => issue.severity === "warning").length;
    return `Демо-пояснение: проверьте ошибки (${errors}) и предупреждения (${warnings}). Текст сформирован детерминированно, без внешних AI API.`;
  }
}
