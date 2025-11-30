package com.nursery.nursery.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class NurseryRequestDTO {
    
    @NotBlank(message = "Nursery name is required")
    @Size(max = 255, message = "Nursery name must not exceed 255 characters")
    private String name;
    
    @Size(max = 500, message = "Location must not exceed 500 characters")
    private String location;
    
    @Size(max = 20, message = "Phone must not exceed 20 characters")
    private String phone;
}

