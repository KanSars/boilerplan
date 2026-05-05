import type { EngineeringDrawing, DrawingEntity, DrawingLayer, DrawingViewport } from "@/domain/drawing";
import type { ConnectionPoint, ConnectionPointType } from "@/domain/equipment/ConnectionPoint";
import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import { getEquipmentBodyRect } from "@/domain/geometry/rectangles";
import { getWorldConnectionPointsForInstance } from "@/domain/geometry/transforms";
import type { PipingSystemType } from "@/domain/piping/PipingRoute";
import type { Project } from "@/domain/project/Project";
import { pilotPipeSpecs, type PilotPipeSpec } from "@/shared/config/pilotKitSpecs";

const sheetWidth = 420;
const sheetHeight = 297;
const viewports: DrawingViewport[] = [
  { name: "frame", x: 5, y: 5, width: 410, height: 287 },
  { name: "plan", x: 15, y: 30, width: 185, height: 124 },
  { name: "schematic", x: 215, y: 30, width: 198, height: 150 },
  { name: "legend", x: 15, y: 180, width: 190, height: 55 },
  { name: "titleBlock", x: 260, y: 252, width: 155, height: 40 },
];

const layers: DrawingLayer[] = [
  { name: "SHEET_FRAME", stroke: "#111827", fill: "none", strokeWidth: 0.35 },
  { name: "TITLE_BLOCK", stroke: "#111827", fill: "none", strokeWidth: 0.25 },
  { name: "ROOM_OUTLINE", stroke: "#111827", fill: "#ffffff", strokeWidth: 0.25 },
  { name: "EQUIPMENT_SYMBOL", stroke: "#111827", fill: "#f8fafc", strokeWidth: 0.3 },
  { name: "PIPE_SUPPLY", stroke: "#b91c1c", fill: "none", strokeWidth: 0.45 },
  { name: "PIPE_RETURN", stroke: "#1d4ed8", fill: "none", strokeWidth: 0.45, lineType: "dashed" },
  { name: "PIPE_GAS", stroke: "#92400e", fill: "none", strokeWidth: 0.45, lineType: "dashdot" },
  { name: "PIPE_FLUE", stroke: "#374151", fill: "none", strokeWidth: 0.45 },
  { name: "VALVE_SYMBOL", stroke: "#111827", fill: "#ffffff", strokeWidth: 0.3 },
  { name: "PORT_MARK", stroke: "#111827", fill: "#ffffff", strokeWidth: 0.25 },
  { name: "ANNOTATION", stroke: "#111827", fill: "#111827", strokeWidth: 0.2 },
  { name: "WARNING", stroke: "#b45309", fill: "#b45309", strokeWidth: 0.2 },
];

export class BoilerRoomSheetDrawingService {
  create(project: Project, equipmentDefinitions: EquipmentDefinition[]): EngineeringDrawing {
    const entities: DrawingEntity[] = [];
    const boiler = project.equipmentInstances.find((instance) =>
      equipmentDefinitions.find((definition) => definition.id === instance.definitionId)?.category === "boiler",
    );
    const supplyHeader = project.equipmentInstances.find((instance) => instance.definitionId === "supply-header");
    const returnHeader = project.equipmentInstances.find((instance) => instance.definitionId === "return-header");

    this.addSheet(entities, project.name);
    this.addPlanView(entities, project, equipmentDefinitions);
    this.addProcessDiagram(entities, project, equipmentDefinitions, boiler?.id, supplyHeader?.id, returnHeader?.id);
    this.addLegend(entities);

    return {
      id: `${project.id}_pilot_sheet`,
      units: "paper_mm",
      sheet: {
        format: "A3",
        orientation: "landscape",
        width: sheetWidth,
        height: sheetHeight,
      },
      layers,
      viewports,
      entities,
      metadata: {
        title: `${project.name}. Пилотный чертеж котельной`,
        status: "review_required",
        sourceDocumentIds: [
          "src-rgt-100-500-passport",
          "src-sp-89-13330-2016",
          "src-gost-21-704-2011",
          "src-gost-2-785-70",
          "src-stout-steel-manifold-dn32",
          "src-gost-3262-75",
          "src-dn-ball-valve-bv3232p",
        ],
        notes: [
          "Предварительный лист: требуется инженерная проверка источников, применимости и координат патрубков.",
          "Котел RGT-100/КСВА-100 принят как пилотная модель по публичному паспорту.",
        ],
      },
    };
  }

