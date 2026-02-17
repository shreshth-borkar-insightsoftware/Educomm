import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CourseCard from "@/components/CourseCard";

// Wrap component with MemoryRouter for useNavigate
function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("CourseCard", () => {
  const baseCourse = {
    id: 1,
    name: "Arduino Basics",
    description: "Learn Arduino from scratch with hands-on projects",
  };

  it("renders course name", () => {
    renderWithRouter(<CourseCard course={baseCourse} />);
    expect(screen.getByText("Arduino Basics")).toBeInTheDocument();
  });

  it("renders course description", () => {
    renderWithRouter(<CourseCard course={baseCourse} />);
    expect(screen.getByText(/Learn Arduino from scratch/)).toBeInTheDocument();
  });

  it("shows GET LINKED KIT button when kitId is provided", () => {
    renderWithRouter(
      <CourseCard course={{ ...baseCourse, kitId: 5 }} />
    );
    expect(screen.getByText("GET LINKED KIT")).toBeInTheDocument();
  });

  it("shows NO KIT REQUIRED when kitId is null", () => {
    renderWithRouter(
      <CourseCard course={{ ...baseCourse, kitId: null }} />
    );
    expect(screen.getByText("NO KIT REQUIRED")).toBeInTheDocument();
  });

  it("shows NO KIT REQUIRED when kitId is undefined", () => {
    renderWithRouter(<CourseCard course={baseCourse} />);
    expect(screen.getByText("NO KIT REQUIRED")).toBeInTheDocument();
  });

  it("disables button when no kitId", () => {
    renderWithRouter(
      <CourseCard course={{ ...baseCourse, kitId: null }} />
    );
    const btn = screen.getByText("NO KIT REQUIRED");
    expect(btn.closest("button")).toBeDisabled();
  });

  it("enables button when kitId is present", () => {
    renderWithRouter(
      <CourseCard course={{ ...baseCourse, kitId: 10 }} />
    );
    const btn = screen.getByText("GET LINKED KIT");
    expect(btn.closest("button")).not.toBeDisabled();
  });

  it("renders category badge when categoryName is provided", () => {
    renderWithRouter(
      <CourseCard course={{ ...baseCourse, categoryName: "Electronics" }} />
    );
    expect(screen.getByText("Electronics")).toBeInTheDocument();
  });

  it("renders difficulty badge when difficulty is provided", () => {
    renderWithRouter(
      <CourseCard course={{ ...baseCourse, difficulty: "Beginner" }} />
    );
    expect(screen.getByText("Beginner")).toBeInTheDocument();
  });

  it("does not render badges when no category or difficulty", () => {
    renderWithRouter(<CourseCard course={baseCourse} />);
    expect(screen.queryByText("Electronics")).not.toBeInTheDocument();
    expect(screen.queryByText("Beginner")).not.toBeInTheDocument();
  });

  it("renders Required Hardware section", () => {
    renderWithRouter(<CourseCard course={baseCourse} />);
    expect(screen.getByText("Required Hardware")).toBeInTheDocument();
  });
});
