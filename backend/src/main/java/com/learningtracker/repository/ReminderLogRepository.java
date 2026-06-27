package com.learningtracker.repository;

import com.learningtracker.entity.ReminderLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for {@link ReminderLog} entity operations.
 */
@Repository
public interface ReminderLogRepository extends JpaRepository<ReminderLog, UUID> {

    /**
     * Retrieves reminder logs for a user, ordered by most recent first.
     *
     * @param userId the user's UUID
     * @return list of reminder logs
     */
    List<ReminderLog> findByUserIdOrderBySentAtDesc(UUID userId);
}
