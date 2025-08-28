import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { BladeStatusCode } from '../../types/blade';
import { BLADE_STATUS_COLORS } from '../../constants/blade';

interface StatusPillProps {
  status: BladeStatusCode | string;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, className }) => {
  const { t } = useTranslation();
  
  // Check if it's a blade status code
  const isBladeStatusCode = status.startsWith('c') && status.length <= 3;
  
  const displayText = isBladeStatusCode 
    ? t(`blade.status.${status}`)
    : status;
    
  const colorClass = isBladeStatusCode 
    ? BLADE_STATUS_COLORS[status as BladeStatusCode]
    : 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border',
        colorClass,
        className
      )}
    >
      {displayText}
    </span>
  );
};