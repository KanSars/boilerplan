import type { ValidationRule } from "@/domain/validation/ValidationRule";

export type StandardsProfile = {
  id: string;
  name: string;
  jurisdiction: string;
  description: string;
  isPlaceholder: boolean;
  rules: ValidationRule[];
};
