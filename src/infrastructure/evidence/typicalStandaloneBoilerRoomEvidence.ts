import type { EvidenceDataset } from "@/domain/evidence";
import compiledRules from "../../../data/evidence/typical-standalone-boiler-room/compiled-rules.json";
import evidenceLinks from "../../../data/evidence/typical-standalone-boiler-room/evidence-links.json";
import requirements from "../../../data/evidence/typical-standalone-boiler-room/requirements.json";
import sourceDocuments from "../../../data/evidence/typical-standalone-boiler-room/source-documents.json";

export const typicalStandaloneBoilerRoomEvidenceDataset: EvidenceDataset = {
  sourceDocuments: sourceDocuments as unknown as EvidenceDataset["sourceDocuments"],
  requirements: requirements as unknown as EvidenceDataset["requirements"],
  compiledRules: compiledRules as unknown as EvidenceDataset["compiledRules"],
  evidenceLinks: evidenceLinks as unknown as EvidenceDataset["evidenceLinks"],
};
