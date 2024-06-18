import { IUser } from "./User";

export interface IVolunteer extends IUser {
    role: "volunteer";
}