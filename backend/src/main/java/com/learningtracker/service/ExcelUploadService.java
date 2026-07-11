package com.learningtracker.service;

import com.learningtracker.constant.enums.UploadStatus;
import com.learningtracker.dto.response.ExcelPreviewResponse;
import com.learningtracker.entity.*;
import com.learningtracker.exception.InvalidOperationException;
import com.learningtracker.exception.ResourceNotFoundException;
import com.learningtracker.repository.LearningClassRepository;
import com.learningtracker.repository.UploadedFileRepository;
import com.learningtracker.repository.UserRepository;
import com.learningtracker.repository.LearningPlanRepository;
import com.learningtracker.repository.ScheduleRepository;
import com.learningtracker.repository.NoteRepository;
import com.learningtracker.repository.StudySessionRepository;
import com.learningtracker.security.SecurityUtils;
import com.learningtracker.util.ExcelUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExcelUploadService {

    private final UploadedFileRepository uploadedFileRepository;
    private final LearningClassRepository learningClassRepository;
    private final UserRepository userRepository;
    private final LearningPlanRepository learningPlanRepository;
    private final ScheduleRepository scheduleRepository;
    private final NoteRepository noteRepository;
    private final StudySessionRepository studySessionRepository;
    private final com.learningtracker.repository.SubjectRepository subjectRepository;

    public ExcelPreviewResponse previewExcelFile(MultipartFile file) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        List<ExcelPreviewResponse.ParsedRow> parsedRows = new ArrayList<>();
        int validRows = 0;
        int invalidRows = 0;

        try (InputStream is = file.getInputStream()) {
            List<LearningClass> classes = ExcelUtils.parseExcelFile(is, user);
            
            for (int i = 0; i < classes.size(); i++) {
                LearningClass cl = classes.get(i);
                boolean valid = true;
                StringBuilder errorMsg = new StringBuilder();

                if (cl.getClassNo() <= 0) {
                    valid = false;
                    errorMsg.append("ClassNo must be greater than 0. ");
                } else if (learningClassRepository.existsByUserIdAndClassNo(user.getId(), cl.getClassNo())) {
                    valid = false;
                    errorMsg.append("Duplicate ClassNo already registered in database. ");
                }

                if (cl.getTopic() == null || cl.getTopic().isBlank()) {
                    valid = false;
                    errorMsg.append("Topic is mandatory. ");
                }

                if (cl.getDurationMinutes() <= 0) {
                    valid = false;
                    errorMsg.append("Duration must be greater than 0. ");
                }

                if (valid) {
                    validRows++;
                } else {
                    invalidRows++;
                }

                parsedRows.add(ExcelPreviewResponse.ParsedRow.builder()
                        .rowIndex(i + 1)
                        .classNo(cl.getClassNo())
                        .topic(cl.getTopic())
                        .durationMinutes(cl.getDurationMinutes())
                        .durationDisplay(cl.getDurationDisplay())
                        .valid(valid)
                        .errorMessage(errorMsg.toString().trim())
                        .build());
            }
        } catch (IllegalArgumentException e) {
            log.error("Excel validation error: {}", e.getMessage());
            throw new InvalidOperationException(e.getMessage());
        } catch (Exception e) {
            log.error("Failed to parse excel preview", e);
            throw new InvalidOperationException("Failed to parse Excel file: " + e.getMessage());
        }

        return ExcelPreviewResponse.builder()
                .totalRows(parsedRows.size())
                .validRowsCount(validRows)
                .invalidRowsCount(invalidRows)
                .rows(parsedRows)
                .build();
    }

    @Transactional
    public UploadedFile confirmImport(MultipartFile file, UUID subjectId) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        com.learningtracker.entity.Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject", "id", subjectId));

        List<LearningClass> allParsed;
        try (InputStream is = file.getInputStream()) {
            allParsed = ExcelUtils.parseExcelFile(is, user);
        } catch (Exception e) {
            throw new InvalidOperationException("Failed to parse Excel file: " + e.getMessage());
        }

        List<LearningClass> toSave = new ArrayList<>();
        int validRows = 0;
        int invalidRows = 0;

        for (LearningClass cl : allParsed) {
            boolean valid = true;
            if (cl.getClassNo() <= 0) {
                valid = false;
            } else if (learningClassRepository.existsByUserIdAndSubjectIdAndClassNo(user.getId(), subject.getId(), cl.getClassNo())) {
                valid = false;
            }
            if (cl.getTopic() == null || cl.getTopic().isBlank()) {
                valid = false;
            }
            if (cl.getDurationMinutes() <= 0) {
                valid = false;
            }

            if (valid) {
                validRows++;
                toSave.add(cl);
            } else {
                invalidRows++;
            }
        }

        if (validRows == 0) {
            throw new InvalidOperationException("No valid rows to import.");
        }

        UploadedFile uploadedFile = new UploadedFile();
        uploadedFile.setUser(user);
        uploadedFile.setFileName(file.getOriginalFilename());
        uploadedFile.setOriginalName(file.getOriginalFilename());
        uploadedFile.setTotalRows(allParsed.size());
        uploadedFile.setValidRows(validRows);
        uploadedFile.setInvalidRows(invalidRows);
        uploadedFile.setStatus(UploadStatus.COMPLETED);
        uploadedFile.setUploadedAt(LocalDateTime.now());
        uploadedFile = uploadedFileRepository.save(uploadedFile);

        for (LearningClass cl : toSave) {
            cl.setUploadedFile(uploadedFile);
            cl.setSubject(subject);
            learningClassRepository.save(cl);
        }

        return uploadedFile;
    }

    public List<UploadedFile> getUploadHistory() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return uploadedFileRepository.findByUserIdOrderByUploadedAtDesc(user.getId());
    }

    /**
     * Deletes ALL data for a user in correct FK order:
     * notes -> study_sessions -> schedules -> plans -> classes -> uploaded_files
     */
    @Transactional
    public void clearAllUserData() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        UUID userId = user.getId();

        // Correct order: delete child records before parent records
        noteRepository.deleteByUserId(userId);
        studySessionRepository.deleteByUserId(userId);
        scheduleRepository.deleteByUserId(userId);
        learningPlanRepository.deleteByUserId(userId);
        learningClassRepository.deleteByUserId(userId);
        uploadedFileRepository.deleteByUserId(userId);
    }

    /**
     * Deletes data for a user filtered by subject in correct FK order.
     * Uses efficient repository queries instead of findAll() over all records.
     */
    @Transactional
    public void clearUserDataBySubject(UUID subjectId) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        UUID userId = user.getId();

        // 1. Get all plans for this subject
        List<LearningPlan> plans = learningPlanRepository.findByUserId(userId).stream()
                .filter(p -> p.getSubject() != null && p.getSubject().getId().equals(subjectId))
                .toList();

        // 2. Delete in correct FK order per plan: notes -> sessions -> schedules -> plan
        for (LearningPlan plan : plans) {
            UUID planId = plan.getId();
            noteRepository.deleteByPlanId(planId);
            studySessionRepository.deleteByPlanId(planId);
            scheduleRepository.deleteByPlanId(planId);
            learningPlanRepository.delete(plan);
        }

        // 3. Delete classes of this subject (use targeted query)
        learningClassRepository.deleteByUserIdAndSubjectId(userId, subjectId);

        // 4. Clean up empty UploadedFiles for this user/subject
        uploadedFileRepository.findByUserIdOrderByUploadedAtDesc(userId).stream()
                .filter(uf -> learningClassRepository.countByUserIdAndUploadedFileId(userId, uf.getId()) == 0)
                .forEach(uploadedFileRepository::delete);
    }
}
