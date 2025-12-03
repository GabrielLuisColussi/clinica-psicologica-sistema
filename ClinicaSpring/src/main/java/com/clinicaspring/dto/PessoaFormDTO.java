package com.clinicaspring.dto;

import java.time.LocalDate;

public class PessoaFormDTO {
  private String nome;
  private String cpf;
  private LocalDate dataNascimento;
  private String email;
  private String telefone;

  // String para conseguirmos fazer valueOf( ... .toUpperCase() )
  private String tipoPessoa; // paciente | medico | recepcionista
  private String crm;        // opcional (para medico)

  private Integer idEspecialidade; // opcional
  private Integer idEndereco;      // opcional

  // getters/setters
  public String getNome() { return nome; }
  public void setNome(String nome) { this.nome = nome; }

  public String getCpf() { return cpf; }
  public void setCpf(String cpf) { this.cpf = cpf; }

  public LocalDate getDataNascimento() { return dataNascimento; }
  public void setDataNascimento(LocalDate dataNascimento) { this.dataNascimento = dataNascimento; }

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
