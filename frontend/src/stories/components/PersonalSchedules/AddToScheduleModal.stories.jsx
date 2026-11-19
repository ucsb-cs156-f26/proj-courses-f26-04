import React from "react";
import { http, HttpResponse } from "msw";
import AddToScheduleModal from "main/components/PersonalSchedules/AddToScheduleModal";

export default {
  title: "components/PersonalSchedules/AddToScheduleModal",
  component: AddToScheduleModal,
};

const Template = (args) => <AddToScheduleModal {...args} />;

export const NoSchedulesForQuarter = Template.bind({});
NoSchedulesForQuarter.args = {
  quarter: "20254",
  section: { enrollCode: "12345" },
  onAdd: () => {},
  schedules: [],
};
NoSchedulesForQuarter.parameters = {
  msw: [
    http.post("/api/personalschedules/post", () =>
      HttpResponse.json({ id: 1, name: "F25" }, { status: 200 }),
    ),
  ],
};
