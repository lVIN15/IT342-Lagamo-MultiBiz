package edu.cit.lagamo.multibiz.repository;

import edu.cit.lagamo.multibiz.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    List<Transaction> findByBusinessId(UUID businessId);

    List<Transaction> findByBusinessIdAndCreatedAtBetween(UUID businessId, LocalDateTime start, LocalDateTime end);
}
