import { IUser } from "./User";

export interface IAdmin extends IUser {
    role: "admin";
}