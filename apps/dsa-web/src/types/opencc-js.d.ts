declare module 'opencc-js' {
  export type ChineseLocale = 'cn' | 'tw' | 'twp' | 'hk' | 'jp' | 't';

  export function Converter(options: {
    from: ChineseLocale;
    to: ChineseLocale;
  }): (text: string) => string;
}
