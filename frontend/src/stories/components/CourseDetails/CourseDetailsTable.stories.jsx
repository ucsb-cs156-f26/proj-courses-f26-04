import React from "react";

import CourseDetailsTable from "main/components/CourseDetails/CourseDetailsTable";
import { personalSectionsFixtures } from "fixtures/personalSectionsFixtures";
import { courseDetailsSessionFixtures } from "fixtures/courseDetailsSessionFixtures";

export default {
  title: "components/CourseDetails/CourseDetailsTable",
  component: CourseDetailsTable,
};

const Template = (args) => {
  return <CourseDetailsTable {...args} />;
};

export const Empty = Template.bind({});
Empty.args = {
  details: [],
};

export const threeCourses = Template.bind({});
threeCourses.args = {
  details: personalSectionsFixtures.threePersonalSections,
};

export const SummerSessionA = Template.bind({});
SummerSessionA.args = {
  details: [courseDetailsSessionFixtures.summerA],
};

export const SummerSessionB = Template.bind({});
SummerSessionB.args = {
  details: [courseDetailsSessionFixtures.summerB],
};

export const NonSummerSession = Template.bind({});
NonSummerSession.args = {
  details: [courseDetailsSessionFixtures.fallWithSession],
};

export const MissingSummerSession = Template.bind({});
MissingSummerSession.args = {
  details: [courseDetailsSessionFixtures.summerWithoutSession],
};
