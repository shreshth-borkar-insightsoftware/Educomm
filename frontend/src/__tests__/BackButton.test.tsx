import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import BackButton from "@/components/BackButton";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("BackButton", () => {
  it("renders with aria-label", () => {
    renderWithRouter(<BackButton />);
    expect(screen.getByLabelText("Go back")).toBeInTheDocument();
  });

  it("renders children text", () => {
    renderWithRouter(<BackButton>Go Back</BackButton>);
    expect(screen.getByText("Go Back")).toBeInTheDocument();
  });

  it("calls onClick prop when provided", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    renderWithRouter(<BackButton onClick={handleClick} />);

    await user.click(screen.getByLabelText("Go back"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies custom className", () => {
    renderWithRouter(<BackButton className="custom-class" />);
    const btn = screen.getByLabelText("Go back");
    expect(btn.className).toContain("custom-class");
  });

  it("renders as a button element", () => {
    renderWithRouter(<BackButton />);
    const btn = screen.getByLabelText("Go back");
    expect(btn.tagName).toBe("BUTTON");
  });
});
