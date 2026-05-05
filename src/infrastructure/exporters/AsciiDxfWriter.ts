import type { CadDrawing, CadEntity } from "@/domain/cad/CadDrawing";

export class AsciiDxfWriter {
  write(drawing: CadDrawing): string {
    const lines: Array<string | number> = [];
    const pair = (code: number, value: string | number) => {
      lines.push(code, value);
    };

    pair(0, "SECTION");
    pair(2, "HEADER");
    pair(9, "$ACADVER");
    pair(1, drawing.version);
    pair(9, "$INSUNITS");
    pair(70, 4);
    pair(9, "$DWGCODEPAGE");
    pair(3, "ANSI_1251");
    pair(0, "ENDSEC");

    pair(0, "SECTION");
    pair(2, "CLASSES");
    pair(0, "ENDSEC");

    pair(0, "SECTION");
    pair(2, "TABLES");
    pair(0, "TABLE");
    pair(100, "AcDbSymbolTable");
    pair(2, "LTYPE");
    pair(70, 2);
    this.writeLineType(pair, "CONTINUOUS", "Solid line", []);
    this.writeLineType(pair, "DASHED", "Dashed line", [120, -80]);
    pair(0, "ENDTAB");
    pair(0, "TABLE");
    pair(100, "AcDbSymbolTable");
    pair(2, "LAYER");
    pair(70, drawing.layers.length);
    for (const layer of drawing.layers) {
      pair(0, "LAYER");
      pair(100, "AcDbSymbolTableRecord");
      pair(100, "AcDbLayerTableRecord");
      pair(2, layer.name);
      pair(70, 0);
      pair(62, layer.color);
      pair(6, layer.lineType ?? "CONTINUOUS");
    }
    pair(0, "ENDTAB");
    pair(0, "TABLE");
    pair(100, "AcDbSymbolTable");
    pair(2, "STYLE");
    pair(70, 1);
    pair(0, "STYLE");
    pair(100, "AcDbSymbolTableRecord");
    pair(100, "AcDbTextStyleTableRecord");
    pair(2, "STANDARD");
    pair(70, 0);
    pair(40, 0);
    pair(41, 1);
    pair(50, 0);
    pair(71, 0);
    pair(42, 2.5);
    pair(3, "txt");
    pair(4, "");
    pair(0, "ENDTAB");
    pair(0, "ENDSEC");

    pair(0, "SECTION");
    pair(2, "ENTITIES");
    for (const entity of drawing.entities) {
      this.writeEntity(pair, entity);
    }
    pair(0, "ENDSEC");
    pair(0, "EOF");

    return `${lines.join("\r\n")}\r\n`;
  }

  private writeLineType(
    pair: (code: number, value: string | number) => void,
    name: string,
    description: string,
    pattern: number[],
  ) {
    pair(0, "LTYPE");
    pair(100, "AcDbSymbolTableRecord");
    pair(100, "AcDbLinetypeTableRecord");
    pair(2, name);
    pair(70, 0);
    pair(3, description);
    pair(72, 65);
    pair(73, pattern.length);
    pair(40, pattern.reduce((sum, value) => sum + Math.abs(value), 0));
    for (const value of pattern) {
      pair(49, value);
      pair(74, 0);
    }
  }

  private writeEntity(
    pair: (code: number, value: string | number) => void,
    entity: CadEntity,
  ) {
    if (entity.type === "line") {
      pair(0, "LINE");
      pair(100, "AcDbEntity");
      pair(8, entity.layer);
      pair(100, "AcDbLine");
      pair(10, round(entity.start.xMm));
      pair(20, round(entity.start.yMm));
      pair(11, round(entity.end.xMm));
      pair(21, round(entity.end.yMm));
      return;
    }

    if (entity.type === "polyline") {
      pair(0, "LWPOLYLINE");
      pair(100, "AcDbEntity");
      pair(8, entity.layer);
      pair(100, "AcDbPolyline");
      pair(90, entity.points.length);
      pair(70, entity.closed ? 1 : 0);
      for (const point of entity.points) {
        pair(10, round(point.xMm));
        pair(20, round(point.yMm));
      }
      return;
    }

    if (entity.type === "circle") {
      pair(0, "CIRCLE");
      pair(100, "AcDbEntity");
      pair(8, entity.layer);
      pair(100, "AcDbCircle");
      pair(10, round(entity.center.xMm));
      pair(20, round(entity.center.yMm));
      pair(40, round(entity.radiusMm));
      return;
    }

    pair(0, "TEXT");
    pair(100, "AcDbEntity");
    pair(8, entity.layer);
    pair(100, "AcDbText");
    pair(10, round(entity.insertionPoint.xMm));
    pair(20, round(entity.insertionPoint.yMm));
    pair(40, round(entity.heightMm));
    pair(1, escapeDxfText(entity.value));
    pair(50, entity.rotationDeg ?? 0);
    pair(7, "STANDARD");
    pair(100, "AcDbText");
  }
}

const round = (value: number): number => Math.round(value * 1000) / 1000;

const escapeDxfText = (value: string): string =>
  Array.from(value).map((char) => {
    const code = char.codePointAt(0) ?? 0;
    if (code === 92) return "\\\\";
    if (code >= 32 && code <= 126) return char;
    return `\\U+${code.toString(16).toUpperCase().padStart(4, "0")}`;
  }).join("");
