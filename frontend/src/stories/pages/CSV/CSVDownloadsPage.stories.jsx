import React from "react";

import CSVDownloadsPage from "main/pages/CSV/CSVDownloadsPage";

import { systemInfoFixtures } from "fixtures/systemInfoFixtures";

import { http, HttpResponse, delay } from "msw";

export default {
  title: "pages/CSV/CSVDownloadsPage",
  component: CSVDownloadsPage,
};

const Template = () => <CSVDownloadsPage />;

const commonHandlers = [
  http.get("/api/systemInfo", () => {
    return HttpResponse.json(systemInfoFixtures.showingBoth, {
      status: 200,
    });
  }),
  http.get("/api/currentUser", () => {
    return HttpResponse.status(403); // returns 403 when not logged in
  }),
];

const sampleEnrollmentCsv =
  "yyyyq,enrollCd,courseId,section,enrollment,dateCreated\n" +
  "20242,07492,CMPSC     156 ,0100,120,2024-04-01T00:00:00\n" +
  "20242,07500,CMPSC     156 ,0101,30,2024-04-01T00:00:00\n";

export const Default = Template.bind({});
Default.parameters = {
  msw: [
    ...commonHandlers,
    http.get("/api/enrollment/csv/quarter", async () => {
      await delay(500);
      return new HttpResponse(sampleEnrollmentCsv, {
        status: 200,
        headers: { "Content-Type": "text/csv; charset=UTF-8" },
      });
    }),
  ],
};

export const EnrollmentDownloadFails = Template.bind({});
EnrollmentDownloadFails.parameters = {
  msw: [
    ...commonHandlers,
    http.get("/api/enrollment/csv/quarter", () => {
      return new HttpResponse(null, { status: 500 });
    }),
  ],
};
