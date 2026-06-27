package com.learningtracker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleResponse {
    private UUID id;
    private UUID planId;
    private UUID classId;
    private int classNo;
    private String topic;
    private int durationMinutes;
    private String durationDisplay;
    private LocalDate scheduledDate;
    private String status;
}
