import type { Project } from "@/domain/project/Project";
import type { StandardsProfile } from "@/domain/standards/StandardsProfile";
import type { ValidationContext } from "@/domain/validation/ValidationRule";
import type { ValidationIssue } from "@/domain/validation/ValidationIssue";

export class ValidationEngine {
  constructor(private readonly profile: StandardsProfile) {}

  validate(project: Project, context: ValidationContext): ValidationIssue[] {
    return this.profile.rules.flatMap((rule) => rule.validate(project, context));
  }
}
