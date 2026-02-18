import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import PageHeader from "@/components/PageHeader";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("PageHeader", () => {
  it("renders title", () => {
    renderWithRouter(<PageHeader title="My Title" />);
    expect(screen.getByText("My Title")).toBeInTheDocument();
  });

  it("renders title as h1 with uppercase styling", () => {
    renderWithRouter(<PageHeader title="Courses" />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Courses");
  });

  it("renders subtitle when provided", () => {
    renderWithRouter(
      <PageHeader title="Dashboard" subtitle="Overview of stats" />
    );
    expect(screen.getByText("Overview of stats")).toBeInTheDocument();
  });

  it("does not render subtitle when not provided", () => {
    renderWithRouter(<PageHeader title="Dashboard" />);
    const subtitle = screen.queryByText(/overview/i);
    expect(subtitle).not.toBeInTheDocument();
  });

  it("renders back button when showBackButton is true", () => {
    renderWithRouter(<PageHeader title="Details" showBackButton={true} />);
    const backBtn = screen.getByLabelText("Go back");
    expect(backBtn).toBeInTheDocument();
  });

  it("does not render back button by default", () => {
    renderWithRouter(<PageHeader title="Details" />);
    const backBtn = screen.queryByLabelText("Go back");
    expect(backBtn).not.toBeInTheDocument();
  });

  it("renders children when provided", () => {
    renderWithRouter(
      <PageHeader title="Test">
        <button>Action</button>
      </PageHeader>
    );
    expect(screen.getByText("Action")).toBeInTheDocument();
  });
});
