package com.learningtracker.repository;

import com.learningtracker.constant.enums.PlanStatus;
import com.learningtracker.entity.LearningPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for {@link LearningPlan} entity operations.
 */
@Repository
public interface LearningPlanRepository extends JpaRepository<LearningPlan, UUID> {

    /**
     * Retrieves all learning plans for a user.
     *
     * @param userId the user's UUID
     * @return list of learning plans
     */
    List<LearningPlan> findByUserId(UUID userId);

    /**
     * Retrieves learning plans for a user filtered by status.
     *
     * @param userId the user's UUID
     * @param status the plan status filter
     * @return list of matching learning plans
     */
    List<LearningPlan> findByUserIdAndStatus(UUID userId, PlanStatus status);
    void deleteByUserId(UUID userId);
}
