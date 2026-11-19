import { vi } from "vitest";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import AddToScheduleModal from "main/components/PersonalSchedules/AddToScheduleModal";
import { useBackendMutation } from "main/utils/useBackend";
import { toast } from "react-toastify";

vi.mock("main/utils/useBackend");
vi.mock("react-toastify", () => ({
  toast: vi.fn(),
}));

describe("AddToScheduleModal", () => {
  const quarter = "20242";
  let mockOnAdd;
  let mockMutate;

  const renderComponent = (props = {}) => {
    const queryClient = new QueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <AddToScheduleModal
          quarter={quarter}
          section="test-section"
          onAdd={mockOnAdd}
          schedules={[]}
          {...props}
        />
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    mockOnAdd = vi.fn();
    mockMutate = vi.fn();
    vi.clearAllMocks();

    useBackendMutation.mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
    });
  });

  test("renders the Add button", () => {
    renderComponent();

    expect(
      screen.getByTestId("AddToScheduleModal-add-to-schedule-button"),
    ).toBeInTheDocument();
  });

  test("automatically creates a quarter-named schedule when none exists", () => {
    renderComponent();

    fireEvent.click(
      screen.getByTestId("AddToScheduleModal-add-to-schedule-button"),
    );

    expect(mockMutate).toHaveBeenCalledWith({
      name: "S24",
      description: "",
      quarter,
    });
    expect(screen.queryByText("Add to Schedule")).not.toBeInTheDocument();
    expect(mockOnAdd).not.toHaveBeenCalled();

    const [, { onSuccess }] = useBackendMutation.mock.lastCall;
    onSuccess({ id: 99, name: "S24" });

    expect(toast).toHaveBeenCalledWith('Schedule "S24" Created');
    expect(mockOnAdd).toHaveBeenCalledWith("test-section", 99);
  });

  test("uses the create-schedule API request parameters", () => {
    renderComponent();

    const [objectToAxiosParams] = useBackendMutation.mock.lastCall;
    expect(
      objectToAxiosParams({
        name: "S24",
        description: "",
        quarter,
      }),
    ).toEqual({
      url: "/api/personalschedules/post",
      method: "POST",
      params: {
        name: "S24",
        description: "",
        quarter,
      },
    });
  });

  test("shows creation errors to the user", () => {
    renderComponent();

    const [, { onError }] = useBackendMutation.mock.lastCall;
    onError({ response: { data: { message: "Create failed" } } });

    expect(toast).toHaveBeenCalledWith("Error: Create failed");
  });

  test("shows the error message or a fallback for errors without a response message", () => {
    renderComponent();

    const [, { onError }] = useBackendMutation.mock.lastCall;
    onError({ message: "Network Error" });
    expect(toast).toHaveBeenLastCalledWith("Error: Network Error");

    onError({ response: {}, message: "No Data" });
    expect(toast).toHaveBeenLastCalledWith("Error: No Data");

    onError({});
    expect(toast).toHaveBeenLastCalledWith("Error: Unknown error");

    onError(undefined);
    expect(toast).toHaveBeenLastCalledWith("Error: Unknown error");
  });

  test("uses the schedule cache invalidation key", () => {
    renderComponent();

    expect(useBackendMutation).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
      ["/api/personalschedules/all"],
    );
  });

  test("opens the selector when a schedule exists and adds to it", async () => {
    const schedules = [{ id: 1, name: "Plan A", quarter }];
    renderComponent({ schedules });

    fireEvent.click(
      screen.getByTestId("AddToScheduleModal-add-to-schedule-button"),
    );

    expect(screen.getByText("Add to Schedule")).toBeInTheDocument();
    const selector = screen.getByLabelText("Schedule", { selector: "select" });
    await waitFor(() => expect(selector).toHaveValue("1"));
    fireEvent.click(screen.getByText("Save Changes"));

    expect(mockOnAdd).toHaveBeenCalledWith("test-section", 1);
    expect(mockMutate).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText("Add to Schedule")).not.toBeInTheDocument();
    });
  });

  test("hides the selector modal if schedules become unavailable", () => {
    const queryClient = new QueryClient();
    const schedule = { id: 1, name: "Plan A", quarter };
    const renderWithSchedules = (schedules) => (
      <QueryClientProvider client={queryClient}>
        <AddToScheduleModal
          quarter={quarter}
          section="test-section"
          onAdd={mockOnAdd}
          schedules={schedules}
        />
      </QueryClientProvider>
    );
    const { rerender } = render(renderWithSchedules([schedule]));

    fireEvent.click(
      screen.getByTestId("AddToScheduleModal-add-to-schedule-button"),
    );
    expect(screen.getByText("Add to Schedule")).toBeInTheDocument();

    rerender(renderWithSchedules([]));

    expect(screen.queryByText("Add to Schedule")).not.toBeInTheDocument();
  });

  test("disables Add and shows progress while creating", () => {
    useBackendMutation.mockReturnValue({
      mutate: mockMutate,
      isLoading: true,
    });

    renderComponent();

    const addButton = screen.getByTestId(
      "AddToScheduleModal-add-to-schedule-button",
    );
    expect(addButton).toBeDisabled();
    expect(addButton).toHaveTextContent("Creating...");
  });
});
