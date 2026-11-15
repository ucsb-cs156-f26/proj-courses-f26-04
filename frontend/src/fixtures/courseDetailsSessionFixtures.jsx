import { personalSectionsFixtures } from "./personalSectionsFixtures";

const courseWithSession = (quarter, session) => ({
  ...personalSectionsFixtures.singleSection,
  quarter,
  classSections: [
    {
      ...personalSectionsFixtures.singleSection.classSections[0],
      session,
    },
  ],
});

export const courseDetailsSessionFixtures = {
  summerA: courseWithSession("20213", "00000A"),
  summerB: courseWithSession("20213", "00000B"),
  // Non-summer courses should stay blank even if a session value is present.
  fallWithSession: courseWithSession("20214", "00000A"),
  summerWithoutSession: courseWithSession("20213", null),
};
