package edu.ucsb.cs156.courses.jobs;

import edu.ucsb.cs156.courses.documents.ConvertedSection;
import edu.ucsb.cs156.courses.documents.Update;
import edu.ucsb.cs156.courses.models.Quarter;
import edu.ucsb.cs156.courses.services.IsStaleService;
import edu.ucsb.cs156.courses.services.UCSBCurriculumService;
import edu.ucsb.cs156.courses.services.UpdateCoursesService;
import edu.ucsb.cs156.jobs.services.JobContext;
import edu.ucsb.cs156.jobs.services.JobContextConsumer;
import edu.ucsb.cs156.jobs.services.JobRateLimit;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

@Builder
@Getter
@AllArgsConstructor
@Slf4j
public class UpdateCourseDataJob implements JobContextConsumer {

  private String start_quarterYYYYQ;
  private String end_quarterYYYYQ;
  private List<String> subjects;
  private UCSBCurriculumService ucsbCurriculumService;
  private IsStaleService isStaleService;
  private boolean ifStale;
  private JobRateLimit jobRateLimit;
  private UpdateCoursesService updateCoursesService;

  @Override
  public void accept(JobContext ctx) throws Exception {

    ctx.log(
        String.format(
            "Updating courses from %s to %s for %d subjects",
            start_quarterYYYYQ, end_quarterYYYYQ, subjects.size()));
    List<Quarter> quarters = Quarter.quarterList(start_quarterYYYYQ, end_quarterYYYYQ);
    for (Quarter quarter : quarters) {
      String quarterYYYYQ = quarter.getYYYYQ();
      for (String subjectArea : subjects) {
        // Most (subjectArea, quarterYYYYQ) pairs are not stale on a typical re-run and hit the
        // `continue` below with no ctx.log() call at all -- checkCancellation() gives this loop
        // its own cancellation checkpoint independent of whether an iteration happens to log
        // anything (see UpdateCourseDataJobTests for why a bare log()-only check isn't enough).
        ctx.checkCancellation();
        boolean isStale = isStaleService.isStale(subjectArea, quarterYYYYQ);
        if (ifStale) {
          if (!isStale) {
            continue;
          }
        }
        jobRateLimit.sleep();
        updateCourses(ctx, quarterYYYYQ, subjectArea);
      }
    }
    ctx.log("Finished updating courses");
  }

  public void updateCourses(JobContext ctx, String quarterYYYYQ, String subjectArea)
      throws Exception {
    ctx.log("Updating courses for [" + subjectArea + " " + quarterYYYYQ + "]");

    List<ConvertedSection> convertedSections =
        ucsbCurriculumService.getConvertedSections(subjectArea, quarterYYYYQ, "A");

    Update savedUpdate =
        updateCoursesService.upsert(convertedSections, ctx, quarterYYYYQ, subjectArea, true);

    ctx.log(
        String.format(
            "%d new sections saved, %d sections updated, %d errors, last update: %s",
            savedUpdate.getSaved(),
            savedUpdate.getUpdated(),
            savedUpdate.getErrors(),
            savedUpdate.getLastUpdate()));

    ctx.log("Saved update: " + savedUpdate);
  }
}
