package com.learningtracker.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompleteSessionRequest {

    @Min(value = 1, message = "Difficulty rating must be at least 1")
    @Max(value = 5, message = "Difficulty rating cannot exceed 5")
    private int difficultyRating;

    @Min(value = 1, message = "Overall rating must be at least 1")
    @Max(value = 5, message = "Overall rating cannot exceed 5")
    private int overallRating;

    private String notes;

    @NotNull(message = "Status is mandatory")
    private com.learningtracker.constant.enums.StudyStatus status;
}
