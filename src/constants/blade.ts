import { BladeStatusCode, MovementOpCode } from '../types';

// Blade status code mappings
export const BLADE_STATUS_CODES: Record<BladeStatusCode, string> = {
  c0: 'blade.status.c0',   // Bez uwag
  c1: 'blade.status.c1',   // Rysuje
  c2: 'blade.status.c2',   // Faluje
  c3: 'blade.status.c3',   // Chodzi po kole
  c4: 'blade.status.c4',   // Pęknięta
  c5: 'blade.status.c5',   // Brak zęba
  c6: 'blade.status.c6',   // Oklejona
  c7: 'blade.status.c7',   // Wada spawu
  c8: 'blade.status.c8',   // Metal, kamień
  c9: 'blade.status.c9',   // Rysuje na 1 kłodzie
  c10: 'blade.status.c10', // Schodzi z koła
  c11: 'blade.status.c11', // Deformacja
  c12: 'blade.status.c12', // Kolizja na złom
  c13: 'blade.status.c13', // Do regeneracji
  c14: 'blade.status.c14', // Do skrócenia
};

// Movement operation code mappings
export const MOVEMENT_OP_CODES: Record<MovementOpCode, string> = {
  MD: 'movement.opCode.MD',         // Magazyn Dostawcy
  PZ: 'movement.opCode.PZ',         // Wydałem piłę
  SR: 'movement.opCode.SR',         // Przyjąłem od klienta
  ST1: 'movement.opCode.ST1',       // Założyłem na trak
  ST2: 'movement.opCode.ST2',       // Zdjąłem z traka
  WZ: 'movement.opCode.WZ',         // Przyjąłem piłę
  MAGAZYN: 'movement.opCode.MAGAZYN', // Przyjęcie na magazyn iPM
};

// Status code colors for UI
export const BLADE_STATUS_COLORS: Record<BladeStatusCode, string> = {
  c0: 'bg-success-50 text-success-700 border-success-200',   // Bez uwag - green
  c1: 'bg-warning-50 text-warning-700 border-warning-200',   // Rysuje - yellow
  c2: 'bg-warning-50 text-warning-700 border-warning-200',   // Faluje - yellow
  c3: 'bg-warning-50 text-warning-700 border-warning-200',   // Chodzi po kole - yellow
  c4: 'bg-error-50 text-error-700 border-error-200',         // Pęknięta - red
  c5: 'bg-error-50 text-error-700 border-error-200',         // Brak zęba - red
  c6: 'bg-warning-50 text-warning-700 border-warning-200',   // Oklejona - yellow
  c7: 'bg-error-50 text-error-700 border-error-200',         // Wada spawu - red
  c8: 'bg-error-50 text-error-700 border-error-200',         // Metal, kamień - red
  c9: 'bg-warning-50 text-warning-700 border-warning-200',   // Rysuje na 1 kłodzie - yellow
  c10: 'bg-warning-50 text-warning-700 border-warning-200',  // Schodzi z koła - yellow
  c11: 'bg-warning-50 text-warning-700 border-warning-200',  // Deformacja - yellow
  c12: 'bg-gray-50 text-gray-700 border-gray-200',           // Kolizja na złom - gray
  c13: 'bg-primary-50 text-primary-700 border-primary-200',  // Do regeneracji - blue
  c14: 'bg-accent-50 text-accent-700 border-accent-200',     // Do skrócenia - orange
};

// Movement operation colors for UI
export const MOVEMENT_OP_COLORS: Record<MovementOpCode, string> = {
  MD: 'bg-gray-50 text-gray-700 border-gray-200',
  PZ: 'bg-primary-50 text-primary-700 border-primary-200',
  SR: 'bg-secondary-50 text-secondary-700 border-secondary-200',
  ST1: 'bg-success-50 text-success-700 border-success-200',
  ST2: 'bg-warning-50 text-warning-700 border-warning-200',
  WZ: 'bg-accent-50 text-accent-700 border-accent-200',
  MAGAZYN: 'bg-primary-50 text-primary-700 border-primary-200',
};

// Service operations
export const SERVICE_OPS = {
  OSTRZENIE: 'ostrzenie',
  STELLITOWANIE: 'stellitowanie',
  SPEZCZANIE: 'spęczanie',
  SPAWANIE: 'spawanie',
  SKRACANIE: 'skracanie',
  PROSTOWANIE: 'prostowanie',
  PROSTOWANIE_EXTRA: 'prostowanie extra',
  WALCOWANIE: 'walcowanie',
  WALCOWANIE_EXTRA: 'walcowanie extra',
  MYCIE: 'mycie',
  PAKOWANIE: 'pakowanie',
  WYSYLKA: 'wysyłka',
} as const;

export type ServiceOpKey = keyof typeof SERVICE_OPS;