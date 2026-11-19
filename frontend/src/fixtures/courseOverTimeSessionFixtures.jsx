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

// The same sections in the grouped format returned by endpoints that use
// Primary.fromConvertedSections (one Primary per lecture, with its
// discussion sections in subRows).
const toPrimary = (entry) => ({
  quarter: entry.courseInfo.quarter,
  courseId: entry.courseInfo.courseId,
  title: entry.courseInfo.title,
  description: entry.courseInfo.description,
  primary: entry.section,
  subRows: [],
  generalEducation: [],
});

export const summerSessionPrimaries = summerSessionSections.map(toPrimary);

export const nonSummerSessionPrimaries =
  nonSummerSessionSections.map(toPrimary);
