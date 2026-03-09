package edu.cit.lagamo.multibiz.controller;

import edu.cit.lagamo.multibiz.dto.TransactionRequest;
import edu.cit.lagamo.multibiz.entity.Business;
import edu.cit.lagamo.multibiz.entity.Transaction;
import edu.cit.lagamo.multibiz.entity.User;
import edu.cit.lagamo.multibiz.repository.BusinessRepository;
import edu.cit.lagamo.multibiz.repository.TransactionRepository;
import edu.cit.lagamo.multibiz.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")
public class TransactionController {

    private final TransactionRepository transactionRepository;
    private final BusinessRepository    businessRepository;
    private final UserRepository        userRepository;

    public TransactionController(TransactionRepository transactionRepository,
                                 BusinessRepository businessRepository,
                                 UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.businessRepository    = businessRepository;
        this.userRepository        = userRepository;
    }

    // ── POST /api/transactions ───────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> logTransaction(@Valid @RequestBody TransactionRequest request) {

        Business business = businessRepository.findById(request.getBusinessId()).orElse(null);
        if (business == null) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Business not found"));
        }

        User staff = userRepository.findById(request.getStaffId()).orElse(null);
        if (staff == null) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Staff user not found"));
        }

        Transaction tx = new Transaction();
        tx.setBusiness(business);
        tx.setStaff(staff);
        tx.setAmount(request.getAmount());
        tx.setDescription(request.getDescription());
        tx.setStatus(request.getStatus());

        Transaction saved = transactionRepository.save(tx);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(Map.of(
                "message",       "Transaction logged successfully",
                "transactionId", saved.getId().toString()
            ));
    }

    // ── GET /api/transactions/business/{businessId} ──────────────────────────

    @GetMapping("/business/{businessId}")
    public ResponseEntity<?> getByBusiness(@PathVariable UUID businessId) {

        if (!businessRepository.existsById(businessId)) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Business not found"));
        }

        List<Transaction> transactions = transactionRepository.findByBusinessId(businessId);
        return ResponseEntity.ok(transactions);
    }
}