  private addSheet(entities: DrawingEntity[], projectName: string) {
    entities.push(
      rect(5, 5, 410, 287, "SHEET_FRAME"),
      rect(260, 252, 155, 40, "TITLE_BLOCK"),
      line([{ x: 260, y: 263 }, { x: 415, y: 263 }], "TITLE_BLOCK"),
      line([{ x: 330, y: 252 }, { x: 330, y: 292 }], "TITLE_BLOCK"),
      text(12, 14, "Пилотный чертеж отдельно стоящей газовой водогрейной котельной", 4.2, "ANNOTATION", "bold"),
      text(12, 20, "Исходные данные и нормативная применимость: review_required", 2.8, "WARNING"),
      text(264, 260, projectName, 3, "ANNOTATION", "bold"),
      text(334, 260, "Лист A3", 3, "ANNOTATION"),
      text(264, 272, "Стадия: PILOT", 2.6, "ANNOTATION"),
      text(334, 272, "Статус: требует проверки", 2.6, "WARNING"),
      text(264, 286, "Не является рабочей документацией", 2.6, "WARNING"),
    );
  }

  private addPlanView(
    entities: DrawingEntity[],
    project: Project,
    equipmentDefinitions: EquipmentDefinition[],
  ) {
    const viewport = getViewport("plan");
    const origin = { x: viewport.x, y: viewport.y + 6 };
    const size = { width: viewport.width, height: viewport.height - 6 };
    const scale = Math.min(size.width / project.room.widthMm, size.height / project.room.lengthMm);

    entities.push(
      text(origin.x, origin.y - 6, "План размещения оборудования, М 1:50 (эскиз)", 3.2, "ANNOTATION", "bold"),
      rect(origin.x, origin.y, project.room.widthMm * scale, project.room.lengthMm * scale, "ROOM_OUTLINE"),
    );

    for (const instance of project.equipmentInstances) {
      const definition = equipmentDefinitions.find((item) => item.id === instance.definitionId);
      if (!definition) continue;
      const body = getEquipmentBodyRect(instance, definition);
      const x = origin.x + body.xMm * scale;
      const y = origin.y + body.yMm * scale;
      const width = Math.max(body.widthMm * scale, 5);
      const height = Math.max(body.depthMm * scale, 4);
      entities.push(rect(x, y, width, height, "EQUIPMENT_SYMBOL", "#f8fafc"));
      this.addEquipmentGlyph(entities, definition.category, x, y, width, height);
      entities.push(text(x + width / 2, y + height / 2 + 1.2, getPlanLabel(instance.label, definition.category), 2.1, "ANNOTATION", "bold", "middle"));

      for (const point of getWorldConnectionPointsForInstance(instance, definition)) {
        entities.push(circle(origin.x + point.worldPosition.xMm * scale, origin.y + point.worldPosition.yMm * scale, 1.2, "PORT_MARK"));
      }
    }

    for (const route of project.pipingRoutes) {
      entities.push(line(route.polylinePoints.map((point) => ({
        x: origin.x + point.xMm * scale,
        y: origin.y + point.yMm * scale,
      })), pipeLayer(route.systemType)));
    }

  }

