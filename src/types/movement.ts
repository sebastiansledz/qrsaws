export type MovementOpCode = 'MD' | 'PZ' | 'SR' | 'ST1' | 'ST2' | 'WZ' | 'MAGAZYN';

export interface Movement {
  id?: string;
  bladeId: string;
  clientId: string;
  machineId?: string;
  opCode: MovementOpCode;
  // derived UI label via map: 
  // MD→Magazyn Dostawcy, PZ→Wydałem piłę, SR→Przyjąłem od klienta, 
  // ST1→Założyłem na trak, ST2→Zdjąłem z traka, WZ→Przyjąłem piłę, 
  // MAGAZYN→Przyjęcie na magazyn iPM
  stateCode?: import('./blade').BladeStatusCode; // optional c0..c14 at time of movement
  hoursWorked?: number; // computed between ST1–ST2 or 16h fallback
  byUserId: string;
  at: Date;
  meta?: {
    notes?: string;
  };
}

export interface CreateMovementData {
  bladeId: string;
  clientId: string;
  machineId?: string;
  opCode: MovementOpCode;
  stateCode?: import('./blade').BladeStatusCode;
  hoursWorked?: number;
  meta?: {
    notes?: string;
  };
}

// Legacy type for backward compatibility
export type MovementType = 'checkout' | 'checkin' | 'transfer' | 'maintenance' | 'disposal';