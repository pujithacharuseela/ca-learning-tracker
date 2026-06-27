package com.learningtracker.controller;

import com.learningtracker.dto.request.ChangePasswordRequest;
import com.learningtracker.dto.request.UpdateProfileRequest;
import com.learningtracker.dto.response.MessageResponse;
import com.learningtracker.dto.response.UserResponse;
import com.learningtracker.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<UserResponse> getCurrentUser() {
        return ResponseEntity.ok(userService.getCurrentUser());
    }

    @PutMapping
    public ResponseEntity<UserResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(request));
    }

    @PutMapping("/change-password")
    public ResponseEntity<MessageResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ResponseEntity.ok(new MessageResponse("Password updated successfully.", true));
    }

    @PutMapping("/picture")
    public ResponseEntity<UserResponse> updateProfilePicture(@RequestBody java.util.Map<String, String> body) {
        String base64Image = body.get("profilePicture");
        return ResponseEntity.ok(userService.updateProfilePicture(base64Image));
    }
}
