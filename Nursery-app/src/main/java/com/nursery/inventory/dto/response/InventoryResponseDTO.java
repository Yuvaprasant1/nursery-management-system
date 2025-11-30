package com.nursery.inventory.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class InventoryResponseDTO {
    private String id;
    private String nurseryId;
    private String breedId;
    private Integer quantity;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

