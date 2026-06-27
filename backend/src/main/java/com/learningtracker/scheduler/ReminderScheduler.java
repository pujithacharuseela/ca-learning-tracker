package com.learningtracker.scheduler;

import com.learningtracker.constant.enums.StudyStatus;
import com.learningtracker.entity.*;
import com.learningtracker.repository.*;
import com.learningtracker.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReminderScheduler {

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final ScheduleRepository scheduleRepository;
    private final EmailService emailService;

    // Runs every 10 minutes to scan for pending classes due in 3 hours, 1 hour, or 30 minutes
    @Scheduled(cron = "0 */10 * * * *")
    public void scanAndSendDeadlineReminders() {
        log.info("ReminderScheduler: Scanning for pending class reminders...");
        List<User> users = userRepository.findAll();
        LocalDate today = LocalDate.now();

        for (User user : users) {
            UserSettings settings = userSettingsRepository.findByUserId(user.getId()).orElse(null);
            if (settings == null || !settings.isEmailNotifications() || !settings.isDailyReminder()) {
                continue;
            }

            LocalTime reminderTime = settings.getReminderTime();
            ZoneId zoneId = ZoneId.of(settings.getTimezone() != null ? settings.getTimezone() : "UTC");
            
            ZonedDateTime nowUser = ZonedDateTime.now(zoneId);
            ZonedDateTime targetDeadline = today.atTime(reminderTime).atZone(zoneId);

            long diffMinutes = ChronoUnit.MINUTES.between(nowUser, targetDeadline);

            List<Schedule> schedules = scheduleRepository.findByUserIdAndScheduledDate(user.getId(), today);
            for (Schedule task : schedules) {
                if (task.getStatus() != StudyStatus.COMPLETED) {
                    if (diffMinutes > 0) {
                        if (diffMinutes <= 180 && diffMinutes > 170) {
                            emailService.sendDeadlineReminderEmail(user, task.getLearningClass().getTopic(), "3 hours", task.getLearningClass().getDurationDisplay());
                        } else if (diffMinutes <= 60 && diffMinutes > 50) {
                            emailService.sendDeadlineReminderEmail(user, task.getLearningClass().getTopic(), "1 hour", task.getLearningClass().getDurationDisplay());
                        } else if (diffMinutes <= 30 && diffMinutes > 20) {
                            emailService.sendDeadlineReminderEmail(user, task.getLearningClass().getTopic(), "30 minutes", task.getLearningClass().getDurationDisplay());
                        }
                    }
                }
            }
        }
    }

    // Runs daily at 10 PM to send streak break warning emails
    @Scheduled(cron = "0 0 22 * * *")
    public void sendStreakWarnings() {
        log.info("ReminderScheduler: Checking for streak break warnings...");
        List<User> users = userRepository.findAll();
        LocalDate today = LocalDate.now();

        for (User user : users) {
            UserSettings settings = userSettingsRepository.findByUserId(user.getId()).orElse(null);
            if (settings == null || !settings.isEmailNotifications()) {
                continue;
            }

            List<Schedule> schedules = scheduleRepository.findByUserIdAndScheduledDate(user.getId(), today);
            boolean hasPending = schedules.stream().anyMatch(task -> task.getStatus() != StudyStatus.COMPLETED);

            if (hasPending) {
                emailService.sendStreakAlertEmail(user, "WARNING");
            }
        }
    }
}
