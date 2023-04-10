

export enum SeizureType{
    TONIC,
    ATONIC,
}

export class Seizure {
    type: SeizureType;
    duration: number;
}