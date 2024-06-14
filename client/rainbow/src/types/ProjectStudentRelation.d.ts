import { IProject } from "./Project";
import { IStudent } from "./Student";

export interface IProjectStudentRelation {
    project: IProject;
    student: Pick<IStudent, "id" | "name" | "email">;
    status: string; //status: "applied" | "accepted" | "rejected"
}