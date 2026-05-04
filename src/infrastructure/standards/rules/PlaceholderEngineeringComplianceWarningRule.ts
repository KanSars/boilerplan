import type { ValidationRule } from "@/domain/validation/ValidationRule";

export const PlaceholderEngineeringComplianceWarningRule: ValidationRule = {
  id: "placeholder_engineering_compliance_warning",
  name: "Ограничение инженерной проверки v0",
  category: "v0-limitation",
  severity: "warning",
  standardReference: "Предупреждение об ограничениях v0",
  validate() {
    return [{
      id: this.id,
      severity: "warning",
      message: "Это приложение v0 не выполняет реальные проверки гидравлики, газа, вентиляции, пожарной безопасности или соответствия нормативам.",
      entityIds: [],
      ruleId: this.id,
      standardReference: this.standardReference,
    }];
  },
};
