// src/main/java/com/clinicaspring/repository/FinanceiroRepository.java
package com.clinicaspring.repository;

import com.clinicaspring.model.Financeiro;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface FinanceiroRepository extends JpaRepository<Financeiro, Long> {

    @Query("""
           SELECT f FROM Financeiro f
           WHERE (:status IS NULL OR :status = '' OR f.statusFinanceiro = :status)
             AND (:from IS NULL OR f.dataPagamento >= :from)
             AND (:to   IS NULL OR f.dataPagamento <= :to)
           """)
    Page<Financeiro> filtrar(
            @Param("status") String status,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable
    );

    Optional<Financeiro> findByIdConsulta(Long idConsulta);
}
