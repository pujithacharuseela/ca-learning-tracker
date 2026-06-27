package com.learningtracker.controller;

import com.learningtracker.entity.Badge;
import com.learningtracker.entity.User;
import com.learningtracker.entity.UserAchievement;
import com.learningtracker.exception.ResourceNotFoundException;
import com.learningtracker.repository.BadgeRepository;
import com.learningtracker.repository.UserAchievementRepository;
import com.learningtracker.repository.UserRepository;
import com.learningtracker.security.SecurityUtils;
import com.learningtracker.service.GamificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gamification")
@RequiredArgsConstructor
public class GamificationController {

    private final GamificationService gamificationService;
    private final UserAchievementRepository userAchievementRepository;
    private final BadgeRepository badgeRepository;
    private final UserRepository userRepository;

    @GetMapping("/badges")
    public ResponseEntity<List<Badge>> getAvailableBadges() {
        return ResponseEntity.ok(badgeRepository.findAll());
    }

    @GetMapping("/achievements")
    public ResponseEntity<List<UserAchievement>> getEarnedAchievements() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return ResponseEntity.ok(userAchievementRepository.findByUserId(user.getId()));
    }

    @GetMapping("/streak")
    public ResponseEntity<Map<String, Long>> getStreak() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        
        long streak = gamificationService.calculateStreak(user.getId());
        Map<String, Long> response = new HashMap<>();
        response.put("currentStreak", streak);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/evaluate")
    public ResponseEntity<List<UserAchievement>> evaluateEarned() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return ResponseEntity.ok(gamificationService.evaluateAchievements(user));
    }
}
