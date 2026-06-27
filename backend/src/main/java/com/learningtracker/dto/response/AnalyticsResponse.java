package com.learningtracker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {
    private long totalHoursStudied;
    private long totalSessionsCompleted;
    private double averageDifficulty;
    private double averageRating;
    private List<DailyStudyMetric> studyTimeTrend;
    private Map<String, Long> statusDistribution;
    private List<SubjectMetric> topicDistribution;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyStudyMetric {
        private String date; // ISO Format
        private long minutes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubjectMetric {
        private String topic;
        private long minutesStudied;
        private long sessionsCount;
    }
}
