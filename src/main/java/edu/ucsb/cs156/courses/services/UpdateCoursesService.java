package edu.ucsb.cs156.courses.services;

import edu.ucsb.cs156.courses.collections.ConvertedSectionCollection;
import edu.ucsb.cs156.courses.collections.UpdateCollection;
import edu.ucsb.cs156.courses.documents.ConvertedSection;
import edu.ucsb.cs156.courses.documents.Update;
import edu.ucsb.cs156.courses.repositories.EnrollmentDataPointRepository;
import edu.ucsb.cs156.jobs.services.JobContext;
import java.util.List;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class UpdateCoursesService {
  @Autowired ConvertedSectionCollection convertedSectionCollection;
  @Autowired EnrollmentDataPointRepository enrollmentDataPointRepository;
  @Autowired UCSBAPIQuarterService ucsbapiQuarterService;
  @Autowired UpdateCollection updateCollection;

  /**
   * Insert or update each section in the convertedSections collection.
   *
   * @param fromJob true when called from UpdateCourseDataJob, which fetches a complete
   *     (subjectArea, quarter) with level "A". Only then do we (a) record enrollment data points,
   *     so enrollment history gets one point per scheduled run rather than one per user search, and
   *     (b) save an Update record, which IsStaleService reads as "this subject/quarter is fully
   *     loaded". User searches pass false: the main page only ever sends a partial level (L, S, U
   *     or G), and GE searches span many subjects, so neither may mark a subject/quarter as loaded.
   * @return the Update summarizing this run; saved to the updates collection only when fromJob
   */
  public Update upsert(
      List<ConvertedSection> convertedSections,
      JobContext ctx,
      String quarterYYYYQ,
      String subjectArea,
      boolean fromJob)
      throws Exception {

    int saved = 0, updated = 0, errors = 0;
    // Short-circuit so user searches never pay for the registration-pass lookup.
    boolean recordEnrollment =
        fromJob && ucsbapiQuarterService.isQuarterInRegistrationPass(quarterYYYYQ);

    for (ConvertedSection section : convertedSections) {
      if (ctx != null) ctx.checkCancellation();
      try {
        String quarter = section.getCourseInfo().getQuarter();
        String enrollCode = section.getSection().getEnrollCode();
        Optional<ConvertedSection> optionalSection =
            convertedSectionCollection.findOneByQuarterAndEnrollCode(quarter, enrollCode);
        if (optionalSection.isPresent()) {
          ConvertedSection existingSection = optionalSection.get();
          existingSection.setCourseInfo(section.getCourseInfo());
          existingSection.setSection(section.getSection());
          convertedSectionCollection.save(existingSection);
          updated++;
        } else {
          convertedSectionCollection.save(section);
          saved++;
        }
        if (recordEnrollment) {
          enrollmentDataPointRepository.save(section.getEnrollmentDataPoint());
        }
      } catch (Exception e) {
        errors++;
      }
    }

    Update update = new Update(null, subjectArea, quarterYYYYQ, saved, updated, errors, null);
    return fromJob ? updateCollection.save(update) : update;
  }

  /**
   * Fire-and-forget write-through for the live-API search endpoints. The caller returns
   * immediately, so the user's search response is never delayed by Mongo writes.
   *
   * <p>Runs on lib-jobs' "jobsExecutor" (@EnableAsync is also provided by lib-jobs). That pool is
   * single-threaded, so this upsert may wait in the queue behind a running UpdateCourseDataJob;
   * that's acceptable for a best-effort cache fill, and it means upserts never run concurrently
   * with each other.
   *
   * <p>Must be called from another bean: Spring applies @Async through a proxy, so a call from
   * inside this class would run synchronously.
   *
   * <p>Exceptions are caught and logged here because an exception thrown from an @Async void method
   * has no caller to propagate to.
   */
  @Async("jobsExecutor")
  public void upsertAsync(
      List<ConvertedSection> convertedSections, String quarterYYYYQ, String subjectArea) {
    try {
      upsert(convertedSections, null, quarterYYYYQ, subjectArea, false);
    } catch (Exception e) {
      log.error("Write-through upsert failed for [{} {}]", subjectArea, quarterYYYYQ, e);
    }
  }
}
