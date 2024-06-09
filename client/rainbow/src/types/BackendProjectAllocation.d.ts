export interface BackendProjectAllocation {
    studentId: number;
    studentName: string;
    studentEmail: string;
    studentDepartment: string;
    projectId: number;
    projectTitle: string;
    projectDescription: string;
    projectAvailability: boolean;
    projectMaxStudent: number;
    projectDepartment: string;
    supervisorId: number;
    supervisorName: string;
    status: string;
}