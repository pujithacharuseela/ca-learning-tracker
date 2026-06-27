package com.learningtracker.repository;

import com.learningtracker.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for {@link UserAchievement} entity operations.
 */
@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, UUID> {

    /**
     * Retrieves all achievements for a user.
     *
     * @param userId the user's UUID
     * @return list of user achievements
     */
    List<UserAchievement> findByUserId(UUID userId);

    /**
     * Checks if a user already has a specific badge.
     *
     * @param userId  the user's UUID
     * @param badgeId the badge's UUID
     * @return true if the user already earned the badge
     */
    boolean existsByUserIdAndBadgeId(UUID userId, UUID badgeId);
}
