export type ConnectionPointType =
  | "supply"
  | "return"
  | "gas"
  | "drain"
  | "flue"
  | "electrical"
  | "signal"
  | "unknown";

export type ConnectionDirection =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "front"
  | "back"
  | "up"
  | "down";

export type ConnectionPointSystemRole = "source" | "target" | "bidirectional" | "unknown";

export type ConnectionPointSource =
  | "mock"
  | "manual_catalog"
  | "ai_extracted_pdf"
  | "bim_import"
  | "user_override";

export type ConnectionPoint = {
  id: string;
  type: ConnectionPointType;
  label: string;
  position: {
    xMm: number;
    yMm: number;
    zMm?: number;
  };
  nominalDiameterMm?: number;
  direction?: ConnectionDirection;
  systemRole?: ConnectionPointSystemRole;
  source: ConnectionPointSource;
  confidence?: number;
  metadata?: Record<string, unknown>;
};
