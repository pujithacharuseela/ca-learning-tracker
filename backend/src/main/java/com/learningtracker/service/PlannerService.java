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

        if (classIds.size() > daysBetween * 3) { // Arbitrary sanity limit (max 3 classes per day)
            throw new InvalidOperationException("The schedule contains too many classes for the selected date range.");
        }

        LearningPlan plan = new LearningPlan();
        plan.setUser(user);
        plan.setName(request.getName());
        plan.setDescription(request.getDescription());
        plan.setStartDate(request.getStartDate());
        plan.setEndDate(request.getEndDate());
        plan.setStatus(PlanStatus.ACTIVE);
        plan = learningPlanRepository.save(plan);

        // Intelligent distribution of classes
        distributeClasses(user, plan, classIds, request.getStartDate(), request.getEndDate());

        return mapToPlanResponse(plan);
    }

    private void distributeClasses(User user, LearningPlan plan, List<UUID> classIds, LocalDate start, LocalDate end) {
        long totalDays = ChronoUnit.DAYS.between(start, end) + 1;
        List<LearningClass> classes = learningClassRepository.findAllById(classIds);

        int classIndex = 0;
        int totalClasses = classes.size();

        for (int day = 0; day < totalDays && classIndex < totalClasses; day++) {
            LocalDate currentDate = start.plusDays(day);
            
            // Calculate how many classes to assign to this specific day (even distribution)
            int classesForToday = (int) Math.ceil((double) (totalClasses - classIndex) / (totalDays - day));
            
            for (int i = 0; i < classesForToday && classIndex < totalClasses; i++) {
                LearningClass cl = classes.get(classIndex++);
                
                // Prevent duplicate assignment validation
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

    public List<PlanResponse> getPlans() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return learningPlanRepository.findByUserId(user.getId()).stream()
                .map(this::mapToPlanResponse)
                .collect(Collectors.toList());
    }

    public List<ScheduleResponse> getSchedulesForPlan(UUID planId) {
        LearningPlan plan = learningPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("LearningPlan", "id", planId));
        
        // Custom JPQL lookup mapping
        return scheduleRepository.findByPlanId(planId).stream()
                .map(this::mapToScheduleResponse)
                .collect(Collectors.toList());
    }

    public List<ScheduleResponse> getDailySchedule(LocalDate date) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return scheduleRepository.findByUserIdAndScheduledDate(user.getId(), date).stream()
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

    public Page<LearningClass> getAvailableClasses(String search, Pageable pageable) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (search != null && !search.isBlank()) {
            return learningClassRepository.findByUserIdAndTopicContainingIgnoreCase(user.getId(), search, pageable);
        }
        return learningClassRepository.findByUserId(user.getId(), pageable);
    }

    private PlanResponse mapToPlanResponse(LearningPlan plan) {
        return PlanResponse.builder()
                .id(plan.getId())
                .name(plan.getName())
                .description(plan.getDescription())
                .startDate(plan.getStartDate())
                .endDate(plan.getEndDate())
                .status(plan.getStatus())
                .createdAt(plan.getCreatedAt())
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
