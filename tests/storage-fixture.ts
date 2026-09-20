const values = new Map<string, string>();
export const testStorage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => {
    values.set(key, value);
  },
  removeItem: (key: string) => {
    values.delete(key);
  },
  clear: () => values.clear(),
};
Object.defineProperty(globalThis, "localStorage", {
  value: testStorage,
  configurable: true,
});
Object.defineProperty(globalThis, "window", {
  value: { localStorage: testStorage },
  configurable: true,
});
