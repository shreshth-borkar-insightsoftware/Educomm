import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FloatingCartButton from "@/components/FloatingCartButton";
import { useCartStore } from "@/store/useCartStore";

// Mock the cart store
vi.mock("@/store/useCartStore", () => ({
  useCartStore: vi.fn(),
}));

const mockedUseCartStore = vi.mocked(useCartStore);

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("FloatingCartButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when cart is empty and no error", () => {
    mockedUseCartStore.mockReturnValue({
      items: [],
      error: null,
      fetchCart: vi.fn(),
      resetError: vi.fn(),
    });

    const { container } = renderWithRouter(<FloatingCartButton />);
    expect(container.innerHTML).toBe("");
  });

  it("renders VIEW CART button when cart has items", () => {
    mockedUseCartStore.mockReturnValue({
      items: [{ id: 1, cartItemId: 1, name: "Kit", price: 100, quantity: 2, stock: 10 }],
      error: null,
      fetchCart: vi.fn(),
      resetError: vi.fn(),
    });

    renderWithRouter(<FloatingCartButton />);
    expect(screen.getByText("VIEW CART")).toBeInTheDocument();
  });

  it("shows item count badge", () => {
    mockedUseCartStore.mockReturnValue({
      items: [
        { id: 1, cartItemId: 1, name: "Kit A", price: 100, quantity: 2, stock: 10 },
        { id: 2, cartItemId: 2, name: "Kit B", price: 200, quantity: 3, stock: 5 },
      ],
      error: null,
      fetchCart: vi.fn(),
      resetError: vi.fn(),
    });

    renderWithRouter(<FloatingCartButton />);
    // Total quantity = 2 + 3 = 5
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows RETRY button when there is an error", () => {
    mockedUseCartStore.mockReturnValue({
      items: [],
      error: "Network error",
      fetchCart: vi.fn(),
      resetError: vi.fn(),
    });

    renderWithRouter(<FloatingCartButton />);
    expect(screen.getByText("RETRY")).toBeInTheDocument();
  });
});
