import { IProject } from "./Project";
import { IStudent } from "./Student";

export interface IAcceptedProjectStudentRelation {
    project: IProject;
    students: Pick<IStudent, "id" | "name" | "email">[];
    status: "accepted";
}