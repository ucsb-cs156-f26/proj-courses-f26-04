import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";

import CSVDownloadsPage from "main/pages/CSV/CSVDownloadsPage";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { allTheSubjects } from "fixtures/subjectFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";

const mockToast = vi.fn();
vi.mock("react-toastify", async () => {
  const originalModule = await vi.importActual("react-toastify");
  return {
    __esModule: true,
    ...originalModule,
    toast: (...params) => mockToast(...params),
  };
});

describe("CSVDownloadsPage tests", () => {
  let axiosMock;

  beforeEach(() => {
    axiosMock = new AxiosMockAdapter(axios);
    const localStorageStore = {};
    const localStorageMock = {
      getItem: (key) => localStorageStore[key] || null,
      setItem: (key, value) => {
        localStorageStore[key] = value.toString();
      },
      removeItem: (key) => {
        delete localStorageStore[key];
      },
      clear: () => {
        Object.keys(localStorageStore).forEach((key) => {
          delete localStorageStore[key];
        });
      },
    };
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    localStorage.setItem("CSVDownloads.Quarter", "20241");
    localStorage.setItem("CSVDownloads.SubjectQuarter", "20241");
    localStorage.setItem("CSVDownloads.Subject", "ANTH");
    localStorage.setItem("CSVDownloads.Level", "U");
    axiosMock.reset();
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.userOnly);
    axiosMock.onGet("/api/systemInfo").reply(200, {
      ...systemInfoFixtures.showingNeither,
      startQtrYYYYQ: "20241",
      endQtrYYYYQ: "20242",
    });
    axiosMock.onGet("/api/UCSBSubjects/all").reply(200, allTheSubjects);
  });

  afterEach(() => {
    axiosMock.restore();
  });

  const renderPage = (browserLocation = window.location) => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CSVDownloadsPage browserLocation={browserLocation} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  const mockLocationAssign = () => {
    const assignMock = vi.fn();
    return {
      assignMock,
      browserLocation: { assign: assignMock },
    };
  };

  test("renders correctly", async () => {
    renderPage();

    expect(await screen.findByText("CSV Downloads")).toBeInTheDocument();
  });

  test("uses dropdowns for quarters, subject area, and course level", async () => {
    renderPage();

    expect(await screen.findAllByLabelText("Quarter")).toHaveLength(3);
    const subjectAreaDropdown = screen.getByLabelText("Subject Area");
    const levelDropdown = screen.getByLabelText("Course Level");
    expect(subjectAreaDropdown).toBeInTheDocument();
    expect(levelDropdown).toBeInTheDocument();
    expect(screen.getByLabelText("Omit sections")).toBeChecked();
    expect(
      screen.getByLabelText("Only include courses with times or locations"),
    ).toBeChecked();

    expect(screen.getByTestId("CSVDownloads.Level-option-0")).toHaveValue("U");
    expect(screen.getByTestId("CSVDownloads.Level-option-0")).toHaveTextContent(
      "Undergraduate",
    );
    expect(screen.getByTestId("CSVDownloads.Level-option-1")).toHaveValue("G");
    expect(screen.getByTestId("CSVDownloads.Level-option-1")).toHaveTextContent(
      "Graduate",
    );
    expect(screen.getByTestId("CSVDownloads.Level-option-2")).toHaveValue("A");
    expect(screen.getByTestId("CSVDownloads.Level-option-2")).toHaveTextContent(
      "All",
    );
    expect(levelDropdown).toHaveValue("U");

    await waitFor(() =>
      expect(
        screen.getByTestId("CSVDownloads.Subject-option-CMPSC"),
      ).toBeInTheDocument(),
    );
    expect(subjectAreaDropdown).toHaveValue("ANTH");
    expect(screen.getByTestId("CSVDownloads.Subject-option-ANTH")).toHaveValue(
      "ANTH",
    );
    expect(
      screen.getByTestId("CSVDownloads.Subject-option-ANTH"),
    ).toHaveTextContent("ANTH - Anthropology");
  });

  test("submitting by-quarter form downloads selected quarter", async () => {
    const { assignMock, browserLocation } = mockLocationAssign();
    renderPage(browserLocation);

    const quarterDropdown = (await screen.findAllByLabelText("Quarter"))[0];
    const byQuarterButton = screen.getAllByRole("button", {
      name: "Download CSV",
    })[0];
    const byQuarterForm = byQuarterButton.closest("form");

    fireEvent.change(quarterDropdown, { target: { value: "20242" } });
    fireEvent.submit(byQuarterForm);

    expect(assignMock).toHaveBeenCalledTimes(1);
    expect(assignMock).toHaveBeenCalledWith(
      "/api/courses/csv/quarter?yyyyq=20242",
    );
  });

  test("submitting by-quarter-and-subject form includes all endpoint parameters", async () => {
    const { assignMock, browserLocation } = mockLocationAssign();
    renderPage(browserLocation);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Download all UCSB classes by Quarter and Subject Area",
      }),
    );

    const allDownloadButtons = screen.getAllByRole("button", {
      name: "Download CSV",
    });
    const byQuarterAndSubjectButton = allDownloadButtons[1];
    const byQuarterAndSubjectForm = byQuarterAndSubjectButton.closest("form");

    const quarterDropdown = screen.getAllByLabelText("Quarter")[1];
    const subjectAreaDropdown = screen.getByLabelText("Subject Area");
    const levelDropdown = screen.getByLabelText("Course Level");
    const omitSectionsCheckbox = screen.getByLabelText("Omit sections");
    const withTimeLocationsCheckbox = screen.getByLabelText(
      "Only include courses with times or locations",
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("CSVDownloads.Subject-option-CMPSC"),
      ).toBeInTheDocument(),
    );

    fireEvent.change(quarterDropdown, { target: { value: "20242" } });
    fireEvent.change(subjectAreaDropdown, { target: { value: "CMPSC" } });
    fireEvent.change(levelDropdown, { target: { value: "G" } });
    fireEvent.click(omitSectionsCheckbox);
    fireEvent.click(withTimeLocationsCheckbox);
    fireEvent.submit(byQuarterAndSubjectForm);

    expect(assignMock).toHaveBeenCalledTimes(1);
    expect(assignMock).toHaveBeenCalledWith(
      "/api/courses/csv/byQuarterAndSubjectArea?yyyyq=20242&subjectArea=CMPSC&level=G&omitSections=false&withTimeLocations=false",
    );
  });

  test("submitting by-quarter-and-subject form includes default parameters", async () => {
    const { assignMock, browserLocation } = mockLocationAssign();
    renderPage(browserLocation);

    await waitFor(() =>
      expect(
        screen.getByTestId("CSVDownloads.Subject-option-ANTH"),
      ).toBeInTheDocument(),
    );

    const byQuarterAndSubjectButton = screen.getAllByRole("button", {
      name: "Download CSV",
    })[1];
    fireEvent.submit(byQuarterAndSubjectButton.closest("form"));

    expect(assignMock).toHaveBeenCalledTimes(1);
    expect(assignMock).toHaveBeenCalledWith(
      "/api/courses/csv/byQuarterAndSubjectArea?yyyyq=20221&subjectArea=ANTH&level=U&omitSections=true&withTimeLocations=true",
    );
  });

  describe("enrollment downloads", () => {
    beforeEach(() => {
      mockToast.mockClear();
    });

    const enrollmentRequests = () =>
      axiosMock.history.get.filter(
        (r) => r.url === "/api/enrollment/csv/quarter",
      );

    const openEnrollmentSection = async () => {
      fireEvent.click(
        await screen.findByRole("button", {
          name: "Download enrollment data by Quarter",
        }),
      );
    };

    test("renders enrollment downloads section", async () => {
      renderPage();
      await openEnrollmentSection();

      expect(
        screen.getByText(
          "Download enrollment data for all UCSB sections in a quarter.",
        ),
      ).toBeInTheDocument();
    });

    test("uses SingleQuarterDropdown to select an enrollment quarter", async () => {
      renderPage();
      await openEnrollmentSection();

      const dropdown = screen.getByTestId("CSVDownloads.EnrollmentQuarter");
      expect(dropdown).toBeInTheDocument();
      expect(
        screen.getByTestId("CSVDownloads.EnrollmentQuarter-option-0"),
      ).toBeInTheDocument();

      fireEvent.change(dropdown, { target: { value: "20242" } });
      expect(dropdown).toHaveValue("20242");
      expect(localStorage.getItem("CSVDownloads.EnrollmentQuarter")).toBe(
        "20242",
      );
    });

    test("restores the saved enrollment quarter from localStorage", async () => {
      localStorage.setItem("CSVDownloads.EnrollmentQuarter", "20242");
      renderPage();
      await openEnrollmentSection();

      await waitFor(() =>
        expect(
          screen.getByTestId("CSVDownloads.EnrollmentQuarter"),
        ).toHaveValue("20242"),
      );
    });

    test("defaults the enrollment quarter to the first quarter when nothing is saved", async () => {
      // Use the same range as the systemInfo placeholder data, so the
      // quarters on the first render match the quarters after loading.
      axiosMock.onGet("/api/systemInfo").reply(200, {
        ...systemInfoFixtures.showingNeither,
        startQtrYYYYQ: "20221",
        endQtrYYYYQ: "20222",
      });
      expect(localStorage.getItem("CSVDownloads.EnrollmentQuarter")).toBeNull();
      renderPage();
      await openEnrollmentSection();

      expect(screen.getByTestId("CSVDownloads.EnrollmentQuarter")).toHaveValue(
        "20221",
      );
    });

    test("requests enrollment CSV for the selected quarter from the backend", async () => {
      axiosMock.onGet("/api/enrollment/csv/quarter").reply(200, "a,b\n");
      const { assignMock, browserLocation } = mockLocationAssign();
      renderPage(browserLocation);
      await openEnrollmentSection();

      fireEvent.change(screen.getByTestId("CSVDownloads.EnrollmentQuarter"), {
        target: { value: "20242" },
      });
      fireEvent.submit(screen.getByTestId("CSVDownloads.EnrollmentForm"));

      await waitFor(() => expect(enrollmentRequests()).toHaveLength(1));
      expect(enrollmentRequests()[0].params).toEqual({ yyyyq: "20242" });
      expect(enrollmentRequests()[0].responseType).toBe("blob");
      expect(mockToast).not.toHaveBeenCalled();
      expect(assignMock).not.toHaveBeenCalled();
    });

    test("shows an error toast when the enrollment request fails", async () => {
      axiosMock.onGet("/api/enrollment/csv/quarter").reply(500);
      renderPage();
      await openEnrollmentSection();

      fireEvent.submit(screen.getByTestId("CSVDownloads.EnrollmentForm"));

      await waitFor(() => expect(mockToast).toHaveBeenCalledTimes(1));
      expect(mockToast).toHaveBeenCalledWith(
        "Error downloading enrollment CSV: Request failed with status code 500",
        { type: "error" },
      );
    });
  });

  test("uses default quarter range when systemInfo has no quarter data", async () => {
    axiosMock.onGet("/api/systemInfo").reply(200, {});
    renderPage();
    expect(await screen.findByText("CSV Downloads")).toBeInTheDocument();
    expect(screen.getByTestId("CSVDownloads.Quarter")).toBeInTheDocument();
  });
});
