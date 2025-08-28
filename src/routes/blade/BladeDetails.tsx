import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Package, MapPin, User, Calendar, QrCode, Download, Printer, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusPill } from '../../components/common/StatusPill';
import { generateQRPNG, generateQRSVG, downloadQR, printQRLabel } from '../../lib/qr';
import { Blade } from '../../types/blade';

export const BladeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [blade, setBlade] = React.useState<Blade | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [qrPngUrl, setQrPngUrl] = React.useState<string>('');
  const [qrSvgUrl, setQrSvgUrl] = React.useState<string>('');

  React.useEffect(() => {
    if (!id) return;

    const loadBlade = async () => {
      try {
        // TODO: Load blade from Supabase
        const mockBlade: Blade = {
          bladeId: id,
          clientId: 'client-1',
          szerokosc: 25,
          grubosc: 0.8,
          dlugosc: 2500,
          podzialka: '22mm',
          uzebienie: 'Standard',
          system: 'Metric',
          typPilarki: 'Taśmowa',
          statusCode: 'c0',
          createdAt: new Date(),
          updatedAt: new Date(),
          qr: {
            pngPath: `qrs/blades/${id}.png`,
            svgPath: `qrs/blades/${id}.svg`,
          },
        };
        setBlade(mockBlade);
        
        // Generate QR codes for preview
        const pngUrl = await generateQRPNG(mockBlade.bladeId);
        const svgString = await generateQRSVG(mockBlade.bladeId);
        const svgUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;
        
        setQrPngUrl(pngUrl);
        setQrSvgUrl(svgUrl);
      } catch (error) {
        console.error('Error loading blade:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBlade();
  }, [id]);

  const handleDownloadPNG = () => {
    if (qrPngUrl && blade) {
      downloadQR(qrPngUrl, `${blade.bladeId}-qr.png`);
    }
  };

  const handleDownloadSVG = () => {
    if (qrSvgUrl && blade) {
      downloadQR(qrSvgUrl, `${blade.bladeId}-qr.svg`);
    }
  };

  const handlePrintLabel = () => {
    if (qrPngUrl && blade) {
      printQRLabel(qrPngUrl, blade.bladeId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!blade) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="h-16 w-16 text-gray-400 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Nie znaleziono ostrza</h2>
          <p className="text-gray-600">Ostrze o ID "{id}" nie istnieje w systemie.</p>
          <Link to="/app">
            <Button>Powrót do panelu</Button>
          </Link>
        </div>
      </div>
    );
  }

  const movements = [
    {
      id: '1',
      type: 'checkout',
      location: 'ABC Stolarka',
      date: new Date('2024-12-20'),
      user: 'Jan Kowalski',
    },
    {
      id: '2',
      type: 'checkin',
      location: 'Magazyn główny',
      date: new Date('2024-12-18'),
      user: 'Admin',
    },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <PageHeader
        title={`${t('blade.title')} ${blade.bladeId}`}
        showBack
        actions={
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handlePrintLabel}>
              <Printer className="h-4 w-4 mr-2" />
              Drukuj
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPNG}>
              <Download className="h-4 w-4 mr-2" />
              PNG
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadSVG}>
              <QrCode className="h-4 w-4 mr-2" />
              SVG
            </Button>
          </div>
        }
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QR Code Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-1"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCode className="h-5 w-5 text-primary-600" />
                  <span>Kod QR</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                {qrPngUrl && (
                  <div className="bg-white p-4 rounded-xl border-2 border-gray-200 inline-block">
                    <img 
                      src={qrPngUrl} 
                      alt={`QR Code for ${blade.bladeId}`}
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleDownloadPNG}
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PNG
                    </Button>
                    <Button 
                      onClick={handleDownloadSVG}
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      SVG
                    </Button>
                  </div>
                  <Button 
                    onClick={handlePrintLabel}
                    className="w-full"
                    size="sm"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Drukuj etykietę (A7)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Blade Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-primary-600" />
                  <span>Informacje o ostrzu</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      {t('blade.serialNumber')}
                    </label>
                    <p className="mt-1 font-medium">{blade.bladeId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      {t('blade.status')}
                    </label>
                    <div className="mt-1">
                      <StatusPill status={blade.statusCode} />
                    </div>
                  </div>
                </div>

                {/* Specifications */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-3">Specyfikacja</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Szerokość:</span>
                      <p className="font-medium">{blade.szerokosc} mm</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Grubość:</span>
                      <p className="font-medium">{blade.grubosc} mm</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Długość:</span>
                      <p className="font-medium">{blade.dlugosc} mm</p>
                    </div>
                    {blade.podzialka && (
                      <div>
                        <span className="text-gray-600">Podziałka:</span>
                        <p className="font-medium">{blade.podzialka}</p>
                      </div>
                    )}
                    {blade.uzebienie && (
                      <div>
                        <span className="text-gray-600">Uzębienie:</span>
                        <p className="font-medium">{blade.uzebienie}</p>
                      </div>
                    )}
                    {blade.system && (
                      <div>
                        <span className="text-gray-600">System:</span>
                        <p className="font-medium">{blade.system}</p>
                      </div>
                    )}
                    {blade.typPilarki && (
                      <div>
                        <span className="text-gray-600">Typ pilarki:</span>
                        <p className="font-medium">{blade.typPilarki}</p>
                      </div>
                    )}
                  </div>
                </div>

                {blade.notes && (
                  <div className="pt-4 border-t">
                    <label className="text-sm font-medium text-gray-600">Uwagi</label>
                    <p className="mt-1 text-sm text-gray-700">{blade.notes}</p>
                  </div>
                )}
                
                {blade.machineId && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Obecna maszyna:</span>
                      <span className="font-medium">{blade.machineId}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Movement History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Historia ruchów</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {movements.map((movement, index) => (
                  <motion.div
                    key={movement.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">
                        {movement.type === 'checkout' ? 'Wydanie' : 'Zwrot'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {movement.date.toLocaleDateString('pl-PL')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{movement.location}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                      <User className="h-4 w-4" />
                      <span>{movement.user}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};