import type { Achievement } from "../../types";
import { Button } from "./Button";
import { InkStamp } from "./InkStamp";
import { getRarity, RARITY_LABEL } from "../../lib/rarity";
import { MedalIcon, SparkIcon } from "../../icons";
import "./AchievementCelebration.css";

interface AchievementCelebrationProps {
  achievements: Achievement[];
  onDismiss: () => void;
}

export function AchievementCelebration({ achievements, onDismiss }: AchievementCelebrationProps) {
  if (achievements.length === 0) return null;

  return (
    <div className="celebration">
      <div className="celebration__card">
        <SparkIcon size={26} className="celebration__spark celebration__spark--1" />
        <SparkIcon size={16} className="celebration__spark celebration__spark--2" />
        <SparkIcon size={20} className="celebration__spark celebration__spark--3" />

        <span className="celebration__tab">pagina carimbada</span>
        <h2 className="celebration__title">Nova conquista!</h2>
        <p className="celebration__subtitle">
          voce desbloqueou {achievements.length > 1 ? "novas conquistas" : "uma nova conquista"} no seu caderno
        </p>

        <div className="celebration__list">
          {achievements.map((achievement, index) => {
            const rarity = getRarity(achievement);
            return (
              <div
                key={achievement.id}
                className="celebration__item rise-in"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <div className="pop-in" style={{ animationDelay: `${index * 90 + 80}ms` }}>
                  <InkStamp variant={rarity} size={52} rotate={index % 2 === 0 ? -8 : 7}>
                    <MedalIcon size={20} />
                  </InkStamp>
                </div>
                <div className="celebration__item-body">
                  <strong>{achievement.name}</strong>
                  <span className={`celebration__rarity celebration__rarity--${rarity}`}>
                    {RARITY_LABEL[rarity]}
                  </span>
                  <p>{achievement.description}</p>
                </div>
                <span className="celebration__points">+{achievement.points}</span>
              </div>
            );
          })}
        </div>

        <Button fullWidth onClick={onDismiss}>
          Continuar explorando
        </Button>
      </div>
    </div>
  );
}
