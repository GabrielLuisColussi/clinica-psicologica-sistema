package com.clinicaspring.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "especialidades")
public class Especialidade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_especialidade")
    private Integer idEspecialidade;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String nome;

    public Especialidade() {}

    public Integer getIdEspecialidade() { return idEspecialidade; }
    public void setIdEspecialidade(Integer idEspecialidade) { this.idEspecialidade = idEspecialidade; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
}