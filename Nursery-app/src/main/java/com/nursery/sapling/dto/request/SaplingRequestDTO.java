package com.nursery.sapling.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;
import lombok.Data;

@Data
public class SaplingRequestDTO {
    
    @NotBlank(message = "Sapling name is required")
    @Size(max = 255, message = "Sapling name must not exceed 255 characters")
    private String name;
    
    private String description;
    
    @URL(message = "Image URL must be a valid URL")
    @Size(max = 500, message = "Image URL must not exceed 500 characters")
    private String imageUrl;
    
    @NotNull(message = "Nursery ID is required")
    private String nurseryId;
}

