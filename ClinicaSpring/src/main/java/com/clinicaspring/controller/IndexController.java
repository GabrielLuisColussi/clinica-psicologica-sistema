package com.clinicaspring.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class IndexController {

    /**
     * Serve o index.html para a rota raiz.
     * 
     * O frontend usa hash-based routing (#/dashboard, #/pacientes, etc),
     * então só precisa servir o index.html na rota raiz "/".
     * O JavaScript no cliente cuida do roteamento usando o hash.
     * 
     * As rotas da API (/auth, /pacientes, /medicos, etc) têm precedência porque
     * os outros controllers são verificados primeiro pelo Spring MVC.
     */
    @GetMapping(value = "/", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<Resource> index() {
        Resource resource = new ClassPathResource("/static/index.html");
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(MediaType.TEXT_HTML_VALUE))
                .body(resource);
    }
}

