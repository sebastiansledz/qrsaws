import React from 'react';
import { QrCode } from 'lucide-react';
import { cn } from '../../lib/utils';

interface QRIconProps {
  className?: string;
  size?: number;
}

export const QRIcon: React.FC<QRIconProps> = ({ className, size = 24 }) => {
  return (
    <QrCode 
      className={cn("text-primary", className)} 
      size={size}
    />
  );
};