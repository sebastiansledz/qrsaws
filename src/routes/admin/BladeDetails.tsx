import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Edit, Download, Printer, QrCode, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusPill } from '../../components/common/StatusPill';
import { getClients, getBlades } from '../../lib/queriesSupabase';
import { generateQRPNG, downloadQR, printQRLabel } from '../../lib/qr';
import { Blade } from '../../types/blade';
import { Client } from '../../types/client';
import { MOVEMENT_OP_CODES } from '../../constants/blade';

export const BladeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [blade, setBlade] = useState<Blade | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrPngUrl, setQrPngUrl] = useState<string>('');

  useEffect(() => {
    if (!id) return;

    const loadBladeDetails = async () => {
      try {
        const clientsData = await getClients();
        const bladesData = await getBlades();
        const b = (bladesData as any[]).find(x => x.blade_code === id);
        if (!b) { 
          setBlade(null); 
          setLoading(false); 
          return; 
        }

        const mapped: Blade = {
          bladeId: b.blade_code,
          clientId: b.client_id,
          szerokosc: b.width_mm || 0,
          grubosc: b.thickness_mm || 0,
          dlugosc: b.length_mm || 0,
          podzialka: b.pitch,
          uzebienie: b.spec,
          system: '',
          typPilarki: b.machine,
          statusCode: (b.status || 'c0') as any,
          createdAt: new Date(b.created_at),
          updatedAt: new Date(b.updated_at || b.created_at),
          qr: { 
            pngPath: `blades/${b.blade_code}.png`, 
            svgPath: `blades/${b.blade_code}.svg` 
          },
        };

        setBlade(mapped);
        
        // Find client
        const clientData = (clientsData as Client[]).find(c => c.id === mapped.clientId);
        setClient(clientData || null);
        
        // Generate QR code
        const pngUrl = await generateQRPNG(mapped.bladeId);
        setQrPngUrl(pngUrl);
      } catch (error) {
        console.error('Error loading blade details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBladeDetails();
  }, [id]);

  // Helper function for file URLs (placeholder for now)
  const getFileUrl = async (storagePath: string): Promise<string> => {
    // TODO: Implement file URL generation for Supabase Storage
    return `#${storagePath}`;
  };

  const handleDownloadQR = () => {
    if (qrPngUrl && blade) {
      downloadQR(qrPngUrl, `${blade.bladeId}-qr.png`);
    }
  };

  const handlePrintLabel = () => {
    if (qrPngUrl && blade) {
      printQRLabel(qrPngUrl, blade.bladeId);
    }
  };

  // Mock movements data
  const movements = [
    {
      id: '1',
      opCode: 'PZ' as const,
      stateCode: 'c0' as const,
      at: new Date('2024-12-20T10:30:00'),
      byUserId: 'user-1',
      meta: { notes: 'Wydanie do klienta' },
    },
    {
      id: '2',
      opCode: 'ST1' as const,
      stateCode: 'c0' as const,
      at: new Date('2024-12-20T11:00:00'),
      byUserId: 'user-2',
      meta: { notes: 'Założono na trak A' },
    },
    {
      id: '3',
      opCode: 'ST2' as const,
      stateCode: 'c1' as const,
      at: new Date('2024-12-20T18:00:00'),
      byUserId: 'user-2',
      meta: { notes: 'Zdjęto z traka - rysuje' },
    },
  ];

  // Mock WZPZ documents
  const wzpzDocs = [
    {
      id: '1',
      humanId: 'PZ/AB/2024/12/001',
      type: 'PZ' as const,
      createdAt: new Date('2024-12-20T10:30:00'),
      storagePath: 'wzpz/2024/12/AB/PZ-001_BS-001-2024.pdf',
    },
  ];

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
          <h2 className="text-xl font-semibold text-gray-900">Nie znaleziono piły</h2>
          <p className="text-gray-600">Piła o ID "{id}" nie istnieje w systemie.</p>
          <Button onClick={() => navigate('/admin')}>
            Powrót do panelu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title={`Piła ${blade.bladeId}`}
        subtitle={client ? `${client.name} (${client.code2})` : 'Szczegóły piły'}
        showBack
        actions={
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/blade/${blade.bladeId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edytuj
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrintLabel}>
              <Printer className="h-4 w-4 mr-2" />
              Drukuj
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadQR}>
              <Download className="h-4 w-4 mr-2" />
              Pobierz QR
            </Button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QR Code */}
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
                  <Button 
                    onClick={handleDownloadQR}
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Pobierz PNG
                  </Button>
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
                  <span>Informacje o pile</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">ID Piły</label>
                    <p className="mt-1 font-medium">{blade.bladeId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      <StatusPill status={blade.statusCode} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Klient</label>
                    <p className="mt-1 font-medium">
                      {client ? `${client.name} (${client.code2})` : blade.clientId}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Maszyna</label>
                    <p className="mt-1 font-medium">{blade.machineId || '-'}</p>
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
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Movement Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary-600" />
                <span>Historia ruchów (ostatnie 30)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data i czas</TableHead>
                    <TableHead>Operacja</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uwagi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement, index) => (
                    <motion.tr
                      key={movement.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <TableCell>
                        {movement.at.toLocaleString('pl-PL')}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                          {movement.opCode}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusPill status={movement.stateCode} />
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {movement.meta?.notes || '-'}
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* WZPZ Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary-600" />
                <span>Dokumenty WZPZ</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numer dokumentu</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Data utworzenia</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wzpzDocs.map((doc, index) => (
                    <motion.tr
                      key={doc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <TableCell className="font-medium">{doc.humanId}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          doc.type === 'WZ' 
                            ? 'bg-accent-100 text-accent-700' 
                            : 'bg-secondary-100 text-secondary-700'
                        }`}>
                          {doc.type === 'WZ' ? 'Wydanie zewnętrzne' : 'Przyjęcie zewnętrzne'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {doc.createdAt.toLocaleString('pl-PL')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={async () => {
                            try {
                              const url = await getFileUrl(doc.storagePath);
                              window.open(url, '_blank');
                            } catch (error) {
                              console.error('Error downloading PDF:', error);
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Pobierz PDF
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                  {wzpzDocs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        Brak dokumentów WZPZ
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default BladeDetails;