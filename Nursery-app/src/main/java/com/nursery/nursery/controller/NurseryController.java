package com.nursery.nursery.controller;

import com.nursery.common.dto.ApiResponse;
import com.nursery.nursery.dto.request.NurseryRequestDTO;
import com.nursery.nursery.dto.response.NurseryResponseDTO;
import com.nursery.nursery.service.NurseryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/nursery")
@RequiredArgsConstructor
public class NurseryController {
    
    private final NurseryService nurseryService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<NurseryResponseDTO>>> findAll() {
        List<NurseryResponseDTO> nurseries = nurseryService.findAll();
        return ResponseEntity.ok(ApiResponse.success(nurseries));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NurseryResponseDTO>> findById(@PathVariable("id") String id) {
        NurseryResponseDTO nursery = nurseryService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(nursery));
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<NurseryResponseDTO>> create(@Valid @RequestBody NurseryRequestDTO request) {
        NurseryResponseDTO nursery = nurseryService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Nursery created successfully", nursery));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<NurseryResponseDTO>> update(
            @PathVariable("id") String id,
            @Valid @RequestBody NurseryRequestDTO request) {
        NurseryResponseDTO nursery = nurseryService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Nursery updated successfully", nursery));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable("id") String id) {
        nurseryService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Nursery deleted successfully", null));
    }
}

