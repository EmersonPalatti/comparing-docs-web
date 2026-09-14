import { type Subject } from "./models.ts";

export function hoursRatio(previous: Subject, current: Subject): number | null {
  if (previous.workloadHours === null || current.workloadHours === null || current.workloadHours <= 0) {
    return null;
  }
  return previous.workloadHours / current.workloadHours;
}
