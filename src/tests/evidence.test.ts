import { describe, expect, it } from "vitest";
import {
  evidenceLinkTargetsEntity,
  requirementHasCitation,
  ruleEvaluationReferencesRequirement,
} from "@/domain/evidence";
import {
  demoEvidenceLinks,
  demoRequirements,
  demoRuleEvaluations,
  demoSourceDocuments,
} from "@/shared/config/demoEvidenceRequirements";

describe("evidence model", () => {
  it("keeps demo requirements tied to explicit citations", () => {
    const [requirement] = demoRequirements;

    expect(requirementHasCitation(requirement)).toBe(true);
    expect(requirement.status).toBe("review_required");
    expect(requirement.extractionMethod).toBe("demo_fixture");
    expect(requirement.citations[0].sourceDocumentId).toBe(demoSourceDocuments[0].id);
  });

  it("links rule evaluations back to the source requirement", () => {
    const [requirement] = demoRequirements;
    const [evaluation] = demoRuleEvaluations;

    expect(ruleEvaluationReferencesRequirement(evaluation, requirement)).toBe(true);
    expect(evaluation.citationIds).toContain(requirement.citations[0].id);
    expect(evaluation.outcome).toBe("manual_review_required");
  });

  it("can attach evidence links to project entities", () => {
    const [link] = demoEvidenceLinks;

    expect(evidenceLinkTargetsEntity(link, "equipment_instance", "b1")).toBe(true);
    expect(link.relation).toBe("requires_review");
    expect(link.status).toBe("review_required");
  });
});
