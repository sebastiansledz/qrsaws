import QRCode from 'qrcode';

export interface QRCodePaths {
  pngPath: string;
  svgPath: string;
}

/**
 * Generate QR code as PNG data URL
 */
export const generateQRPNG = async (text: string): Promise<string> => {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR PNG:', error);
    throw new Error('Failed to generate QR code PNG');
  }
};

/**
 * Generate QR code as SVG string
 */
export const generateQRSVG = async (text: string): Promise<string> => {
  try {
    const svg = await QRCode.toString(text, {
      type: 'svg',
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return svg;
  } catch (error) {
    console.error('Error generating QR SVG:', error);
    throw new Error('Failed to generate QR code SVG');
  }
};

/**
 * Convert data URL to Blob
 */
export const dataURLToBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * Download QR code as file
 */
export const downloadQR = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Print QR code label (A7 format)
 */
export const printQRLabel = (qrDataUrl: string, bladeId: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>QR Label - ${bladeId}</title>
      <style>
        @page {
          size: A7;
          margin: 5mm;
        }
        body {
          margin: 0;
          padding: 10px;
          font-family: Arial, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }
        .qr-code {
          width: 60mm;
          height: 60mm;
          margin-bottom: 5mm;
        }
        .blade-id {
          font-size: 12px;
          font-weight: bold;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <img src="${qrDataUrl}" alt="QR Code" class="qr-code" />
      <div class="blade-id">${bladeId}</div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};