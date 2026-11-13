package edu.ucsb.cs156.courses.controllers;

import edu.ucsb.cs156.courses.documents.CoursePage;
import edu.ucsb.cs156.courses.documents.Primary;
import edu.ucsb.cs156.courses.repositories.UserRepository;
import edu.ucsb.cs156.courses.services.UCSBCurriculumService;
import edu.ucsb.cs156.courses.services.UpdateCoursesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "UCSBCurriculumController")
@RestController
@RequestMapping("/api/public")
@Slf4j
public class UCSBCurriculumController extends ApiController {

  @Autowired UserRepository userRepository;
  @Autowired UCSBCurriculumService ucsbCurriculumService;
  @Autowired UpdateCoursesService updateCoursesService;

  @Operation(
      summary =
          "Get course data (in original UCSB API format) for a given quarter, department, and level")
  @GetMapping(value = "/basicsearch", produces = "application/json")
  public ResponseEntity<String> basicsearch(
      @RequestParam String qtr, @RequestParam String dept, @RequestParam String level)
      throws Exception {

    String body = ucsbCurriculumService.getJSON(dept, qtr, level);

    return ResponseEntity.ok().body(body);
  }

  /**
   * Get primaries for a given quarter, department, and level. This endpoint returns a list of
   * Primary objects.
   *
   * @param qtr the quarter in YYYYQ format
   * @param dept the department code (e.g., "CS")
   * @param level the course level (e.g., "UG" for undergraduate)
   * @return a list of Primary objects
   */
  @Operation(summary = "Get primaries for a given quarter, department, and level")
  @GetMapping(value = "/primaries", produces = "application/json")
  public List<Primary> primaries(
      @RequestParam String qtr, @RequestParam String dept, @RequestParam String level)
      throws Exception {

    CoursePage coursePage = ucsbCurriculumService.getCoursePage(dept, qtr, level);
    // Runs on a background thread (see UpdateCoursesService.upsertAsync); never blocks or fails
    // this response.
    updateCoursesService.upsertAsync(coursePage.convertedSections(), qtr, dept);

    return coursePage.getPrimaries();
  }

  @Operation(summary = "Get primaries for a given quarter and GE area")
  @GetMapping(value = "/primariesge", produces = "application/json")
  public List<Primary> primariesGE(@RequestParam String qtr, @RequestParam String area)
      throws Exception {
    CoursePage coursePage = ucsbCurriculumService.getCoursePageByGE(qtr, area);
    // GE results span many subjects; `area` only labels the in-memory Update returned by upsert,
    // which is never saved for user searches (fromJob = false).
    updateCoursesService.upsertAsync(coursePage.convertedSections(), qtr, area);

    return coursePage.getPrimaries();
  }

  // Backend for final exam info, similar to the above operation:
  @Operation(summary = "Get final exam information for a given quarter and course enrollment code")
  @GetMapping(value = "/finalsInfo", produces = "application/json")
  public ResponseEntity<String> finalsInfo(
      @RequestParam String quarterYYYYQ, @RequestParam String enrollCd)
      throws Exception { // Looks for quarter and code

    String body = ucsbCurriculumService.getFinalsInfo(quarterYYYYQ, enrollCd);

    return ResponseEntity.ok().body(body);
  }

  @Operation(summary = "Get General Education areas, optionally filtered by collegeCode")
  @GetMapping(value = "/generalEducationInfo", produces = "application/json")
  public ResponseEntity<?> generalEducationInfo(
      @Parameter(description = "Enter either L&S, ENGR, or CRST")
          @RequestParam(value = "collegeCode", required = false)
          String collegeCode)
      throws Exception {

    if (collegeCode != null) {
      // returns List<String> of requirementCode
      List<String> codes = ucsbCurriculumService.getRequirementCodesByCollege(collegeCode);
      return ResponseEntity.ok().body(codes);
    } else {
      // returns the full raw JSON array
      String body = ucsbCurriculumService.getGeneralEducationInfo();
      return ResponseEntity.ok().body(body);
    }
  }
}
