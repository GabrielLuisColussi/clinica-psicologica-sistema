package com.clinicaspring.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "consultas")
public class Consulta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private LocalDate data;       // OK para o front
    private String hora;          // OK para o front
    private Integer duracao;      // em minutos
    private String status;        // String (ex.: "AGENDADA", "CANCELADA")
    private String observacoes;   // OK para o front

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_paciente", nullable = false)
    private Pessoa paciente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_medico", nullable = false)
    private Pessoa medico;

    public Consulta() {}

    // Getters/Setters básicos
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public LocalDate getData() { return data; }
    public void setData(LocalDate data) { this.data = data; }

    public String getHora() { return hora; }
    public void setHora(String hora) { this.hora = hora; }

    public Integer getDuracao() { return duracao; }
    public void setDuracao(Integer duracao) { this.duracao = duracao; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }

    public Pessoa getPaciente() { return paciente; }
    public void setPaciente(Pessoa paciente) { this.paciente = paciente; }

    public Pessoa getMedico() { return medico; }
    public void setMedico(Pessoa medico) { this.medico = medico; }

    // --- Helpers opcionais (aparecem no JSON, mas não viram colunas no DB) ---
    @Transient
    public Integer getPacienteId() { return paciente != null ? paciente.getIdPessoa() : null; }

    @Transient
    public String getPacienteNome() { return paciente != null ? paciente.getNome() : null; }

    @Transient
    public Integer getMedicoId() { return medico != null ? medico.getIdPessoa() : null; }

    @Transient
    public String getMedicoNome() { return medico != null ? medico.getNome() : null; }
}
