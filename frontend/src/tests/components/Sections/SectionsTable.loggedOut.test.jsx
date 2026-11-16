import { vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";
import SectionsTable from "main/components/Sections/SectionsTable";

import primaryFixtures from "fixtures/primaryFixtures";

import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

import { personalScheduleFixtures } from "fixtures/personalScheduleFixtures";

// mock the error console to avoid cluttering the test output
import mockConsole from "tests/testutils/mockConsole";

describe("SectionsTable.loggedOut tests", () => {
  let axiosMock;
  let restoreConsole;
  const queryClient = new QueryClient();

  const testId = "SectionsTable";

  beforeEach(() => {
    restoreConsole = mockConsole();
    axiosMock = new AxiosMockAdapter(axios);
    vi.clearAllMocks();
    axiosMock.reset();
    axiosMock.resetHistory();
    axiosMock.onGet("/api/currentUser").reply(403, {
      timestamp: "2025-08-03T10:51:29.907-07:00",
      status: 403,
      error: "Forbidden",
      path: "/api/currentUser",
    });
    axiosMock
      .onGet("/api/personalschedules/all")
      .reply(200, personalScheduleFixtures.threePersonalSchedules);
  });

  afterEach(() => {
    vi.clearAllMocks();
    axiosMock.restore();
    restoreConsole();
  });

  test("Has the expected cell values when expanded", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SectionsTable sections={primaryFixtures.f24_math_lowerDiv} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId(`${testId}-expand-all-rows`),
      ).toBeInTheDocument();
    });
    const expandAll = screen.getByTestId(`${testId}-expand-all-rows`);
    fireEvent.click(expandAll);

    await waitFor(() => {
      expect(
        screen.getByTestId(`${testId}-row-0-not-logged-in`),
      ).toBeInTheDocument();
    });

    const row0ExpandButton = screen.getByTestId(
      `${testId}-row-0-expand-button`,
    );
    expect(row0ExpandButton).toBeInTheDocument();
    expect(row0ExpandButton).toHaveAttribute("style", "cursor: pointer;");
  });

  test("session column is not shown by default", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SectionsTable sections={primaryFixtures.f24_math_lowerDiv} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId(`${testId}-expand-all-rows`),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText("Session")).not.toBeInTheDocument();
  });

  test("session column is shown when showSession is true", async () => {
    const summerPrimary = [
      {
        ...primaryFixtures.singleLectureSectionWithNoDiscussion[0],
        quarter: "20243",
        primary: {
          ...primaryFixtures.singleLectureSectionWithNoDiscussion[0].primary,
          session: "00000A",
        },
      },
    ];

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SectionsTable sections={summerPrimary} showSession />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Session")).toBeInTheDocument();
    });

    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-session`),
    ).toHaveTextContent("A");
  });

  test("session column is empty for non-summer quarters when showSession is true", async () => {
    const fallPrimary = [
      {
        ...primaryFixtures.singleLectureSectionWithNoDiscussion[0],
        primary: {
          ...primaryFixtures.singleLectureSectionWithNoDiscussion[0].primary,
          session: "00000A",
        },
      },
    ];

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SectionsTable sections={fallPrimary} showSession />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Session")).toBeInTheDocument();
    });

    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-session`),
    ).toHaveTextContent("");
  });

  test("GE Areas column is not shown by default", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SectionsTable sections={primaryFixtures.f24_math_lowerDiv} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId(`${testId}-expand-all-rows`),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText("GE Areas")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`${testId}-cell-row-0-col-geAreas`),
    ).not.toBeInTheDocument();
  });

  test("GE Areas column shows each course's GE codes when showGeAreas is true", async () => {
    const courseWithGe = primaryFixtures.f24_math_lowerDiv.findIndex(
      (p) => p.generalEducation.length > 0,
    );

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SectionsTable
            sections={primaryFixtures.f24_math_lowerDiv}
            showGeAreas
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("GE Areas")).toBeInTheDocument();
    });

    expect(
      screen.getByTestId(`${testId}-cell-row-${courseWithGe}-col-geAreas`),
    ).toHaveTextContent(/^C, QNT$/);

    // section rows (shown after expanding) have no GE areas
    fireEvent.click(screen.getByTestId(`${testId}-expand-all-rows`));
    expect(
      screen.getByTestId(`${testId}-cell-row-0.0-col-geAreas`),
    ).toHaveTextContent(/^$/);
  });
});
