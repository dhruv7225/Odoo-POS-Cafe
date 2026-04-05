package com.example.backendpos.controller;

import com.example.backendpos.dto.response.ApiResponse;
import com.example.backendpos.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {
    private final CloudinaryService cloudinaryService;

    @PostMapping("/image")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(@RequestParam("file") MultipartFile file) {
        String url = cloudinaryService.uploadImage(file);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("url", url)));
    }

    @PostMapping("/glb")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadGlb(@RequestParam("file") MultipartFile file) {
        String url = cloudinaryService.uploadGlb(file);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("url", url)));
    }
}
