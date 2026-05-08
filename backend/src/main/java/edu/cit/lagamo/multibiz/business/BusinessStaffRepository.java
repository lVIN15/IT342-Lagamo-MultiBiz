package edu.cit.lagamo.multibiz.business;

import edu.cit.lagamo.multibiz.business.entity.BusinessStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BusinessStaffRepository extends JpaRepository<BusinessStaff, UUID> {

    List<BusinessStaff> findByBusinessId(UUID businessId);

    List<BusinessStaff> findByUserId(UUID userId);

    Optional<BusinessStaff> findByBusinessIdAndUserId(UUID businessId, UUID userId);
}
