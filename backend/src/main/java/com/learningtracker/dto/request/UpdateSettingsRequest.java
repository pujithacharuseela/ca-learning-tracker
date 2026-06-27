package com.learningtracker.dto.request;

import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSettingsRequest {
    private String timezone;

    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Reminder time must be in HH:mm format")
    private String reminderTime;

    private com.learningtracker.constant.enums.Theme theme;
    private Boolean emailNotifications;
    private Boolean dailyReminder;
    private Boolean weeklySummary;
    private Boolean achievementAlerts;
}
