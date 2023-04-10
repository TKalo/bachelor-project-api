import { Seizure } from "./Seizure.entity";

export enum ChangeType {
  CREATE,
  UPDATE,
  DELETE,
}

export class SeizureChange {
  change: ChangeType;
  seizure: Seizure;
}
