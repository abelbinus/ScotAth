import { IUser } from "./User";

export interface IStudent extends IUser {
    role: "student";
}