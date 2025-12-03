package com.clinicaspring.service;

import jakarta.validation.Valid;
import org.springframework.stereotype.Service;

import com.clinicaspring.model.Endereco;
import com.clinicaspring.repository.EnderecoRepository;

import java.util.List;
import java.util.Optional;

@Service
public class EnderecoService {

    private final EnderecoRepository repository;

    public EnderecoService(EnderecoRepository repository) {
        this.repository = repository;
    }

    public List<Endereco> listarTodos() {
        return repository.findAll();
    }

    public Optional<Endereco> buscarPorId(Integer id) {
        return repository.findById(id);
    }

    public Endereco salvar(@Valid Endereco endereco) {
        return repository.save(endereco);
    }

    public Endereco atualizar(Integer id, @Valid Endereco enderecoAtualizado) {
        Endereco endereco = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Endereço não encontrado"));
        endereco.setLogradouro(enderecoAtualizado.getLogradouro());
        endereco.setNumero(enderecoAtualizado.getNumero());
        endereco.setComplemento(enderecoAtualizado.getComplemento());
        endereco.setBairro(enderecoAtualizado.getBairro());
        endereco.setMunicipio(enderecoAtualizado.getMunicipio());
        endereco.setUf(enderecoAtualizado.getUf());
        endereco.setCep(enderecoAtualizado.getCep());
        return repository.save(endereco);
    }

    public void deletar(Integer id) {
        repository.deleteById(id);
    }
}