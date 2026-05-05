import type { PilotCalculationResult } from "@/domain/calculation";
import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import { pilotPipeSpecs } from "@/shared/config/pilotKitSpecs";

const waterDensityKgM3 = 1000;
const waterSpecificHeatJKgK = 4186;
const defaultSupplyTemperatureC = 80;
const defaultReturnTemperatureC = 60;

export class PilotKitCalculationService {
  calculate(equipmentDefinitions: EquipmentDefinition[]): PilotCalculationResult[] {
    const boiler = equipmentDefinitions.find((definition) => definition.id === "rgt-100-ksva-100");
    return [
      this.calculateHydronicFlow(boiler),
      this.calculateGasVelocity(boiler),
    ];
  }

  private calculateHydronicFlow(boiler: EquipmentDefinition | undefined): PilotCalculationResult {
    const facts = getEquipmentFacts(boiler);
    const powerKw = facts.nominalPowerKw;
    const pipe = pilotPipeSpecs.find((spec) => spec.system === "supply");
    if (!powerKw || !pipe?.outerDiameterMm || !pipe.wallThicknessMm) {
      return insufficient("calc-hydronic-flow", "Расчет расхода теплоносителя", "Нет мощности котла или размеров трубы.");
    }

    const deltaT = defaultSupplyTemperatureC - defaultReturnTemperatureC;
    const massFlowKgS = powerKw * 1000 / (waterSpecificHeatJKgK * deltaT);
    const volumeFlowM3H = massFlowKgS / waterDensityKgM3 * 3600;
    const innerDiameterMm = pipe.outerDiameterMm - pipe.wallThicknessMm * 2;
    const areaM2 = Math.PI * (innerDiameterMm / 1000) ** 2 / 4;
    const velocityMS = (volumeFlowM3H / 3600) / areaM2;

    return {
      id: "calc-hydronic-flow",
      title: "Расчет расхода теплоносителя и скорости T1/T2",
      status: "calculated_review_required",
      sourceDocumentIds: ["src-rgt-100-500-passport", "src-gost-3262-75", "src-sp-89-13330-2016"],
      formula: "m = P / (c * Δt); V = m / ρ; v = V / A",
      inputs: {
        powerKw,
        supplyTemperatureC: defaultSupplyTemperatureC,
        returnTemperatureC: defaultReturnTemperatureC,
        deltaT,
        waterSpecificHeatJKgK,
        waterDensityKgM3,
        pipeOuterDiameterMm: pipe.outerDiameterMm,
        pipeWallThicknessMm: pipe.wallThicknessMm,
        pipeInnerDiameterMm: round(innerDiameterMm, 1),
      },
      outputs: {
        massFlowKgS: round(massFlowKgS, 3),
        volumeFlowM3H: round(volumeFlowM3H, 2),
        velocityMS: round(velocityMS, 2),
      },
      limitations: [
        "Расчет использует pilot температурный график 80/60 °C; график должен быть задан проектом.",
        "Потери давления, насос, местные сопротивления, арматура и балансировка не рассчитаны.",
        "СП 89.13330 требует выбирать диаметры и арматуру по гидравлическим и прочностным расчетам; этот расчет закрывает только расход и скорость.",
      ],
    };
  }

  private calculateGasVelocity(boiler: EquipmentDefinition | undefined): PilotCalculationResult {
    const facts = getEquipmentFacts(boiler);
    const gasFlowM3H = facts.nominalGasFlowM3h;
    const pipe = pilotPipeSpecs.find((spec) => spec.system === "gas");
    if (!gasFlowM3H || !pipe?.outerDiameterMm || !pipe.wallThicknessMm) {
      return insufficient("calc-gas-velocity", "Предварительная скорость газа", "Нет паспортного расхода газа или размеров газовой трубы.");
    }

    const innerDiameterMm = pipe.outerDiameterMm - pipe.wallThicknessMm * 2;
    const areaM2 = Math.PI * (innerDiameterMm / 1000) ** 2 / 4;
    const velocityMS = (gasFlowM3H / 3600) / areaM2;

    return {
      id: "calc-gas-velocity",
      title: "Предварительная скорость газа в DN25",
      status: "calculated_review_required",
      sourceDocumentIds: ["src-rgt-100-500-passport", "src-gost-3262-75", "src-sp-89-13330-2016"],
      formula: "v = V / A",
      inputs: {
        gasFlowM3H,
        gasPressureKpaMax: facts.gasPressureKpaMax ?? "unknown",
        pipeOuterDiameterMm: pipe.outerDiameterMm,
        pipeWallThicknessMm: pipe.wallThicknessMm,
        pipeInnerDiameterMm: round(innerDiameterMm, 1),
      },
      outputs: {
        velocityMS: round(velocityMS, 2),
      },
      limitations: [
        "Это только расчет скорости по паспортному расходу газа, без расчета падения давления и без проверки требований газоснабжения.",
        "Газовая часть должна проверяться отдельным нормативным/расчетным модулем.",
      ],
    };
  }
}

type EquipmentFacts = {
  nominalPowerKw?: number;
  gasPressureKpaMax?: number;
  nominalGasFlowM3h?: number;
};

const getEquipmentFacts = (definition: EquipmentDefinition | undefined): EquipmentFacts => {
  const facts = definition?.metadata?.extractedFacts;
  return typeof facts === "object" && facts !== null ? facts as EquipmentFacts : {};
};

const insufficient = (id: string, title: string, reason: string): PilotCalculationResult => ({
  id,
  title,
  status: "insufficient_data",
  sourceDocumentIds: [],
  formula: "not_calculated",
  inputs: {},
  outputs: {},
  limitations: [reason],
});

const round = (value: number, digits: number): number => {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
};
