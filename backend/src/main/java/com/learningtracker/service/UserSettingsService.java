package com.learningtracker.service;

import com.learningtracker.dto.request.UpdateSettingsRequest;
import com.learningtracker.dto.response.UserSettingsResponse;
import com.learningtracker.entity.UserSettings;
import com.learningtracker.exception.ResourceNotFoundException;
import com.learningtracker.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserSettingsService {

    private final UserSettingsRepository userSettingsRepository;

    public UserSettingsResponse getSettings(UUID userId) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("UserSettings", "userId", userId));
        return mapToResponse(settings);
    }

    @Transactional
    public UserSettingsResponse updateSettings(UUID userId, UpdateSettingsRequest request) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("UserSettings", "userId", userId));

        if (request.getTimezone() != null) {
            settings.setTimezone(request.getTimezone());
        }
        if (request.getReminderTime() != null) {
            settings.setReminderTime(LocalTime.parse(request.getReminderTime(), DateTimeFormatter.ofPattern("HH:mm")));
        }
        if (request.getTheme() != null) {
            settings.setTheme(request.getTheme());
        }
        if (request.getEmailNotifications() != null) {
            settings.setEmailNotifications(request.getEmailNotifications());
        }
        if (request.getDailyReminder() != null) {
            settings.setDailyReminder(request.getDailyReminder());
        }
        if (request.getWeeklySummary() != null) {
            settings.setWeeklySummary(request.getWeeklySummary());
        }
        if (request.getAchievementAlerts() != null) {
            settings.setAchievementAlerts(request.getAchievementAlerts());
        }

        UserSettings updated = userSettingsRepository.save(settings);
        return mapToResponse(updated);
    }

    public UserSettingsResponse mapToResponse(UserSettings settings) {
        return UserSettingsResponse.builder()
                .id(settings.getId())
                .timezone(settings.getTimezone())
                .reminderTime(settings.getReminderTime().format(DateTimeFormatter.ofPattern("HH:mm")))
                .theme(settings.getTheme())
                .emailNotifications(settings.isEmailNotifications())
                .dailyReminder(settings.isDailyReminder())
                .weeklySummary(settings.isWeeklySummary())
                .achievementAlerts(settings.isAchievementAlerts())
                .build();
    }
}
