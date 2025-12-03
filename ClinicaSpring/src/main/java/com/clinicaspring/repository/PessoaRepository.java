package com.clinicaspring.repository;

import com.clinicaspring.model.Pessoa;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PessoaRepository extends JpaRepository<Pessoa, Integer> {

    // onde antes estava findByTipo(...)
    Page<Pessoa> findByTipoPessoa(Pessoa.TipoPessoa tipo, Pageable pageable);

    // onde antes estava findByTipoAndNomeContainingIgnoreCase(...)
    Page<Pessoa> findByTipoPessoaAndNomeContainingIgnoreCase(
            Pessoa.TipoPessoa tipo,
            String nome,
            Pageable pageable
    );

    boolean existsByCpf(String cpf);
    boolean existsByCpfAndIdPessoaNot(String cpf, Integer idPessoa);
}
