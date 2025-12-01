package com.nursery.payment.controller;

import com.nursery.common.dto.ApiResponse;
import com.nursery.payment.dto.request.PaymentRequestDTO;
import com.nursery.payment.dto.response.PaymentResponseDTO;
import com.nursery.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for managing payments.
 * Provides endpoints for creating, updating, retrieving, and deleting payments.
 * All payment operations are associated with transactions.
 */
@Slf4j
@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {
    
    private final PaymentService paymentService;
    
    /**
     * Creates a new payment for the specified transaction.
     * 
     * @param transactionId the ID of the transaction to associate the payment with
     * @param request the payment request DTO containing payment details
     * @return the created payment response DTO
     */
    @PostMapping("/transaction/{transactionId}")
    public ResponseEntity<ApiResponse<PaymentResponseDTO>> createPayment(
            @PathVariable("transactionId") String transactionId,
            @Valid @RequestBody PaymentRequestDTO request) {
        log.debug("REST request to create payment for transactionId={}", transactionId);
        PaymentResponseDTO payment = paymentService.createPayment(transactionId, request);
        log.info("Created payment id={} for transactionId={}", payment.getId(), transactionId);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Payment created successfully", payment));
    }
    
    /**
     * Updates an existing payment.
     * 
     * @param id the ID of the payment to update
     * @param request the payment request DTO containing updated payment details
     * @return the updated payment response DTO
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentResponseDTO>> updatePayment(
            @PathVariable("id") String id,
            @Valid @RequestBody PaymentRequestDTO request) {
        log.debug("REST request to update payment id={}", id);
        PaymentResponseDTO payment = paymentService.updatePayment(id, request);
        log.info("Updated payment id={}", id);
        return ResponseEntity.ok(ApiResponse.success("Payment updated successfully", payment));
    }
    
    /**
     * Retrieves all payments associated with a specific transaction.
     * 
     * @param transactionId the ID of the transaction
     * @return list of payment response DTOs
     */
    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<ApiResponse<List<PaymentResponseDTO>>> getPaymentsByTransaction(
            @PathVariable("transactionId") String transactionId) {
        log.debug("REST request to get payments for transactionId={}", transactionId);
        List<PaymentResponseDTO> payments = paymentService.findByTransactionId(transactionId);
        log.debug("Found {} payments for transactionId={}", payments.size(), transactionId);
        return ResponseEntity.ok(ApiResponse.success(payments));
    }
    
    /**
     * Retrieves a payment by its ID.
     * 
     * @param id the ID of the payment
     * @return the payment response DTO
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentResponseDTO>> getPayment(@PathVariable("id") String id) {
        log.debug("REST request to get payment id={}", id);
        PaymentResponseDTO payment = paymentService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(payment));
    }
    
    /**
     * Soft deletes a payment by marking it as deleted without removing it from the database.
     * 
     * @param id the ID of the payment to delete
     * @return success response
     */
    @PostMapping("/{id}/soft-delete")
    public ResponseEntity<ApiResponse<Void>> softDeletePayment(@PathVariable("id") String id) {
        log.debug("REST request to soft delete payment id={}", id);
        paymentService.softDeletePayment(id);
        log.info("Soft deleted payment id={}", id);
        return ResponseEntity.ok(ApiResponse.success("Payment deleted successfully", null));
    }
}

