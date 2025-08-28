export interface WZPZDoc {
  id?: string;
  bladeId: string;
  clientId: string;
  clientCode2: string; // e.g., 'JK'
  type: 'WZ' | 'PZ';
  seq: number; // per‑client, per YYYY/MM sequence (1..999)
  year: number; // YYYY
  month: number; // 1..12
  humanId: string; // e.g., 'PZ/JK/2025/08/007'
  storagePath: string; // Storage path to PDF
  createdAt: Date;
  byUserId: string;
  signatures?: {
    client?: string;
    ipm?: string;
  }; // Storage paths to PNGs
}

export interface CreateWZPZData {
  bladeId: string;
  clientId: string;
  clientCode2: string;
  type: 'WZ' | 'PZ';
  signatures?: {
    client?: string;
    ipm?: string;
  };
}