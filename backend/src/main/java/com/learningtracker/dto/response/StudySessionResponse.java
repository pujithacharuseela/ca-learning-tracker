package com.learningtracker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudySessionResponse {
    private UUID id;
    private UUID scheduleId;
    private String status;
    private int actualDurationMinutes;
    private int difficultyRating;
    private int overallRating;
    private String notes;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}
