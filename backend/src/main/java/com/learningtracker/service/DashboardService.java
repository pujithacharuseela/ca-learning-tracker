package com.learningtracker.service;

import com.learningtracker.constant.enums.StudyStatus;
import com.learningtracker.dto.response.DashboardResponse;
import com.learningtracker.dto.response.ScheduleResponse;
import com.learningtracker.entity.*;
import com.learningtracker.exception.ResourceNotFoundException;
import com.learningtracker.repository.*;
import com.learningtracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final ScheduleRepository scheduleRepository;
    private final StudySessionRepository studySessionRepository;
    private final UserAchievementRepository userAchievementRepository;

    public DashboardResponse getDashboardData() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        LocalDate today = LocalDate.now();
        
        // 1. Get Scheduled Tasks
        List<Schedule> todaySchedules = scheduleRepository.findByUserIdAndScheduledDate(user.getId(), today);
        List<Schedule> upcomingSchedules = scheduleRepository.findByUserIdAndScheduledDateBetween(
                user.getId(), today.plusDays(1), today.plusDays(7));

        // 2. Calculations
        long completedCount = studySessionRepository.countByUserIdAndStatus(user.getId(), StudyStatus.COMPLETED);
        long totalCount = scheduleRepository.countByUserId(user.getId());
        double percentage = totalCount > 0 ? ((double) completedCount / totalCount) * 100 : 0.0;

        Integer totalMinutes = studySessionRepository.sumActualDurationMinutesByUserId(user.getId());
        long totalHours = totalMinutes != null ? totalMinutes / 60 : 0;

        // Streaks (Placeholder logic defaulting to mock tracker streaks for now)
        long currentStreak = completedCount > 0 ? 3 : 0;
        long longestStreak = completedCount > 0 ? 5 : 0;

        // Achievements
        List<DashboardResponse.BadgeResponse> badges = userAchievementRepository.findByUserId(user.getId()).stream()
                .map(ach -> DashboardResponse.BadgeResponse.builder()
                        .name(ach.getBadge().getName())
                        .displayName(ach.getBadge().getDisplayName())
                        .icon(ach.getBadge().getIcon())
                        .description(ach.getBadge().getDescription())
                        .build())
                .collect(Collectors.toList());

        return DashboardResponse.builder()
                .currentStreak(currentStreak)
                .longestStreak(longestStreak)
                .completedClassesCount(completedCount)
                .completionPercentage(percentage)
                .totalStudyHours(totalHours)
                .todayTasks(todaySchedules.stream().map(this::mapToScheduleResponse).collect(Collectors.toList()))
                .upcomingTasks(upcomingSchedules.stream().map(this::mapToScheduleResponse).collect(Collectors.toList()))
                .recentBadges(badges)
                .build();
    }

    private ScheduleResponse mapToScheduleResponse(Schedule sc) {
        return ScheduleResponse.builder()
                .id(sc.getId())
                .planId(sc.getPlan().getId())
                .classId(sc.getLearningClass().getId())
                .classNo(sc.getLearningClass().getClassNo())
                .topic(sc.getLearningClass().getTopic())
                .durationMinutes(sc.getLearningClass().getDurationMinutes())
                .durationDisplay(sc.getLearningClass().getDurationDisplay())
                .scheduledDate(sc.getScheduledDate())
                .status(sc.getStatus().name())
                .build();
    }
}
