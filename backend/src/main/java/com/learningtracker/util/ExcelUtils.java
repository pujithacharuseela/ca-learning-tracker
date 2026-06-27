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
                String classNoStr = getCellValueAsString(classNoCell).trim();
                if (classNoStr.isEmpty()) {
                    throw new IllegalArgumentException("Row " + (i + 1) + ": ClassNo must not be empty.");
                }
                try {
                    // Remove decimals if any (e.g. "1.0" to "1")
                    if (classNoStr.contains(".")) {
                        classNoStr = classNoStr.substring(0, classNoStr.indexOf("."));
                    }
                    learningClass.setClassNo(Integer.parseInt(classNoStr));
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Row " + (i + 1) + ": ClassNo must be a valid integer, found: " + classNoStr);
                }

                // Topic
                Cell topicCell = row.getCell(topicIdx);
                String topicStr = getCellValueAsString(topicCell).trim();
                if (topicStr.isEmpty()) {
                    throw new IllegalArgumentException("Row " + (i + 1) + ": Topic must be a non-empty string.");
                }
                learningClass.setTopic(topicStr);

                // Duration (Minutes)
                Cell durationMinCell = row.getCell(durationMinutesIdx);
                String durationMinStr = getCellValueAsString(durationMinCell).trim();
                int durationMinutes = 0;
                if (!durationMinStr.isEmpty()) {
                    try {
                        if (durationMinStr.contains(".")) {
                            durationMinStr = durationMinStr.substring(0, durationMinStr.indexOf("."));
                        }
                        durationMinutes = Integer.parseInt(durationMinStr);
                    } catch (NumberFormatException e) {
                        // ignore and default to 0
                    }
                }
                learningClass.setDurationMinutes(durationMinutes);

                // Duration (Hours + Minutes)
                Cell durationDisplayCell = row.getCell(durationDisplayIdx);
                String durationDisplayStr = getCellValueAsString(durationDisplayCell).trim();
                if (!durationDisplayStr.isEmpty()) {
                    learningClass.setDurationDisplay(durationDisplayStr);
                } else {
                    learningClass.setDurationDisplay(durationMinutes + " mins");
                }

                classes.add(learningClass);
            }
        }
        return classes;
    }

    private static String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return "";
        }
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                }
                double val = cell.getNumericCellValue();
                if (val == (long) val) {
                    return String.valueOf((long) val);
                }
                return String.valueOf(val);
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return cell.getStringCellValue();
                } catch (Exception e) {
                    try {
                        double formulaVal = cell.getNumericCellValue();
                        if (formulaVal == (long) formulaVal) {
                            return String.valueOf((long) formulaVal);
                        }
                        return String.valueOf(formulaVal);
                    } catch (Exception ex) {
                        return "";
                    }
                }
            default:
                return "";
        }
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
