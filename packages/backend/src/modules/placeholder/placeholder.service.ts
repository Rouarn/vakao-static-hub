import { Injectable, BadRequestException } from '@nestjs/common';
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
  private readonly MAX_DIMENSION = 4096;

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
    const width = this.parseNumber(options.width);
    const height = this.parseNumber(options.height);

    if (width !== undefined && (width < 1 || width > this.MAX_DIMENSION)) {
      throw new BadRequestException(`宽度必须在 1-${this.MAX_DIMENSION} 之间`);
    }
    if (height !== undefined && (height < 1 || height > this.MAX_DIMENSION)) {
      throw new BadRequestException(`高度必须在 1-${this.MAX_DIMENSION} 之间`);
    }

    const normalizedOptions = {
      width,
      height,
      text: options.text,
      bgColor: this.normalizeColor(options.bgColor),
      textColor: this.normalizeColor(options.textColor),
      fontFamily: options.fontFamily,
      fontWeight: options.fontWeight,
      fontSize: this.parseNumber(options.fontSize),
    };
    const svg = generateDefaultPlaceholder({
      dataUri: false,
      ...normalizedOptions,
    });
    return svg;
  }
}
