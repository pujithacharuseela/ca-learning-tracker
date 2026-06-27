package com.learningtracker.controller;

import com.learningtracker.dto.request.UpdateSettingsRequest;
import com.learningtracker.dto.response.UserSettingsResponse;
import com.learningtracker.repository.UserRepository;
import com.learningtracker.security.SecurityUtils;
import com.learningtracker.service.UserSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final UserSettingsService userSettingsService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<UserSettingsResponse> getSettings() {
        UUID userId = getLoggedUserId();
        return ResponseEntity.ok(userSettingsService.getSettings(userId));
    }

    @PutMapping
    public ResponseEntity<UserSettingsResponse> updateSettings(@Valid @RequestBody UpdateSettingsRequest request) {
        UUID userId = getLoggedUserId();
        return ResponseEntity.ok(userSettingsService.updateSettings(userId, request));
    }

    private UUID getLoggedUserId() {
        String email = SecurityUtils.getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new com.learningtracker.exception.ResourceNotFoundException("User", "email", email))
                .getId();
    }
}
