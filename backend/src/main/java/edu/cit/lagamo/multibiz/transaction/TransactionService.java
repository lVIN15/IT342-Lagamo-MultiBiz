package edu.cit.lagamo.multibiz.transaction;

import edu.cit.lagamo.multibiz.common.dto.ApiResponse;
import edu.cit.lagamo.multibiz.transaction.dto.TransactionRequest;
import edu.cit.lagamo.multibiz.business.entity.Business;
import edu.cit.lagamo.multibiz.business.entity.BusinessStaff;
import edu.cit.lagamo.multibiz.transaction.entity.Transaction;
import edu.cit.lagamo.multibiz.user.entity.User;
import edu.cit.lagamo.multibiz.business.BusinessRepository;
import edu.cit.lagamo.multibiz.business.BusinessStaffRepository;
import edu.cit.lagamo.multibiz.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;
    private final BusinessStaffRepository businessStaffRepository;

    public TransactionService(TransactionRepository transactionRepository,
                              BusinessRepository businessRepository,
                              UserRepository userRepository,
                              BusinessStaffRepository businessStaffRepository) {
        this.transactionRepository = transactionRepository;
        this.businessRepository = businessRepository;
        this.userRepository = userRepository;
        this.businessStaffRepository = businessStaffRepository;
    }

    private boolean isAuthorizedForBusiness(User user, Business business) {
        if ("OWNER".equalsIgnoreCase(user.getRole())) {
            return business.getOwner().getId().equals(user.getId());
        } else {
            List<BusinessStaff> staffList = businessStaffRepository.findByBusinessId(business.getId());
            return staffList.stream().anyMatch(bs -> bs.getUser().getId().equals(user.getId()));
        }
    }

    @Transactional
    public ApiResponse<Map<String, Object>> logTransaction(TransactionRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) {
            return ApiResponse.fail("UNAUTHORIZED", "User not found");
        }

        Business business = businessRepository.findById(request.getBusinessId()).orElse(null);
        if (business == null) {
            return ApiResponse.fail("NOT_FOUND", "Business not found");
        }

        if (!isAuthorizedForBusiness(user, business)) {
            return ApiResponse.fail("FORBIDDEN", "You are not authorized for this business");
        }

        Transaction tx = new Transaction();
        tx.setBusiness(business);
        tx.setStaff(user);
        tx.setAmount(request.getAmount());
        tx.setDescription(request.getDescription());
        tx.setStatus("pending_receipt");

        Transaction saved = transactionRepository.save(tx);
        
        Map<String, Object> data = new HashMap<>();
        data.put("transactionId", saved.getId().toString());
        data.put("status", saved.getStatus());

        return ApiResponse.ok(data);
    }

    @Transactional(readOnly = true)
    public ApiResponse<List<Map<String, Object>>> getTransactionsByBusiness(UUID businessId, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) {
            return ApiResponse.fail("UNAUTHORIZED", "User not found");
        }

        Business business = businessRepository.findById(businessId).orElse(null);
        if (business == null) {
            return ApiResponse.fail("NOT_FOUND", "Business not found");
        }

        if (!isAuthorizedForBusiness(user, business)) {
            return ApiResponse.fail("FORBIDDEN", "You are not authorized for this business");
        }

        List<Transaction> transactions = transactionRepository.findByBusinessId(businessId);
        List<Map<String, Object>> result = transactions.stream().map(tx -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", tx.getId().toString());
            map.put("amount", tx.getAmount());
            map.put("description", tx.getDescription());
            map.put("status", tx.getStatus());
            map.put("receiptUrl", tx.getReceiptUrl());
            map.put("createdAt", tx.getCreatedAt().toString());
            
            if (tx.getStaff() != null) {
                Map<String, Object> staffMap = new HashMap<>();
                staffMap.put("id", tx.getStaff().getId().toString());
                staffMap.put("firstname", tx.getStaff().getFirstname());
                staffMap.put("lastname", tx.getStaff().getLastname());
                map.put("staff", staffMap);
            }
            return map;
        }).toList();

        return ApiResponse.ok(result);
    }

    @Transactional
    public ApiResponse<Map<String, Object>> updateTransaction(UUID transactionId, TransactionRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) {
            return ApiResponse.fail("UNAUTHORIZED", "User not found");
        }

        Transaction tx = transactionRepository.findById(transactionId).orElse(null);
        if (tx == null) {
            return ApiResponse.fail("NOT_FOUND", "Transaction not found");
        }

        // STRICT OWNER CHECK: Only the business owner can edit
        if (!tx.getBusiness().getOwner().getId().equals(user.getId())) {
            return ApiResponse.fail("FORBIDDEN", "Only the business owner can explicitly edit transactions.");
        }

        tx.setAmount(request.getAmount());
        tx.setDescription(request.getDescription());
        transactionRepository.save(tx);

        Map<String, Object> data = new HashMap<>();
        data.put("transactionId", tx.getId().toString());
        data.put("status", tx.getStatus());

        return ApiResponse.ok(data);
    }

    @Transactional
    public ApiResponse<Void> deleteTransaction(UUID transactionId, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) {
            return ApiResponse.fail("UNAUTHORIZED", "User not found");
        }

        Transaction tx = transactionRepository.findById(transactionId).orElse(null);
        if (tx == null) {
            return ApiResponse.fail("NOT_FOUND", "Transaction not found");
        }

        // STRICT OWNER CHECK: Only the business owner can delete
        if (!tx.getBusiness().getOwner().getId().equals(user.getId())) {
            return ApiResponse.fail("FORBIDDEN", "Only the business owner can delete transactions.");
        }

        transactionRepository.delete(tx);
        return ApiResponse.ok(null);
    }

    @Transactional
    public ApiResponse<Map<String, Object>> uploadReceipt(UUID transactionId, MultipartFile file, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) {
            return ApiResponse.fail("UNAUTHORIZED", "User not found");
        }

        Transaction tx = transactionRepository.findById(transactionId).orElse(null);
        if (tx == null) {
            return ApiResponse.fail("NOT_FOUND", "Transaction not found");
        }

        if (!isAuthorizedForBusiness(user, tx.getBusiness())) {
            return ApiResponse.fail("FORBIDDEN", "You are not authorized for this business");
        }

        // Mock Supabase Storage Upload for now, as SDD focuses on structure first
        String mockUrl = "https://mock.supabase.co/storage/v1/object/public/receipts/" + file.getOriginalFilename();
        tx.setReceiptUrl(mockUrl);
        tx.setStatus("completed");

        transactionRepository.save(tx);

        Map<String, Object> data = new HashMap<>();
        data.put("transactionId", tx.getId().toString());
        data.put("receiptUrl", tx.getReceiptUrl());
        data.put("status", tx.getStatus());

        return ApiResponse.ok(data);
    }
}
