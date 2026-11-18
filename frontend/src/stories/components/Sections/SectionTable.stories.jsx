import React from "react";
import SectionsTable from "main/components/Sections/SectionsTable";
import { http, HttpResponse } from "msw";

import { personalScheduleFixtures } from "fixtures/personalScheduleFixtures";
import primaryFixtures from "fixtures/primaryFixtures";

export default {
  title: "components/Sections/SectionsTable",
  component: SectionsTable,
};

const Template = (args) => {
  return <SectionsTable {...args} />;
};

export const Empty = Template.bind({});

Empty.args = {
  sections: [],
};
Empty.parameters = {
  msw: [
    http.get("/api/personalschedules/all", () => {
      return HttpResponse.json(
        personalScheduleFixtures.threePersonalSchedules,
        {
          status: 200,
        },
      );
    }),
  ],
};

export const f24_math_lowerDiv = Template.bind({});

f24_math_lowerDiv.args = {
  sections: primaryFixtures.f24_math_lowerDiv,
};
f24_math_lowerDiv.parameters = {
  msw: [
    http.get("/api/personalschedules/all", () => {
      return HttpResponse.json(
        personalScheduleFixtures.threePersonalSchedules,
        {
          status: 200,
        },
      );
    }),
  ],
};

export const f24_math_lowerDiv_withGeAreas = Template.bind({});

f24_math_lowerDiv_withGeAreas.args = {
  sections: primaryFixtures.f24_math_lowerDiv,
  showGeAreas: true,
};
f24_math_lowerDiv_withGeAreas.parameters = {
  ...f24_math_lowerDiv.parameters,
  docs: {
    description: {
      story:
        "With showGeAreas (used by the GE Search page): a GE Areas column lists each course's GE codes, e.g. C, QNT for MATH 2A. Section rows leave it blank.",
    },
  },
};
