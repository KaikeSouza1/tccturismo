import { useState } from "react";
import { ACHIEVEMENT_ICONS } from "../../lib/achievement-icons";
import { AchievementIcon } from "./AchievementIcon";
import "./IconPicker.css";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [search, setSearch] = useState("");
  const filtered = ACHIEVEMENT_ICONS.filter((icon) =>
    icon.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="icon-picker">
      <input
        className="input"
        placeholder="buscar icone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="icon-picker__grid">
        {filtered.map((icon) => (
          <button
            key={icon}
            type="button"
            className={`icon-picker__item${icon === value ? " icon-picker__item--selected" : ""}`}
            onClick={() => onChange(icon)}
            title={icon}
          >
            <AchievementIcon name={icon} size={18} />
          </button>
        ))}
        {filtered.length === 0 ? <span className="icon-picker__empty">nenhum icone encontrado</span> : null}
      </div>
    </div>
  );
}
