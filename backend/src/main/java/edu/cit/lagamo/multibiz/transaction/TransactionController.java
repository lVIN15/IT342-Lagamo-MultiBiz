package edu.cit.lagamo.multibiz.transaction;

import edu.cit.lagamo.multibiz.common.dto.ApiResponse;
import edu.cit.lagamo.multibiz.transaction.dto.TransactionRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('STAFF', 'OWNER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> logTransaction(
            @Valid @RequestBody TransactionRequest request, 
            Authentication authentication) {

        ApiResponse<Map<String, Object>> response = transactionService.logTransaction(request, authentication.getName());
        
        if (!response.isSuccess()) {
            if ("UNAUTHORIZED".equals(response.getError().getCode())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            if ("FORBIDDEN".equals(response.getError().getCode())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/business/{businessId}")
    @PreAuthorize("hasAnyAuthority('STAFF', 'OWNER')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTransactionsByBusiness(
            @PathVariable UUID businessId,
            Authentication authentication) {

        ApiResponse<List<Map<String, Object>>> response = transactionService.getTransactionsByBusiness(businessId, authentication.getName());

        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateTransaction(
            @PathVariable UUID id,
            @Valid @RequestBody TransactionRequest request,
            Authentication authentication) {
        
        ApiResponse<Map<String, Object>> response = transactionService.updateTransaction(id, request, authentication.getName());
        if (!response.isSuccess()) {
            if ("FORBIDDEN".equals(response.getError().getCode())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            if ("NOT_FOUND".equals(response.getError().getCode())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(
            @PathVariable UUID id,
            Authentication authentication) {
        
        ApiResponse<Void> response = transactionService.deleteTransaction(id, authentication.getName());
        if (!response.isSuccess()) {
            if ("FORBIDDEN".equals(response.getError().getCode())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            if ("NOT_FOUND".equals(response.getError().getCode())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/upload")
    @PreAuthorize("hasAnyAuthority('STAFF', 'OWNER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadReceipt(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        ApiResponse<Map<String, Object>> response = transactionService.uploadReceipt(id, file, authentication.getName());
        
        if (!response.isSuccess()) {
            if ("FORBIDDEN".equals(response.getError().getCode())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        return ResponseEntity.ok(response);
    }
}
