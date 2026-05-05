import type { PointMm } from "@/domain/geometry/geometryTypes";

export type CadLayerName =
  | "AR_ROOM_WALL"
  | "ME_EQ_BODY"
  | "ME_EQ_CLEARANCE"
  | "ME_CONN_POINT"
  | "ME_PIPE_SUPPLY"
  | "ME_PIPE_RETURN"
  | "ME_PIPE_GAS"
  | "ME_PIPE_FLUE"
  | "ME_VALVE"
  | "SHEET_FRAME"
  | "TITLE_BLOCK"
  | "AN_TEXT";

export type CadLayer = {
  name: CadLayerName;
  color: number;
  lineType?: "CONTINUOUS" | "DASHED";
};

export type CadPolyline = {
  type: "polyline";
  layer: CadLayerName;
  points: PointMm[];
  closed?: boolean;
};

export type CadCircle = {
  type: "circle";
  layer: CadLayerName;
  center: PointMm;
  radiusMm: number;
};

export type CadText = {
  type: "text";
  layer: CadLayerName;
  insertionPoint: PointMm;
  heightMm: number;
  value: string;
  rotationDeg?: number;
};

export type CadEntity = CadPolyline | CadCircle | CadText;

export type CadDrawing = {
  version: "AC1015";
  units: "mm";
  layers: CadLayer[];
  entities: CadEntity[];
  metadata: {
    title: string;
  };
};
