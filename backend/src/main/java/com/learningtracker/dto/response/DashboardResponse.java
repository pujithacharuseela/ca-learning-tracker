package com.learningtracker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private long currentStreak;
    private long longestStreak;
    private long completedClassesCount;
    private double completionPercentage;
    private long totalStudyHours;
    private List<ScheduleResponse> todayTasks;
    private List<ScheduleResponse> upcomingTasks;
    private List<BadgeResponse> recentBadges;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BadgeResponse {
        private String name;
        private String displayName;
        private String icon;
        private String description;
    }
}
