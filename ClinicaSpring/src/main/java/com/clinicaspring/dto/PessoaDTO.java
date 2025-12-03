package com.clinicaspring.dto;

import com.clinicaspring.model.Especialidade;

public class PessoaDTO {
  private Integer id;
  private String nome;
  private String telefone;
  private String cidade;
  private String uf;

  // 🔹 NOVOS CAMPOS
  private String crm;
  private Boolean atendimentoPrioritario;
  private Especialidade especialidade;

  public Integer getId() { return id; }
  public void setId(Integer id) { this.id = id; }

  public String getNome() { return nome; }
  public void setNome(String nome) { this.nome = nome; }

  public String getTelefone() { return telefone; }
  public void setTelefone(String telefone) { this.telefone = telefone; }

  public String getCidade() { return cidade; }
  public void setCidade(String cidade) { this.cidade = cidade; }

  public String getUf() { return uf; }
  public void setUf(String uf) { this.uf = uf; }

  // --- getters/setters novos ---
  public String getCrm() { return crm; }
  public void setCrm(String crm) { this.crm = crm; }

  public Boolean getAtendimentoPrioritario() { return atendimentoPrioritario; }
  public void setAtendimentoPrioritario(Boolean atendimentoPrioritario) {
    this.atendimentoPrioritario = atendimentoPrioritario;
  }

  public Especialidade getEspecialidade() { return especialidade; }
  public void setEspecialidade(Especialidade especialidade) {
    this.especialidade = especialidade;
  }
}
