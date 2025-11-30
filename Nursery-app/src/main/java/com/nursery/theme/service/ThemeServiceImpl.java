package com.nursery.theme.service;

import com.nursery.nursery.service.NurseryService;
import com.nursery.theme.dto.request.ThemeRequestDTO;
import com.nursery.theme.dto.response.ThemeResponseDTO;
import com.nursery.theme.firestore.ThemeDocument;
import com.nursery.theme.firestore.ThemeFirestoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ThemeServiceImpl implements ThemeService {
    
    private final ThemeFirestoreRepository repository;
    private final NurseryService nurseryService;
    
    @Override
    public ThemeResponseDTO getByNurseryId(String nurseryId) {
        ThemeDocument theme = repository.findByNurseryId(nurseryId)
            .orElse(null);
        
        if (theme == null) {
            return getDefault();
        }
        
        return toResponseDTO(theme);
    }
    
    @Override
    public ThemeResponseDTO createOrUpdate(String nurseryId, ThemeRequestDTO request) {
        // Validate nursery exists
        nurseryService.validateExists(nurseryId);
        
        ThemeDocument theme = repository.findByNurseryId(nurseryId)
            .orElse(null);
        
        if (theme == null) {
            // Create new theme
            theme = toDocument(request, nurseryId);
            String id = repository.save(theme);
            log.info("Created theme for nursery: {}", nurseryId);
        } else {
            // Update existing theme
            updateDocumentFromDTO(request, theme);
            repository.save(theme);
            log.info("Updated theme for nursery: {}", nurseryId);
        }
        
        return toResponseDTO(theme);
    }
    
    @Override
    public ThemeResponseDTO getDefault() {
        ThemeResponseDTO defaultTheme = new ThemeResponseDTO();
        defaultTheme.setPrimaryColor("#3B82F6");
        defaultTheme.setSecondaryColor("#8B5CF6");
        defaultTheme.setAccentColor("#10B981");
        defaultTheme.setFontFamily("Inter");
        defaultTheme.setFontSizeBase("16px");
        defaultTheme.setBorderRadius("8px");
        defaultTheme.setSpacingUnit("8px");
        defaultTheme.setThemeMode("light");
        return defaultTheme;
    }
    
    private ThemeDocument toDocument(ThemeRequestDTO dto, String nurseryId) {
        ThemeDocument doc = new ThemeDocument();
        doc.setNurseryId(nurseryId);
        if (dto.getPrimaryColor() != null) doc.setPrimaryColor(dto.getPrimaryColor());
        if (dto.getSecondaryColor() != null) doc.setSecondaryColor(dto.getSecondaryColor());
        if (dto.getAccentColor() != null) doc.setAccentColor(dto.getAccentColor());
        if (dto.getFontFamily() != null) doc.setFontFamily(dto.getFontFamily());
        if (dto.getFontSizeBase() != null) doc.setFontSizeBase(dto.getFontSizeBase());
        if (dto.getLogoUrl() != null) doc.setLogoUrl(dto.getLogoUrl());
        if (dto.getFaviconUrl() != null) doc.setFaviconUrl(dto.getFaviconUrl());
        if (dto.getBorderRadius() != null) doc.setBorderRadius(dto.getBorderRadius());
        if (dto.getSpacingUnit() != null) doc.setSpacingUnit(dto.getSpacingUnit());
        if (dto.getThemeMode() != null) doc.setThemeMode(dto.getThemeMode());
        return doc;
    }
    
    private void updateDocumentFromDTO(ThemeRequestDTO dto, ThemeDocument doc) {
        if (dto.getPrimaryColor() != null) doc.setPrimaryColor(dto.getPrimaryColor());
        if (dto.getSecondaryColor() != null) doc.setSecondaryColor(dto.getSecondaryColor());
        if (dto.getAccentColor() != null) doc.setAccentColor(dto.getAccentColor());
        if (dto.getFontFamily() != null) doc.setFontFamily(dto.getFontFamily());
        if (dto.getFontSizeBase() != null) doc.setFontSizeBase(dto.getFontSizeBase());
        if (dto.getLogoUrl() != null) doc.setLogoUrl(dto.getLogoUrl());
        if (dto.getFaviconUrl() != null) doc.setFaviconUrl(dto.getFaviconUrl());
        if (dto.getBorderRadius() != null) doc.setBorderRadius(dto.getBorderRadius());
        if (dto.getSpacingUnit() != null) doc.setSpacingUnit(dto.getSpacingUnit());
        if (dto.getThemeMode() != null) doc.setThemeMode(dto.getThemeMode());
    }
    
    private ThemeResponseDTO toResponseDTO(ThemeDocument doc) {
        ThemeResponseDTO dto = new ThemeResponseDTO();
        dto.setId(doc.getId());
        dto.setNurseryId(doc.getNurseryId());
        dto.setPrimaryColor(doc.getPrimaryColor());
        dto.setSecondaryColor(doc.getSecondaryColor());
        dto.setAccentColor(doc.getAccentColor());
        dto.setFontFamily(doc.getFontFamily());
        dto.setFontSizeBase(doc.getFontSizeBase());
        dto.setLogoUrl(doc.getLogoUrl());
        dto.setFaviconUrl(doc.getFaviconUrl());
        dto.setBorderRadius(doc.getBorderRadius());
        dto.setSpacingUnit(doc.getSpacingUnit());
        dto.setThemeMode(doc.getThemeMode());
        dto.setCreatedAt(doc.getCreatedAt());
        dto.setUpdatedAt(doc.getUpdatedAt());
        return dto;
    }
}
