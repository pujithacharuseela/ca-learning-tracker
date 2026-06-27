package com.learningtracker.repository;

import com.learningtracker.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for {@link AuditLog} entity operations.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    /**
     * Retrieves paginated audit logs for a user, ordered by most recent first.
     *
     * @param userId   the user's UUID
     * @param pageable pagination parameters
     * @return a page of audit logs
     */
    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
}
