package com.clinicaspring.dto;

import com.clinicaspring.model.Consulta;
import com.clinicaspring.model.Pessoa;
import java.time.LocalDate;

/**
 * DTO de saída usado na listagem/consulta de agendamentos.
 * Campos compatíveis com o front (agendamentos.js):
 * id, pacienteId, pacienteNome, medicoId, medicoNome,
 * data, hora, status, observacoes, duracao
 */
public class ConsultaResponseDTO {

    private Integer id;
    private Integer pacienteId;
    private String  pacienteNome;
    private Integer medicoId;
    private String  medicoNome;
    private LocalDate data;
    private String  hora;
    private String  status;
    private String  observacoes;
    private Integer duracao;

    public ConsultaResponseDTO(Consulta c) {
        this.id = c.getId(); // use o getter que você tem para o ID (getId ou getIdConsulta)
        // se sua entidade usa getIdConsulta(), troque a linha acima para: this.id = c.getIdConsulta();

        Pessoa p = c.getPaciente();
        this.pacienteId   = (p != null ? p.getIdPessoa() : null);
        this.pacienteNome = (p != null ? p.getNome()     : null);

        Pessoa m = c.getMedico();
        this.medicoId   = (m != null ? m.getIdPessoa() : null);
        this.medicoNome = (m != null ? m.getNome()     : null);

        // aliases adicionados na entidade
        this.data        = c.getData();
        this.hora        = c.getHora();
        this.status      = c.getStatus();        // string (ex.: "AGENDADA")
        this.observacoes = c.getObservacoes();
        this.duracao     = c.getDuracao();
    }

    // getters (Jackson usa para serializar)
    public Integer getId() { return id; }
    public Integer getPacienteId() { return pacienteId; }
    public String  getPacienteNome() { return pacienteNome; }
    public Integer getMedicoId() { return medicoId; }
    public String  getMedicoNome() { return medicoNome; }
    public LocalDate getData() { return data; }
    public String  getHora() { return hora; }
    public String  getStatus() { return status; }
    public String  getObservacoes() { return observacoes; }
    public Integer getDuracao() { return duracao; }
}
