export type EvidenceTargetKind =
  | "project"
  | "room"
  | "equipment_definition"
  | "equipment_instance"
  | "connection_point"
  | "world_connection_point"
  | "system_connection"
  | "piping_route"
  | "drawing_element";

export type EvidenceTarget = {
  kind: EvidenceTargetKind;
  id: string;
};
