package com.nursery.auth.service;

import com.nursery.auth.dto.request.GenerateTokenRequestDTO;
import com.nursery.auth.dto.request.LoginRequestDTO;
import com.nursery.auth.dto.request.SignupRequestDTO;
import com.nursery.auth.dto.response.AuthResponseDTO;

public interface AuthService {
    AuthResponseDTO login(LoginRequestDTO request);
    AuthResponseDTO signup(SignupRequestDTO request);
    AuthResponseDTO generateToken(GenerateTokenRequestDTO request);
    AuthResponseDTO getCurrentUser(String phone);
}





