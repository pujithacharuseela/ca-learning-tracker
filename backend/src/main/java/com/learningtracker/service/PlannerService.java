package com.learningtracker.service;

import com.learningtracker.constant.enums.PlanStatus;
import com.learningtracker.constant.enums.StudyStatus;
import com.learningtracker.dto.request.PlanAssignmentRequest;
import com.learningtracker.dto.response.PlanResponse;
import com.learningtracker.dto.response.ScheduleResponse;
import com.learningtracker.entity.*;
import com.learningtracker.exception.InvalidOperationException;
import com.learningtracker.exception.ResourceNotFoundException;
import com.learningtracker.repository.*;
import com.learningtracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlannerService {

    private final LearningPlanRepository learningPlanRepository;
    private final ScheduleRepository scheduleRepository;
    private final LearningClassRepository learningClassRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final StudySessionRepository studySessionRepository;
    private final NoteRepository noteRepository;
    private final EmailService emailService;

    @Transactional
    public PlanResponse createPlan(PlanAssignmentRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new InvalidOperationException("Start date cannot be after end date.");
        }

        long daysBetween = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1;
        List<UUID> classIds = request.getClassIds();

        if (classIds.size() > daysBetween * 3) {
            throw new InvalidOperationException("The schedule contains too many classes for the selected date range.");
        }

        LearningPlan plan = new LearningPlan();
        plan.setUser(user);
        plan.setName(request.getName());
        plan.setDescription(request.getDescription());
        plan.setStartDate(request.getStartDate());
        plan.setEndDate(request.getEndDate());
        plan.setStatus(PlanStatus.ACTIVE);
        if (request.getSubjectId() != null) {
            subjectRepository.findById(request.getSubjectId()).ifPresent(plan::setSubject);
        }
        plan = learningPlanRepository.save(plan);

        distributeClasses(user, plan, classIds, request.getStartDate(), request.getEndDate());

        List<LearningClass> selectedClasses = learningClassRepository.findAllById(classIds);

        try {
            emailService.sendPlanScheduledEmail(
                user,
                plan.getName(),
                plan.getStartDate().toString(),
                plan.getEndDate().toString(),
                plan.getSubject() != null ? plan.getSubject().getName() : null,
                selectedClasses
            );
        } catch (Exception e) {
            // Log warning but don't fail plan creation if email fails
            log.warn("Failed to send plan scheduled email: {}", e.getMessage());
        }

        return mapToPlanResponse(plan);
    }

    @Transactional
    public PlanResponse updatePlan(UUID planId, String name, String description, java.time.LocalDate startDate, java.time.LocalDate endDate, UUID subjectId) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        LearningPlan plan = learningPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("LearningPlan", "id", planId));

        if (!plan.getUser().getId().equals(user.getId())) {
            throw new InvalidOperationException("You do not have permission to update this plan.");
        }

        if (name != null && !name.isBlank()) plan.setName(name);
        if (description != null) plan.setDescription(description);
        if (startDate != null) plan.setStartDate(startDate);
        if (endDate != null) plan.setEndDate(endDate);
        if (subjectId != null) {
            subjectRepository.findById(subjectId).ifPresent(plan::setSubject);
        }
        plan = learningPlanRepository.save(plan);
        return mapToPlanResponse(plan);
    }

    /**
     * Deletes a plan and ALL its associated data in correct order:
     * notes -> study_sessions -> schedules -> plan
     * This prevents FK constraint violations.
     */
    @Transactional
    public void deletePlan(UUID planId) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        LearningPlan plan = learningPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("LearningPlan", "id", planId));

        if (!plan.getUser().getId().equals(user.getId())) {
            throw new InvalidOperationException("You do not have permission to delete this plan.");
        }

        // Delete in correct FK order: notes -> study_sessions -> schedules -> plan
        noteRepository.deleteByPlanId(planId);
        studySessionRepository.deleteByPlanId(planId);
        scheduleRepository.deleteByPlanId(planId);
        learningPlanRepository.delete(plan);
        log.info("Deleted plan {} and all associated data for user {}", planId, user.getId());
    }

    @Transactional
    public ScheduleResponse completeSchedule(UUID scheduleId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule", "id", scheduleId));

        StudyStatus newStatus = schedule.getStatus() == StudyStatus.COMPLETED
                ? StudyStatus.NOT_STARTED
                : StudyStatus.COMPLETED;

        schedule.setStatus(newStatus);
        schedule.setCompletedAt(newStatus == StudyStatus.COMPLETED ? java.time.LocalDateTime.now() : null);
        scheduleRepository.save(schedule);

        if (newStatus == StudyStatus.COMPLETED) {
            // Use efficient repository query instead of findAll()
            List<StudySession> existing = studySessionRepository.findByScheduleId(scheduleId);
            if (existing.isEmpty()) {
                StudySession session = new StudySession();
                session.setUser(schedule.getUser());
                session.setSchedule(schedule);
                session.setStatus(StudyStatus.COMPLETED);
                session.setActualDurationMinutes(schedule.getLearningClass().getDurationMinutes());
                session.setDifficultyRating(3);
                session.setOverallRating(4);
                session.setStartedAt(java.time.LocalDateTime.now().minusMinutes(schedule.getLearningClass().getDurationMinutes()));
                session.setCompletedAt(java.time.LocalDateTime.now());
                studySessionRepository.save(session);
            }
        } else {
            // Uncomplete: delete associated sessions in correct FK order (notes -> sessions)
            List<StudySession> sessions = studySessionRepository.findByScheduleId(scheduleId);
            for (StudySession ss : sessions) {
                List<com.learningtracker.entity.Note> notes = noteRepository.findByStudySessionId(ss.getId());
                noteRepository.deleteAll(notes);
                studySessionRepository.delete(ss);
            }
        }

        return mapToScheduleResponse(schedule);
    }

    @Transactional(readOnly = true)
    public List<PlanResponse> getPlans() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return learningPlanRepository.findByUserId(user.getId()).stream()
                .map(this::mapToPlanResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> getSchedulesForPlan(UUID planId) {
        learningPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("LearningPlan", "id", planId));
        return scheduleRepository.findByPlanId(planId).stream()
                .map(this::mapToScheduleResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> getDailySchedule(LocalDate date) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return scheduleRepository.findByUserIdAndScheduledDate(user.getId(), date).stream()
                .map(this::mapToScheduleResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Set<UUID> getPlannedClassIds() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return learningPlanRepository.findByUserId(user.getId()).stream()
                .flatMap(plan -> scheduleRepository.findByPlanId(plan.getId()).stream())
                .map(sc -> sc.getLearningClass().getId())
                .collect(Collectors.toSet());
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> getAllSchedules() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return learningPlanRepository.findByUserId(user.getId()).stream()
                .flatMap(plan -> scheduleRepository.findByPlanId(plan.getId()).stream())
                .map(this::mapToScheduleResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ScheduleResponse rescheduleClass(UUID scheduleId, LocalDate newDate) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule", "id", scheduleId));

        if (newDate.isBefore(LocalDate.now())) {
            throw new InvalidOperationException("Cannot reschedule to a past date.");
        }

        schedule.setScheduledDate(newDate);
        Schedule updated = scheduleRepository.save(schedule);
        return mapToScheduleResponse(updated);
    }

    @Transactional(readOnly = true)
    public Page<LearningClass> getAvailableClasses(String search, UUID subjectId, String status, Pageable pageable) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        String finalStatus = (status == null || status.isBlank()) ? "all" : status.toLowerCase().trim();
        UUID userId = user.getId();

        switch (finalStatus) {
            case "planned":
                return (subjectId != null)
                        ? learningClassRepository.findPlannedWithSearchAndSubject(userId, subjectId, search, pageable)
                        : learningClassRepository.findPlannedWithSearch(userId, search, pageable);
            case "unplanned":
                return (subjectId != null)
                        ? learningClassRepository.findUnplannedWithSearchAndSubject(userId, subjectId, search, pageable)
                        : learningClassRepository.findUnplannedWithSearch(userId, search, pageable);
            case "completed":
                return (subjectId != null)
                        ? learningClassRepository.findCompletedWithSearchAndSubject(userId, subjectId, search, pageable)
                        : learningClassRepository.findCompletedWithSearch(userId, search, pageable);
            case "excluded":
                return (subjectId != null)
                        ? learningClassRepository.findExcludedWithSearchAndSubject(userId, subjectId, search, pageable)
                        : learningClassRepository.findExcludedWithSearch(userId, search, pageable);
            default:
                return (subjectId != null)
                        ? learningClassRepository.findAllWithSearchAndSubject(userId, subjectId, search, pageable)
                        : learningClassRepository.findAllWithSearch(userId, search, pageable);
        }
    }

    private void distributeClasses(User user, LearningPlan plan, List<UUID> classIds, LocalDate start, LocalDate end) {
        long totalDays = ChronoUnit.DAYS.between(start, end) + 1;
        List<LearningClass> classes = learningClassRepository.findAllById(classIds);

        int classIndex = 0;
        int totalClasses = classes.size();

        for (int day = 0; day < totalDays && classIndex < totalClasses; day++) {
            LocalDate currentDate = start.plusDays(day);
            int classesForToday = (int) Math.ceil((double) (totalClasses - classIndex) / (totalDays - day));

            for (int i = 0; i < classesForToday && classIndex < totalClasses; i++) {
                LearningClass cl = classes.get(classIndex++);
                if (!scheduleRepository.existsByUserIdAndLearningClassIdAndScheduledDate(user.getId(), cl.getId(), currentDate)) {
                    Schedule schedule = new Schedule();
                    schedule.setUser(user);
                    schedule.setPlan(plan);
                    schedule.setLearningClass(cl);
                    schedule.setScheduledDate(currentDate);
                    schedule.setStatus(StudyStatus.NOT_STARTED);
                    schedule.setSortOrder(i);
                    scheduleRepository.save(schedule);
                }
            }
        }
    }

    private PlanResponse mapToPlanResponse(LearningPlan plan) {
        PlanResponse.PlanResponseBuilder builder = PlanResponse.builder()
                .id(plan.getId())
                .name(plan.getName())
                .description(plan.getDescription())
                .startDate(plan.getStartDate())
                .endDate(plan.getEndDate())
                .status(plan.getStatus())
                .createdAt(plan.getCreatedAt());
        if (plan.getSubject() != null) {
            builder.subjectId(plan.getSubject().getId())
                    .subjectName(plan.getSubject().getName())
                    .subjectColor(plan.getSubject().getColor());
        }
        return builder.build();
    }

    private ScheduleResponse mapToScheduleResponse(Schedule sc) {
        LearningPlan plan = sc.getPlan();
        if (plan == null) {
            log.warn("Schedule {} has no associated plan — skipping", sc.getId());
            return ScheduleResponse.builder()
                    .id(sc.getId())
                    .classId(sc.getLearningClass().getId())
                    .classNo(sc.getLearningClass().getClassNo())
                    .topic(sc.getLearningClass().getTopic())
                    .durationMinutes(sc.getLearningClass().getDurationMinutes())
                    .durationDisplay(sc.getLearningClass().getDurationDisplay())
                    .scheduledDate(sc.getScheduledDate())
                    .status(sc.getStatus().name())
                    .build();
        }
        String color = (plan.getSubject() != null) ? plan.getSubject().getColor() : "#8b5cf6";
        return ScheduleResponse.builder()
                .id(sc.getId())
                .planId(plan.getId())
                .planName(plan.getName())
                .planColor(color)
                .classId(sc.getLearningClass().getId())
                .classNo(sc.getLearningClass().getClassNo())
                .topic(sc.getLearningClass().getTopic())
                .durationMinutes(sc.getLearningClass().getDurationMinutes())
                .durationDisplay(sc.getLearningClass().getDurationDisplay())
                .scheduledDate(sc.getScheduledDate())
                .status(sc.getStatus().name())
                .build();
     }

    @Transactional
    public LearningClass toggleClassActive(UUID classId) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        LearningClass cl = learningClassRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("LearningClass", "id", classId));

        if (!cl.getUser().getId().equals(user.getId())) {
            throw new InvalidOperationException("You do not have permission to modify this lecture.");
        }

        cl.setActive(!cl.isActive());
        return learningClassRepository.save(cl);
    }

    @Transactional
    public int activateAllClasses() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return learningClassRepository.activateAllByUserId(user.getId());
    }
}
