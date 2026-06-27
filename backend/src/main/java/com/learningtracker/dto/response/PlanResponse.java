package com.learningtracker.dto.response;

import com.learningtracker.constant.enums.PlanStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanResponse {
    private UUID id;
    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private PlanStatus status;
    private LocalDateTime createdAt;
    // Subject info
    private UUID subjectId;
    private String subjectName;
    private String subjectColor;
}
