export interface Client {
  id?: string;
  name: string;
  code2: string; // two-letter client code, e.g., 'JK'
  nip: string; // Polish VAT number
  phone?: string;
  email?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  counters?: {
    bladesTotal: number;
    sharp: number;
    dull: number;
    regen: number;
    cracked: number;
    scrapped: number;
  };
}

export interface Machine {
  id?: string;
  name: string; // e.g., 'Trak A', 'Trak B'
  location?: string; // optional site descriptor
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClientData {
  name: string;
  code2: string;
  nip: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface CreateMachineData {
  name: string;
  location?: string;
  notes?: string;
}