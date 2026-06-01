export const VIOLATION_RU: Record<string, string> = {
  collision:      "Столкновение",
  track_limits:   "Срез трассы",
  false_start:    "Фальстарт",
  unsafe_driving: "Опасное вождение",
  blocking:       "Блокировка",
  other:          "Другое",
};

export const DECISION_RU: Record<string, { tone: "danger" | "warning" | "neutral"; label: string }> = {
  penalty: { tone: "danger",  label: "Штраф"    },
  warning: { tone: "warning", label: "Предупр." },
  dismiss: { tone: "neutral", label: "Снят"     },
};
