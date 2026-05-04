import { describe, expect, it } from "vitest";
import { getWorldConnectionPoint } from "@/domain/geometry/transforms";
import { ConnectionCompatibilityService } from "@/domain/piping/ConnectionCompatibilityService";
import { definitions, makeProject } from "@/tests/testFixtures";

describe("connection points", () => {
  it("transforms local connection point into world point", () => {
    const project = makeProject();
    const instance = project.equipmentInstances[0];
    const definition = definitions.find((item) => item.id === instance.definitionId);
    const connectionPoint = definition?.connectionPoints.find((point) => point.id === "supply");
    expect(definition).toBeDefined();
    expect(connectionPoint).toBeDefined();
    if (!definition || !connectionPoint) return;

    const worldPoint = getWorldConnectionPoint(instance, definition, connectionPoint);
    expect(worldPoint.worldPosition).toEqual({ xMm: 1280, yMm: 650, zMm: 900 });
  });

  it("allows supply to connect to supply and rejects supply to return", () => {
    const compatibility = new ConnectionCompatibilityService();
    const boilerDefinition = definitions.find((item) => item.id === "boiler-250kw");
    const supplyHeaderDefinition = definitions.find((item) => item.id === "supply-header");
    const returnHeaderDefinition = definitions.find((item) => item.id === "return-header");
    if (!boilerDefinition || !supplyHeaderDefinition || !returnHeaderDefinition) return;

    const boilerSupply = getWorldConnectionPoint(
      { id: "b1", definitionId: "boiler-250kw", position: { xMm: 0, yMm: 0 }, rotationDeg: 0, label: "B-1" },
      boilerDefinition,
      boilerDefinition.connectionPoints.find((point) => point.id === "supply")!,
    );
    const supplyHeader = getWorldConnectionPoint(
      { id: "h1", definitionId: "supply-header", position: { xMm: 0, yMm: 0 }, rotationDeg: 0, label: "Коллектор подачи" },
      supplyHeaderDefinition,
      supplyHeaderDefinition.connectionPoints[0],
    );
    const returnHeader = getWorldConnectionPoint(
      { id: "h2", definitionId: "return-header", position: { xMm: 0, yMm: 0 }, rotationDeg: 0, label: "Коллектор обратки" },
      returnHeaderDefinition,
      returnHeaderDefinition.connectionPoints[0],
    );

    expect(compatibility.canConnect(boilerSupply, supplyHeader).compatible).toBe(true);
    expect(compatibility.canConnect(boilerSupply, returnHeader).compatible).toBe(false);
  });

  it("allows return to connect to return", () => {
    const compatibility = new ConnectionCompatibilityService();
    const boilerDefinition = definitions.find((item) => item.id === "boiler-250kw");
    const returnHeaderDefinition = definitions.find((item) => item.id === "return-header");
    if (!boilerDefinition || !returnHeaderDefinition) return;

    const boilerReturn = getWorldConnectionPoint(
      { id: "b1", definitionId: "boiler-250kw", position: { xMm: 0, yMm: 0 }, rotationDeg: 0, label: "B-1" },
      boilerDefinition,
      boilerDefinition.connectionPoints.find((point) => point.id === "return")!,
    );
    const returnHeader = getWorldConnectionPoint(
      { id: "h2", definitionId: "return-header", position: { xMm: 0, yMm: 0 }, rotationDeg: 0, label: "Коллектор обратки" },
      returnHeaderDefinition,
      returnHeaderDefinition.connectionPoints[0],
    );

    expect(compatibility.canConnect(boilerReturn, returnHeader).compatible).toBe(true);
  });
});
