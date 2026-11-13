package edu.ucsb.cs156.courses.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.ucsb.cs156.courses.entities.User;
import edu.ucsb.cs156.courses.repositories.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "User information (admin only)")
@RequestMapping("/api/admin/users")
@RestController
public class UsersController extends ApiController {
  @Autowired UserRepository userRepository;

  @Autowired ObjectMapper mapper;

  @Operation(summary = "Get a list of all users")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  @GetMapping("")
  public ResponseEntity<String> users() throws JsonProcessingException {
    Iterable<User> users = userRepository.findAll();
    String body = mapper.writeValueAsString(users);
    return ResponseEntity.ok().body(body);
  }

  public static final int AUTOCOMPLETE_MIN_CHARS = 2;
  // One more than the frontend's maxSuggestions (10), so the UI can tell
  // "exactly 10 matches" apart from "more than 10 matches".
  public static final int AUTOCOMPLETE_MAX_RESULTS = 11;

  @Operation(summary = "Autocomplete users by name or email (case-insensitive substring match)")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  @GetMapping("/autocomplete")
  public List<User> autocomplete(
      @Parameter(
              name = "q",
              description = "text to look for in the user's full name or email",
              example = "ph",
              required = true)
          @RequestParam
          String q) {
    String trimmed = q.trim();
    if (trimmed.length() < AUTOCOMPLETE_MIN_CHARS) {
      return List.of();
    }
    return userRepository.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
        trimmed, trimmed, PageRequest.of(0, AUTOCOMPLETE_MAX_RESULTS));
  }

  @Operation(summary = "Get a list of all users with pages")
  @PreAuthorize("hasRole('ROLE_ADMIN')")
  @GetMapping(params = {"page", "pageSize", "sortField", "sortDirection"})
  public Iterable<User> usersPaged(
      @Parameter(
              name = "page",
              description = "what page of the data",
              example = "0",
              required = true)
          @RequestParam
          int page,
      @Parameter(
              name = "pageSize",
              description = "size of each page",
              example = "5",
              required = true)
          @RequestParam
          int pageSize,
      @Parameter(
              name = "sortField",
              description = "field to sort by",
              example = "email",
              required = true)
          @RequestParam
          String sortField,
      @Parameter(
              name = "sortDirection",
              description = "sort direction",
              example = "ASC",
              required = true)
          @RequestParam
          String sortDirection)
      throws JsonProcessingException {
    List<String> allowedSortFields = Arrays.asList("givenName", "familyName", "email");
    if (!allowedSortFields.contains(sortField)) {
      throw new IllegalArgumentException(
          String.format(
              "%s is not a valid sort field.  Valid values are %s", sortField, allowedSortFields));
    }

    List<String> allowedSortDirections = Arrays.asList("ASC", "DESC");
    if (!allowedSortDirections.contains(sortDirection)) {
      throw new IllegalArgumentException(
          String.format(
              "%s is not a valid sort direction.  Valid values are %s",
              sortDirection, allowedSortDirections));
    }

    Direction sortDirectionObject = Direction.ASC;
    if (sortDirection.equals("DESC")) {
      sortDirectionObject = Direction.DESC;
    }

    PageRequest pageRequest = PageRequest.of(page, pageSize, sortDirectionObject, sortField);

    Iterable<User> users = userRepository.findAll(pageRequest);
    return users;
  }
}
