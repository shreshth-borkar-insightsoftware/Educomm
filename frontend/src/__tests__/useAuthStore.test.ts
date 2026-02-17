import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/store/useAuthStore";

describe("useAuthStore", () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });

  it("has correct initial state when no localStorage data", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("setAuth sets user, token, and isAuthenticated", () => {
    const user = {
      email: "test@example.com",
      role: "Customer",
      userId: 1,
      firstName: "John",
      lastName: "Doe",
    };
    const token = "jwt-token-123";

    useAuthStore.getState().setAuth(user, token);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.token).toBe(token);
    expect(state.isAuthenticated).toBe(true);
  });

  it("setAuth persists to localStorage", () => {
    const user = {
      email: "test@example.com",
      role: "Admin",
      userId: 2,
      firstName: "Jane",
      lastName: "Smith",
    };
    const token = "admin-token-456";

    useAuthStore.getState().setAuth(user, token);

    expect(localStorage.getItem("token")).toBe(token);
    expect(JSON.parse(localStorage.getItem("user")!)).toEqual(user);
  });

  it("logout clears state", () => {
    const user = {
      email: "test@example.com",
      role: "Customer",
      userId: 1,
      firstName: "A",
      lastName: "B",
    };
    useAuthStore.getState().setAuth(user, "token-123");

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("logout clears localStorage", () => {
    useAuthStore.getState().setAuth(
      { email: "a@b.com", role: "Customer", userId: 1, firstName: "A", lastName: "B" },
      "token"
    );

    useAuthStore.getState().logout();

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("user object has correct shape", () => {
    const user = {
      email: "test@test.com",
      role: "Customer",
      userId: 99,
      firstName: "First",
      lastName: "Last",
    };
    useAuthStore.getState().setAuth(user, "token");

    const stored = useAuthStore.getState().user!;
    expect(stored.email).toBe("test@test.com");
    expect(stored.role).toBe("Customer");
    expect(stored.userId).toBe(99);
    expect(stored.firstName).toBe("First");
    expect(stored.lastName).toBe("Last");
  });
});
