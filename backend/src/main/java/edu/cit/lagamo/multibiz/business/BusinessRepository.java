package edu.cit.lagamo.multibiz.business;

import edu.cit.lagamo.multibiz.business.entity.Business;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BusinessRepository extends JpaRepository<Business, UUID> {

    List<Business> findByOwnerId(UUID ownerId);
}
