package com.clinicaspring.controller;

import com.clinicaspring.dto.PessoaDTO;
import com.clinicaspring.dto.PessoaUpsertDTO;
import com.clinicaspring.model.Endereco;
import com.clinicaspring.model.Especialidade;
import com.clinicaspring.model.Pessoa;
import com.clinicaspring.repository.EnderecoRepository;
import com.clinicaspring.repository.EspecialidadeRepository;
import com.clinicaspring.service.PessoaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/pessoas")
public class PessoaController {

    private final PessoaService service;
    private final EspecialidadeRepository especialidadeRepository;
    private final EnderecoRepository enderecoRepository;

    public PessoaController(
            PessoaService service,
            EspecialidadeRepository especialidadeRepository,
            EnderecoRepository enderecoRepository) {
        this.service = service;
        this.especialidadeRepository = especialidadeRepository;
        this.enderecoRepository = enderecoRepository;
    }

    // Lista paginada por tipo (PACIENTE, MEDICO, RECEPCIONISTA) com mesmo shape que o front usa
    @GetMapping
    public Map<String, Object> listar(
            @RequestParam(defaultValue = "PACIENTE") String tipo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String q
    ) {
        var tp = TipoPessoaUtil.parse(tipo);
        var pg = service.listarPorTipo(tp, page, size, q);
        return Map.of(
                "content",        pg.getContent(),
                "totalElements",  pg.getTotalElements(),
                "number",         pg.getNumber(),
                "size",           pg.getSize()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pessoa> buscar(@PathVariable Integer id) {
        return service.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Pessoa> salvar(@Valid @RequestBody PessoaUpsertDTO dto) {
        // usa o helper que já trata especialidade + ENDEREÇO (idEndereco)
        Pessoa p = fromDTO(dto);
        return ResponseEntity.ok(service.salvar(p));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Pessoa> atualizar(@PathVariable Integer id,
                                            @Valid @RequestBody PessoaUpsertDTO dto) {
        Pessoa p = service.buscarPorId(id)
                .orElseThrow(() -> new IllegalArgumentException("Pessoa não encontrada"));

        // reaproveita a mesma lógica do fromDTO/copyDTO,
        // que já cuida de especialidade E ENDEREÇO (idEndereco)
        copyDTO(dto, p);

        return ResponseEntity.ok(service.salvar(p));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Integer id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }

    // ----------------- helpers -----------------

    private Pessoa fromDTO(PessoaUpsertDTO dto) {
        Pessoa p = new Pessoa();
        copyDTO(dto, p);
        return p;
    }

    private void copyDTO(PessoaUpsertDTO dto, Pessoa p) {
        p.setNome(dto.getNome());
        p.setTelefone(dto.getTelefone());
        p.setEmail(dto.getEmail());
        p.setCpf(dto.getCpf());
        p.setDataNascimento(dto.getDataNascimento());

        // tipo robusto (aceita letras minúsculas/maiúsculas)
        p.setTipoPessoa(TipoPessoaUtil.parse(dto.getTipoPessoa()));

        p.setCrm(dto.getCrm());

        // especialidade opcional
        if (dto.getIdEspecialidade() != null) {
            Especialidade esp = especialidadeRepository.findById(dto.getIdEspecialidade())
                    .orElseThrow(() -> new IllegalArgumentException("Especialidade não encontrada"));
            p.setEspecialidade(esp);
        } else {
            p.setEspecialidade(null);
        }

        // endereço opcional
        if (dto.getIdEndereco() != null) {
            Endereco end = enderecoRepository.findById(dto.getIdEndereco())
                    .orElseThrow(() -> new IllegalArgumentException("Endereço não encontrado"));
            p.setEndereco(end);
        } else {
            p.setEndereco(null);
        }
    }
}
