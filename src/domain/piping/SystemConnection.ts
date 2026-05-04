export type SystemConnectionStatus =
  | "connected"
  | "missing_target"
  | "missing_source"
  | "ambiguous"
  | "invalid";

export type SystemConnection = {
  id: string;
  systemType: "supply" | "return" | "gas" | "drain" | "signal" | "unknown";
  from: {
    equipmentInstanceId: string;
    connectionPointId: string;
  };
  to?: {
    equipmentInstanceId: string;
    connectionPointId: string;
  };
  status: SystemConnectionStatus;
  issueMessage?: string;
};
