import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import type { Project } from "@/domain/project/Project";
import type { ValidationIssue, ValidationSeverity } from "@/domain/validation/ValidationIssue";

export type ValidationContext = {
  equipmentDefinitions: EquipmentDefinition[];
};

export type ValidationRule = {
  id: string;
  name: string;
  category: string;
  severity: ValidationSeverity;
  standardReference?: string;
  validate(project: Project, context: ValidationContext): ValidationIssue[];
};
