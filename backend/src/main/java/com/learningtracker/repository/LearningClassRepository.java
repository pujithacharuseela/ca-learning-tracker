package com.learningtracker.repository;

import com.learningtracker.entity.LearningClass;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface LearningClassRepository extends JpaRepository<LearningClass, UUID> {
    Page<LearningClass> findByUserId(UUID userId, Pageable pageable);
    Page<LearningClass> findByUserIdAndTopicContainingIgnoreCase(UUID userId, String topic, Pageable pageable);
    Page<LearningClass> findByUserIdAndSubjectId(UUID userId, UUID subjectId, Pageable pageable);
    Page<LearningClass> findByUserIdAndSubjectIdAndTopicContainingIgnoreCase(UUID userId, UUID subjectId, String topic, Pageable pageable);
    Optional<LearningClass> findByUserIdAndClassNo(UUID userId, int classNo);
    boolean existsByUserIdAndClassNo(UUID userId, int classNo);
    boolean existsByUserIdAndSubjectIdAndClassNo(UUID userId, UUID subjectId, int classNo);
    long countByUserId(UUID userId);

    // All
    @org.springframework.data.jpa.repository.Query("SELECT lc FROM LearningClass lc WHERE lc.user.id = :userId " +
           "AND (:search IS NULL OR :search = '' OR LOWER(lc.topic) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<LearningClass> findAllWithSearch(
        @org.springframework.data.repository.query.Param("userId") UUID userId,
        @org.springframework.data.repository.query.Param("search") String search,
        Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT lc FROM LearningClass lc WHERE lc.user.id = :userId AND lc.subject.id = :subjectId " +
           "AND (:search IS NULL OR :search = '' OR LOWER(lc.topic) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<LearningClass> findAllWithSearchAndSubject(
        @org.springframework.data.repository.query.Param("userId") UUID userId,
        @org.springframework.data.repository.query.Param("subjectId") UUID subjectId,
        @org.springframework.data.repository.query.Param("search") String search,
        Pageable pageable);

    // Planned
    @org.springframework.data.jpa.repository.Query("SELECT lc FROM LearningClass lc WHERE lc.user.id = :userId " +
           "AND (:search IS NULL OR :search = '' OR LOWER(lc.topic) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND EXISTS (SELECT s FROM Schedule s WHERE s.learningClass.id = lc.id)")
    Page<LearningClass> findPlannedWithSearch(
        @org.springframework.data.repository.query.Param("userId") UUID userId,
        @org.springframework.data.repository.query.Param("search") String search,
        Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT lc FROM LearningClass lc WHERE lc.user.id = :userId AND lc.subject.id = :subjectId " +
           "AND (:search IS NULL OR :search = '' OR LOWER(lc.topic) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND EXISTS (SELECT s FROM Schedule s WHERE s.learningClass.id = lc.id)")
    Page<LearningClass> findPlannedWithSearchAndSubject(
        @org.springframework.data.repository.query.Param("userId") UUID userId,
        @org.springframework.data.repository.query.Param("subjectId") UUID subjectId,
        @org.springframework.data.repository.query.Param("search") String search,
        Pageable pageable);

    // Unplanned
    @org.springframework.data.jpa.repository.Query("SELECT lc FROM LearningClass lc WHERE lc.user.id = :userId " +
           "AND lc.isActive = true " +
           "AND (:search IS NULL OR :search = '' OR LOWER(lc.topic) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND NOT EXISTS (SELECT s FROM Schedule s WHERE s.learningClass.id = lc.id)")
    Page<LearningClass> findUnplannedWithSearch(
        @org.springframework.data.repository.query.Param("userId") UUID userId,
        @org.springframework.data.repository.query.Param("search") String search,
        Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT lc FROM LearningClass lc WHERE lc.user.id = :userId AND lc.subject.id = :subjectId " +
           "AND lc.isActive = true " +
           "AND (:search IS NULL OR :search = '' OR LOWER(lc.topic) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND NOT EXISTS (SELECT s FROM Schedule s WHERE s.learningClass.id = lc.id)")
    Page<LearningClass> findUnplannedWithSearchAndSubject(
        @org.springframework.data.repository.query.Param("userId") UUID userId,
        @org.springframework.data.repository.query.Param("subjectId") UUID subjectId,
        @org.springframework.data.repository.query.Param("search") String search,
        Pageable pageable);

    // Completed
    @org.springframework.data.jpa.repository.Query("SELECT lc FROM LearningClass lc WHERE lc.user.id = :userId " +
           "AND (:search IS NULL OR :search = '' OR LOWER(lc.topic) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND EXISTS (SELECT s FROM Schedule s WHERE s.learningClass.id = lc.id AND s.status = com.learningtracker.constant.enums.StudyStatus.COMPLETED)")
    Page<LearningClass> findCompletedWithSearch(
        @org.springframework.data.repository.query.Param("userId") UUID userId,
        @org.springframework.data.repository.query.Param("search") String search,
        Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT lc FROM LearningClass lc WHERE lc.user.id = :userId AND lc.subject.id = :subjectId " +
           "AND (:search IS NULL OR :search = '' OR LOWER(lc.topic) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND EXISTS (SELECT s FROM Schedule s WHERE s.learningClass.id = lc.id AND s.status = com.learningtracker.constant.enums.StudyStatus.COMPLETED)")
    Page<LearningClass> findCompletedWithSearchAndSubject(
        @org.springframework.data.repository.query.Param("userId") UUID userId,
        @org.springframework.data.repository.query.Param("subjectId") UUID subjectId,
        @org.springframework.data.repository.query.Param("search") String search,
        Pageable pageable);

    // Excluded
    @org.springframework.data.jpa.repository.Query("SELECT lc FROM LearningClass lc WHERE lc.user.id = :userId " +
           "AND lc.isActive = false " +
           "AND (:search IS NULL OR :search = '' OR LOWER(lc.topic) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<LearningClass> findExcludedWithSearch(
        @org.springframework.data.repository.query.Param("userId") UUID userId,
        @org.springframework.data.repository.query.Param("search") String search,
        Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT lc FROM LearningClass lc WHERE lc.user.id = :userId AND lc.subject.id = :subjectId " +
           "AND lc.isActive = false " +
           "AND (:search IS NULL OR :search = '' OR LOWER(lc.topic) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<LearningClass> findExcludedWithSearchAndSubject(
        @org.springframework.data.repository.query.Param("userId") UUID userId,
        @org.springframework.data.repository.query.Param("subjectId") UUID subjectId,
        @org.springframework.data.repository.query.Param("search") String search,
        Pageable pageable);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM LearningClass lc WHERE lc.user.id = :userId")
    void deleteByUserId(@org.springframework.data.repository.query.Param("userId") UUID userId);

    /** Delete classes for a specific user and subject */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM LearningClass lc WHERE lc.user.id = :userId AND lc.subject.id = :subjectId")
    void deleteByUserIdAndSubjectId(
        @org.springframework.data.repository.query.Param("userId") UUID userId,
        @org.springframework.data.repository.query.Param("subjectId") UUID subjectId);

    /** Count classes for a user linked to a specific uploaded file (for cleanup checks) */
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(lc) FROM LearningClass lc WHERE lc.user.id = :userId AND lc.uploadedFile.id = :fileId")
    long countByUserIdAndUploadedFileId(
        @org.springframework.data.repository.query.Param("userId") UUID userId,
        @org.springframework.data.repository.query.Param("fileId") UUID fileId);
}

