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

const similarNames = [
  makeUser(11, "Charlie Tuna", "ctuna@ucsb.edu"),
  makeUser(12, "Chris Gaucho", "cgaucho@ucsb.edu"),
  makeUser(13, "Chris Taylor", "ctaylor@ucsb.edu"),
  makeUser(14, "Christopher Reeves", "creeves@ucsb.edu"),
  makeUser(15, "Christine Keener", "ckeener@ucsb.edu"),
];

// The component working "just right": not too few matches, not too many,
// not loading. The seed names are all close to each other. The story types
// "Chris" for you, which leaves four matches; keep typing " Gaucho" to narrow
// it to one, or use the arrow keys and Enter to pick a row.
export const Try_Chris_Gaucho = Template.bind({});
Try_Chris_Gaucho.args = {
  allUsers: similarNames,
};
Try_Chris_Gaucho.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.type(canvas.getByRole("combobox"), "Chris");
  const options = await canvas.findAllByRole("option");
  await expect(options).toHaveLength(4);
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
