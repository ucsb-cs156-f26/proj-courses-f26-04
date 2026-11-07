import { oneSection } from "./sectionFixtures";

export const summerSessionSections = ["A", "B"].map((session, index) => ({
  ...oneSection[0],
  courseInfo: { ...oneSection[0].courseInfo, quarter: "20213" },
  section: {
    ...oneSection[0].section,
    enrollCode: `${12583 + index}`,
    session: `00000${session}`,
  },
}));

// Even if a non-summer section has a session value, its Session cell stays blank.
export const nonSummerSessionSections = summerSessionSections.map((entry) => ({
  ...entry,
  courseInfo: { ...entry.courseInfo, quarter: "20214" },
}));
