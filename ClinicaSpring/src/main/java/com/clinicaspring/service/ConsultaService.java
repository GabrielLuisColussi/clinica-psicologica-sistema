package com.clinicaspring.service;

import org.springframework.stereotype.Service;

import com.clinicaspring.model.Consulta;
import com.clinicaspring.repository.ConsultaRepository;

import java.util.List;
import java.util.Optional;

@Service
public class ConsultaService {

    private final ConsultaRepository repository;

    public ConsultaService(ConsultaRepository repository) {
        this.repository = repository;
    }

    public List<Consulta> listarTodas() {
        return repository.findAll();
    }

    public Optional<Consulta> buscarPorId(Integer id) {
        return repository.findById(id);
    }

    public Consulta salvar(Consulta c) {
        return repository.save(c);
    }

    public Consulta atualizar(Integer id, Consulta nova) {
        Consulta atual = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Consulta não encontrada"));

        // Se sua regra permitir trocar paciente/médico, mantenha as linhas abaixo; senão, remova.
        atual.setPaciente(nova.getPaciente());
        atual.setMedico(nova.getMedico());

        // campos básicos — usando os aliases que adicionamos na entidade
        atual.setData(nova.getData());
        atual.setHora(nova.getHora());
        atual.setObservacoes(nova.getObservacoes());
        atual.setDuracao(nova.getDuracao());

        // status (string -> enum via alias setStatus)
        atual.setStatus(nova.getStatus());

        return repository.save(atual);
    }

    public void deletar(Integer id) {
        repository.deleteById(id);
    }
}
