import type { Project } from "@/domain/project/Project";

export const removeEquipmentInstance = (
  project: Project,
  equipmentInstanceId: string,
): Project => ({
  ...project,
  equipmentInstances: project.equipmentInstances.filter(
    (instance) => instance.id !== equipmentInstanceId,
  ),
  pipingRoutes: project.pipingRoutes.filter(
    (route) =>
      route.from.equipmentInstanceId !== equipmentInstanceId &&
      route.to.equipmentInstanceId !== equipmentInstanceId,
  ),
});
