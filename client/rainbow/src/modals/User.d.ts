export interface IUser {
    id: number;
    name: string;
    username: string;
    password: string | null;
    email: string | null;
    role: string;
}