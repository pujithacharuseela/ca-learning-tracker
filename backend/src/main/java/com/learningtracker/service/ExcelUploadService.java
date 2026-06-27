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
    public UploadedFile confirmImport(MultipartFile file, ExcelPreviewResponse preview) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (preview.getValidRowsCount() == 0) {
            throw new InvalidOperationException("No valid rows to import.");
        }

        UploadedFile uploadedFile = new UploadedFile();
        uploadedFile.setUser(user);
        uploadedFile.setFileName(file.getOriginalFilename());
        uploadedFile.setOriginalName(file.getOriginalFilename());
        uploadedFile.setTotalRows(preview.getTotalRows());
        uploadedFile.setValidRows(preview.getValidRowsCount());
        uploadedFile.setInvalidRows(preview.getInvalidRowsCount());
        uploadedFile.setStatus(UploadStatus.COMPLETED);
        uploadedFile.setUploadedAt(LocalDateTime.now());
        uploadedFile = uploadedFileRepository.save(uploadedFile);

        try (InputStream is = file.getInputStream()) {
            List<LearningClass> classes = ExcelUtils.parseExcelFile(is, user);
            
            for (LearningClass cl : classes) {
                // Confirm duplicate doesn't exist to prevent concurrent inserts
                if (!learningClassRepository.existsByUserIdAndClassNo(user.getId(), cl.getClassNo())) {
                    cl.setUploadedFile(uploadedFile);
                    learningClassRepository.save(cl);
                }
            }
        } catch (Exception e) {
            uploadedFile.setStatus(UploadStatus.FAILED);
            uploadedFileRepository.save(uploadedFile);
            throw new InvalidOperationException("Error persisting imported classes: " + e.getMessage());
        }

        return uploadedFile;
    }

    public List<UploadedFile> getUploadHistory() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return uploadedFileRepository.findByUserIdOrderByUploadedAtDesc(user.getId());
    }
}
