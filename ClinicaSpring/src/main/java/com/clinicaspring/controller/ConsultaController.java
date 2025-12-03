package com.clinicaspring.controller;

import com.clinicaspring.dto.ConsultaDTO;
import com.clinicaspring.model.Consulta;
import com.clinicaspring.model.Pessoa;
import com.clinicaspring.repository.ConsultaRepository;
import com.clinicaspring.repository.PessoaRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.Arrays;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/consultas")
@CrossOrigin(origins = {"http://127.0.0.1:5500","http://localhost:5500"})
public class ConsultaController {

    @Autowired private ConsultaRepository consultaRepo;
    @Autowired private PessoaRepository pessoaRepo;

    @GetMapping
    public Map<String,Object> list(
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "200") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("data").ascending());
        LocalDate f = (from != null) ? from : LocalDate.now().minusYears(1);
        LocalDate t = (to != null) ? to : LocalDate.now().plusYears(1);

        Page<Consulta> res = consultaRepo.findByDataBetween(f, t, pageable);

        List<ConsultaDTO> list = res.stream().map(this::toDTO).toList();
        return Map.of("content", list, "totalElements", res.getTotalElements(), "number", page, "size", size);
    }

    @PostMapping
    public ResponseEntity<Map<String,Object>> create(@RequestBody ConsultaDTO dto) {
        // Validação: não permite datas passadas
        if (dto.getData() != null && dto.getData().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Não é possível agendar consultas com data passada");
        }
        
        // Validação: horário deve estar entre 7h e 17h
        if (dto.getHora() != null && !dto.getHora().trim().isEmpty()) {
            try {
                LocalTime horaConsulta = LocalTime.parse(dto.getHora(), DateTimeFormatter.ofPattern("HH:mm"));
                LocalTime horaMinima = LocalTime.of(7, 0);
                LocalTime horaMaxima = LocalTime.of(17, 0);
                
                if (horaConsulta.isBefore(horaMinima) || horaConsulta.isAfter(horaMaxima)) {
                    throw new IllegalArgumentException("Horário de agendamento deve estar entre 07:00 e 17:00");
                }
            } catch (IllegalArgumentException e) {
                if (e.getMessage().contains("Horário")) {
                    throw e; // Re-lança se for erro de validação de horário
                }
                // Ignora erros de parsing, será validado em outro lugar se necessário
            }
        }
        
        Consulta c = new Consulta();
        apply(dto, c);
        consultaRepo.save(c);
        return ResponseEntity.ok(Map.of("id", c.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String,Object>> update(@PathVariable Integer id, @RequestBody ConsultaDTO dto) {
        // Validação: não permite datas passadas
        if (dto.getData() != null && dto.getData().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Não é possível agendar consultas com data passada");
        }
        
        // Validação: horário deve estar entre 7h e 17h
        if (dto.getHora() != null && !dto.getHora().trim().isEmpty()) {
            try {
                LocalTime horaConsulta = LocalTime.parse(dto.getHora(), DateTimeFormatter.ofPattern("HH:mm"));
                LocalTime horaMinima = LocalTime.of(7, 0);
                LocalTime horaMaxima = LocalTime.of(17, 0);
                
                if (horaConsulta.isBefore(horaMinima) || horaConsulta.isAfter(horaMaxima)) {
                    throw new IllegalArgumentException("Horário de agendamento deve estar entre 07:00 e 17:00");
                }
            } catch (IllegalArgumentException e) {
                if (e.getMessage().contains("Horário")) {
                    throw e; // Re-lança se for erro de validação de horário
                }
                // Ignora erros de parsing, será validado em outro lugar se necessário
            }
        }
        
        Consulta c = consultaRepo.findById(id).orElseThrow(() -> new RuntimeException("Consulta não encontrada"));
        apply(dto, c);
        consultaRepo.save(c);
        return ResponseEntity.ok(Map.of("id", c.getId(), "updated", true));
    }

    /**
     * Atualiza apenas o status da consulta.
     * Usado pelo sininho de notificações e pela tela de agendamentos.
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String,Object>> updateStatus(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.trim().isEmpty()) {
            throw new IllegalArgumentException("Status é obrigatório");
        }

        Consulta c = consultaRepo.findById(id).orElseThrow(() -> new RuntimeException("Consulta não encontrada"));
        // Normaliza para maiúsculo, mas mantém o texto recebido (ex.: CONCLUIDO, CANCELADO)
        c.setStatus(status.toUpperCase());
        consultaRepo.save(c);

        return ResponseEntity.ok(Map.of(
                "id", c.getId(),
                "status", c.getStatus(),
                "updated", true
        ));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        consultaRepo.deleteById(id);
    }

    @GetMapping("/notificacoes/pendentes")
    public Map<String,Object> consultasPendentes() {
        LocalDate hoje = LocalDate.now();
        LocalTime agora = LocalTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
        
        // Busca consultas passadas que não estão como "CONCLUÍDA", "CONCLUIDO" ou "CANCELADA", "CANCELADO"
        List<String> statusExcluidos = Arrays.asList("CONCLUÍDA", "CONCLUIDA", "CONCLUIDO", "CANCELADA", "CANCELADO", "FINALIZADA", "FINALIZADO");
        
        // Consultas de dias anteriores
        List<Consulta> passadas = consultaRepo.findConsultasPassadasPendentes(hoje, statusExcluidos);
        
        // Consultas do dia atual
        List<Consulta> doDiaAtual = consultaRepo.findConsultasDoDiaAtual(hoje, statusExcluidos);
        
        // Filtra consultas do dia atual onde o horário já passou ou é igual ao atual
        List<Consulta> doDiaAtualPassadas = doDiaAtual.stream()
            .filter(c -> {
                if (c.getHora() == null || c.getHora().trim().isEmpty()) {
                    return false;
                }
                try {
                    LocalTime horaConsulta = LocalTime.parse(c.getHora(), formatter);
                    // Se o horário da consulta já passou ou é igual ao horário atual, considera pendente
                    return horaConsulta.isBefore(agora) || horaConsulta.equals(agora);
                } catch (Exception e) {
                    // Se não conseguir parsear, considera como pendente por segurança
                    return true;
                }
            })
            .collect(Collectors.toList());
        
        // Combina as duas listas
        List<Consulta> todasPendentes = new ArrayList<>();
        todasPendentes.addAll(passadas);
        todasPendentes.addAll(doDiaAtualPassadas);
        
        List<ConsultaDTO> list = todasPendentes.stream().map(this::toDTO).toList();
        return Map.of("content", list, "total", list.size());
    }

    private void apply(ConsultaDTO dto, Consulta c) {
        c.setData(dto.getData());
        c.setHora(dto.getHora());
        c.setDuracao(dto.getDuracao());
        c.setStatus(dto.getStatus());
        c.setObservacoes(dto.getObservacoes());

        Pessoa paciente = pessoaRepo.findById(dto.getPacienteId())
                .orElseThrow(() -> new RuntimeException("Paciente não encontrado"));
        Pessoa medico = pessoaRepo.findById(dto.getMedicoId())
                .orElseThrow(() -> new RuntimeException("Médico não encontrado"));

        c.setPaciente(paciente);
        c.setMedico(medico);
    }

    private ConsultaDTO toDTO(Consulta c) {
        ConsultaDTO dto = new ConsultaDTO();
        dto.setId(c.getId());
        dto.setData(c.getData());
        dto.setHora(c.getHora());
        dto.setDuracao(c.getDuracao());
        dto.setStatus(c.getStatus());
        dto.setObservacoes(c.getObservacoes());
        dto.setPacienteId(c.getPaciente().getIdPessoa());
        dto.setMedicoId(c.getMedico().getIdPessoa());
        dto.setPacienteNome(c.getPaciente().getNome());
        dto.setMedicoNome(c.getMedico().getNome());
        return dto;
    }
}