  private addProcessDiagram(
    entities: DrawingEntity[],
    project: Project,
    equipmentDefinitions: EquipmentDefinition[],
    boilerId?: string,
    supplyHeaderId?: string,
    returnHeaderId?: string,
  ) {
    const viewport = getViewport("schematic");
    const localEntities: DrawingEntity[] = [];
    const x0 = 10;
    const y0 = 8;
    localEntities.push(text(x0, y0 - 2, "Технологическая схема подключений (без масштаба)", 3.2, "ANNOTATION", "bold"));

    const boiler = project.equipmentInstances.find((instance) => instance.id === boilerId);
    const boilerDefinition = boiler ? equipmentDefinitions.find((definition) => definition.id === boiler.definitionId) : undefined;
    const boilerTitle = boiler && boilerDefinition
      ? `${boiler.label}: ${boilerDefinition.manufacturer ?? ""} ${boilerDefinition.model ?? boilerDefinition.name}`
      : "К1: котел";
    const boilerBox = { x: x0, y: y0 + 38, width: 58, height: 48 };
    this.addBoilerSymbol(localEntities, boilerBox.x, boilerBox.y, boilerBox.width, boilerBox.height, boilerTitle);

    const supply = { x: x0 + 105, y: y0 + 28, width: 88, height: 12 };
    const ret = { x: x0 + 105, y: y0 + 84, width: 88, height: 12 };
    const supplyHeaderDefinition = getDefinitionByInstanceId(project, equipmentDefinitions, supplyHeaderId);
    const returnHeaderDefinition = getDefinitionByInstanceId(project, equipmentDefinitions, returnHeaderId);
    this.addHeaderSymbol(localEntities, supply.x, supply.y, supply.width, supply.height, getHeaderLabel("КП1", supplyHeaderDefinition), "PIPE_SUPPLY");
    this.addHeaderSymbol(localEntities, ret.x, ret.y, ret.width, ret.height, getHeaderLabel("КО1", returnHeaderDefinition), "PIPE_RETURN");

    const boilerFacts = getEquipmentFacts(boilerDefinition);
    const supplyPoint = getConnectionPoint(boilerDefinition, "supply");
    const returnPoint = getConnectionPoint(boilerDefinition, "return");
    const gasPoint = getConnectionPoint(boilerDefinition, "gas");
    const fluePoint = getConnectionPoint(boilerDefinition, "flue");
    const supplyHeaderPoint = getConnectionPoint(supplyHeaderDefinition, "supply");
    const returnHeaderPoint = getConnectionPoint(returnHeaderDefinition, "return");
    const supplyDn = supplyPoint?.nominalDiameterMm ?? 32;
    const returnDn = returnPoint?.nominalDiameterMm ?? 32;
    const gasDn = gasPoint?.nominalDiameterMm ?? 25;
    const flueDn = fluePoint?.nominalDiameterMm ?? boilerFacts.flueDiameterMm ?? 200;
    const boilerSupplyPort = getBoxPort(boilerBox, boilerDefinition, supplyPoint, "right");
    const boilerReturnPort = getBoxPort(boilerBox, boilerDefinition, returnPoint, "right");
    const boilerGasPort = getBoxPort(boilerBox, boilerDefinition, gasPoint, "bottom");
    const boilerFluePort = getBoxPort(boilerBox, boilerDefinition, fluePoint, "top");
    const supplyHeaderPort = getBoxPort(supply, supplyHeaderDefinition, supplyHeaderPoint, "left");
    const returnHeaderPort = getBoxPort(ret, returnHeaderDefinition, returnHeaderPoint, "left");
    const valvePoints = spreadClosePoints(
      [
        { systemType: "supply" as const, point: { x: supply.x - 18, y: midpoint(boilerSupplyPort.y, supplyHeaderPort.y) } },
        { systemType: "return" as const, point: { x: ret.x - 25, y: midpoint(boilerReturnPort.y, returnHeaderPort.y) } },
        { systemType: "gas" as const, point: { x: boilerGasPort.x, y: boilerBox.y + boilerBox.height + 12 } },
      ],
      14,
    );

    this.addPipeRun(localEntities, [
      boilerSupplyPort,
      { x: supply.x - 18, y: boilerSupplyPort.y },
      { x: supply.x - 18, y: supplyHeaderPort.y },
      supplyHeaderPort,
    ], "PIPE_SUPPLY", `T1 DN${supplyDn}`);
    this.addValveEquipmentSymbol(localEntities, project, equipmentDefinitions, "supply", valvePoints.supply);

    this.addPipeRun(localEntities, [
      boilerReturnPort,
      { x: ret.x - 25, y: boilerReturnPort.y },
      { x: ret.x - 25, y: returnHeaderPort.y },
      returnHeaderPort,
    ], "PIPE_RETURN", `T2 DN${returnDn}`);
    this.addValveEquipmentSymbol(localEntities, project, equipmentDefinitions, "return", valvePoints.return);

    this.addPipeRun(localEntities, [
      boilerGasPort,
      { x: boilerGasPort.x, y: boilerBox.y + boilerBox.height + 24 },
      { x: boilerBox.x - 30, y: boilerBox.y + boilerBox.height + 24 },
    ], "PIPE_GAS", `Г DN${gasDn}`);
    this.addValveEquipmentSymbol(localEntities, project, equipmentDefinitions, "gas", valvePoints.gas);

    this.addPipeRun(localEntities, [
      boilerFluePort,
      { x: boilerFluePort.x, y: boilerBox.y - 26 },
    ], "PIPE_FLUE", `Дымоход DN${flueDn}`);

    this.addConnectionPortMarker(localEntities, boilerSupplyPort, supplyPoint, "PIPE_SUPPLY");
    this.addConnectionPortMarker(localEntities, boilerReturnPort, returnPoint, "PIPE_RETURN");
    this.addConnectionPortMarker(localEntities, boilerGasPort, gasPoint, "PIPE_GAS");
    this.addConnectionPortMarker(localEntities, boilerFluePort, fluePoint, "PIPE_FLUE");
    this.addConnectionPortMarker(localEntities, supplyHeaderPort, supplyHeaderPoint, "PIPE_SUPPLY");
    this.addConnectionPortMarker(localEntities, returnHeaderPort, returnHeaderPoint, "PIPE_RETURN");

    localEntities.push(
      text(boilerBox.x - 33, boilerBox.y + boilerBox.height + 27, "Ввод газа", 2.6, "ANNOTATION"),
      text(boilerBox.x + boilerBox.width / 2 + 5, boilerBox.y - 22, "Дымовые газы", 2.6, "ANNOTATION"),
      text(supply.x + supply.width, supply.y + 17, "к системе", 2.4, "ANNOTATION", "normal", "end"),
      text(ret.x + ret.width, ret.y + 17, "от системы", 2.4, "ANNOTATION", "normal", "end"),
      text(x0, 138, getPassportSummary(boilerDefinition), 2.6, "ANNOTATION"),
      text(x0, 144, getSourceSummary(boilerDefinition), 2.6, "WARNING"),
      text(x0, 150, getCollectorSummary(supplyHeaderDefinition), 2.6, "ANNOTATION"),
      text(x0, 156, getPipeKitSummary(), 2.6, "ANNOTATION"),
      text(x0, 162, "Арматура: шаровые краны DN32/DN25, источник-кандидат src-dn-ball-valve-bv3232p.", 2.6, "ANNOTATION"),
      text(x0, 165, "Котел работает с принудительной циркуляцией. Запуск без циркуляции запрещен по паспорту RGT.", 2.6, "WARNING"),
      text(x0, 171, "DN и габариты для RGT-100/КСВА-100 взяты из публичного паспорта; координаты портов условные.", 2.6, "WARNING"),
    );

    if (!supplyHeaderId || !returnHeaderId) {
      localEntities.push(text(x0, 148, "Нет размещенных коллекторов подачи/обратки: схема требует проверки.", 2.6, "WARNING"));
    }

    entities.push(...fitEntitiesToViewport(localEntities, viewport, 2));
  }

