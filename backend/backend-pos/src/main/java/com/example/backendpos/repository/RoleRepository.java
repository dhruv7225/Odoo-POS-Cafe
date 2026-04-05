package com.example.backendpos.repository;
import com.example.backendpos.entity.Role;
import com.example.backendpos.enums.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleName name);
}
