package com.learningtracker.repository;

import com.learningtracker.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, UUID> {
    List<Schedule> findByUserIdAndScheduledDate(UUID userId, LocalDate date);
    List<Schedule> findByUserIdAndScheduledDateBetween(UUID userId, LocalDate start, LocalDate end);
    List<Schedule> findByPlanId(UUID planId);
    boolean existsByUserIdAndLearningClassIdAndScheduledDate(UUID userId, UUID classId, LocalDate date);
    
    List<Schedule> findByUserIdAndStatus(UUID userId, com.learningtracker.constant.enums.StudyStatus status);

    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.user.id = :userId")
    long countByUserId(@Param("userId") UUID userId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM Schedule s WHERE s.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM Schedule s WHERE s.plan.id = :planId")
    void deleteByPlanId(@Param("planId") UUID planId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Schedule s SET s.status = :status WHERE s.id = :scheduleId")
    void updateStatusById(@Param("scheduleId") UUID scheduleId, @Param("status") com.learningtracker.constant.enums.StudyStatus status);
}