  private addLegend(entities: DrawingEntity[]) {
    const viewport = getViewport("legend");
    const x = viewport.x;
    const y = viewport.y;
    entities.push(text(x, y, "Условные обозначения", 3.2, "ANNOTATION", "bold"));
    this.addPipeRun(entities, [{ x, y: y + 9 }, { x: x + 28, y: y + 9 }], "PIPE_SUPPLY", "T1 подача");
    this.addPipeRun(entities, [{ x, y: y + 20 }, { x: x + 28, y: y + 20 }], "PIPE_RETURN", "T2 обратка");
    this.addPipeRun(entities, [{ x, y: y + 31 }, { x: x + 28, y: y + 31 }], "PIPE_GAS", "Г газ");
    this.addValve(entities, x + 70, y + 9, "PIPE_SUPPLY");
    entities.push(text(x + 78, y + 10, "Запорная арматура", 2.5, "ANNOTATION"));
  }

  private addEquipmentGlyph(entities: DrawingEntity[], category: string, x: number, y: number, width: number, height: number) {
    if (category === "boiler") {
      entities.push(
        circle(x + width / 2, y + Math.max(2, height * 0.22), Math.min(width, height) * 0.12, "EQUIPMENT_SYMBOL", "#ffffff"),
        line([{ x: x + width * 0.2, y: y + height * 0.72 }, { x: x + width * 0.8, y: y + height * 0.72 }], "EQUIPMENT_SYMBOL"),
      );
      return;
    }
    if (category === "header") {
      entities.push(line([{ x: x + 1, y: y + height / 2 }, { x: x + width - 1, y: y + height / 2 }], "EQUIPMENT_SYMBOL"));
    }
    if (category === "valve") {
      this.addValveSymbol(entities, x + width / 2, y + height / 2, "PIPE_SUPPLY");
    }
  }

