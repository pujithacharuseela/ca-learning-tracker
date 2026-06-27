package com.learningtracker.entity;

import com.learningtracker.constant.enums.StudyStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Represents a scheduled study session for a specific class on a specific date.
 * Enforces uniqueness per user, class, and date combination.
 */
@Entity
@Table(name = "schedules", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "class_id", "scheduled_date"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Schedule extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private LearningPlan plan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private LearningClass learningClass;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private StudyStatus status = StudyStatus.NOT_STARTED;

    @Column(name = "sort_order")
    private int sortOrder;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
