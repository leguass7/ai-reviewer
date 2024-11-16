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

export function extractJson<R = Record<string, unknown>>(markdownResponse: string): R | null {
  const jsonMatch = markdownResponse.match(/```json([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      const jsonData = JSON.parse(jsonMatch?.[1]?.trim?.());
      return jsonData;
    } catch (error) {
      return null;
    }
  } else {
    return null;
  }
}
