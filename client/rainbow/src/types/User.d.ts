export interface IUser {
    id: number;
    name: string;
    password: string | null;
    email: string | null;
    role: string;
    username:string;
}