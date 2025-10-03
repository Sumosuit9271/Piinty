export interface PintEntry {
  note: string;
  timestamp: number;
  paid: boolean;
  photo?: string; // base64 image
}

export interface GroupData {
  groupName: string;
  members: string[];
  pints: Record<string, PintEntry[]>;
}
