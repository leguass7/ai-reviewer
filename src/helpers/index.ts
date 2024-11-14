export const wait = (timeout: number): Promise<any> => {
  return new Promise(resolve => setTimeout(resolve, timeout));
};

export function stringify(obj: any): string {
  return JSON.stringify(obj, undefined, 2);
}