  private addBoilerSymbol(entities: DrawingEntity[], x: number, y: number, width: number, height: number, title: string) {
    entities.push(
      rect(x, y, width, height, "EQUIPMENT_SYMBOL", "#f8fafc"),
      text(x + width / 2, y + 6, "К1", 4, "ANNOTATION", "bold", "middle"),
      circle(x + width / 2, y + 16, 6, "EQUIPMENT_SYMBOL", "#ffffff"),
      line([{ x: x + 16, y: y + 28 }, { x: x + 42, y: y + 28 }], "EQUIPMENT_SYMBOL"),
      line([{ x: x + 18, y: y + 34 }, { x: x + 40, y: y + 34 }], "EQUIPMENT_SYMBOL"),
      text(x + width / 2, y + height + 7, title.trim(), 2.5, "ANNOTATION", "normal", "middle"),
    );
  }

  private addHeaderSymbol(
    entities: DrawingEntity[],
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    layer: "PIPE_SUPPLY" | "PIPE_RETURN",
  ) {
    entities.push(
      rect(x, y, width, height, "EQUIPMENT_SYMBOL", "#ffffff"),
      line([{ x: x + 4, y: y + height / 2 }, { x: x + width - 4, y: y + height / 2 }], layer),
      circle(x + 8, y + height / 2, 2.2, "PORT_MARK", "#ffffff"),
      circle(x + width - 8, y + height / 2, 2.2, "PORT_MARK", "#ffffff"),
      text(x + width / 2, y - 3, label, 2.6, "ANNOTATION", "bold", "middle"),
    );
  }

  private addConnectionPortMarker(
    entities: DrawingEntity[],
    point: Point,
    connectionPoint: ConnectionPoint | undefined,
    layer: "PIPE_SUPPLY" | "PIPE_RETURN" | "PIPE_GAS" | "PIPE_FLUE",
  ) {
    const dn = connectionPoint?.nominalDiameterMm ? `DN${connectionPoint.nominalDiameterMm}` : "DN?";
    entities.push(
      circle(point.x, point.y, 1.8, "PORT_MARK", "#ffffff"),
      text(point.x + 3, point.y + 1.1, dn, 1.9, layer, "bold"),
    );
  }

  private addValveEquipmentSymbol(
    entities: DrawingEntity[],
    project: Project,
    equipmentDefinitions: EquipmentDefinition[],
    systemType: "supply" | "return" | "gas",
    point: Point,
  ) {
    const component = project.equipmentInstances.find((instance) => {
      const definition = equipmentDefinitions.find((item) => item.id === instance.definitionId);
      return definition?.category === "valve" && definition.connectionPoints.some((connectionPoint) => connectionPoint.type === systemType);
    });
    const definition = component ? equipmentDefinitions.find((item) => item.id === component.definitionId) : undefined;
    if (!component || !definition) return;
    const dn = definition.connectionPoints.find((connectionPoint) => connectionPoint.type === systemType)?.nominalDiameterMm;
    this.addValveSymbol(entities, point.x, point.y, pipeLayer(systemType));
    entities.push(text(point.x + 5, point.y + 5, dn ? `DN${dn}` : component.label, 2, "ANNOTATION", "bold"));
  }

  private addPipeRun(
    entities: DrawingEntity[],
    points: Point[],
    layer: "PIPE_SUPPLY" | "PIPE_RETURN" | "PIPE_GAS" | "PIPE_FLUE",
    label: string,
  ) {
    entities.push(line(points, layer));
    const mid = points[Math.floor(points.length / 2)];
    entities.push(text(mid.x + 2, mid.y - 2, label, 2.5, "ANNOTATION", "bold"));
    this.addFlowArrow(entities, points, layer);
  }

  private addFlowArrow(entities: DrawingEntity[], points: Point[], layer: "PIPE_SUPPLY" | "PIPE_RETURN" | "PIPE_GAS" | "PIPE_FLUE") {
    if (points.length < 2) return;
    const a = points[points.length - 2];
    const b = points[points.length - 1];
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const x = (a.x + b.x) / 2;
    const y = (a.y + b.y) / 2;
    const size = 3.5;
    const left = {
      x: x - Math.cos(angle) * size - Math.sin(angle) * size * 0.5,
      y: y - Math.sin(angle) * size + Math.cos(angle) * size * 0.5,
    };
    const right = {
      x: x - Math.cos(angle) * size + Math.sin(angle) * size * 0.5,
      y: y - Math.sin(angle) * size - Math.cos(angle) * size * 0.5,
    };
    entities.push({ type: "polyline", layer, points: [{ x, y }, left, right, { x, y }], closed: true });
  }

