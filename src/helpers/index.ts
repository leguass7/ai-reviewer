import { existsSync } from 'fs';

export const wait = (timeout: number): Promise<any> => {
  return new Promise(resolve => setTimeout(resolve, timeout));
};

export function stringify(obj: any): string {
  return JSON.stringify(obj, undefined, 2);
}

export function fileExists(filePath: string) {
  try {
    return !!existsSync(filePath);
  } catch (err) {
    return false;
  }
}
