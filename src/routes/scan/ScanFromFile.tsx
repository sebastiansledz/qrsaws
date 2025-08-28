import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Upload, Camera } from 'lucide-react';

export const ScanFromFile: React.FC = () => {
  // TODO: Implement QR code scanning from uploaded image
  // This could use a library like jsQR to decode QR codes from image files
  
  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="border-0 shadow-large">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Upload className="h-6 w-6 text-primary-600" />
              <span>Skanuj z pliku</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="w-32 h-32 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center">
              <Camera className="h-16 w-16 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                Prześlij zdjęcie z kodem QR aby go zeskanować
              </p>
              
              <Button 
                variant="outline" 
                className="w-full h-12"
                disabled
              >
                <Upload className="h-4 w-4 mr-2" />
                Wybierz plik (Wkrótce)
              </Button>
              
              <p className="text-xs text-gray-500">
                TODO: Implementacja skanowania QR z przesłanych zdjęć
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};