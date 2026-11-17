package edu.ucsb.cs156.courses.jobs;

import edu.ucsb.cs156.courses.repositories.UCSBSubjectRepository;
import edu.ucsb.cs156.courses.services.IsStaleService;
import edu.ucsb.cs156.courses.services.UCSBCurriculumService;
import edu.ucsb.cs156.courses.services.UpdateCoursesService;
import edu.ucsb.cs156.jobs.services.JobRateLimit;
import java.util.ArrayList;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class UpdateCourseDataJobFactory {

  @Autowired private UCSBCurriculumService curriculumService;

  @Autowired private UCSBSubjectRepository subjectRepository;

  @Autowired private IsStaleService isStaleService;

  @Autowired private JobRateLimit jobRateLimit;

  @Autowired private UpdateCoursesService updateCoursesService;

  public UpdateCourseDataJob createForSubjectAndQuarterAndIfStale(
      String subjectArea, String quarterYYYYQ, boolean ifStale) {
    return new UpdateCourseDataJob(
        quarterYYYYQ,
        quarterYYYYQ,
        List.of(subjectArea),
        curriculumService,
        isStaleService,
        ifStale,
        jobRateLimit,
        updateCoursesService);
  }

  public UpdateCourseDataJob createForSubjectAndQuarterRange(
      String subjectArea, String start_quarterYYYYQ, String end_quarterYYYYQ, boolean ifStale) {
    return new UpdateCourseDataJob(
        start_quarterYYYYQ,
        end_quarterYYYYQ,
        List.of(subjectArea),
        curriculumService,
        isStaleService,
        ifStale,
        jobRateLimit,
        updateCoursesService);
  }

  private List<String> getAllSubjectCodes() {
    var subjects = subjectRepository.findAll();
    var subjectCodes = new ArrayList<String>();
    for (var subject : subjects) {
      subjectCodes.add(subject.getSubjectCode());
    }
    return subjectCodes;
  }

  public UpdateCourseDataJob createForQuarter(String quarterYYYYQ, boolean ifStale) {
    return new UpdateCourseDataJob(
        quarterYYYYQ,
        quarterYYYYQ,
        getAllSubjectCodes(),
        curriculumService,
        isStaleService,
        ifStale,
        jobRateLimit,
        updateCoursesService);
  }

  public UpdateCourseDataJob createForQuarterRange(
      String start_quarterYYYYQ, String end_quarterYYYYQ, boolean ifStale) {
    return new UpdateCourseDataJob(
        start_quarterYYYYQ,
        end_quarterYYYYQ,
        getAllSubjectCodes(),
        curriculumService,
        isStaleService,
        ifStale,
        jobRateLimit,
        updateCoursesService);
  }
}
