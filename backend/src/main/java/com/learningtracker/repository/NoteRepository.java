package com.learningtracker.repository;

import com.learningtracker.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for {@link Note} entity operations.
 */
@Repository
public interface NoteRepository extends JpaRepository<Note, UUID> {

    /**
     * Retrieves all notes for a specific study session.
     *
     * @param studySessionId the study session's UUID
     * @return list of notes
     */
    List<Note> findByStudySessionId(UUID studySessionId);

    /** Delete notes linked to sessions of a specific schedule */
    @Modifying
    @Query("DELETE FROM Note n WHERE n.studySession.id IN (SELECT ss.id FROM StudySession ss WHERE ss.schedule.id = :scheduleId)")
    void deleteByScheduleId(@Param("scheduleId") UUID scheduleId);

    /** Delete notes linked to sessions of schedules in a specific plan */
    @Modifying
    @Query("DELETE FROM Note n WHERE n.studySession.id IN (SELECT ss.id FROM StudySession ss WHERE ss.schedule.id IN (SELECT sc.id FROM Schedule sc WHERE sc.plan.id = :planId))")
    void deleteByPlanId(@Param("planId") UUID planId);

    @Modifying
    @Query("DELETE FROM Note n WHERE n.studySession.id IN (SELECT ss.id FROM StudySession ss WHERE ss.user.id = :userId)")
    void deleteByUserId(@Param("userId") UUID userId);
}
