package com.learningtracker.repository;

import com.learningtracker.entity.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, UUID> {
    List<StudySession> findByScheduleId(UUID scheduleId);
    long countByUserIdAndStatus(UUID userId, com.learningtracker.constant.enums.StudyStatus status);

    @Query("SELECT SUM(s.actualDurationMinutes) FROM StudySession s WHERE s.user.id = :userId AND s.status = 'COMPLETED'")
    Integer sumActualDurationMinutesByUserId(@Param("userId") UUID userId);

    List<StudySession> findByUserIdAndCompletedAtBetween(UUID userId, LocalDateTime start, LocalDateTime end);

    @Modifying
    @Query("DELETE FROM StudySession s WHERE s.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);

    /** Delete all study sessions linked to a specific schedule (for plan/schedule deletion) */
    @Modifying
    @Query("DELETE FROM StudySession s WHERE s.schedule.id = :scheduleId")
    void deleteByScheduleId(@Param("scheduleId") UUID scheduleId);

    /** Delete all study sessions linked to schedules of a specific plan */
    @Modifying
    @Query("DELETE FROM StudySession s WHERE s.schedule.id IN (SELECT sc.id FROM Schedule sc WHERE sc.plan.id = :planId)")
    void deleteByPlanId(@Param("planId") UUID planId);
}