  private addValve(entities: DrawingEntity[], x: number, y: number, pipeLayer: "PIPE_SUPPLY" | "PIPE_RETURN" | "PIPE_GAS") {
    this.addValveSymbol(entities, x, y, pipeLayer);
  }

  private addValveSymbol(entities: DrawingEntity[], x: number, y: number, pipeLayer: "PIPE_SUPPLY" | "PIPE_RETURN" | "PIPE_GAS") {
    const size = 4;
    entities.push(
      { type: "polyline", layer: "VALVE_SYMBOL", points: [{ x: x - size, y: y - size }, { x, y }, { x: x - size, y: y + size }, { x: x - size, y: y - size }], closed: true },
      { type: "polyline", layer: "VALVE_SYMBOL", points: [{ x: x + size, y: y - size }, { x, y }, { x: x + size, y: y + size }, { x: x + size, y: y - size }], closed: true },
      circle(x, y, 0.8, pipeLayer, "#ffffff"),
    );
  }
}

type Point = { x: number; y: number };
type ValveSystemType = "supply" | "return" | "gas";

const midpoint = (a: number, b: number) => (a + b) / 2;

const spreadClosePoints = (
  items: { systemType: ValveSystemType; point: Point }[],
  minDistance: number,
): Record<ValveSystemType, Point> => {
  const sorted = items
    .map((item) => ({ ...item, point: { ...item.point } }))
    .sort((a, b) => a.point.y - b.point.y);

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1].point;
    const current = sorted[index].point;
    const dx = current.x - previous.x;
    const dy = current.y - previous.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 0 && distance < minDistance) {
      current.y += minDistance - distance;
    }
  }

  return {
    supply: sorted.find((item) => item.systemType === "supply")?.point ?? { x: 0, y: 0 },
    return: sorted.find((item) => item.systemType === "return")?.point ?? { x: 0, y: 0 },
    gas: sorted.find((item) => item.systemType === "gas")?.point ?? { x: 0, y: 0 },
  };
};

const rect = (x: number, y: number, width: number, height: number, layer: DrawingEntity["layer"], fill?: string): DrawingEntity => ({
  type: "rect",
  layer,
  x,
  y,
  width,
  height,
  fill,
});

const line = (points: Point[], layer: DrawingEntity["layer"]): DrawingEntity => ({
  type: "polyline",
  layer,
  points,
});

const circle = (x: number, y: number, radius: number, layer: DrawingEntity["layer"], fill?: string): DrawingEntity => ({
  type: "circle",
  layer,
  center: { x, y },
  radius,
  fill,
});

const text = (
  x: number,
  y: number,
  value: string,
  height: number,
  layer: DrawingEntity["layer"],
  weight: "normal" | "bold" = "normal",
  align: "start" | "middle" | "end" = "start",
): DrawingEntity => ({
  type: "text",
  layer,
  at: { x, y },
  value,
  height,
  weight,
  align,
});

const pipeLayer = (systemType: PipingSystemType): "PIPE_SUPPLY" | "PIPE_RETURN" | "PIPE_GAS" =>
  systemType === "return" ? "PIPE_RETURN" : systemType === "gas" ? "PIPE_GAS" : "PIPE_SUPPLY";

const getConnectionPoint = (
  definition: EquipmentDefinition | undefined,
  type: ConnectionPointType,
): ConnectionPoint | undefined =>
  definition?.connectionPoints.find((point) => point.type === type);

const getDefinitionByInstanceId = (
  project: Project,
  equipmentDefinitions: EquipmentDefinition[],
  instanceId: string | undefined,
): EquipmentDefinition | undefined => {
  const instance = project.equipmentInstances.find((item) => item.id === instanceId);
  return instance ? equipmentDefinitions.find((definition) => definition.id === instance.definitionId) : undefined;
};

type EquipmentFacts = {
  nominalPowerKw?: number;
  fuelType?: string;
  gasPressureKpaMax?: number;
  flueDiameterMm?: number;
  nominalDiameterMm?: number;
  circuitCount?: number;
  article?: string;
};

const getEquipmentFacts = (definition: EquipmentDefinition | undefined): EquipmentFacts => {
  const facts = definition?.metadata?.extractedFacts;
  return typeof facts === "object" && facts !== null ? facts as EquipmentFacts : {};
};

