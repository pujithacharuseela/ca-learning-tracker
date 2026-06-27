package com.learningtracker.repository;

import com.learningtracker.entity.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for {@link UserSettings} entity operations.
 */
@Repository
public interface UserSettingsRepository extends JpaRepository<UserSettings, UUID> {

    /**
     * Finds user settings by user ID.
     *
     * @param userId the user's UUID
     * @return an optional containing the settings if found
     */
    Optional<UserSettings> findByUserId(UUID userId);
}
