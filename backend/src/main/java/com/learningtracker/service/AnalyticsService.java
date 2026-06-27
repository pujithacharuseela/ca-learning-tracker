package com.learningtracker.service;

import com.learningtracker.constant.enums.StudyStatus;
import com.learningtracker.dto.response.AnalyticsResponse;
import com.learningtracker.entity.StudySession;
import com.learningtracker.entity.User;
import com.learningtracker.exception.ResourceNotFoundException;
import com.learningtracker.repository.ScheduleRepository;
import com.learningtracker.repository.StudySessionRepository;
import com.learningtracker.repository.UserRepository;
import com.learningtracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final StudySessionRepository studySessionRepository;
    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;

    public AnalyticsResponse getAnalyticsData(LocalDate startDate, LocalDate endDate) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        // Get completed sessions in date range
        List<StudySession> sessions = studySessionRepository.findByUserIdAndCompletedAtBetween(
                user.getId(), startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay());

        long totalMinutes = sessions.stream().mapToLong(StudySession::getActualDurationMinutes).sum();
        long completedCount = sessions.size();

        double avgDifficulty = sessions.stream()
                .mapToInt(StudySession::getDifficultyRating)
                .filter(r -> r > 0)
                .average()
                .orElse(0.0);

        double avgRating = sessions.stream()
                .mapToInt(StudySession::getOverallRating)
                .filter(r -> r > 0)
                .average()
                .orElse(0.0);

        // Daily Study Trend
        Map<String, Long> dailyTrend = new TreeMap<>();
        for (LocalDate d = startDate; !d.isAfter(endDate); d = d.plusDays(1)) {
            dailyTrend.put(d.format(DateTimeFormatter.ISO_LOCAL_DATE), 0L);
        }

        sessions.forEach(s -> {
            String dateKey = s.getCompletedAt().toLocalDate().format(DateTimeFormatter.ISO_LOCAL_DATE);
            if (dailyTrend.containsKey(dateKey)) {
                dailyTrend.put(dateKey, dailyTrend.get(dateKey) + s.getActualDurationMinutes());
            }
        });

        List<AnalyticsResponse.DailyStudyMetric> trendList = dailyTrend.entrySet().stream()
                .map(e -> new AnalyticsResponse.DailyStudyMetric(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        // Status Distribution
        Map<String, Long> statusMap = new HashMap<>();
        for (StudyStatus s : StudyStatus.values()) {
            statusMap.put(s.name(), 0L);
        }
        scheduleRepository.findByUserIdAndScheduledDateBetween(user.getId(), startDate, endDate)
                .forEach(sc -> statusMap.put(sc.getStatus().name(), statusMap.getOrDefault(sc.getStatus().name(), 0L) + 1));

        // Topic distribution
        Map<String, List<StudySession>> topicGroup = sessions.stream()
                .collect(Collectors.groupingBy(s -> s.getSchedule().getLearningClass().getTopic()));

        List<AnalyticsResponse.SubjectMetric> topicMetrics = topicGroup.entrySet().stream()
                .map(e -> new AnalyticsResponse.SubjectMetric(
                        e.getKey(),
                        e.getValue().stream().mapToLong(StudySession::getActualDurationMinutes).sum(),
                        e.getValue().size()
                ))
                .collect(Collectors.toList());

        return AnalyticsResponse.builder()
                .totalHoursStudied(totalMinutes / 60)
                .totalSessionsCompleted(completedCount)
                .averageDifficulty(avgDifficulty)
                .averageRating(avgRating)
                .studyTimeTrend(trendList)
                .statusDistribution(statusMap)
                .topicDistribution(topicMetrics)
                .build();
    }
}
