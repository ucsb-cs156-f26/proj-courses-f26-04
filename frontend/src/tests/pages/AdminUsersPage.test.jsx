import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import mockConsole from "tests/testutils/mockConsole";

import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import usersFixtures from "fixtures/usersFixtures";
import AdminUsersPage from "main/pages/Admin/AdminUsersPage";

describe("AdminUsersPage tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);

  const testId = "UsersTable";

  beforeEach(() => {
    axiosMock.reset();
    axiosMock.resetHistory();
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.userOnly);
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
  });

  test("renders without crashing on three users", async () => {
    const queryClient = new QueryClient();
    axiosMock.onGet("/api/admin/users").reply(200, {
      content: usersFixtures.threeUsers,
      totalPages: 2,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminUsersPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Users")).toBeInTheDocument();
    expect(
      await screen.findByTestId("UsersTable-cell-row-0-col-id"),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId(`UsersTable-cell-row-0-col-id`),
    ).toHaveTextContent("1");
    expect(
      screen.getByTestId(`UsersTable-cell-row-0-col-givenName`),
    ).toHaveTextContent("Phill");
    expect(
      screen.getByTestId(`UsersTable-cell-row-0-col-familyName`),
    ).toHaveTextContent("Conrad");
    expect(
      screen.getByTestId(`UsersTable-cell-row-0-col-email`),
    ).toHaveTextContent("phtcon@ucsb.edu");
    expect(
      screen.getByTestId(`UsersTable-cell-row-0-col-admin`),
    ).toHaveTextContent("true");

    expect(screen.getByTestId("OurPagination-2")).toBeInTheDocument();

    const usersRequest = axiosMock.history.get.find(
      (request) => request.url === "/api/admin/users",
    );
    expect(usersRequest.params).toEqual({
      page: 0,
      pageSize: "10",
      sortField: "email",
      sortDirection: "ASC",
    });
  });

  test("clicking pagination requests the second page", async () => {
    const queryClient = new QueryClient();
    axiosMock.onGet("/api/admin/users").reply((config) => {
      if (config.params.page === 1) {
        return [
          200,
          {
            content: [usersFixtures.threeUsers[1]],
            totalPages: 2,
          },
        ];
      }

      return [
        200,
        {
          content: [usersFixtures.threeUsers[0]],
          totalPages: 2,
        },
      ];
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminUsersPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByTestId("UsersTable-cell-row-0-col-email"),
    ).toHaveTextContent("phtcon@ucsb.edu");

    fireEvent.click(screen.getByTestId("OurPagination-2"));

    await waitFor(() => {
      expect(
        screen.getByTestId("UsersTable-cell-row-0-col-email"),
      ).toHaveTextContent("pconrad.cis@gmail.com");
    });

    const usersRequests = axiosMock.history.get.filter(
      (request) => request.url === "/api/admin/users",
    );
    expect(usersRequests).toHaveLength(2);
    expect(usersRequests[1].params).toEqual({
      page: 1,
      pageSize: "10",
      sortField: "email",
      sortDirection: "ASC",
    });
  });

  test("reads pageSize, sortField, sortDirection from localStorage", async () => {
    const queryClient = new QueryClient();

    localStorage.setItem("UsersSearch.PageSize", "25");
    localStorage.setItem("UsersSearch.SortField", "familyName");
    localStorage.setItem("UsersSearch.SortDirection", "DESC");

    axiosMock.onGet("/api/admin/users").reply(200, {
      content: usersFixtures.threeUsers,
      totalPages: 2,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminUsersPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Users")).toBeInTheDocument();

    const usersRequest = axiosMock.history.get.find(
      (request) => request.url === "/api/admin/users",
    );
    expect(usersRequest.params).toEqual({
      page: 0,
      pageSize: "25",
      sortField: "familyName",
      sortDirection: "DESC",
    });

    localStorage.clear();
  });

  test("renders empty table when backend unavailable", async () => {
    const queryClient = new QueryClient();
    axiosMock.onGet("/api/admin/users").timeout();

    const restoreConsole = mockConsole();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminUsersPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(axiosMock.history.get.length).toBeGreaterThanOrEqual(1);
    });

    const errorMessage = console.error.mock.calls[0][0];
    expect(errorMessage).toMatch(
      "Error communicating with backend via GET on /api/admin/users",
    );
    restoreConsole();

    expect(
      screen.queryByTestId(`${testId}-cell-row-0-col-id`),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("OurPagination-1")).not.toBeInTheDocument();
  });

  describe("typeahead search", () => {
    const renderPage = () =>
      render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter>
            <AdminUsersPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

    beforeEach(() => {
      axiosMock.onGet("/api/admin/users").reply(200, {
        content: usersFixtures.threeUsers,
        totalPages: 2,
      });
      axiosMock
        .onGet("/api/admin/users/autocomplete")
        .reply(200, [usersFixtures.threeUsers[0], usersFixtures.threeUsers[1]]);
    });

    const autocompleteRequests = () =>
      axiosMock.history.get.filter(
        (request) => request.url === "/api/admin/users/autocomplete",
      );

    test("does not call autocomplete for fewer than 2 characters", async () => {
      renderPage();
      const user = userEvent.setup();
      await screen.findByTestId("UsersTable-cell-row-0-col-id");

      await user.type(screen.getByLabelText("Search by name or email"), "p");

      expect(autocompleteRequests()).toHaveLength(0);
    });

    test("calls autocomplete with q and lists suggestions", async () => {
      renderPage();
      const user = userEvent.setup();
      await screen.findByTestId("UsersTable-cell-row-0-col-id");

      await user.type(screen.getByLabelText("Search by name or email"), "ph");

      expect(
        await screen.findByTestId("UserTypeahead-option-0"),
      ).toHaveTextContent("Phill Conrad (phtcon@ucsb.edu)");
      expect(screen.getByTestId("UserTypeahead-option-1")).toHaveTextContent(
        "Phillip Conrad (pconrad.cis@gmail.com)",
      );
      const requests = autocompleteRequests();
      expect(requests[requests.length - 1].params).toEqual({ q: "ph" });
    });

    test("selecting a user shows only that user, and clearing restores the list", async () => {
      renderPage();
      const user = userEvent.setup();
      await screen.findByTestId("UsersTable-cell-row-0-col-id");

      await user.type(screen.getByLabelText("Search by name or email"), "ph");
      await user.click(await screen.findByTestId("UserTypeahead-option-1"));

      expect(
        screen.getByTestId("UsersTable-cell-row-0-col-email"),
      ).toHaveTextContent("pconrad.cis@gmail.com");
      expect(
        screen.queryByTestId("UsersTable-cell-row-1-col-email"),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("OurPagination-2")).not.toBeInTheDocument();

      await user.click(screen.getByTestId("AdminUsersPage-clear"));

      expect(
        screen.getByTestId("UsersTable-cell-row-1-col-email"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("OurPagination-2")).toBeInTheDocument();
      expect(
        screen.queryByTestId("AdminUsersPage-clear"),
      ).not.toBeInTheDocument();
      expect(screen.getByLabelText("Search by name or email")).toHaveValue("");
    });
  });
});
