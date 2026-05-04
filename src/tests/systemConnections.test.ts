import { describe, expect, it } from "vitest";
import { SystemConnectionResolver } from "@/domain/piping/SystemConnectionResolver";
import { ValidationEngine } from "@/domain/validation/ValidationEngine";
import { DemoInternalStandardsProfile } from "@/infrastructure/standards/DemoInternalStandardsProfile";
import { definitions, makeProject } from "@/tests/testFixtures";

const resolver = new SystemConnectionResolver();
const context = { equipmentDefinitions: definitions };

const withHeaders = () => {
  const project = makeProject();
  project.equipmentInstances.push(
    { id: "supply-header", definitionId: "supply-header", position: { xMm: 500, yMm: 3000 }, rotationDeg: 0, label: "Коллектор подачи" },
    { id: "return-header", definitionId: "return-header", position: { xMm: 500, yMm: 3500 }, rotationDeg: 0, label: "Коллектор обратки" },
  );
  project.equipmentInstances = project.equipmentInstances.filter((instance) => instance.id === "b1" || instance.definitionId.endsWith("header"));
  return project;
};

describe("SystemConnectionResolver", () => {
  it("creates connected supply and return connections for one boiler with headers", () => {
    const connections = resolver.resolve(withHeaders(), context);
    expect(connections).toHaveLength(2);
    expect(connections.some((connection) => connection.systemType === "supply" && connection.status === "connected")).toBe(true);
    expect(connections.some((connection) => connection.systemType === "return" && connection.status === "connected")).toBe(true);
  });

  it("creates missing_target for supply when supply header is missing", () => {
    const project = withHeaders();
    project.equipmentInstances = project.equipmentInstances.filter((instance) => instance.definitionId !== "supply-header");
    const connections = resolver.resolve(project, context);
    expect(connections.some((connection) => connection.systemType === "supply" && connection.status === "missing_target")).toBe(true);
  });

  it("creates missing_target for return when return header is missing", () => {
    const project = withHeaders();
    project.equipmentInstances = project.equipmentInstances.filter((instance) => instance.definitionId !== "return-header");
    const connections = resolver.resolve(project, context);
    expect(connections.some((connection) => connection.systemType === "return" && connection.status === "missing_target")).toBe(true);
  });

  it("creates connections for two boilers with one supply header and one return header", () => {
    const project = makeProject();
    project.equipmentInstances.push(
      { id: "supply-header", definitionId: "supply-header", position: { xMm: 500, yMm: 3000 }, rotationDeg: 0, label: "Коллектор подачи" },
      { id: "return-header", definitionId: "return-header", position: { xMm: 500, yMm: 3500 }, rotationDeg: 0, label: "Коллектор обратки" },
    );
    const connections = resolver.resolve(project, context);
    expect(connections.filter((connection) => connection.status === "connected")).toHaveLength(4);
  });

  it("turns connections into missing_target after removing a header and resolving again", () => {
    const project = withHeaders();
    const before = resolver.resolve(project, context);
    project.equipmentInstances = project.equipmentInstances.filter((instance) => instance.definitionId !== "supply-header");
    const after = resolver.resolve(project, context);
    expect(before.some((connection) => connection.systemType === "supply" && connection.status === "connected")).toBe(true);
    expect(after.some((connection) => connection.systemType === "supply" && connection.status === "missing_target")).toBe(true);
  });

  it("validation reports missing supply and return logical connections", () => {
    const project = withHeaders();
    project.equipmentInstances = project.equipmentInstances.filter((instance) => !instance.definitionId.endsWith("header"));
    const issues = new ValidationEngine(DemoInternalStandardsProfile).validate(project, context);
    expect(issues.some((issue) => issue.ruleId === "required_hydronic_connections" && issue.message === "Котёл не подключён к коллектору подачи")).toBe(true);
    expect(issues.some((issue) => issue.ruleId === "required_hydronic_connections" && issue.message === "Котёл не подключён к коллектору обратки")).toBe(true);
  });
});
