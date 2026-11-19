import {
  summerSessionSections,
  nonSummerSessionSections,
} from "fixtures/courseOverTimeSessionFixtures";
import React from "react";

import CourseOverTimeInstructorIndexPage from "main/pages/CourseOverTime/CourseOverTimeInstructorIndexPage";
import { threeSections } from "fixtures/sectionFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { ucsbSubjectsFixtures } from "fixtures/ucsbSubjectsFixtures";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";

import { toast } from "react-toastify";
import { http, HttpResponse } from "msw";

export default {
  title: "pages/CourseOverTime/CourseOverTimeInstructorIndexPage",
  component: CourseOverTimeInstructorIndexPage,
};

const Template = () => <CourseOverTimeInstructorIndexPage />;

export const Default = Template.bind({});
const parametersForSections = (sections) => ({
  msw: [
    http.get("/api/UCSBSubjects/all", () => {
      return HttpResponse.json(ucsbSubjectsFixtures.threeSubjects, {
        status: 200,
      });
    }),
    http.get("/api/public/courseovertime/instructorsearch", ({ request }) => {
      toast(`Generated: ${request.method} ${request.url}`);
      return HttpResponse.json(sections, {
        status: 200,
      });
    }),
    http.get("/api/systemInfo", () => {
      return HttpResponse.json(systemInfoFixtures.showingNeither, {
        status: 200,
      });
    }),
    http.get("/api/currentUser", () => {
      return HttpResponse.json(apiCurrentUserFixtures.adminUser, {
        status: 200,
      });
    }),
    http.post("/logout", ({ request }) => {
      toast(`Generated: ${request.method} ${request.url}`);
      return HttpResponse.json(
        {},
        {
          status: 200,
        },
      );
    }),
  ],
});

Default.parameters = parametersForSections(threeSections);

export const SessionExamples = Template.bind({});
SessionExamples.parameters = {
  ...parametersForSections([
    ...summerSessionSections,
    ...nonSummerSessionSections,
  ]),
  docs: {
    description: {
      story:
        "Search from Summer 2021 through Fall 2021, then Submit. Summer rows show A and B; fall rows have blank Session cells.",
    },
  },
};
