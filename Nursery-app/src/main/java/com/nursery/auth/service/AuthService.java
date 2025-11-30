package com.nursery.auth.service;

import com.nursery.auth.dto.request.LoginRequestDTO;
import com.nursery.auth.dto.response.AuthResponseDTO;

public interface AuthService {
    AuthResponseDTO login(LoginRequestDTO request);
    AuthResponseDTO getCurrentUser(String phone);
}





