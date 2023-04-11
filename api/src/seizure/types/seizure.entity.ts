import { ObjectId } from "mongodb";


export enum SeizureType{
    TONIC,
    ATONIC,
}

export class Seizure {
    _id: ObjectId;
    userId: ObjectId;
    type: SeizureType;
    duration: number;
    deleted?: boolean;
}