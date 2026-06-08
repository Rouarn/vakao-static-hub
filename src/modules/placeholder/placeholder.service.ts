import { Injectable } from '@nestjs/common';
import { generateDefaultPlaceholder } from './generators/default';

export interface PlaceholderOptions {
  width?: string | number;
  height?: string | number;
  text?: string;
  bgColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: string | number;
}

@Injectable()
export class PlaceholderService {
  private parseNumber(value?: string | number): number | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') return value;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  }

  private normalizeColor(color?: string): string | undefined {
    if (!color) return undefined;
    const trimmed = color.trim();
    if (!trimmed) return undefined;
    return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  }

  generatePlaceholder(options: PlaceholderOptions = {}) {
    const normalizedOptions = {
      width: this.parseNumber(options.width as string | number),
      height: this.parseNumber(options.height as string | number),
      text: options.text,
      bgColor: this.normalizeColor(options.bgColor as string),
      textColor: this.normalizeColor(options.textColor as string),
      fontFamily: options.fontFamily,
      fontWeight: options.fontWeight,
      fontSize: this.parseNumber(options.fontSize as string | number),
    };
    const svg = generateDefaultPlaceholder({
      dataUri: false,
      ...normalizedOptions,
    });
    return svg;
  }
}
