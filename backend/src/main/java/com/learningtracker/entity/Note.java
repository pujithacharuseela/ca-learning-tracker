package com.learningtracker.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * User notes associated with a specific study session.
 */
@Entity
@Table(name = "notes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Note extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_session_id", nullable = false)
    private StudySession studySession;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;
}
