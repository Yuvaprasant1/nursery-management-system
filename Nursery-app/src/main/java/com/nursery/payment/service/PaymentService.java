package com.nursery.payment.service;

import com.nursery.payment.dto.request.PaymentRequestDTO;
import com.nursery.payment.dto.response.PaymentResponseDTO;

import java.util.List;

public interface PaymentService {
    PaymentResponseDTO createPayment(String transactionId, PaymentRequestDTO request);
    PaymentResponseDTO updatePayment(String paymentId, PaymentRequestDTO request);
    List<PaymentResponseDTO> findByTransactionId(String transactionId);
    PaymentResponseDTO findById(String id);
    void softDeletePayment(String id);
}

