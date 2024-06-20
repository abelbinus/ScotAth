export interface IMeet {
  meetId: integer;
  meetName: string;
  meetDesc?: string;
  pfFolder: string;
  pfOutput: string;
  eventList: string;
  intFolder: string;
  edit?: boolean;
}