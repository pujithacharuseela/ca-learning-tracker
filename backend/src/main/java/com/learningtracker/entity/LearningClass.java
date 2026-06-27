package com.learningtracker.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Represents an individual learning class/lesson within the user's curriculum.
 * Each class has a unique class number per user.
 */
@Entity
@Table(name = "learning_classes", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "class_no"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearningClass extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_file_id")
    private UploadedFile uploadedFile;

    @Column(name = "class_no", nullable = false)
    private int classNo;

    @Column(name = "topic", nullable = false, length = 500)
    private String topic;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Column(name = "duration_display", length = 50)
    private String durationDisplay;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
