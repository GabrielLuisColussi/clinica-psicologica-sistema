package com.clinicaspring.controller;

import com.clinicaspring.model.Pessoa;
import com.clinicaspring.service.PessoaService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/medicos")
public class MedicoController {

    private final PessoaService service;

    public MedicoController(PessoaService service) {
        this.service = service;
    }

    @GetMapping
    public Map<String, Object> listarMedicos(
            @RequestParam(defaultValue = "MEDICO") String tipo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String q
    ) {
        Pessoa.TipoPessoa tp = TipoPessoaUtil.parse(tipo);
        var pag = service.listarPorTipo(tp, page, size, q); // Page<PessoaDTO>

        return Map.of(
                "content",        pag.getContent(),
                "totalElements",  pag.getTotalElements(),
                "number",         pag.getNumber(),
                "size",           pag.getSize()
        );
    }
}
