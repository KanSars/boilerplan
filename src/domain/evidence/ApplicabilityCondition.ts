export type ApplicabilityConditionSubject =
  | "project"
  | "room"
  | "equipment_definition"
  | "equipment_instance"
  | "connection_point"
  | "piping_route"
  | "drawing_element";

export type ApplicabilityConditionOperator =
  | "equals"
  | "not_equals"
  | "includes"
  | "greater_than"
  | "greater_than_or_equal"
  | "less_than"
  | "less_than_or_equal"
  | "exists";

export type ApplicabilityCondition = {
  id: string;
  subject: ApplicabilityConditionSubject;
  fieldPath: string;
  operator: ApplicabilityConditionOperator;
  value?: string | number | boolean;
  description: string;
};
