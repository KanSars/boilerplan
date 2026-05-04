import type { CompiledRule } from "@/domain/evidence/CompiledRule";
import type { EvidenceLink } from "@/domain/evidence/EvidenceLink";
import type { Requirement } from "@/domain/evidence/Requirement";
import type { RuleEvaluation } from "@/domain/evidence/RuleEvaluation";
import type { SourceDocument } from "@/domain/evidence/SourceDocument";
import type { Project } from "@/domain/project/Project";

export type RequirementRepository = {
  listSourceDocuments(): SourceDocument[];
  listRequirements(): Requirement[];
  findRequirementById(id: string): Requirement | undefined;
};

export type RuleCompiler = {
  compile(requirement: Requirement): CompiledRule | undefined;
};

export type RuleEvaluationContext = {
  sourceDocuments: SourceDocument[];
  requirements: Requirement[];
};

export type RuleEvaluator = {
  evaluate(project: Project, rule: CompiledRule, context: RuleEvaluationContext): RuleEvaluation[];
};

export type EvidenceLinkRepository = {
  listEvidenceLinks(): EvidenceLink[];
};
