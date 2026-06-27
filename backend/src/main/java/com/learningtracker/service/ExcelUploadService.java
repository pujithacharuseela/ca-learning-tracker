package com.learningtracker.service;

import com.learningtracker.constant.enums.UploadStatus;
import com.learningtracker.dto.response.ExcelPreviewResponse;
import com.learningtracker.entity.LearningClass;
import com.learningtracker.entity.UploadedFile;
import com.learningtracker.entity.User;
import com.learningtracker.exception.InvalidOperationException;
import com.learningtracker.exception.ResourceNotFoundException;
import com.learningtracker.repository.LearningClassRepository;
import com.learningtracker.repository.UploadedFileRepository;
import com.learningtracker.repository.UserRepository;
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
    public UploadedFile confirmImport(MultipartFile file) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

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
            } else if (learningClassRepository.existsByUserIdAndClassNo(user.getId(), cl.getClassNo())) {
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

    @Transactional
    public void clearAllUserData() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        UUID userId = user.getId();

        studySessionRepository.deleteByUserId(userId);
        noteRepository.deleteByUserId(userId);
        scheduleRepository.deleteByUserId(userId);
        learningPlanRepository.deleteByUserId(userId);
        learningClassRepository.deleteByUserId(userId);
        uploadedFileRepository.deleteByUserId(userId);
    }
}
