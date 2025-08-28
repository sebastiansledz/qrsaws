export const ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client',
  USER: 'user',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const isAdmin = (role?: string): boolean => {
  return role === ROLES.ADMIN;
};

export const isClient = (role?: string): boolean => {
  return role === ROLES.CLIENT;
};

export const isUser = (role?: string): boolean => {
  return role === ROLES.USER;
};

export const hasRole = (userRole?: string, requiredRole?: Role): boolean => {
  if (!userRole || !requiredRole) return false;
  
  const roleHierarchy = {
    [ROLES.ADMIN]: 3,
    [ROLES.CLIENT]: 2,
    [ROLES.USER]: 1,
  };
  
  return roleHierarchy[userRole as Role] >= roleHierarchy[requiredRole];
};