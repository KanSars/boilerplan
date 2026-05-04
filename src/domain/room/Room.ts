import type { PointMm } from "@/domain/geometry/geometryTypes";

export type Room = {
  widthMm: number;
  lengthMm: number;
  heightMm?: number;
  origin: PointMm;
};
