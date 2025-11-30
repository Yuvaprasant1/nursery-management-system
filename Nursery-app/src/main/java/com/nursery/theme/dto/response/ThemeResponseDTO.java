package com.nursery.theme.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ThemeResponseDTO {
    private String id;
    private String nurseryId;
    private String primaryColor;
    private String secondaryColor;
    private String accentColor;
    private String fontFamily;
    private String fontSizeBase;
    private String logoUrl;
    private String faviconUrl;
    private String borderRadius;
    private String spacingUnit;
    private String themeMode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

