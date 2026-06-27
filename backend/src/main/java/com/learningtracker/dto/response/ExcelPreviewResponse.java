package com.learningtracker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExcelPreviewResponse {
    private int totalRows;
    private int validRowsCount;
    private int invalidRowsCount;
    private List<ParsedRow> rows;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParsedRow {
        private int rowIndex;
        private Integer classNo;
        private String topic;
        private int durationMinutes;
        private String durationDisplay;
        private boolean valid;
        private String errorMessage;
    }
}
