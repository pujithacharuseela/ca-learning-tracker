package com.learningtracker.entity;

import com.learningtracker.constant.enums.Theme;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

/**
 * User-specific application settings including timezone, theme, and notification preferences.
 */
@Entity
@Table(name = "user_settings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSettings extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "timezone", nullable = false, length = 50)
    @Builder.Default
    private String timezone = "UTC";

    @Column(name = "reminder_time", nullable = false)
    @Builder.Default
    private LocalTime reminderTime = LocalTime.of(9, 0);

    @Enumerated(EnumType.STRING)
    @Column(name = "theme", nullable = false, length = 10)
    @Builder.Default
    private Theme theme = Theme.SYSTEM;

    @Column(name = "email_notifications", nullable = false)
    @Builder.Default
    private boolean emailNotifications = true;

    @Column(name = "daily_reminder", nullable = false)
    @Builder.Default
    private boolean dailyReminder = true;

    @Column(name = "weekly_summary", nullable = false)
    @Builder.Default
    private boolean weeklySummary = true;

    @Column(name = "achievement_alerts", nullable = false)
    @Builder.Default
    private boolean achievementAlerts = true;
}
