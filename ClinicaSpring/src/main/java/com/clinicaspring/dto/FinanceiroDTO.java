// src/main/java/com/clinicaspring/dto/FinanceiroDTO.java
package com.clinicaspring.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class FinanceiroDTO {

    private Long id;

    @NotNull(message = "ID da consulta é obrigatório")
    private Long idConsulta;

    private String formaPagamento;

    @NotBlank(message = "Status financeiro é obrigatório")
    private String statusFinanceiro;

    private LocalDate dataPagamento;

    private BigDecimal valor;

    public FinanceiroDTO() {
    }

    public FinanceiroDTO(Long id,
                         Long idConsulta,
                         String formaPagamento,
                         String statusFinanceiro,
                         LocalDate dataPagamento,
                         BigDecimal valor) {
        this.id = id;
        this.idConsulta = idConsulta;
        this.formaPagamento = formaPagamento;
        this.statusFinanceiro = statusFinanceiro;
        this.dataPagamento = dataPagamento;
        this.valor = valor;
    }

    // ================== Getters/Setters ==================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getIdConsulta() {
        return idConsulta;
    }

    public void setIdConsulta(Long idConsulta) {
        this.idConsulta = idConsulta;
    }

    public String getFormaPagamento() {
        return formaPagamento;
    }

    public void setFormaPagamento(String formaPagamento) {
        this.formaPagamento = formaPagamento;
    }

    public String getStatusFinanceiro() {
        return statusFinanceiro;
    }

    public void setStatusFinanceiro(String statusFinanceiro) {
        this.statusFinanceiro = statusFinanceiro;
    }

    public LocalDate getDataPagamento() {
        return dataPagamento;
    }

    public void setDataPagamento(LocalDate dataPagamento) {
        this.dataPagamento = dataPagamento;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }
}
