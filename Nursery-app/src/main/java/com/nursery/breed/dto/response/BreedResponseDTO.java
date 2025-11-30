package com.nursery.breed.dto.response;

import com.nursery.breed.enumeration.BreedMode;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BreedResponseDTO {
    private String id;
    private String nurseryId;
    private String saplingId;
    private String breedName;
    private BreedMode mode;
    private Integer itemsPerSlot;
    private String imageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

