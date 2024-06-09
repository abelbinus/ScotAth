export interface BackendProjectList {
    id: number;
    title: string;
    description: string;
    availability: boolean;
    maxstudents: number;
    department: string;
    supervisorId: number;
    status: string;
    supervisorName: string;
}