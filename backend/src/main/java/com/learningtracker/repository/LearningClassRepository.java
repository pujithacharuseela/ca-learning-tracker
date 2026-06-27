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

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM LearningClass lc WHERE lc.user.id = :userId")
    void deleteByUserId(@org.springframework.data.repository.query.Param("userId") UUID userId);
}
