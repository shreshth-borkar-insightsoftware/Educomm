import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PaymentNotification from "@/components/PaymentNotification";

describe("PaymentNotification", () => {
  it("renders success state correctly", () => {
    render(<PaymentNotification type="success" onClose={vi.fn()} />);
    expect(screen.getByText("PAYMENT SUCCESSFUL")).toBeInTheDocument();
    expect(
      screen.getByText(/your order has been placed successfully/i)
    ).toBeInTheDocument();
  });

  it("renders failed state correctly", () => {
    render(<PaymentNotification type="failed" onClose={vi.fn()} />);
    expect(screen.getByText("VERIFICATION FAILED")).toBeInTheDocument();
    expect(
      screen.getByText(/payment verification failed/i)
    ).toBeInTheDocument();
  });

  it("shows BACK TO CART button on failed state", () => {
    render(<PaymentNotification type="failed" onClose={vi.fn()} />);
    expect(screen.getByText("BACK TO CART")).toBeInTheDocument();
  });

  it("does not show BACK TO CART button on success state", () => {
    render(<PaymentNotification type="success" onClose={vi.fn()} />);
    expect(screen.queryByText("BACK TO CART")).not.toBeInTheDocument();
  });

  it("calls onClose when BACK TO CART is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PaymentNotification type="failed" onClose={onClose} />);

    await user.click(screen.getByText("BACK TO CART"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("auto-closes after delay when autoCloseDelay is set", async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(
      <PaymentNotification
        type="success"
        onClose={onClose}
        autoCloseDelay={1000}
      />
    );

    expect(onClose).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(onClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("does not auto-close when autoCloseDelay is not set", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<PaymentNotification type="success" onClose={onClose} />);

    vi.advanceTimersByTime(5000);
    expect(onClose).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("renders progress bar on success with autoCloseDelay", () => {
    const { container } = render(
      <PaymentNotification
        type="success"
        onClose={vi.fn()}
        autoCloseDelay={3000}
      />
    );
    // Progress bar has bg-green-500 class
    const progressBar = container.querySelector(".bg-green-500");
    expect(progressBar).toBeInTheDocument();
  });

  it("does not render progress bar on failed state", () => {
    const { container } = render(
      <PaymentNotification
        type="failed"
        onClose={vi.fn()}
        autoCloseDelay={3000}
      />
    );
    // No green progress bar for failed
    const progressBars = container.querySelectorAll(".bg-green-500");
    expect(progressBars.length).toBe(0);
  });
});
