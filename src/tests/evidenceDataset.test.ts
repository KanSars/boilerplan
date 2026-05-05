import { describe, expect, it } from "vitest";
import { EvidenceDatasetValidator } from "@/infrastructure/evidence/EvidenceDatasetValidator";
import { StaticEvidenceRepository } from "@/infrastructure/evidence/StaticEvidenceRepository";
import { typicalStandaloneBoilerRoomEvidenceDataset } from "@/infrastructure/evidence/typicalStandaloneBoilerRoomEvidence";
import { definitions } from "@/tests/testFixtures";

describe("typical standalone boiler room evidence dataset", () => {
  it("loads pilot source documents, requirements, rules, and evidence links", () => {
    const repository = new StaticEvidenceRepository(typicalStandaloneBoilerRoomEvidenceDataset);

    expect(repository.listSourceDocuments().length).toBeGreaterThan(0);
    expect(repository.listRequirements().length).toBeGreaterThan(0);
    expect(repository.listCompiledRules().length).toBeGreaterThan(0);
    expect(repository.listEvidenceLinks().length).toBeGreaterThan(0);
  });

  it("keeps every requirement tied to citations and source documents", () => {
    const dataset = typicalStandaloneBoilerRoomEvidenceDataset;
    const sourceDocumentIds = new Set(dataset.sourceDocuments.map((document) => document.id));

    for (const requirement of dataset.requirements) {
      expect(requirement.citations.length).toBeGreaterThan(0);
      for (const citation of requirement.citations) {
        expect(sourceDocumentIds.has(citation.sourceDocumentId)).toBe(true);
      }
    }
  });

  it("does not mark pilot extracted data as verified", () => {
    const dataset = typicalStandaloneBoilerRoomEvidenceDataset;

    expect(dataset.requirements.every((requirement) => requirement.status !== "verified")).toBe(true);
    expect(dataset.sourceDocuments.every((document) => document.status !== "verified")).toBe(true);
    expect(dataset.evidenceLinks.every((link) => link.status !== "verified")).toBe(true);
  });

  it("passes structural integrity validation", () => {
    const result = new EvidenceDatasetValidator().validate(typicalStandaloneBoilerRoomEvidenceDataset);

    expect(result.valid).toBe(true);
    expect(result.issues.filter((issue) => issue.severity === "error")).toEqual([]);
  });

  it("links pilot equipment evidence to existing mock catalog definitions", () => {
    const definitionIds = new Set(definitions.map((definition) => definition.id));
    const equipmentDefinitionLinks = typicalStandaloneBoilerRoomEvidenceDataset.evidenceLinks.filter(
      (link) => link.target.kind === "equipment_definition",
    );

    expect(equipmentDefinitionLinks.length).toBeGreaterThan(0);
    for (const link of equipmentDefinitionLinks) {
      expect(definitionIds.has(link.target.id)).toBe(true);
    }
  });
});
