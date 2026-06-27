package com.learningtracker.service;

import com.learningtracker.constant.enums.BadgeType;
import com.learningtracker.constant.enums.StudyStatus;
import com.learningtracker.entity.*;
import com.learningtracker.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GamificationService {

    private final BadgeRepository badgeRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final StudySessionRepository studySessionRepository;
    private final ScheduleRepository scheduleRepository;

    @Transactional
    public List<UserAchievement> evaluateAchievements(User user) {
        List<UserAchievement> newAchievements = new ArrayList<>();

        // 1. Get Completed count
        long completedClasses = studySessionRepository.countByUserIdAndStatus(user.getId(), StudyStatus.COMPLETED);
        
        // 2. Fetch all configured badges
        List<Badge> allBadges = badgeRepository.findAll();
        List<Badge> userBadges = userAchievementRepository.findByUserId(user.getId()).stream()
                .map(UserAchievement::getBadge)
                .collect(Collectors.toList());

        for (Badge badge : allBadges) {
            if (userBadges.contains(badge)) {
                continue; // Already earned
            }

            boolean earned = false;
            
            if (badge.getName().equals(BadgeType.FIRST_COMPLETION.name())) {
                earned = completedClasses >= 1;
            } else if (badge.getName().equals(BadgeType.HUNDRED_CLASSES.name())) {
                earned = completedClasses >= 100;
            } else if (badge.getName().equals(BadgeType.CONSISTENCY_CHAMPION.name())) {
                // Consistency streak checked below
                earned = calculateStreak(user.getId()) >= 7;
            }

            if (earned) {
                UserAchievement ach = new UserAchievement();
                ach.setUser(user);
                ach.setBadge(badge);
                ach.setEarnedAt(LocalDateTime.now());
                newAchievements.add(userAchievementRepository.save(ach));
                log.info("User {} earned badge: {}", user.getEmail(), badge.getDisplayName());
            }
        }

        return newAchievements;
    }

    public long calculateStreak(UUID userId) {
        // Calculate consecutive daily study completions
        List<Schedule> completedSchedules = scheduleRepository.findByUserIdAndStatus(userId, StudyStatus.COMPLETED);
        if (completedSchedules.isEmpty()) {
            return 0;
        }

        Set<LocalDate> completedDates = completedSchedules.stream()
                .map(s -> s.getCompletedAt() != null ? s.getCompletedAt().toLocalDate() : s.getScheduledDate())
                .collect(Collectors.toSet());

        long streak = 0;
        LocalDate checkDate = LocalDate.now();

        // If today has no completion, check if yesterday did to keep streak alive
        if (!completedDates.contains(checkDate)) {
            checkDate = checkDate.minusDays(1);
        }

        while (completedDates.contains(checkDate)) {
            streak++;
            checkDate = checkDate.minusDays(1);
        }

        return streak;
    }
}
