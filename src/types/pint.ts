export interface PintEntry {
  note: string;
  timestamp: number;
}

export interface GroupData {
  groupName: string;
  members: string[];
  pints: Record<string, PintEntry[]>;
}
