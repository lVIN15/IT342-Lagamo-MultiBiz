package edu.cit.lagamo.multibiz.repository;

import edu.cit.lagamo.multibiz.entity.BusinessStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BusinessStaffRepository extends JpaRepository<BusinessStaff, UUID> {

    List<BusinessStaff> findByBusinessId(UUID businessId);

    List<BusinessStaff> findByUserId(UUID userId);
}
