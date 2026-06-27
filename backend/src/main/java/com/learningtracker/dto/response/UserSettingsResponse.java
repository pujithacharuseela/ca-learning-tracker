package com.learningtracker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSettingsResponse {
    private UUID id;
    private String timezone;
    private String reminderTime;
    private com.learningtracker.constant.enums.Theme theme;
    private boolean emailNotifications;
    private boolean dailyReminder;
    private boolean weeklySummary;
    private boolean achievementAlerts;
}
