import type { EvidenceDataset } from "@/domain/evidence";

export type EvidenceDatasetValidationIssue = {
  id: string;
  severity: "error" | "warning";
  message: string;
};

export type EvidenceDatasetValidationResult = {
  valid: boolean;
  issues: EvidenceDatasetValidationIssue[];
};

const unverifiedExtractionStatuses = new Set(["extracted", "review_required"]);

export class EvidenceDatasetValidator {
  validate(dataset: EvidenceDataset): EvidenceDatasetValidationResult {
    const issues: EvidenceDatasetValidationIssue[] = [];
    const sourceDocumentIds = new Set(dataset.sourceDocuments.map((document) => document.id));
    const requirementIds = new Set(dataset.requirements.map((requirement) => requirement.id));
    const citationIdList = dataset.requirements.flatMap((requirement) => requirement.citations.map((citation) => citation.id));
    const citationIds = new Set(citationIdList);

    addDuplicateIssues("source document", dataset.sourceDocuments.map((document) => document.id), issues);
    addDuplicateIssues("requirement", dataset.requirements.map((requirement) => requirement.id), issues);
    addDuplicateIssues("citation", citationIdList, issues);
    addDuplicateIssues("compiled rule", dataset.compiledRules.map((rule) => rule.id), issues);
    addDuplicateIssues("evidence link", dataset.evidenceLinks.map((link) => link.id), issues);

    for (const requirement of dataset.requirements) {
      if (requirement.citations.length === 0) {
        issues.push({
          id: `${requirement.id}:missing-citation`,
          severity: "error",
          message: `Requirement ${requirement.id} must have at least one citation.`,
        });
      }

      if (requirement.extractionMethod !== "manual" && requirement.status === "verified") {
        issues.push({
          id: `${requirement.id}:unreviewed-verified-status`,
          severity: "error",
          message: `Requirement ${requirement.id} cannot be verified when extracted by ${requirement.extractionMethod}.`,
        });
      }

      for (const citation of requirement.citations) {
        if (!sourceDocumentIds.has(citation.sourceDocumentId)) {
          issues.push({
            id: `${citation.id}:unknown-source-document`,
            severity: "error",
            message: `Citation ${citation.id} references unknown source document ${citation.sourceDocumentId}.`,
          });
        }
      }
    }

    for (const rule of dataset.compiledRules) {
      if (!requirementIds.has(rule.requirementId)) {
        issues.push({
          id: `${rule.id}:unknown-requirement`,
          severity: "error",
          message: `Compiled rule ${rule.id} references unknown requirement ${rule.requirementId}.`,
        });
      }

      if (unverifiedExtractionStatuses.has(rule.status) && rule.kind !== "manual_review" && rule.severity === "error") {
        issues.push({
          id: `${rule.id}:unverified-error-rule`,
          severity: "warning",
          message: `Compiled rule ${rule.id} is unverified but produces error severity.`,
        });
      }
    }

    for (const link of dataset.evidenceLinks) {
      if (!requirementIds.has(link.requirementId)) {
        issues.push({
          id: `${link.id}:unknown-requirement`,
          severity: "error",
          message: `Evidence link ${link.id} references unknown requirement ${link.requirementId}.`,
        });
      }

      for (const citationId of link.citationIds) {
        if (!citationIds.has(citationId)) {
          issues.push({
            id: `${link.id}:${citationId}:unknown-citation`,
            severity: "error",
            message: `Evidence link ${link.id} references unknown citation ${citationId}.`,
          });
        }
      }

      if (link.status === "verified") {
        issues.push({
          id: `${link.id}:verified-link-not-supported-yet`,
          severity: "warning",
          message: `Evidence link ${link.id} is marked verified; this pilot does not yet implement verification workflow.`,
        });
      }
    }

    return {
      valid: issues.every((issue) => issue.severity !== "error"),
      issues,
    };
  }
}

const addDuplicateIssues = (
  label: string,
  ids: string[],
  issues: EvidenceDatasetValidationIssue[],
) => {
  const seen = new Set<string>();
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id);
      continue;
    }
    issues.push({
      id: `${label}:${id}:duplicate-id`,
      severity: "error",
      message: `Duplicate ${label} id: ${id}.`,
    });
  }
};
