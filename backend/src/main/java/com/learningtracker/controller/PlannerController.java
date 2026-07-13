package com.learningtracker.controller;

import com.learningtracker.dto.request.PlanAssignmentRequest;
import com.learningtracker.dto.response.PlanResponse;
import com.learningtracker.dto.response.ScheduleResponse;
import com.learningtracker.entity.LearningClass;
import com.learningtracker.service.PlannerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/planner")
@RequiredArgsConstructor
public class PlannerController {

    private final PlannerService plannerService;

    @PostMapping("/plans")
    public ResponseEntity<PlanResponse> createPlan(@Valid @RequestBody PlanAssignmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(plannerService.createPlan(request));
    }

    @GetMapping("/plans")
    public ResponseEntity<List<PlanResponse>> getPlans() {
        return ResponseEntity.ok(plannerService.getPlans());
    }

    @PutMapping("/plans/{planId}")
    public ResponseEntity<PlanResponse> updatePlan(
            @PathVariable UUID planId,
            @RequestBody Map<String, String> body) {
        LocalDate startDate = body.containsKey("startDate") && body.get("startDate") != null && !body.get("startDate").isBlank()
                ? LocalDate.parse(body.get("startDate")) : null;
        LocalDate endDate = body.containsKey("endDate") && body.get("endDate") != null && !body.get("endDate").isBlank()
                ? LocalDate.parse(body.get("endDate")) : null;
        UUID subjectId = body.containsKey("subjectId") && body.get("subjectId") != null && !body.get("subjectId").isBlank()
                ? UUID.fromString(body.get("subjectId")) : null;
        return ResponseEntity.ok(plannerService.updatePlan(planId, body.get("name"), body.get("description"), startDate, endDate, subjectId));
    }

    @DeleteMapping("/plans/{planId}")
    public ResponseEntity<Void> deletePlan(@PathVariable UUID planId) {
        plannerService.deletePlan(planId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/plans/{planId}/schedules")
    public ResponseEntity<List<ScheduleResponse>> getSchedulesForPlan(@PathVariable UUID planId) {
        return ResponseEntity.ok(plannerService.getSchedulesForPlan(planId));
    }

    /** Returns ALL schedules across all plans — used by Calendar "All" view */
    @GetMapping("/schedules/all")
    public ResponseEntity<List<ScheduleResponse>> getAllSchedules() {
        return ResponseEntity.ok(plannerService.getAllSchedules());
    }

    @GetMapping("/classes")
    public ResponseEntity<Page<LearningClass>> getClasses(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID subjectId,
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "classNo") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(plannerService.getAvailableClasses(search, subjectId, status, pageable));
    }

    @GetMapping("/classes/planned-ids")
    public ResponseEntity<Set<UUID>> getPlannedClassIds() {
        return ResponseEntity.ok(plannerService.getPlannedClassIds());
    }

    @GetMapping("/schedules/daily")
    public ResponseEntity<List<ScheduleResponse>> getDailySchedule(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(plannerService.getDailySchedule(date));
    }

    @PatchMapping("/schedules/{scheduleId}/complete")
    public ResponseEntity<ScheduleResponse> completeSchedule(@PathVariable UUID scheduleId) {
        return ResponseEntity.ok(plannerService.completeSchedule(scheduleId));
    }

    @PutMapping("/schedules/{scheduleId}/reschedule")
    public ResponseEntity<ScheduleResponse> rescheduleClass(
            @PathVariable UUID scheduleId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate newDate) {
        return ResponseEntity.ok(plannerService.rescheduleClass(scheduleId, newDate));
    }

    @PatchMapping("/classes/{classId}/toggle-active")
    public ResponseEntity<LearningClass> toggleClassActive(@PathVariable UUID classId) {
        return ResponseEntity.ok(plannerService.toggleClassActive(classId));
    }

    @PatchMapping("/classes/activate-all")
    public ResponseEntity<Map<String, Integer>> activateAllClasses() {
        int count = plannerService.activateAllClasses();
        return ResponseEntity.ok(Map.of("activated", count));
    }
}
