import { Seizure } from "./seizure.entity";

export enum ChangeType {
  CREATE,
  UPDATE,
  DELETE,
}

export class SeizureChange {
  change: ChangeType;
  seizure: Seizure;
}
