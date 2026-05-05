import type {
  CompiledRule,
  EvidenceDataset,
  EvidenceLink,
  EvidenceLinkRepository,
  Requirement,
  RequirementRepository,
  SourceDocument,
} from "@/domain/evidence";

export class StaticEvidenceRepository implements RequirementRepository, EvidenceLinkRepository {
  constructor(private readonly dataset: EvidenceDataset) {}

  listSourceDocuments(): SourceDocument[] {
    return this.dataset.sourceDocuments;
  }

  listRequirements(): Requirement[] {
    return this.dataset.requirements;
  }

  listCompiledRules(): CompiledRule[] {
    return this.dataset.compiledRules;
  }

  listEvidenceLinks(): EvidenceLink[] {
    return this.dataset.evidenceLinks;
  }

  findRequirementById(id: string): Requirement | undefined {
    return this.dataset.requirements.find((requirement) => requirement.id === id);
  }
}
