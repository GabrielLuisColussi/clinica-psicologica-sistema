package com.clinicaspring.dto;

import java.time.LocalDate;
import jakarta.validation.constraints.NotBlank;

public class PessoaUpsertDTO {

  @NotBlank private String nome;
  @NotBlank private String cpf;
  private LocalDate dataNascimento;
  @NotBlank private String email;
  @NotBlank private String telefone;

  /** paciente | medico | recepcionista (case-insensitive) */
  @NotBlank private String tipoPessoa;

  // só para médico (opcional)
  private String crm;

  // relacionamentos opcionais
  private Integer idEspecialidade;
  private Integer idEndereco;

  // getters/setters
  public String getNome() { return nome; }
  public void setNome(String nome) { this.nome = nome; }

  public String getCpf() { return cpf; }
  public void setCpf(String cpf) { this.cpf = cpf; }

  public LocalDate getDataNascimento() { return dataNascimento; }
  public void setDataNascimento(LocalDate d) { this.dataNascimento = d; }

  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }

  public String getTelefone() { return telefone; }
  public void setTelefone(String telefone) { this.telefone = telefone; }

  public String getTipoPessoa() { return tipoPessoa; }
  public void setTipoPessoa(String tipoPessoa) { this.tipoPessoa = tipoPessoa; }

  public String getCrm() { return crm; }
  public void setCrm(String crm) { this.crm = crm; }

  public Integer getIdEspecialidade() { return idEspecialidade; }
  public void setIdEspecialidade(Integer idEspecialidade) { this.idEspecialidade = idEspecialidade; }

  public Integer getIdEndereco() { return idEndereco; }
  public void setIdEndereco(Integer idEndereco) { this.idEndereco = idEndereco; }
}
