export type DrawingLayerName =
  | "SHEET_FRAME"
  | "TITLE_BLOCK"
  | "ROOM_OUTLINE"
  | "EQUIPMENT_SYMBOL"
  | "PIPE_SUPPLY"
  | "PIPE_RETURN"
  | "PIPE_GAS"
  | "PIPE_FLUE"
  | "VALVE_SYMBOL"
  | "PORT_MARK"
  | "ANNOTATION"
  | "WARNING";

export type DrawingLayer = {
  name: DrawingLayerName;
  stroke: string;
  fill?: string;
  strokeWidth: number;
  lineType?: "solid" | "dashed" | "dashdot";
};

export type DrawingPoint = {
  x: number;
  y: number;
};

export type DrawingRect = {
  type: "rect";
  layer: DrawingLayerName;
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
};

export type DrawingPolyline = {
  type: "polyline";
  layer: DrawingLayerName;
  points: DrawingPoint[];
  closed?: boolean;
};

export type DrawingCircle = {
  type: "circle";
  layer: DrawingLayerName;
  center: DrawingPoint;
  radius: number;
  fill?: string;
};

export type DrawingText = {
  type: "text";
  layer: DrawingLayerName;
  at: DrawingPoint;
  value: string;
  height: number;
  align?: "start" | "middle" | "end";
  rotationDeg?: number;
  weight?: "normal" | "bold";
};

export type DrawingEntity = DrawingRect | DrawingPolyline | DrawingCircle | DrawingText;

export type EngineeringDrawing = {
  id: string;
  units: "paper_mm";
  sheet: {
    format: "A3";
    orientation: "landscape";
    width: number;
    height: number;
  };
  layers: DrawingLayer[];
  entities: DrawingEntity[];
  metadata: {
    title: string;
    status: "draft" | "review_required";
    sourceDocumentIds: string[];
    notes: string[];
  };
};
