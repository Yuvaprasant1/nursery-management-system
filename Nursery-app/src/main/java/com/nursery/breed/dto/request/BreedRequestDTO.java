package com.nursery.breed.dto.request;

import com.nursery.breed.enumeration.BreedMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;
import lombok.Data;

@Data
public class BreedRequestDTO {
    
    @NotNull(message = "Nursery ID is required")
    private String nurseryId;
    
    @NotNull(message = "Sapling ID is required")
    private String saplingId;
    
    @NotBlank(message = "Breed name is required")
    @Size(max = 255, message = "Breed name must not exceed 255 characters")
    private String breedName;
    
    @NotNull(message = "Mode is required")
    private BreedMode mode;
    
    @Positive(message = "Items per slot must be positive")
    private Integer itemsPerSlot = 1;
    
    @URL(message = "Image URL must be a valid URL")
    @Size(max = 500, message = "Image URL must not exceed 500 characters")
    private String imageUrl;
}

