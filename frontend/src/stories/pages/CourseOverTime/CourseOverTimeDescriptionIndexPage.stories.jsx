import {
  summerSessionPrimaries,
  nonSummerSessionPrimaries,
} from "fixtures/courseOverTimeSessionFixtures";
import React from "react";

import CourseOverTimeDescriptionIndexPage from "main/pages/CourseOverTime/CourseOverTimeDescriptionIndexPage";
import primaryFixtures from "fixtures/primaryFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";

import { toast } from "react-toastify";
import { http, HttpResponse } from "msw";

export default {
  title: "pages/CourseOverTime/CourseOverTimeDescriptionIndexPage",
  component: CourseOverTimeDescriptionIndexPage,
};

const Template = () => <CourseOverTimeDescriptionIndexPage />;

export const Default = Template.bind({});
const parametersForSections = (sections) => ({
  msw: [
    http.get("/api/public/description/search", ({ request }) => {
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

Default.parameters = {
  ...parametersForSections(primaryFixtures.f24_math_lowerDiv),
  docs: {
    description: {
      story:
        "Enter any search terms, then Submit. Each lecture has a ➕ button that unfolds its discussion sections.",
    },
  },
};

export const SessionExamples = Template.bind({});
SessionExamples.parameters = {
  ...parametersForSections([
    ...summerSessionPrimaries,
    ...nonSummerSessionPrimaries,
  ]),
  docs: {
    description: {
      story:
        "Search from Summer 2021 through Fall 2021, then Submit. Summer rows show A and B; fall rows have blank Session cells.",
    },
  },
};
