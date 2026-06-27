package com.learningtracker.service;

import com.learningtracker.entity.StudySession;
import com.learningtracker.entity.User;
import com.learningtracker.exception.ResourceNotFoundException;
import com.learningtracker.repository.StudySessionRepository;
import com.learningtracker.repository.UserRepository;
import com.learningtracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final StudySessionRepository studySessionRepository;
    private final UserRepository userRepository;

    public ByteArrayInputStream exportStudySessionsToExcel() throws Exception {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        // Get all historical study sessions
        List<StudySession> sessions = studySessionRepository.findByUserIdAndCompletedAtBetween(
                user.getId(), LocalDateTime.now().minusYears(1), LocalDateTime.now());

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Study Sessions Report");

            // Style headers
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.INDIGO.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Create Header Row
            String[] columns = {"Session ID", "Class No", "Topic", "Status", "Duration (Minutes)", "Difficulty (1-5)", "Overall Rating (1-5)", "Completed At"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // Populating Rows
            int rowIdx = 1;
            for (StudySession session : sessions) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(session.getId().toString());
                row.createCell(1).setCellValue(session.getSchedule().getLearningClass().getClassNo());
                row.createCell(2).setCellValue(session.getSchedule().getLearningClass().getTopic());
                row.createCell(3).setCellValue(session.getStatus().name());
                row.createCell(4).setCellValue(session.getActualDurationMinutes());
                row.createCell(5).setCellValue(session.getDifficultyRating());
                row.createCell(6).setCellValue(session.getOverallRating());
                row.createCell(7).setCellValue(session.getCompletedAt().toString());
            }

            // Autosizing columns
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
