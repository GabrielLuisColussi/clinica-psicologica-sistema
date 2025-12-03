package com.clinicaspring.service;

import jakarta.validation.Valid;
import org.springframework.stereotype.Service;

import com.clinicaspring.model.Especialidade;
import com.clinicaspring.repository.EspecialidadeRepository;

import java.util.List;
import java.util.Optional;

@Service
public class EspecialidadeService {

    private final EspecialidadeRepository repository;

    public EspecialidadeService(EspecialidadeRepository repository) {
        this.repository = repository;
    }

    public List<Especialidade> listarTodas() {
        return repository.findAll();
    }

    public Optional<Especialidade> buscarPorId(Integer id) {
        return repository.findById(id);
    }

    public Especialidade salvar(@Valid Especialidade especialidade) {
        return repository.save(especialidade);
    }

    public Especialidade atualizar(Integer id, @Valid Especialidade especialidadeAtualizada) {
        Especialidade especialidade = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Especialidade não encontrada"));
        especialidade.setNome(especialidadeAtualizada.getNome());
        return repository.save(especialidade);
    }

    public void deletar(Integer id) {
        repository.deleteById(id);
    }
}