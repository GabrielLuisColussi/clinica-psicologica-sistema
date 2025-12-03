// src/main/java/com/clinicaspring/service/FinanceiroService.java
package com.clinicaspring.service;

import com.clinicaspring.dto.FinanceiroDTO;
import com.clinicaspring.model.Financeiro;
import com.clinicaspring.repository.FinanceiroRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Service
public class FinanceiroService {

    @Autowired
    private FinanceiroRepository repo;

    private FinanceiroDTO toDTO(Financeiro f) {
        if (f == null) return null;
        return new FinanceiroDTO(
                f.getId(),
                f.getIdConsulta(),
                f.getFormaPagamento(),
                f.getStatusFinanceiro(),
                f.getDataPagamento(),
                f.getValor()
        );
    }

    private void fromDTO(FinanceiroDTO dto, Financeiro f) {
        if (dto.getIdConsulta() != null) {
            f.setIdConsulta(dto.getIdConsulta());
        }
        if (dto.getFormaPagamento() != null) {
            f.setFormaPagamento(dto.getFormaPagamento());
        }
        if (dto.getStatusFinanceiro() != null) {
            f.setStatusFinanceiro(dto.getStatusFinanceiro());
        }
        if (dto.getDataPagamento() != null) {
            f.setDataPagamento(dto.getDataPagamento());
        }
        if (dto.getValor() != null) {
            f.setValor(dto.getValor());
        }
    }

    /**
     * Regra de negócio: valor não pode ser negativo.
     */
    private void validarValorNaoNegativo(FinanceiroDTO dto) {
        BigDecimal valor = dto.getValor();
        if (valor != null && valor.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Valor não pode ser negativo");
        }
    }

    public Page<FinanceiroDTO> listar(LocalDate from, LocalDate to, String status,
                                      int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("dataPagamento").descending());
        return repo.filtrar(status, from, to, pageable).map(this::toDTO);
    }

    public FinanceiroDTO buscarPorId(Long id) {
        Financeiro f = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Lançamento não encontrado"));
        return toDTO(f);
    }

    public FinanceiroDTO criar(FinanceiroDTO dto) {
        if (dto.getIdConsulta() == null) {
            throw new RuntimeException("idConsulta é obrigatório");
        }

        // validação de valor
        validarValorNaoNegativo(dto);

        // upsert por idConsulta – evita Duplicate entry
        Optional<Financeiro> existenteOpt = repo.findByIdConsulta(dto.getIdConsulta());
        Financeiro f = existenteOpt.orElseGet(Financeiro::new);

        if (f.getIdConsulta() == null) {
            f.setIdConsulta(dto.getIdConsulta());
        }

        if (dto.getStatusFinanceiro() == null || dto.getStatusFinanceiro().isBlank()) {
            dto.setStatusFinanceiro("nao pago");
        }

        fromDTO(dto, f);
        return toDTO(repo.save(f));
    }

    public FinanceiroDTO atualizar(Long id, FinanceiroDTO dto) {
        Financeiro f = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Lançamento não encontrado"));

        // validação de valor
        validarValorNaoNegativo(dto);

        fromDTO(dto, f);
        return toDTO(repo.save(f));
    }

    public void excluir(Long id) {
        repo.deleteById(id);
    }

    public FinanceiroDTO marcarPago(Long id, LocalDate dataPag) {
        Financeiro f = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Lançamento não encontrado"));

        f.setStatusFinanceiro("pago");
        if (dataPag == null) {
            dataPag = LocalDate.now();
        }
        f.setDataPagamento(dataPag);

        return toDTO(repo.save(f));
    }
}
