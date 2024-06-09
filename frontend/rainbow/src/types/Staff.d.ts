import { IUser } from "./User";

export interface IStaff extends IUser {
    role: "staff";
}