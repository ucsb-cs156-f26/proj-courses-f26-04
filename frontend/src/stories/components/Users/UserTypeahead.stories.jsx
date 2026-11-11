import React, { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import UserTypeahead from "main/components/Users/UserTypeahead";
import usersFixtures from "fixtures/usersFixtures";

export default {
  title: "components/Users/UserTypeahead",
  component: UserTypeahead,
};

// Filters the fixtures locally so the stories behave like a real backend would.
const Template = ({ allUsers = usersFixtures.threeUsers, ...args }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);

  const handleInputChange = (text) => {
    const needle = text.toLowerCase();
    setSuggestions(
      allUsers.filter(
        (u) =>
          u.fullName.toLowerCase().includes(needle) ||
          u.email.toLowerCase().includes(needle),
      ),
    );
  };

  return (
    <>
      <UserTypeahead
        {...args}
        suggestions={suggestions}
        onInputChange={handleInputChange}
        onSelect={setSelected}
      />
      <p className="mt-3">
        Selected:{" "}
        {selected ? `${selected.fullName} (${selected.email})` : "none"}
      </p>
    </>
  );
};

export const Default = Template.bind({});
Default.args = {};

const makeUser = (id, fullName, email) => ({
  ...usersFixtures.threeUsers[0],
  id,
  fullName,
  email,
  admin: false,
});

const classUsers = [
  makeUser(11, "Chris Gaucho", "cgaucho@ucsb.edu"),
  makeUser(12, "Christina Lee", "clee@ucsb.edu"),
  makeUser(13, "Chad Nguyen", "cnguyen@ucsb.edu"),
  makeUser(14, "Charlie Brown", "cbrown@ucsb.edu"),
  makeUser(15, "Michelle Tran", "mtran@ucsb.edu"),
  makeUser(16, "Daniel Park", "dpark@ucsb.edu"),
  makeUser(17, "Maria Lopez", "mlopez@ucsb.edu"),
];

// The component working "just right": not too few matches, not too many,
// not loading. Types "ch" automatically so the open list is visible, then
// highlights the first suggestion with the keyboard.
export const JustRight = Template.bind({});
JustRight.args = {
  allUsers: classUsers,
};
JustRight.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.type(canvas.getByRole("combobox"), "ch");
  const options = await canvas.findAllByRole("option");
  await expect(options).toHaveLength(5);
  await userEvent.keyboard("{ArrowDown}");
  await expect(options[0]).toHaveAttribute("aria-selected", "true");
};

export const NoMatches = Template.bind({});
NoMatches.args = {
  allUsers: [],
};

export const Loading = (args) => (
  <UserTypeahead
    {...args}
    suggestions={[]}
    isLoading={true}
    onInputChange={() => {}}
    onSelect={() => {}}
  />
);

const manyUsers = Array.from({ length: 15 }, (_, i) => ({
  ...usersFixtures.threeUsers[0],
  id: 100 + i,
  fullName: `Student Number${i}`,
  email: `student${i}@ucsb.edu`,
}));

export const TooManyMatches = Template.bind({});
TooManyMatches.args = {
  allUsers: manyUsers,
  maxSuggestions: 10,
};
