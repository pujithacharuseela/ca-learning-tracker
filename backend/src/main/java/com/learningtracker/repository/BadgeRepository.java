package com.learningtracker.repository;

import com.learningtracker.entity.Badge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for {@link Badge} entity operations.
 */
@Repository
public interface BadgeRepository extends JpaRepository<Badge, UUID> {

    /**
     * Finds a badge by its unique name.
     *
     * @param name the badge name
     * @return an optional containing the badge if found
     */
    Optional<Badge> findByName(String name);
}
