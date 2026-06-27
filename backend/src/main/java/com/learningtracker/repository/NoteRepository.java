package com.learningtracker.repository;

import com.learningtracker.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
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

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM Note n WHERE n.user.id = :userId")
    void deleteByUserId(@org.springframework.data.repository.query.Param("userId") UUID userId);
}
