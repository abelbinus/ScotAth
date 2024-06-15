import { IProject } from "./Meet";
import { IStudent } from "./Student";

export interface IProjectStudentRelation {
    project: IProject;
    student: Pick<IStudent, "id" | "name" | "email">;
    status: string; //status: "applied" | "accepted" | "rejected"
}