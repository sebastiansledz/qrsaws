export type BladeStatusCode =
  | 'c0'  // Bez uwag
  | 'c1'  // Rysuje
  | 'c2'  // Faluje
  | 'c3'  // Chodzi po kole
  | 'c4'  // Pęknięta
  | 'c5'  // Brak zęba
  | 'c6'  // Oklejona
  | 'c7'  // Wada spawu
  | 'c8'  // Metal, kamień
  | 'c9'  // Rysuje na 1 kłodzie
  | 'c10' // Schodzi z koła
  | 'c11' // Deformacja
  | 'c12' // Kolizja na złom
  | 'c13' // Do regeneracji
  | 'c14'; // Do skrócenia

export interface Blade {
  bladeId: string; // QR + primary ID (unique)
  clientId: string;
  machineId?: string; // optional current machine
  // Specs (characteristics):
  szerokosc: number; // width (mm)
  grubosc: number; // thickness (mm)
  dlugosc: number; // length (mm)
  podzialka?: string; // tooth pitch
  uzebienie?: string; // tooth profile
  system?: string; // system
  typPilarki?: string; // saw type
  statusCode: BladeStatusCode; // c0..c14
  notes?: string;
  lastMovementAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  qr: {
    pngPath: string;
    svgPath: string;
  }; // Storage paths for QR assets
}

export interface CreateBladeData {
  bladeId: string;
  clientId: string;
  machineId?: string;
  szerokosc: number;
  grubosc: number;
  dlugosc: number;
  podzialka?: string;
  uzebienie?: string;
  system?: string;
  typPilarki?: string;
  statusCode?: BladeStatusCode;
  notes?: string;
}

// Legacy type for backward compatibility
export type BladeStatus = 'available' | 'in-use' | 'maintenance' | 'damaged' | 'retired';