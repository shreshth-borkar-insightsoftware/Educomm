import "@testing-library/jest-dom/vitest";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock window.location
Object.defineProperty(window, "location", {
  value: { href: "", pathname: "/", search: "", hash: "" },
  writable: true,
});

// Suppress console.error in tests (optional — remove if you want to see errors)
// vi.spyOn(console, "error").mockImplementation(() => {});
