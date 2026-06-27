package com.learningtracker.controller;

import com.learningtracker.dto.response.ExcelPreviewResponse;
import com.learningtracker.entity.UploadedFile;
import com.learningtracker.service.ExcelUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class UploadController {

    private final ExcelUploadService excelUploadService;

    @PostMapping("/preview")
    public ResponseEntity<ExcelPreviewResponse> previewFile(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(excelUploadService.previewExcelFile(file));
    }

    @PostMapping("/import")
    public ResponseEntity<UploadedFile> confirmImport(
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(excelUploadService.confirmImport(file));
    }

    @GetMapping("/history")
    public ResponseEntity<List<UploadedFile>> getHistory() {
        return ResponseEntity.ok(excelUploadService.getUploadHistory());
    }

    @DeleteMapping("/reset")
    public ResponseEntity<Void> resetData() {
        excelUploadService.clearAllUserData();
        return ResponseEntity.ok().build();
    }
}
