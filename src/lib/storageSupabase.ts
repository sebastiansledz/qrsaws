import { supabase } from './supabaseClient';

function dataURLToBlob(dataUrl: string) {
  const [meta, base64] = dataUrl.split(',');
  const mime = meta.match(/data:(.*);base64/)?.[1] ?? 'image/png';
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function uploadQrDataUrls(bladeId: string, pngDataUrl: string, svgText: string) {
  // Ensure you created a public bucket named "qr" in Supabase
  const y = new Date().getFullYear();
  const m = String(new Date().getMonth() + 1).padStart(2, '0');

  const pngBlob = dataURLToBlob(pngDataUrl);
  const pngPath = `blades/${y}/${m}/${bladeId}.png`;
  const svgPath = `blades/${y}/${m}/${bladeId}.svg`;

  const up1 = await supabase.storage.from('qr').upload(pngPath, pngBlob, { upsert: true, contentType: 'image/png' });
  if (up1.error) throw up1.error;

  const up2 = await supabase.storage.from('qr').upload(svgPath, new Blob([svgText], { type: 'image/svg+xml' }), { upsert: true, contentType: 'image/svg+xml' });
  if (up2.error) throw up2.error;

  const { data: pub1 } = supabase.storage.from('qr').getPublicUrl(pngPath);
  const { data: pub2 } = supabase.storage.from('qr').getPublicUrl(svgPath);

  return { pngUrl: pub1.publicUrl, svgUrl: pub2.publicUrl, pngPath, svgPath };
}