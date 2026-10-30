import QRCode from 'qrcode';

export async function generateQrDataUrl(content: string): Promise<string> {
  return QRCode.toDataURL(content, { width: 300, margin: 1 });
}
