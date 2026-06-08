export interface BasePlaceholderOptions {
  width?: number;
  height?: number;
  text?: string;
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: number;
  dy?: number;
  bgColor?: string;
  textColor?: string;
  dataUri?: boolean;
  charset?: string;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateDefaultPlaceholder({
  width = 300,
  height = 150,
  text = `${width}×${height}`,
  fontFamily = 'sans-serif',
  fontWeight = 'bold',
  fontSize = Math.floor(Math.min(width, height) * 0.2),
  dy = fontSize * 0.35,
  bgColor = '#ddd',
  textColor = 'rgba(0,0,0,0.5)',
}: BasePlaceholderOptions = {}): string {
  const safeText = escapeXml(text);
  const safeFontFamily = escapeXml(fontFamily);
  const safeBgColor = escapeXml(bgColor);
  const safeTextColor = escapeXml(textColor);
  const safeFontWeight = escapeXml(fontWeight);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect fill="${safeBgColor}" width="${width}" height="${height}"/>
    <text fill="${safeTextColor}" font-family="${safeFontFamily}" font-size="${fontSize}" dy="${dy}" font-weight="${safeFontWeight}" x="50%" y="50%" text-anchor="middle">${safeText}</text>
  </svg>`;
}
