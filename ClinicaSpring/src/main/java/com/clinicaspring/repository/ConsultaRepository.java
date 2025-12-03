package com.clinicaspring.repository;

import com.clinicaspring.model.Consulta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.*;
import java.time.LocalDate;
import java.util.List;

public interface ConsultaRepository extends JpaRepository<Consulta, Integer> {
    Page<Consulta> findByDataBetween(LocalDate from, LocalDate to, Pageable pageable);
    
    // Busca consultas passadas que não foram finalizadas ou canceladas
    @Query("SELECT c FROM Consulta c WHERE c.data < :data AND c.status NOT IN :statusExcluidos")
    List<Consulta> findConsultasPassadasPendentes(@Param("data") LocalDate data, @Param("statusExcluidos") List<String> statusExcluidos);
    
    // Busca consultas do dia atual que não foram finalizadas ou canceladas
    @Query("SELECT c FROM Consulta c WHERE c.data = :data AND c.status NOT IN :statusExcluidos")
    List<Consulta> findConsultasDoDiaAtual(@Param("data") LocalDate data, @Param("statusExcluidos") List<String> statusExcluidos);
}
