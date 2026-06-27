package com.learningtracker.controller;

import com.learningtracker.dto.request.CompleteSessionRequest;
import com.learningtracker.dto.request.StartSessionRequest;
import com.learningtracker.dto.response.StudySessionResponse;
import com.learningtracker.service.StudySessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class StudySessionController {

    private final StudySessionService studySessionService;

    @PostMapping("/start")
    public ResponseEntity<StudySessionResponse> startSession(@Valid @RequestBody StartSessionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studySessionService.startSession(request));
    }

    @PutMapping("/{sessionId}/complete")
    public ResponseEntity<StudySessionResponse> completeSession(
            @PathVariable UUID sessionId,
            @Valid @RequestBody CompleteSessionRequest request) {
        return ResponseEntity.ok(studySessionService.completeSession(sessionId, request));
    }
}
