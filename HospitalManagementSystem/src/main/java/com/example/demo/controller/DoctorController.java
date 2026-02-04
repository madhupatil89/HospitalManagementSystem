package com.example.demo.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.dto.DoctorDTO;
import com.example.demo.service.DoctorService;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class DoctorController {

    private final DoctorService doctorService = new DoctorService();

    @GetMapping
    public ResponseEntity<List<DoctorDTO>> getAll(@RequestParam(required = false) Long departmentId) {
        if (departmentId != null) {
            return ResponseEntity.ok(doctorService.findByDepartment(departmentId));
        }
        return ResponseEntity.ok(doctorService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DoctorDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.findById(id));
    }

    @PostMapping
    public ResponseEntity<DoctorDTO> create(@Valid @RequestBody DoctorDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(doctorService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DoctorDTO> update(@PathVariable Long id, @Valid @RequestBody DoctorDTO dto) {
        return ResponseEntity.ok(doctorService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        doctorService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
