package com.learningtracker.repository;

import com.learningtracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for {@link User} entity operations.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Finds a user by their email address.
     *
     * @param email the email to search for
     * @return an optional containing the user if found
     */
    Optional<User> findByEmail(String email);

    /**
     * Checks whether a user exists with the given email.
     *
     * @param email the email to check
     * @return true if a user exists with that email
     */
    boolean existsByEmail(String email);
}
