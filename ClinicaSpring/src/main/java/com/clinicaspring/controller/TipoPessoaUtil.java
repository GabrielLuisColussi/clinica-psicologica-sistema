package com.clinicaspring.controller;

import com.clinicaspring.model.Pessoa;

public final class TipoPessoaUtil {
    private TipoPessoaUtil(){}

    public static Pessoa.TipoPessoa parse(String raw) {
        if (raw == null) throw new IllegalArgumentException("tipo obrigatório");
        switch (raw.trim().toUpperCase()) {
            case "PACIENTE":      return Pessoa.TipoPessoa.PACIENTE;
            case "MEDICO":        return Pessoa.TipoPessoa.MEDICO;
            case "RECEPCIONISTA": return Pessoa.TipoPessoa.RECEPCIONISTA;
            default:
                throw new IllegalArgumentException(
                        "Tipo de pessoa inválido: " + raw +
                        ". Valores aceitos: PACIENTE, MEDICO, RECEPCIONISTA");
        }
    }
}
