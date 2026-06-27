package com.learningtracker.service;

import com.learningtracker.constant.enums.StudyStatus;
import com.learningtracker.dto.request.CompleteSessionRequest;
import com.learningtracker.dto.request.StartSessionRequest;
import com.learningtracker.dto.response.StudySessionResponse;
import com.learningtracker.entity.*;
import com.learningtracker.exception.InvalidOperationException;
import com.learningtracker.exception.ResourceNotFoundException;
import com.learningtracker.repository.*;
import com.learningtracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudySessionService {

    private final StudySessionRepository studySessionRepository;
    private final ScheduleRepository scheduleRepository;
    private final NoteRepository noteRepository;
    private final UserRepository userRepository;

    @Transactional
    public StudySessionResponse startSession(StartSessionRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Schedule schedule = scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Schedule", "id", request.getScheduleId()));

        if (schedule.getStatus() == StudyStatus.COMPLETED) {
            throw new InvalidOperationException("This class schedule is already marked as completed.");
        }

        // Start session
        schedule.setStatus(StudyStatus.IN_PROGRESS);
        scheduleRepository.save(schedule);

        StudySession session = new StudySession();
        session.setUser(user);
        session.setSchedule(schedule);
        session.setStatus(StudyStatus.IN_PROGRESS);
        session.setStartedAt(LocalDateTime.now());
        session.setActualDurationMinutes(0);
        session.setDifficultyRating(0);
        session.setOverallRating(0);

        StudySession saved = studySessionRepository.save(session);
        return mapToResponse(saved, null);
    }

    @Transactional
    public StudySessionResponse completeSession(UUID sessionId, CompleteSessionRequest request) {
        StudySession session = studySessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("StudySession", "id", sessionId));

        if (session.getStatus() == StudyStatus.COMPLETED) {
            throw new InvalidOperationException("This session has already been completed.");
        }

        Schedule schedule = session.getSchedule();
        schedule.setStatus(request.getStatus());
        if (request.getStatus() == StudyStatus.COMPLETED) {
            schedule.setCompletedAt(LocalDateTime.now());
        }
        scheduleRepository.save(schedule);

        session.setStatus(request.getStatus());
        session.setCompletedAt(LocalDateTime.now());
        session.setDifficultyRating(request.getDifficultyRating());
        session.setOverallRating(request.getOverallRating());
        
        long actualMinutes = Duration.between(session.getStartedAt(), session.getCompletedAt()).toMinutes();
        session.setActualDurationMinutes((int) Math.max(1, actualMinutes));
        StudySession saved = studySessionRepository.save(session);

        // Save Notes
        Note note = null;
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            note = new Note();
            note.setStudySession(saved);
            note.setContent(request.getNotes());
            note = noteRepository.save(note);
        }

        return mapToResponse(saved, note != null ? note.getContent() : null);
    }

    private StudySessionResponse mapToResponse(StudySession ss, String noteContent) {
        return StudySessionResponse.builder()
                .id(ss.getId())
                .scheduleId(ss.getSchedule().getId())
                .status(ss.getStatus().name())
                .actualDurationMinutes(ss.getActualDurationMinutes())
                .difficultyRating(ss.getDifficultyRating())
                .overallRating(ss.getOverallRating())
                .notes(noteContent)
                .startedAt(ss.getStartedAt())
                .completedAt(ss.getCompletedAt())
                .build();
    }
}