const getPassportSummary = (definition: EquipmentDefinition | undefined): string => {
  const facts = getEquipmentFacts(definition);
  const parts = [
    facts.nominalPowerKw ? `N=${facts.nominalPowerKw} кВт` : undefined,
    facts.fuelType === "natural_gas" ? "топливо: природный газ" : undefined,
    facts.gasPressureKpaMax ? `p газа до ${facts.gasPressureKpaMax} кПа` : undefined,
  ].filter(Boolean);
  return parts.length > 0 ? `Паспортные данные: ${parts.join("; ")}` : "Паспортные данные: требуется заполнение";
};

const getSourceSummary = (definition: EquipmentDefinition | undefined): string => {
  const sourceDocumentId = typeof definition?.metadata?.sourceDocumentId === "string"
    ? definition.metadata.sourceDocumentId
    : "нет источника";
  const status = typeof definition?.metadata?.reviewStatus === "string"
    ? definition.metadata.reviewStatus
    : "review_required";
  return `Источник: ${sourceDocumentId}; статус: ${status}`;
};

const getHeaderLabel = (prefix: string, definition: EquipmentDefinition | undefined): string => {
  if (!definition) return `${prefix} Коллектор`;
  const model = definition.model ?? definition.name;
  const facts = getEquipmentFacts(definition);
  const dn = facts.nominalDiameterMm ? `DN${facts.nominalDiameterMm}` : "DN?";
  const circuits = facts.circuitCount ? `${facts.circuitCount} конт.` : "";
  return `${prefix} ${definition.manufacturer ?? ""} ${model} ${dn} ${circuits}`.trim();
};

const getCollectorSummary = (definition: EquipmentDefinition | undefined): string => {
  const facts = getEquipmentFacts(definition);
  const article = facts.article ? `арт. ${facts.article}` : definition?.model;
  const dn = facts.nominalDiameterMm ? `DN${facts.nominalDiameterMm}` : "DN?";
  const circuits = facts.circuitCount ? `${facts.circuitCount} контура` : "контуры требуют проверки";
  return `Коллекторы: ${definition?.manufacturer ?? "источник не задан"} ${article ?? ""}, ${dn}, ${circuits}; статус review_required.`;
};

const getPipeKitSummary = (): string => {
  const hydronic = pilotPipeSpecs.find((spec) => spec.system === "supply");
  const gas = pilotPipeSpecs.find((spec) => spec.system === "gas");
  const flue = pilotPipeSpecs.find((spec) => spec.system === "flue");
  const hydronicText = hydronic ? `T1/T2 DN${hydronic.nominalDiameterMm} ${formatPipeSize(hydronic)}` : "T1/T2 DN?";
  const gasText = gas ? `Г DN${gas.nominalDiameterMm} ${formatPipeSize(gas)}` : "Г DN?";
  const flueText = flue ? `дымоход DN${flue.nominalDiameterMm}` : "дымоход DN?";
  return `Трубы: ${hydronicText}; ${gasText}; ${flueText}; источники review_required.`;
};

const formatPipeSize = (spec: PilotPipeSpec): string =>
  spec.outerDiameterMm && spec.wallThicknessMm
    ? `Ø${spec.outerDiameterMm}x${spec.wallThicknessMm}`
    : spec.material;

type Box = { x: number; y: number; width: number; height: number };

const getBoxPort = (
  box: Box,
  definition: EquipmentDefinition | undefined,
  connectionPoint: ConnectionPoint | undefined,
  fallbackSide: "left" | "right" | "top" | "bottom",
): Point => {
  if (!definition || !connectionPoint) return getSidePort(box, fallbackSide);
  const xRatio = clamp(connectionPoint.position.xMm / Math.max(1, definition.dimensionsMm.width), 0, 1);
  const yRatio = clamp(connectionPoint.position.yMm / Math.max(1, definition.dimensionsMm.depth), 0, 1);
  const side = getPortSide(connectionPoint, fallbackSide);
  if (side === "left") return { x: box.x, y: box.y + box.height * yRatio };
  if (side === "right") return { x: box.x + box.width, y: box.y + box.height * yRatio };
  if (side === "top") return { x: box.x + box.width * xRatio, y: box.y };
  return { x: box.x + box.width * xRatio, y: box.y + box.height };
};

const getPortSide = (
  connectionPoint: ConnectionPoint,
  fallbackSide: "left" | "right" | "top" | "bottom",
): "left" | "right" | "top" | "bottom" => {
  if (connectionPoint.direction === "left") return "left";
  if (connectionPoint.direction === "right") return "right";
  if (connectionPoint.direction === "bottom" || connectionPoint.direction === "front" || connectionPoint.direction === "back") return "bottom";
  if (connectionPoint.direction === "top" || connectionPoint.direction === "up" || connectionPoint.direction === "down") return "top";
  return fallbackSide;
};

