// src/main/java/com/clinicaspring/controller/FinanceiroController.java
package com.clinicaspring.controller;

import com.clinicaspring.dto.FinanceiroDTO;
import com.clinicaspring.service.FinanceiroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/financeiro")
@CrossOrigin(origins = "*")
public class FinanceiroController {

    @Autowired
    private FinanceiroService service;

    @GetMapping
    public Page<FinanceiroDTO> listar(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return service.listar(from, to, status, page, size);
    }

    @GetMapping("/{id}")
    public FinanceiroDTO buscar(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    public FinanceiroDTO criar(@RequestBody FinanceiroDTO dto) {
        return service.criar(dto);
    }

    @PutMapping("/{id}")
    public FinanceiroDTO atualizar(@PathVariable Long id,
                                   @RequestBody FinanceiroDTO dto) {
        return service.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.excluir(id);
    }

    @PutMapping("/{id}/pagar")
    public FinanceiroDTO pagar(@PathVariable Long id,
                               @RequestBody Map<String,Object> body) {

        String dt = body.get("dataPagamento") != null
                ? String.valueOf(body.get("dataPagamento"))
                : null;

        LocalDate dataPag = null;
        if (dt != null && !dt.isBlank()) {
            dataPag = LocalDate.parse(dt);
        }

        return service.marcarPago(id, dataPag);
    }
}
