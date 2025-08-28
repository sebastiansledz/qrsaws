import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getClients } from '../../lib/queriesSupabase';
import { generateQRSVG } from '../../lib/qr';
import { Blade } from '../../types/blade';
import { Client } from '../../types/client';

export const PrintLabel: React.FC = () => {
  const { bladeId } = useParams<{ bladeId: string }>();
  const [blade, setBlade] = useState<Blade | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bladeId) return;

    const loadData = async () => {
      try {
        const clientsData = await getClients();

        // TODO: Load blade from Supabase
        const mockBlade: Blade = {
          bladeId: bladeId!,
          clientId: 'client-1',
          szerokosc: 25,
          grubosc: 0.8,
          dlugosc: 2500,
          statusCode: 'c0',
          createdAt: new Date(),
          updatedAt: new Date(),
          qr: {
            pngPath: `qrs/blades/${bladeId}.png`,
            svgPath: `qrs/blades/${bladeId}.svg`,
          },
        };
        setBlade(mockBlade);
        
        // Find client
        const clientData = (clientsData as Client[]).find(c => c.id === mockBlade.clientId);
        setClient(clientData || null);
        
        // Generate QR SVG
        const svgString = await generateQRSVG(mockBlade.bladeId);
        setQrSvg(svgString);
      } catch (error) {
        console.error('Error loading blade data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [bladeId]);

  useEffect(() => {
    // Auto-print when data is loaded
    if (!loading && blade && qrSvg) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, blade, qrSvg]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Ładowanie etykiety...</p>
        </div>
      </div>
    );
  }

  if (!blade) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Nie znaleziono ostrza</h2>
          <p>Ostrze o ID "{bladeId}" nie istnieje w systemie.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @page {
          size: A7;
          margin: 0;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          
          .no-print {
            display: none !important;
          }
        }
        
        .print-label {
          width: 74mm;
          height: 105mm;
          padding: 5mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: Arial, sans-serif;
          background: white;
          box-sizing: border-box;
        }
        
        .qr-container {
          width: 50mm;
          height: 50mm;
          margin-bottom: 3mm;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .qr-container svg {
          width: 100%;
          height: 100%;
        }
        
        .blade-info {
          text-align: center;
          line-height: 1.2;
        }
        
        .blade-id {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 2mm;
        }
        
        .client-code {
          font-size: 10px;
          color: #666;
        }
      `}</style>
      
      <div className="no-print p-4 text-center bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <p className="mb-4">Przygotowywanie etykiety do druku...</p>
          <p className="text-sm text-gray-600">
            Etykieta zostanie automatycznie wydrukowana.
          </p>
        </div>
      </div>

      <div className="print-label">
        <div className="qr-container">
          {qrSvg && (
            <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
          )}
        </div>
        
        <div className="blade-info">
          <div className="blade-id">{blade.bladeId}</div>
          {client && (
            <div className="client-code">{client.code2}</div>
          )}
        </div>
      </div>
    </>
  );
};