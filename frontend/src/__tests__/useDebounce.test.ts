import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/hooks/useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 500));
    expect(result.current).toBe("hello");
  });

  it("does not update value before delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "first", delay: 500 } }
    );

    rerender({ value: "second", delay: 500 });
    vi.advanceTimersByTime(300);
    expect(result.current).toBe("first");
  });

  it("updates value after delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "first", delay: 500 } }
    );

    rerender({ value: "second", delay: 500 });
    vi.advanceTimersByTime(500);
    expect(result.current).toBe("second");
  });

  it("resets timer on rapid changes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "a", delay: 300 } }
    );

    rerender({ value: "b", delay: 300 });
    vi.advanceTimersByTime(100);
    rerender({ value: "c", delay: 300 });
    vi.advanceTimersByTime(100);
    rerender({ value: "d", delay: 300 });
    vi.advanceTimersByTime(300);

    expect(result.current).toBe("d");
  });

  it("uses default delay of 400ms", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: "initial" } }
    );

    rerender({ value: "updated" });
    vi.advanceTimersByTime(399);
    expect(result.current).toBe("initial");

    vi.advanceTimersByTime(1);
    expect(result.current).toBe("updated");
  });

  it("works with numeric values", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 200 } }
    );

    rerender({ value: 42, delay: 200 });
    vi.advanceTimersByTime(200);
    expect(result.current).toBe(42);
  });

  it("works with boolean values", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: false, delay: 200 } }
    );

    rerender({ value: true, delay: 200 });
    vi.advanceTimersByTime(200);
    expect(result.current).toBe(true);
  });
});
