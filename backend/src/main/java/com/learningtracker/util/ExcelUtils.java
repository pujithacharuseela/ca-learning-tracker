package com.learningtracker.util;

import com.learningtracker.entity.LearningClass;
import com.learningtracker.entity.User;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

public class ExcelUtils {

    private ExcelUtils() {
        // Private constructor to prevent instantiation
    }

    public static List<LearningClass> parseExcelFile(InputStream is, User user) throws Exception {
        List<LearningClass> classes = new ArrayList<>();
        
        try (Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            
            // Expected headers: ClassNo, Day / Topic, Duration (Minutes), Duration (Hours + Minutes)
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new IllegalArgumentException("Excel sheet is empty.");
            }

            int classNoIdx = 0;
            int topicIdx = 1;
            int durationMinutesIdx = 2;
            int durationDisplayIdx = 3;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) {
                    continue;
                }

                LearningClass learningClass = new LearningClass();
                learningClass.setUser(user);
                learningClass.setActive(true);

                // ClassNo
                Cell classNoCell = row.getCell(classNoIdx);
                if (classNoCell != null && classNoCell.getCellType() == CellType.NUMERIC) {
                    learningClass.setClassNo((int) classNoCell.getNumericCellValue());
                } else if (classNoCell != null && classNoCell.getCellType() == CellType.STRING) {
                    learningClass.setClassNo(Integer.parseInt(classNoCell.getStringCellValue().trim()));
                } else {
                    throw new IllegalArgumentException("Row " + (i + 1) + ": ClassNo must be a valid number.");
                }

                // Topic
                Cell topicCell = row.getCell(topicIdx);
                if (topicCell != null && topicCell.getCellType() == CellType.STRING) {
                    learningClass.setTopic(topicCell.getStringCellValue().trim());
                } else {
                    throw new IllegalArgumentException("Row " + (i + 1) + ": Topic must be a non-empty string.");
                }

                // Duration (Minutes)
                Cell durationMinCell = row.getCell(durationMinutesIdx);
                int durationMinutes = 0;
                if (durationMinCell != null && durationMinCell.getCellType() == CellType.NUMERIC) {
                    durationMinutes = (int) durationMinCell.getNumericCellValue();
                } else if (durationMinCell != null && durationMinCell.getCellType() == CellType.STRING) {
                    durationMinutes = Integer.parseInt(durationMinCell.getStringCellValue().trim());
                }
                learningClass.setDurationMinutes(durationMinutes);

                // Duration (Hours + Minutes)
                Cell durationDisplayCell = row.getCell(durationDisplayIdx);
                if (durationDisplayCell != null) {
                    if (durationDisplayCell.getCellType() == CellType.STRING) {
                        learningClass.setDurationDisplay(durationDisplayCell.getStringCellValue().trim());
                    } else if (durationDisplayCell.getCellType() == CellType.NUMERIC) {
                        learningClass.setDurationDisplay(String.valueOf((int) durationDisplayCell.getNumericCellValue()));
                    }
                } else {
                    // Fallback to minutes mapping format
                    learningClass.setDurationDisplay(durationMinutes + " mins");
                }

                classes.add(learningClass);
            }
        }
        return classes;
    }

    private static boolean isRowEmpty(Row row) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                return false;
            }
        }
        return true;
    }
}
