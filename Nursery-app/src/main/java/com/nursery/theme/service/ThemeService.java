package com.nursery.theme.service;

import com.nursery.theme.dto.request.ThemeRequestDTO;
import com.nursery.theme.dto.response.ThemeResponseDTO;

public interface ThemeService {
    ThemeResponseDTO getByNurseryId(String nurseryId);
    ThemeResponseDTO createOrUpdate(String nurseryId, ThemeRequestDTO request);
    ThemeResponseDTO getDefault();
}

