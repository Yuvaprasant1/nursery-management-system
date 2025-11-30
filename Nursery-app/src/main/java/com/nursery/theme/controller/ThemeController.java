package com.nursery.theme.controller;

import com.nursery.common.dto.ApiResponse;
import com.nursery.theme.dto.request.ThemeRequestDTO;
import com.nursery.theme.dto.response.ThemeResponseDTO;
import com.nursery.theme.service.ThemeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/theme")
@RequiredArgsConstructor
public class ThemeController {
    
    private final ThemeService themeService;
    
    @GetMapping("/nursery/{nurseryId}")
    public ResponseEntity<ApiResponse<ThemeResponseDTO>> getByNurseryId(@PathVariable("nurseryId") String nurseryId) {
        ThemeResponseDTO theme = themeService.getByNurseryId(nurseryId);
        return ResponseEntity.ok(ApiResponse.success(theme));
    }
    
    @PostMapping("/nursery/{nurseryId}")
    public ResponseEntity<ApiResponse<ThemeResponseDTO>> createOrUpdate(
            @PathVariable("nurseryId") String nurseryId,
            @Valid @RequestBody ThemeRequestDTO request) {
        ThemeResponseDTO theme = themeService.createOrUpdate(nurseryId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Theme saved successfully", theme));
    }
    
    @GetMapping("/default")
    public ResponseEntity<ApiResponse<ThemeResponseDTO>> getDefault() {
        ThemeResponseDTO theme = themeService.getDefault();
        return ResponseEntity.ok(ApiResponse.success(theme));
    }
}

