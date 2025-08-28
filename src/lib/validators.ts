import { z } from 'zod';
import { BladeStatusCode, MovementOpCode } from '../types';
import { SERVICE_OPS, type ServiceOpKey } from '../constants/blade';

// Client validators
export const clientSchema = z.object({
  name: z.string().min(1, 'Nazwa klienta jest wymagana'),
  code2: z.string().length(2, 'Kod klienta musi mieć dokładnie 2 znaki').regex(/^[A-Z]{2}$/, 'Kod musi składać się z wielkich liter'),
  nip: z.string().min(10, 'NIP musi mieć co najmniej 10 znaków').max(13, 'NIP może mieć maksymalnie 13 znaków'),
  phone: z.string().optional(),
  email: z.string().email('Nieprawidłowy adres email').optional().or(z.literal('')),
  address: z.string().optional(),
});

export const machineSchema = z.object({
  name: z.string().min(1, 'Nazwa maszyny jest wymagana'),
  location: z.string().optional(),
  notes: z.string().optional(),
});

// Blade validators
const bladeStatusCodes: [BladeStatusCode, ...BladeStatusCode[]] = [
  'c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12', 'c13', 'c14'
];

export const bladeSchema = z.object({
  bladeId: z.string().min(1, 'ID ostrza jest wymagane'),
  clientId: z.string().min(1, 'ID klienta jest wymagane'),
  machineId: z.string().optional(),
  szerokosc: z.number().positive('Szerokość musi być większa od 0'),
  grubosc: z.number().positive('Grubość musi być większa od 0'),
  dlugosc: z.number().positive('Długość musi być większa od 0'),
  podzialka: z.string().optional(),
  uzebienie: z.string().optional(),
  system: z.string().optional(),
  typPilarki: z.string().optional(),
  statusCode: z.enum(bladeStatusCodes).default('c0'),
  notes: z.string().optional(),
});

// Movement validators
const movementOpCodes: [MovementOpCode, ...MovementOpCode[]] = [
  'MD', 'PZ', 'SR', 'ST1', 'ST2', 'WZ', 'MAGAZYN'
];

export const movementSchema = z.object({
  bladeId: z.string().min(1, 'ID ostrza jest wymagane'),
  clientId: z.string().min(1, 'ID klienta jest wymagane'),
  machineId: z.string().optional(),
  opCode: z.enum(movementOpCodes),
  stateCode: z.enum(bladeStatusCodes).optional(),
  hoursWorked: z.number().min(0, 'Godziny pracy nie mogą być ujemne').optional(),
  serviceOps: z.array(z.enum(Object.keys(SERVICE_OPS) as [ServiceOpKey, ...ServiceOpKey[]])).optional(),
  meta: z.object({
    notes: z.string().optional(),
  }).optional(),
});

// WZPZ validators
export const wzpzSchema = z.object({
  bladeId: z.string().min(1, 'ID ostrza jest wymagane'),
  clientId: z.string().min(1, 'ID klienta jest wymagane'),
  clientCode2: z.string().length(2, 'Kod klienta musi mieć dokładnie 2 znaki'),
  type: z.enum(['WZ', 'PZ']),
  signatures: z.object({
    client: z.string().optional(),
    ipm: z.string().optional(),
  }).optional(),
});

// Form validation helpers
export type ClientFormData = z.infer<typeof clientSchema>;
export type MachineFormData = z.infer<typeof machineSchema>;
export type BladeFormData = z.infer<typeof bladeSchema>;
export type MovementFormData = z.infer<typeof movementSchema>;
export type WZPZFormData = z.infer<typeof wzpzSchema>;