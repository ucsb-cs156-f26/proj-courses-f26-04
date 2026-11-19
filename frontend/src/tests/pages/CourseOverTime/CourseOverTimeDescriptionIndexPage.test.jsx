import {
  summerSessionPrimaries,
  nonSummerSessionPrimaries,
} from "fixtures/courseOverTimeSessionFixtures";
import { vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import * as useBackend from "main/utils/useBackend.jsx";

import CourseOverTimeDescriptionIndexPage from "main/pages/CourseOverTime/CourseOverTimeDescriptionIndexPage";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import primaryFixtures from "fixtures/primaryFixtures";
import userEvent from "@testing-library/user-event";

const mockToast = vi.fn();
vi.mock("react-toastify", async () => {
  const originalModule = await vi.importActual("react-toastify");
  return {
    __esModule: true,
    ...originalModule,
    toast: (x) => mockToast(x),
  };
});

describe("CourseOverTimeDescriptionIndexPage tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);

  beforeEach(() => {
    localStorage.clear();
    axiosMock.resetHistory();
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.userOnly);
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
  });

  const queryClient = new QueryClient();
  test("displays summer sessions and leaves non-summer Session cells blank", async () => {
    const expectedSessions = ["A", "B", "", ""];
    axiosMock
      .onGet("/api/public/description/search")
      .reply(200, [...summerSessionPrimaries, ...nonSummerSessionPrimaries]);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <CourseOverTimeDescriptionIndexPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await userEvent.selectOptions(
      await screen.findByLabelText("Start Quarter"),
      "20213",
    );
    await userEvent.selectOptions(
      screen.getByLabelText("End Quarter"),
      "20214",
    );
    await userEvent.type(screen.getByLabelText("Search Terms"), "computer");
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(
      await screen.findByRole("columnheader", { name: "Session" }),
    ).toBeInTheDocument();
    for (const [index, expected] of expectedSessions.entries()) {
      const cell = await screen.findByTestId(
        `SectionsTable-cell-row-${index}-col-session`,
      );
      expect(cell.textContent).toBe(expected);
    }
  });

  test("renders without crashing", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CourseOverTimeDescriptionIndexPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  });

  test("calls UCSB Course description search api correctly with a one lecture response", async () => {
    const useBackendMutationSpy = vi.spyOn(useBackend, "useBackendMutation");
    axiosMock
      .onGet("/api/public/description/search")
      .reply(200, primaryFixtures.singleLectureSectionWithNoDiscussion);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CourseOverTimeDescriptionIndexPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const selectStartQuarter = screen.getByLabelText("Start Quarter");
    await userEvent.selectOptions(selectStartQuarter, "20222");
    const selectEndQuarter = screen.getByLabelText("End Quarter");
    await userEvent.selectOptions(selectEndQuarter, "20222");
    const enterSearchTerms = screen.getByLabelText("Search Terms");
    await userEvent.type(enterSearchTerms, "data");
    const selectCheckbox = screen.getByTestId(
      "CourseOverTimeDescriptionSearchForm-checkbox",
    );
    await userEvent.click(selectCheckbox);

    const submitButton = screen.getByText("Submit");
    expect(submitButton).toBeInTheDocument();
    axiosMock.resetHistory();

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(axiosMock.history.get.length).toBeGreaterThanOrEqual(1);
    });

    expect(axiosMock.history.get[0].params).toEqual({
      startQtr: "20222",
      endQtr: "20222",
      searchTerms: "data",
      lectureOnly: true,
    });
    expect(axiosMock.history.get[0].url).toBe("/api/public/description/search");

    expect(useBackendMutationSpy).toHaveBeenCalledWith(
      expect.any(Function),
      { onSuccess: expect.any(Function) },
      [],
    );

    expect(await screen.findByText("GROUP STUDIES-MATH")).toBeInTheDocument();
  });

  const renderPage = () =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <CourseOverTimeDescriptionIndexPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

  const submitSearch = async () => {
    await userEvent.type(screen.getByLabelText("Search Terms"), "data");
    await userEvent.click(screen.getByText("Submit"));
  };

  const noCoursesMessage = "No courses were found with the specified criteria.";

  test("shows no feedback and no table before the first search", async () => {
    renderPage();

    expect(screen.queryByText(noCoursesMessage)).not.toBeInTheDocument();
    expect(screen.queryByText("Loading courses...")).not.toBeInTheDocument();
    expect(screen.queryByTestId("SectionsTable")).not.toBeInTheDocument();
  });

  test("shows the no courses message when the search returns no courses", async () => {
    axiosMock.onGet("/api/public/description/search").reply(200, []);
    renderPage();

    await submitSearch();

    expect(await screen.findByText(noCoursesMessage)).toBeInTheDocument();
    expect(screen.queryByText("Loading courses...")).not.toBeInTheDocument();
  });

  test("shows a loading message and no other feedback while searching", async () => {
    let finishSearch;
    axiosMock.onGet("/api/public/description/search").reply(
      () =>
        new Promise((resolve) => {
          finishSearch = () => resolve([200, []]);
        }),
    );
    renderPage();

    await submitSearch();

    expect(await screen.findByText("Loading courses...")).toBeInTheDocument();
    expect(screen.queryByText(noCoursesMessage)).not.toBeInTheDocument();

    finishSearch();

    expect(await screen.findByText(noCoursesMessage)).toBeInTheDocument();
    expect(screen.queryByText("Loading courses...")).not.toBeInTheDocument();
  });

  test("shows the results and no message when the search returns courses", async () => {
    axiosMock
      .onGet("/api/public/description/search")
      .reply(200, primaryFixtures.singleLectureSectionWithNoDiscussion);
    renderPage();

    await submitSearch();

    expect(await screen.findByText("GROUP STUDIES-MATH")).toBeInTheDocument();
    expect(screen.queryByText(noCoursesMessage)).not.toBeInTheDocument();
    expect(screen.queryByText("Loading courses...")).not.toBeInTheDocument();
  });

  test("shows discussion sections folded under their lecture", async () => {
    axiosMock
      .onGet("/api/public/description/search")
      .reply(200, primaryFixtures.f24_math_lowerDiv);
    renderPage();

    await submitSearch();

    // MATH 2A lecture (30247) is shown, its discussion sections are folded
    expect(
      await screen.findByTestId("SectionsTable-cell-row-0-col-enrollCode"),
    ).toHaveTextContent("30247");
    expect(
      screen.queryByTestId("SectionsTable-cell-row-0.0-col-enrollCode"),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByTestId("SectionsTable-row-0-expand-button"),
    );

    // after expanding, the first discussion section (30254) is shown under it
    expect(
      screen.getByTestId("SectionsTable-cell-row-0.0-col-enrollCode"),
    ).toHaveTextContent("30254");
  });
});
