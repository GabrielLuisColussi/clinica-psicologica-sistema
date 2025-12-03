package com.clinicaspring.controller;

import com.clinicaspring.model.Pessoa;
import com.clinicaspring.service.PessoaService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/pacientes")
public class PacienteController {

    private final PessoaService service;

    public PacienteController(PessoaService service) {
        this.service = service;
    }

    @GetMapping
    public Map<String, Object> listarPacientes(
            @RequestParam(defaultValue = "PACIENTE") String tipo,
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
