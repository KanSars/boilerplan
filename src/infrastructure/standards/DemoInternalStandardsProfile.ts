import type { StandardsProfile } from "@/domain/standards/StandardsProfile";
import { EquipmentBodyCollisionRule } from "@/infrastructure/standards/rules/EquipmentBodyCollisionRule";
import { EquipmentInsideRoomRule } from "@/infrastructure/standards/rules/EquipmentInsideRoomRule";
import { PlaceholderEngineeringComplianceWarningRule } from "@/infrastructure/standards/rules/PlaceholderEngineeringComplianceWarningRule";
import { RequiredHydronicConnectionsRule } from "@/infrastructure/standards/rules/RequiredHydronicConnectionsRule";
import { RequiredConnectionPointsRule } from "@/infrastructure/standards/rules/RequiredConnectionPointsRule";
import { ServiceClearanceCollisionRule } from "@/infrastructure/standards/rules/ServiceClearanceCollisionRule";

export const DemoInternalStandardsProfile: StandardsProfile = {
  id: "demo-internal-standards-profile",
  name: "Демо-профиль внутренних правил",
  jurisdiction: "Только демо / заглушка",
  description: "Содержит демо-правила проверки и условные проверки зон обслуживания. Не подтверждает соответствие законам, нормам или требованиям производителя.",
  isPlaceholder: true,
  rules: [
    EquipmentInsideRoomRule,
    EquipmentBodyCollisionRule,
    ServiceClearanceCollisionRule,
    RequiredConnectionPointsRule,
    RequiredHydronicConnectionsRule,
    PlaceholderEngineeringComplianceWarningRule,
  ],
};
