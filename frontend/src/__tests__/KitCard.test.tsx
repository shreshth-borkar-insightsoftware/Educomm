import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import KitCard from "@/components/KitCard";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("KitCard", () => {
  const baseKit = {
    kitId: 1,
    name: "Arduino Starter Kit",
    description: "Everything you need to start with Arduino",
    price: 1999,
    imageUrl: "https://example.com/kit.jpg",
  };

  it("renders kit name", () => {
    renderWithRouter(<KitCard kit={baseKit} />);
    expect(screen.getByText("Arduino Starter Kit")).toBeInTheDocument();
  });

  it("renders kit description", () => {
    renderWithRouter(<KitCard kit={baseKit} />);
    expect(screen.getByText(/Everything you need/)).toBeInTheDocument();
  });

  it("renders kit price with rupee symbol", () => {
    renderWithRouter(<KitCard kit={baseKit} />);
    expect(screen.getByText(/₹1,999/)).toBeInTheDocument();
  });

  it("renders image when imageUrl is provided", () => {
    renderWithRouter(<KitCard kit={baseKit} />);
    const img = screen.getByAltText("Arduino Starter Kit");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/kit.jpg");
  });

  it("shows 'No image' when imageUrl is empty", () => {
    renderWithRouter(<KitCard kit={{ ...baseKit, imageUrl: "" }} />);
    expect(screen.getByText("No image")).toBeInTheDocument();
  });

  it("renders Add to Cart button when onAddToCart is provided", () => {
    const mockFn = vi.fn();
    renderWithRouter(<KitCard kit={baseKit} onAddToCart={mockFn} />);
    expect(screen.getByText("Add to Cart")).toBeInTheDocument();
  });

  it("does not render Add to Cart button when onAddToCart is undefined", () => {
    renderWithRouter(<KitCard kit={baseKit} />);
    expect(screen.queryByText("Add to Cart")).not.toBeInTheDocument();
  });

  it("calls onAddToCart with kit data when button is clicked", async () => {
    const user = userEvent.setup();
    const mockFn = vi.fn();
    renderWithRouter(<KitCard kit={baseKit} onAddToCart={mockFn} />);

    await user.click(screen.getByText("Add to Cart"));
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith(baseKit);
  });

  it("formats large prices with commas", () => {
    renderWithRouter(
      <KitCard kit={{ ...baseKit, price: 45999 }} />
    );
    expect(screen.getByText(/₹45,999/)).toBeInTheDocument();
  });
});
