import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import UserTypeahead from "main/components/Users/UserTypeahead";
import usersFixtures from "fixtures/usersFixtures";

describe("UserTypeahead tests", () => {
  const onInputChange = vi.fn();
  const onSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderIt = (props = {}) =>
    render(
      <UserTypeahead
        suggestions={usersFixtures.threeUsers}
        onInputChange={onInputChange}
        onSelect={onSelect}
        {...props}
      />,
    );

  test("renders the input with the default label and no panel", () => {
    renderIt();
    expect(
      screen.getByLabelText("Search by name or email"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  test("uses a custom label and controlId", () => {
    renderIt({ label: "Find user", controlId: "MyTypeahead" });
    expect(screen.getByLabelText("Find user")).toHaveAttribute(
      "id",
      "MyTypeahead",
    );
  });

  test("does not show suggestions until minChars is reached", async () => {
    const user = userEvent.setup();
    renderIt({ minChars: 3 });
    const input = screen.getByRole("combobox");

    await user.type(input, "Ph");
    expect(onInputChange).toHaveBeenLastCalledWith("Ph");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.type(input, "i");
    expect(onInputChange).toHaveBeenLastCalledWith("Phi");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  test("shows suggestions with name and email", async () => {
    const user = userEvent.setup();
    renderIt();
    await user.type(screen.getByRole("combobox"), "Ph");

    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(
      screen.getByText("Phill Conrad (phtcon@ucsb.edu)"),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  test("clicking a suggestion selects it and closes the panel", async () => {
    const user = userEvent.setup();
    renderIt();
    await user.type(screen.getByRole("combobox"), "Ph");
    await user.click(screen.getByTestId("UserTypeahead-option-1"));

    expect(onSelect).toHaveBeenCalledWith(usersFixtures.threeUsers[1]);
    expect(screen.getByRole("combobox")).toHaveValue("Phillip Conrad");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  test("shows a message when there are no matches", async () => {
    const user = userEvent.setup();
    renderIt({ suggestions: [] });
    await user.type(screen.getByRole("combobox"), "zz");
    expect(screen.getByText("No matching users")).toBeInTheDocument();
  });

  test("shows a loading message while loading", async () => {
    const user = userEvent.setup();
    renderIt({ suggestions: [], isLoading: true });
    await user.type(screen.getByRole("combobox"), "zz");
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("No matching users")).not.toBeInTheDocument();
  });

  test("asks the user to keep typing when there are too many matches", async () => {
    const user = userEvent.setup();
    renderIt({ maxSuggestions: 2 });
    await user.type(screen.getByRole("combobox"), "Ph");
    expect(
      screen.getByText("3 matches. Keep typing to narrow the results."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  test("shows exactly maxSuggestions matches as a list", async () => {
    const user = userEvent.setup();
    renderIt({ maxSuggestions: 3 });
    await user.type(screen.getByRole("combobox"), "Ph");
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  test("arrow keys move the highlight and Enter selects", async () => {
    const user = userEvent.setup();
    renderIt();
    const input = screen.getByRole("combobox");
    await user.type(input, "Ph");
    expect(input).not.toHaveAttribute("aria-activedescendant");

    await user.keyboard("{ArrowDown}");
    expect(screen.getByTestId("UserTypeahead-option-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(input).toHaveAttribute(
      "aria-activedescendant",
      "UserTypeahead-option-0",
    );

    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(screen.getByTestId("UserTypeahead-option-2")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.keyboard("{ArrowUp}");
    expect(screen.getByTestId("UserTypeahead-option-1")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(screen.getByTestId("UserTypeahead-option-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith(usersFixtures.threeUsers[1]);
  });

  test("Enter with nothing highlighted does not select", async () => {
    const user = userEvent.setup();
    renderIt();
    await user.type(screen.getByRole("combobox"), "Ph");
    await user.keyboard("{Enter}");
    expect(onSelect).not.toHaveBeenCalled();
  });

  test("Escape closes the panel and typing reopens it", async () => {
    const user = userEvent.setup();
    renderIt();
    const input = screen.getByRole("combobox");
    await user.type(input, "Ph");
    await user.keyboard("{ArrowDown}{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.type(input, "i");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(input).not.toHaveAttribute("aria-activedescendant");
  });

  test("arrow keys and Enter do nothing when the list is not visible", async () => {
    const user = userEvent.setup();
    renderIt({ suggestions: [] });
    await user.type(screen.getByRole("combobox"), "zz");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).not.toHaveBeenCalled();
  });

  test("does not show the panel before typing even when minChars is 0", () => {
    renderIt({ minChars: 0 });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  test("wires up ids, aria attributes and active styling", async () => {
    const user = userEvent.setup();
    renderIt();
    const input = screen.getByRole("combobox");
    await user.type(input, "Ph");

    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("id", "UserTypeahead-listbox");
    expect(input).toHaveAttribute("aria-controls", "UserTypeahead-listbox");
    const options = screen.getAllByRole("option");
    options.forEach((option, i) => {
      expect(option).toHaveAttribute("id", `UserTypeahead-option-${i}`);
      expect(option).toHaveAttribute("aria-selected", "false");
      expect(option).not.toHaveClass("active");
    });

    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    expect(options[1]).toHaveClass("active");
    expect(options[0]).toHaveAttribute("aria-selected", "false");
    expect(options[0]).not.toHaveClass("active");
    expect(options[2]).toHaveAttribute("aria-selected", "false");
    expect(options[2]).not.toHaveClass("active");
  });

  test("Enter selects the first suggestion after one ArrowDown", async () => {
    const user = userEvent.setup();
    renderIt();
    await user.type(screen.getByRole("combobox"), "Ph");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith(usersFixtures.threeUsers[0]);
  });

  test("ArrowUp with nothing highlighted highlights the first suggestion", async () => {
    const user = userEvent.setup();
    renderIt();
    await user.type(screen.getByRole("combobox"), "Ph");
    await user.keyboard("{ArrowUp}");
    expect(screen.getByTestId("UserTypeahead-option-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("typing again clears the highlight", async () => {
    const user = userEvent.setup();
    renderIt();
    const input = screen.getByRole("combobox");
    await user.type(input, "Ph");
    await user.keyboard("{ArrowDown}");
    await user.type(input, "i");
    screen.getAllByRole("option").forEach((option) => {
      expect(option).toHaveAttribute("aria-selected", "false");
    });
    expect(input).not.toHaveAttribute("aria-activedescendant");
  });

  test("aria-activedescendant is removed when the panel is closed", async () => {
    const user = userEvent.setup();
    renderIt();
    const input = screen.getByRole("combobox");
    await user.type(input, "Ph");
    await user.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute(
      "aria-activedescendant",
      "UserTypeahead-option-0",
    );
    await user.keyboard("{Escape}");
    expect(input).not.toHaveAttribute("aria-activedescendant");
  });

  test("keyboard selection works with exactly maxSuggestions matches", async () => {
    const user = userEvent.setup();
    renderIt({ maxSuggestions: 3 });
    await user.type(screen.getByRole("combobox"), "Ph");
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith(usersFixtures.threeUsers[2]);
  });

  test("keyboard does not select when there are too many matches", async () => {
    const user = userEvent.setup();
    renderIt({ maxSuggestions: 2 });
    await user.type(screen.getByRole("combobox"), "Ph");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).not.toHaveBeenCalled();
  });

  test("keyboard does not select while loading", async () => {
    const user = userEvent.setup();
    renderIt({ isLoading: true });
    await user.type(screen.getByRole("combobox"), "Ph");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).not.toHaveBeenCalled();
  });

  test("keyboard does not select before minChars is reached", async () => {
    const user = userEvent.setup();
    renderIt({ minChars: 2 });
    await user.type(screen.getByRole("combobox"), "P");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).not.toHaveBeenCalled();
  });

  test("keyboard does not select after the panel is closed with Escape", async () => {
    const user = userEvent.setup();
    renderIt();
    await user.type(screen.getByRole("combobox"), "Ph");
    await user.keyboard("{Escape}{ArrowDown}{Enter}");
    expect(onSelect).not.toHaveBeenCalled();
  });
});
