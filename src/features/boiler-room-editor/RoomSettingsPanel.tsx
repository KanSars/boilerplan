"use client";

import { mmToMeters } from "@/lib/units";
import type { Room } from "@/domain/room/Room";

type Props = {
  projectName: string;
  room: Room;
  onProjectNameChange: (name: string) => void;
  onRoomChange: (room: Room) => void;
};

export function RoomSettingsPanel({ projectName, room, onProjectNameChange, onRoomChange }: Props) {
  const updateMeters = (field: "widthMm" | "lengthMm" | "heightMm", meters: number) => {
    const mm = Math.max(0, Math.round(meters * 1000));
    onRoomChange({ ...room, [field]: mm });
  };

  return (
    <section className="panel-section">
      <h2>Проект</h2>
      <label>
        Название проекта
        <input value={projectName} onChange={(event) => onProjectNameChange(event.target.value)} />
      </label>
      <div className="field-grid">
        <label>
          Ширина помещения, м
          <input type="number" min="1" step="0.1" value={mmToMeters(room.widthMm)} onChange={(event) => updateMeters("widthMm", Number(event.target.value))} />
        </label>
        <label>
          Длина помещения, м
          <input type="number" min="1" step="0.1" value={mmToMeters(room.lengthMm)} onChange={(event) => updateMeters("lengthMm", Number(event.target.value))} />
        </label>
        <label>
          Высота помещения, м
          <input type="number" min="0" step="0.1" value={room.heightMm ? mmToMeters(room.heightMm) : 0} onChange={(event) => updateMeters("heightMm", Number(event.target.value))} />
        </label>
      </div>
    </section>
  );
}
