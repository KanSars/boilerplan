export const metersToMm = (meters: number): number => Math.round(meters * 1000);

export const mmToMeters = (mm: number): number => mm / 1000;

export const mmToPx = (mm: number, pxPerMm: number): number => mm * pxPerMm;

export const pxToMm = (px: number, pxPerMm: number): number => px / pxPerMm;
