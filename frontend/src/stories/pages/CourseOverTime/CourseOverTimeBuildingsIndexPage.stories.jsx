import {
  summerSessionSections,
  nonSummerSessionSections,
} from "fixtures/courseOverTimeSessionFixtures";
import React from "react";

import CourseOverTimeBuildingsIndexPage from "main/pages/CourseOverTime/CourseOverTimeBuildingsIndexPage";
import { ucsbSubjectsFixtures } from "fixtures/ucsbSubjectsFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { coursesInLib } from "fixtures/buildingFixtures";
import { http, HttpResponse } from "msw";

export default {
  title: "pages/CourseOverTime/CourseOverTimeBuildingsIndexPage",
  component: CourseOverTimeBuildingsIndexPage,
};

const Template = () => <CourseOverTimeBuildingsIndexPage />;

export const Default = Template.bind({});
const parametersForSections = (sections, filterByQuarter = false) => ({
  msw: [
    http.get("/api/UCSBSubjects/all", () => {
      return HttpResponse.json(ucsbSubjectsFixtures.threeSubjects, {
        status: 200,
      });
    }),
    http.get("/api/systemInfo", () => {
      return HttpResponse.json(systemInfoFixtures.showingBoth, {
        status: 200,
      });
    }),
    http.get("/api/currentUser", () => {
      return HttpResponse.status(403); // returns 403 when not logged in
    }),
    http.get("/api/public/courseovertime/buildingsearch/classrooms", () => {
      return HttpResponse.json(["1312", "2020", "1108"], {
        status: 200,
      });
    }),
    http.get("/api/public/courseovertime/buildingsearch", ({ request }) => {
      const quarter = new URL(request.url).searchParams.get("startQtr");
      return HttpResponse.json(
        filterByQuarter
          ? sections.filter((entry) => entry.courseInfo.quarter === quarter)
          : sections,
        {
          status: 200,
        },
      );
    }),
  ],
});

Default.parameters = parametersForSections(coursesInLib);

export const SessionExamples = Template.bind({});
SessionExamples.parameters = {
  ...parametersForSections(
    [...summerSessionSections, ...nonSummerSessionSections],
    true,
  ),
  docs: {
    description: {
      story:
        "Select Summer 2021 or Fall 2021 and Buchanan Hall, then Submit. Summer rows show A and B; fall rows have blank Session cells.",
    },
  },
};
