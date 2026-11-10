import React, { useState } from "react";

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
