package com.nursery.nursery.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NurseryResponseDTO {
    private String id;
    private String name;
    private String location;
    private String phone;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

