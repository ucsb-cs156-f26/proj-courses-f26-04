package edu.ucsb.cs156.courses.repositories;

import static org.junit.jupiter.api.Assertions.assertThrows;

import edu.ucsb.cs156.courses.entities.User;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

@DataJpaTest
public class UserRepositoryTests {

  @Autowired UserRepository userRepository;

  @Autowired EntityManager entityManager;

  @Test
  public void save_rejects_duplicate_email_addresses() {
    User user1 = User.builder().email("student@example.com").build();
    User user2 = User.builder().email("student@example.com").build();

    userRepository.save(user1);
    entityManager.flush();

    assertThrows(
        DataIntegrityViolationException.class,
        () -> {
          userRepository.save(user2);
          entityManager.flush();
        });
  }

  @Test
  public void save_allows_different_email_addresses() {
    User user1 = User.builder().email("student1@example.com").build();
    User user2 = User.builder().email("student2@example.com").build();

    userRepository.save(user1);
    userRepository.save(user2);

    entityManager.flush();
  }
}
