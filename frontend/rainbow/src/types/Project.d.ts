import { IStaff } from "./Staff";

export interface IProject {
  id: number;
  title: string;
  department: string;
  supervisor: Pick<IStaff, "id" | "name">;
  description: string;
  maxStudents: number;
  availability: boolean;
}