const getSidePort = (box: Box, side: "left" | "right" | "top" | "bottom"): Point => {
  if (side === "left") return { x: box.x, y: box.y + box.height / 2 };
  if (side === "right") return { x: box.x + box.width, y: box.y + box.height / 2 };
  if (side === "top") return { x: box.x + box.width / 2, y: box.y };
  return { x: box.x + box.width / 2, y: box.y + box.height };
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const getPlanLabel = (label: string, category: string): string => {
  if (category !== "header") return label.length > 8 ? label.slice(0, 8) : label;
  if (label.toLowerCase().includes("пода")) return "КП1";
  if (label.toLowerCase().includes("обрат")) return "КО1";
  return "К";
};

const getViewport = (name: DrawingViewport["name"]): DrawingViewport => {
  const viewport = viewports.find((item) => item.name === name);
  if (!viewport) throw new Error(`Missing drawing viewport: ${name}`);
  return viewport;
};

const fitEntitiesToViewport = (
  entities: DrawingEntity[],
  viewport: DrawingViewport,
  padding: number,
): DrawingEntity[] => {
  const bounds = getEntitiesBounds(entities);
  const availableWidth = viewport.width - padding * 2;
  const availableHeight = viewport.height - padding * 2;
  const scale = Math.min(1, availableWidth / bounds.width, availableHeight / bounds.height);
  const dx = viewport.x + padding + (availableWidth - bounds.width * scale) / 2 - bounds.xMin * scale;
  const dy = viewport.y + padding + (availableHeight - bounds.height * scale) / 2 - bounds.yMin * scale;
  return entities.map((entity) => transformEntity(entity, scale, dx, dy));
};

const getEntitiesBounds = (entities: DrawingEntity[]) => {
  const bounds = entities.map(getEntityBounds);
  const xMin = Math.min(...bounds.map((item) => item.xMin));
  const yMin = Math.min(...bounds.map((item) => item.yMin));
  const xMax = Math.max(...bounds.map((item) => item.xMax));
  const yMax = Math.max(...bounds.map((item) => item.yMax));
  return {
    xMin,
    yMin,
    xMax,
    yMax,
    width: Math.max(1, xMax - xMin),
    height: Math.max(1, yMax - yMin),
  };
};

const transformEntity = (entity: DrawingEntity, scale: number, dx: number, dy: number): DrawingEntity => {
  if (entity.type === "rect") {
    return { ...entity, x: entity.x * scale + dx, y: entity.y * scale + dy, width: entity.width * scale, height: entity.height * scale };
  }
  if (entity.type === "circle") {
    return { ...entity, center: transformPoint(entity.center, scale, dx, dy), radius: entity.radius * scale };
  }
  if (entity.type === "polyline") {
    return { ...entity, points: entity.points.map((point) => transformPoint(point, scale, dx, dy)) };
  }
  return { ...entity, at: transformPoint(entity.at, scale, dx, dy), height: entity.height * scale };
};

const transformPoint = (point: Point, scale: number, dx: number, dy: number): Point => ({
  x: point.x * scale + dx,
  y: point.y * scale + dy,
});

const getEntityBounds = (entity: DrawingEntity) => {
  if (entity.type === "rect") {
    return { xMin: entity.x, yMin: entity.y, xMax: entity.x + entity.width, yMax: entity.y + entity.height };
  }
  if (entity.type === "circle") {
    return { xMin: entity.center.x - entity.radius, yMin: entity.center.y - entity.radius, xMax: entity.center.x + entity.radius, yMax: entity.center.y + entity.radius };
  }
  if (entity.type === "polyline") {
    return {
      xMin: Math.min(...entity.points.map((point) => point.x)),
      yMin: Math.min(...entity.points.map((point) => point.y)),
      xMax: Math.max(...entity.points.map((point) => point.x)),
      yMax: Math.max(...entity.points.map((point) => point.y)),
    };
  }
  const estimatedWidth = entity.value.length * entity.height * 0.58;
  const xMin = entity.align === "middle" ? entity.at.x - estimatedWidth / 2 : entity.align === "end" ? entity.at.x - estimatedWidth : entity.at.x;
  return { xMin, yMin: entity.at.y - entity.height, xMax: xMin + estimatedWidth, yMax: entity.at.y + entity.height * 0.25 };
};
