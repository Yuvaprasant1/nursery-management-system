package com.nursery.theme.firestore;

import com.nursery.common.firestore.BaseDocument;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ThemeDocument extends BaseDocument {
    
    private String nurseryId;
    
    private String primaryColor = "#3B82F6";
    
    private String secondaryColor = "#8B5CF6";
    
    private String accentColor = "#10B981";
    
    private String fontFamily = "Inter";
    
    private String fontSizeBase = "16px";
    
    private String logoUrl;
    
    private String faviconUrl;
    
    private String borderRadius = "8px";
    
    private String spacingUnit = "8px";
    
    private String themeMode = "light";
}

