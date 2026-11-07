import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";

import CourseDetailsTable from "main/components/CourseDetails/CourseDetailsTable";
import { personalSectionsFixtures } from "fixtures/personalSectionsFixtures";
import { courseDetailsSessionFixtures } from "fixtures/courseDetailsSessionFixtures";

const mockedNavigate = vi.fn();

vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual("react-router-dom")),
  useNavigate: () => mockedNavigate,
}));

const mockedMutate = vi.fn();

vi.mock("main/utils/useBackend", async () => ({
  ...(await vi.importActual("main/utils/useBackend")),
  useBackendMutation: () => ({ mutate: mockedMutate }),
}));

describe("CourseDetailsTable tests", () => {
  const queryClient = new QueryClient();

  const testId = "CourseDetailsTable";

  test("renders without crashing for empty table", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CourseDetailsTable details={[]} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  });

  test("Has the expected colum headers and content", () => {
    // console.log(oneSection)
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CourseDetailsTable
            details={personalSectionsFixtures.threePersonalSections}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const expectedHeaders = [
      "Course ID",
      "Enroll Code",
      "Section",
      "Session",
      "Title",
      "Enrolled",
      "Location",
      "Days",
      "Time",
      "Instructor",
    ];
    const expectedFields = [
      "courseId",
      "enrollCode",
      "section",
      "session",
      "title",
      "enrolled",
      "location",
    ];

    expectedHeaders.forEach((headerText) => {
      const header = screen.getByText(headerText);
      expect(header).toBeInTheDocument();
    });

    expectedFields.forEach((field) => {
      const header = screen.getByTestId(`${testId}-cell-row-0-col-${field}`);
      expect(header).toBeInTheDocument();
    });

    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-courseId`),
    ).toHaveTextContent("ECE 1A");
    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-enrollCode`),
    ).toHaveTextContent("12583");
    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-section`),
    ).toHaveTextContent("0100");
    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-title`),
    ).toHaveTextContent("COMP ENGR SEMINAR");
    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-location`),
    ).toHaveTextContent("BUCHN 1930");
    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-instructor`),
    ).toHaveTextContent("WANG L C");
    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-days`),
    ).toHaveTextContent("M");
    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-time`),
    ).toHaveTextContent("3:00 PM - 3:50 PM");
    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-enrolled`),
    ).toHaveTextContent("84/100");
  });

  test("Has the expected content when days is empty", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CourseDetailsTable details={personalSectionsFixtures.emptyDays} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-days`),
    ).toHaveTextContent("");
  });

  test("displays A for a summer session A course", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CourseDetailsTable
            details={[courseDetailsSessionFixtures.summerA]}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const sessionCell = screen.getByTestId(`${testId}-cell-row-0-col-session`);

    expect(sessionCell.textContent).toBe("A");
  });

  test("displays B for a summer session B course", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CourseDetailsTable
            details={[courseDetailsSessionFixtures.summerB]}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const sessionCell = screen.getByTestId(`${testId}-cell-row-0-col-session`);

    expect(sessionCell.textContent).toBe("B");
  });

  test("leaves Session blank for a non-summer course", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CourseDetailsTable
            details={[courseDetailsSessionFixtures.fallWithSession]}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const sessionCell = screen.getByTestId(`${testId}-cell-row-0-col-session`);

    expect(sessionCell.textContent).toBe("");
  });

  test("leaves Session blank when summer session information is missing", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CourseDetailsTable
            details={[courseDetailsSessionFixtures.summerWithoutSession]}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const sessionCell = screen.getByTestId(`${testId}-cell-row-0-col-session`);

    expect(sessionCell.textContent).toBe("");
  });
});
