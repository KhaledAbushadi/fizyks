import { describe, expect, it } from 'vitest';
import { isValidElement } from 'react';
import { isolateLatin } from '../../src/ui/RichText';

const runs = (s: string) => isolateLatin(s, 'k').filter(isValidElement).map((e) => (e.props as { children: string }).children);

describe('عزل التعبيرات اللاتينية داخل النص العربي', () => {
  it('يعزل التعبيرات متعددة الرموز ويسيب النقطة برا', () => {
    expect(runs('المقاومة الكلية R + r.')).toEqual(['R + r']);
    expect(runs('جهد القطبين V = V_B − I r، أقل')).toEqual(['V = V_B − I r']);
    expect(runs('الضايع I r جوه البطارية')).toEqual(['I r']);
  });
  it('لا يلمس الحرف الواحد', () => {
    expect(runs('المقاومة R بتاعتك')).toEqual([]);
  });
});
