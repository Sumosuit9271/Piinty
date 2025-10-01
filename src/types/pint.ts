export interface PintEntry {
  note: string;
  timestamp: number;
  paid: boolean;
}

export interface GroupData {
  groupName: string;
  members: string[];
  pints: Record<string, PintEntry[]>;
}
