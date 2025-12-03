package com.clinicaspring.service;

import com.clinicaspring.dto.PessoaDTO;
import com.clinicaspring.model.Pessoa;
import com.clinicaspring.repository.PessoaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
public class PessoaService {

    private final PessoaRepository repo;

    public PessoaService(PessoaRepository repo) {
        this.repo = repo;
    }

    // ---- CRUD básico usado no Controller ----
    public Optional<Pessoa> buscarPorId(Integer id) { return repo.findById(id); }

    public Pessoa salvar(Pessoa p) {
    // Normaliza CPF (remove pontos/traços) se vier formatado
    if (p.getCpf() != null) {
        String cpf = p.getCpf().replaceAll("\\D", "");
        p.setCpf(cpf);

        boolean exists;
        if (p.getIdPessoa() == null) {
            // inclusão
            exists = repo.existsByCpf(cpf);
        } else {
            // edição – ignora o próprio registro
            exists = repo.existsByCpfAndIdPessoaNot(cpf, p.getIdPessoa());
        }

        if (exists) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "CPF já cadastrado para outra pessoa."
            );
        }
    }

    return repo.save(p);
}

    public void deletar(Integer id) { repo.deleteById(id); }

    // ---- Listagem com paginação (usada pelos controllers de pacientes/médicos) ----
    public Page<PessoaDTO> listarPorTipo(Pessoa.TipoPessoa tipo, int page, int size, String q) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("nome").ascending());
    Page<Pessoa> pg;

    if (q != null && !q.isBlank()) {
        pg = repo.findByTipoPessoaAndNomeContainingIgnoreCase(tipo, q.trim(), pageable);
    } else {
        pg = repo.findByTipoPessoa(tipo, pageable);
    }

    return pg.map(this::mapToDTO); // 👈 AQUI ESTÁ O AJUSTE
}

    private PessoaDTO mapToDTO(Pessoa p) {
    PessoaDTO dto = new PessoaDTO();
    dto.setId(p.getIdPessoa());
    dto.setNome(p.getNome());
    dto.setTelefone(p.getTelefone());

    dto.setCrm(p.getCrm());
    dto.setEspecialidade(p.getEspecialidade());
    
    if (p.getEndereco() != null) {
        dto.setCidade(p.getEndereco().getMunicipio());
        dto.setUf(p.getEndereco().getUf());
    } else {
        dto.setCidade(null);
        dto.setUf(null);
    }
    return dto;
}
}
