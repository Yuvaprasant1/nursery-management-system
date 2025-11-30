package com.nursery.sapling.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SaplingResponseDTO {
    private String id;
    private String name;
    private String description;
    private String imageUrl;
    private String nurseryId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

