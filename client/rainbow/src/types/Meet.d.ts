import { IVlounteer } from "./Volunteer";

export interface IMeet {
  meetid: number;
  meetName: string;
  description: string;
  pfFolder: string;
  pfOutput: string;
  eventList: string;
  extFolder: string;
  edit: boolean;
}