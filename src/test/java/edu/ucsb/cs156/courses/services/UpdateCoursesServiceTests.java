package edu.ucsb.cs156.courses.services;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import edu.ucsb.cs156.courses.collections.ConvertedSectionCollection;
import edu.ucsb.cs156.courses.collections.UpdateCollection;
import edu.ucsb.cs156.courses.documents.ConvertedSection;
import edu.ucsb.cs156.courses.documents.CoursePage;
import edu.ucsb.cs156.courses.documents.CoursePageFixtures;
import edu.ucsb.cs156.courses.documents.Update;
import edu.ucsb.cs156.courses.entities.EnrollmentDataPoint;
import edu.ucsb.cs156.courses.repositories.EnrollmentDataPointRepository;
import edu.ucsb.cs156.jobs.entities.Job;
import edu.ucsb.cs156.jobs.errors.JobCancelledException;
import edu.ucsb.cs156.jobs.repositories.JobsRepository;
import edu.ucsb.cs156.jobs.services.JobContext;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class UpdateCoursesServiceTests {

  @Mock ConvertedSectionCollection convertedSectionCollection;

  @Mock EnrollmentDataPointRepository enrollmentDataPointRepository;

  @Mock UCSBAPIQuarterService ucsbapiQuarterService;

  @Mock UpdateCollection updateCollection;

  @InjectMocks UpdateCoursesService updateCoursesService;

  ConvertedSection section0;
  ConvertedSection section1;
  Update savedUpdate;

  @BeforeEach
  void setup() throws Exception {
    CoursePage coursePage = CoursePage.fromJSON(CoursePageFixtures.COURSE_PAGE_JSON_MATH3B);
    List<ConvertedSection> convertedSections = coursePage.convertedSections();
    section0 = convertedSections.get(0);
    section1 = convertedSections.get(1);
    savedUpdate =
        new Update(null, "MATH", "20211", 0, 0, 0, LocalDateTime.parse("2022-03-05T15:50:10"));
  }

  private void stubFindOne(ConvertedSection section, Optional<ConvertedSection> result) {
    when(convertedSectionCollection.findOneByQuarterAndEnrollCode(
            eq(section.getCourseInfo().getQuarter()), eq(section.getSection().getEnrollCode())))
        .thenReturn(result);
  }

  @Test
  void upsert_inserts_sections_that_are_not_in_the_database() throws Exception {
    when(ucsbapiQuarterService.isQuarterInRegistrationPass(eq("20211"))).thenReturn(false);
    stubFindOne(section0, Optional.empty());
    stubFindOne(section1, Optional.empty());
    when(updateCollection.save(any())).thenReturn(savedUpdate);

    Update result =
        updateCoursesService.upsert(List.of(section0, section1), null, "20211", "MATH", true);

    assertSame(savedUpdate, result);
    verify(convertedSectionCollection, times(1)).save(same(section0));
    verify(convertedSectionCollection, times(1)).save(same(section1));
    verify(updateCollection, times(1)).save(new Update(null, "MATH", "20211", 2, 0, 0, null));
    verify(enrollmentDataPointRepository, never()).save(any());
  }

  @Test
  void upsert_updates_sections_that_are_already_in_the_database() throws Exception {
    ConvertedSection existing = (ConvertedSection) section0.clone();
    ConvertedSection incoming = (ConvertedSection) section0.clone();
    incoming.getCourseInfo().setTitle("New Title");
    incoming.getSection().setEnrolledTotal(existing.getSection().getEnrolledTotal() + 1);

    when(ucsbapiQuarterService.isQuarterInRegistrationPass(eq("20211"))).thenReturn(false);
    stubFindOne(incoming, Optional.of(existing));
    when(updateCollection.save(any())).thenReturn(savedUpdate);

    Update result = updateCoursesService.upsert(List.of(incoming), null, "20211", "MATH", true);

    assertSame(savedUpdate, result);
    // the existing document (keeping its _id) is the one saved, carrying the new data
    assertSame(incoming.getCourseInfo(), existing.getCourseInfo());
    assertSame(incoming.getSection(), existing.getSection());
    assertEquals("New Title", existing.getCourseInfo().getTitle());
    verify(convertedSectionCollection, times(1)).save(same(existing));
    verify(convertedSectionCollection, times(1)).save(any());
    verify(updateCollection, times(1)).save(new Update(null, "MATH", "20211", 0, 1, 0, null));
  }

  @Test
  void upsert_handles_a_mix_of_new_and_existing_sections() throws Exception {
    when(ucsbapiQuarterService.isQuarterInRegistrationPass(eq("20211"))).thenReturn(false);
    when(convertedSectionCollection.findOneByQuarterAndEnrollCode(
            eq(section0.getCourseInfo().getQuarter()), eq(section0.getSection().getEnrollCode())))
        .thenReturn(Optional.empty())
        .thenReturn(Optional.of(section0));
    stubFindOne(section1, Optional.empty());
    when(updateCollection.save(any())).thenReturn(savedUpdate);

    updateCoursesService.upsert(List.of(section0, section1, section0), null, "20211", "MATH", true);

    verify(updateCollection, times(1)).save(new Update(null, "MATH", "20211", 2, 1, 0, null));
  }

  @Test
  void upsert_counts_errors_and_keeps_going() throws Exception {
    when(ucsbapiQuarterService.isQuarterInRegistrationPass(eq("20211"))).thenReturn(false);
    when(convertedSectionCollection.findOneByQuarterAndEnrollCode(
            eq(section0.getCourseInfo().getQuarter()), eq(section0.getSection().getEnrollCode())))
        .thenThrow(new IllegalArgumentException("Testing Exception Handling!"));
    stubFindOne(section1, Optional.empty());
    when(updateCollection.save(any())).thenReturn(savedUpdate);

    Update result =
        updateCoursesService.upsert(List.of(section0, section1), null, "20211", "MATH", true);

    assertSame(savedUpdate, result);
    verify(convertedSectionCollection, never()).save(same(section0));
    verify(convertedSectionCollection, times(1)).save(same(section1));
    verify(updateCollection, times(1)).save(new Update(null, "MATH", "20211", 1, 0, 1, null));
  }

  @Test
  void upsert_saves_enrollment_data_points_during_registration_pass() throws Exception {
    when(ucsbapiQuarterService.isQuarterInRegistrationPass(eq("20211"))).thenReturn(true);
    stubFindOne(section0, Optional.empty());
    stubFindOne(section1, Optional.empty());
    when(updateCollection.save(any())).thenReturn(savedUpdate);

    EnrollmentDataPoint edp0 = section0.getEnrollmentDataPoint();
    EnrollmentDataPoint edp1 = section1.getEnrollmentDataPoint();

    updateCoursesService.upsert(List.of(section0, section1), null, "20211", "MATH", true);

    verify(enrollmentDataPointRepository, times(1)).save(eq(edp0));
    verify(enrollmentDataPointRepository, times(1)).save(eq(edp1));
    verify(enrollmentDataPointRepository, times(2)).save(any());
  }

  @Test
  void upsert_with_empty_list_still_records_an_update() throws Exception {
    when(ucsbapiQuarterService.isQuarterInRegistrationPass(eq("20211"))).thenReturn(false);
    when(updateCollection.save(any())).thenReturn(savedUpdate);

    Update result = updateCoursesService.upsert(List.of(), null, "20211", "MATH", true);

    assertSame(savedUpdate, result);
    verify(convertedSectionCollection, never()).save(any());
    verify(updateCollection, times(1)).save(new Update(null, "MATH", "20211", 0, 0, 0, null));
  }

  @Test
  void upsert_works_with_a_non_cancelled_job_context() throws Exception {
    JobContext ctx = new JobContext(null, Job.builder().build());
    when(ucsbapiQuarterService.isQuarterInRegistrationPass(eq("20211"))).thenReturn(false);
    stubFindOne(section0, Optional.empty());
    when(updateCollection.save(any())).thenReturn(savedUpdate);

    Update result = updateCoursesService.upsert(List.of(section0), ctx, "20211", "MATH", true);

    assertSame(savedUpdate, result);
    verify(convertedSectionCollection, times(1)).save(same(section0));
  }

  @Test
  void upsert_checks_cancellation_before_each_section() throws Exception {
    JobsRepository jobsRepository = mock(JobsRepository.class);
    when(jobsRepository.findById(99L))
        .thenReturn(Optional.of(Job.builder().id(99L).status("cancelling").build()));
    JobContext cancellingCtx =
        new JobContext(null, Job.builder().id(99L).build(), null, jobsRepository);
    when(ucsbapiQuarterService.isQuarterInRegistrationPass(eq("20211"))).thenReturn(false);

    assertThrows(
        JobCancelledException.class,
        () -> updateCoursesService.upsert(List.of(section0), cancellingCtx, "20211", "MATH", true));

    verify(convertedSectionCollection, never()).findOneByQuarterAndEnrollCode(any(), any());
    verify(updateCollection, never()).save(any());
  }

  // ─────────────── fromJob = false: write-through from a user's live-API search ───────────────
  // A user search only covers part of a subject/quarter (a single level, or a GE area spanning
  // many subjects), so it must upsert sections without saving an Update record (which
  // IsStaleService would read as "fully loaded") and without adding enrollment data points.

  @Test
  void upsert_not_from_job_saves_sections_but_does_not_save_an_update_record() throws Exception {
    stubFindOne(section0, Optional.empty());
    stubFindOne(section1, Optional.of(section1));

    Update result =
        updateCoursesService.upsert(List.of(section0, section1), null, "20211", "MATH", false);

    // the returned Update still summarizes the run, but was never persisted
    assertEquals(new Update(null, "MATH", "20211", 1, 1, 0, null), result);
    verify(convertedSectionCollection, times(1)).save(same(section0));
    verify(convertedSectionCollection, times(1)).save(same(section1));
    verify(updateCollection, never()).save(any());
  }

  @Test
  void upsert_not_from_job_never_records_enrollment_or_checks_registration_pass() throws Exception {
    stubFindOne(section0, Optional.empty());

    updateCoursesService.upsert(List.of(section0), null, "20211", "MATH", false);

    // the registration-pass lookup is short-circuited, so enrollment is never recorded even if
    // the quarter is in its registration pass
    verify(ucsbapiQuarterService, never()).isQuarterInRegistrationPass(any());
    verify(enrollmentDataPointRepository, never()).save(any());
  }

  @Test
  void upsertAsync_upserts_sections_without_saving_an_update_record() {
    stubFindOne(section0, Optional.empty());

    // @Async is applied by a Spring proxy, which a plain Mockito test doesn't have, so this
    // runs synchronously here -- which is what lets us verify its effects directly.
    updateCoursesService.upsertAsync(List.of(section0), "20211", "MATH");

    verify(convertedSectionCollection, times(1)).save(same(section0));
    verify(updateCollection, never()).save(any());
    verify(enrollmentDataPointRepository, never()).save(any());
    verify(ucsbapiQuarterService, never()).isQuarterInRegistrationPass(any());
  }

  @Test
  void upsertAsync_swallows_exceptions_so_they_do_not_escape_the_async_thread() {
    // a null list makes upsert throw (NullPointerException in its for loop) outside the
    // per-section try/catch, so this exercises upsertAsync's own catch
    assertDoesNotThrow(() -> updateCoursesService.upsertAsync(null, "20211", "MATH"));

    verify(convertedSectionCollection, never()).save(any());
    verify(updateCollection, never()).save(any());
  }
}
