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
    Optional<LearningClass> findByUserIdAndClassNo(UUID userId, int classNo);
    boolean existsByUserIdAndClassNo(UUID userId, int classNo);
    long countByUserId(UUID userId);
    void deleteByUserId(UUID userId);
}
