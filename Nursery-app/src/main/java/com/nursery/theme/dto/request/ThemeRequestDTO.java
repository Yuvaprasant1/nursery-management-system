package com.nursery.theme.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ThemeRequestDTO {
    
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Primary color must be a valid hex color")
    @Size(max = 7, message = "Primary color must not exceed 7 characters")
    private String primaryColor;
    
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Secondary color must be a valid hex color")
    @Size(max = 7, message = "Secondary color must not exceed 7 characters")
    private String secondaryColor;
    
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Accent color must be a valid hex color")
    @Size(max = 7, message = "Accent color must not exceed 7 characters")
    private String accentColor;
    
    @Size(max = 100, message = "Font family must not exceed 100 characters")
    private String fontFamily;
    
    @Size(max = 10, message = "Font size base must not exceed 10 characters")
    private String fontSizeBase;
    
    @Size(max = 500, message = "Logo URL must not exceed 500 characters")
    private String logoUrl;
    
    @Size(max = 500, message = "Favicon URL must not exceed 500 characters")
    private String faviconUrl;
    
    @Size(max = 10, message = "Border radius must not exceed 10 characters")
    private String borderRadius;
    
    @Size(max = 10, message = "Spacing unit must not exceed 10 characters")
    private String spacingUnit;
    
    @Pattern(regexp = "^(light|dark|auto)$", message = "Theme mode must be light, dark, or auto")
    @Size(max = 20, message = "Theme mode must not exceed 20 characters")
    private String themeMode;
}

