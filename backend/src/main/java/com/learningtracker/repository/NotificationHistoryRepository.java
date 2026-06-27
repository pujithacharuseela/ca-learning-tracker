package com.learningtracker.repository;

import com.learningtracker.entity.NotificationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for {@link NotificationHistory} entity operations.
 */
@Repository
public interface NotificationHistoryRepository extends JpaRepository<NotificationHistory, UUID> {

    /**
     * Retrieves notification history for a user, ordered by most recent first.
     *
     * @param userId the user's UUID
     * @return list of notification history entries
     */
    List<NotificationHistory> findByUserIdOrderBySentAtDesc(UUID userId);
}
