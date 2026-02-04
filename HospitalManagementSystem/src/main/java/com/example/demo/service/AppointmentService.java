package com.example.demo.service;




import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.AppointmentDTO;
import com.example.demo.entity.Appointment;
import com.example.demo.entity.Department;
import com.example.demo.entity.Doctor;
import com.example.demo.entity.*;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.AppointmentRepository;
import com.example.demo.repository.DepartmentRepository;
import com.example.demo.repository.DoctorRepository;
import com.example.demo.repository.PatientRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;

    @Transactional(readOnly = true)
    public List<AppointmentDTO> findAll() {
        return appointmentRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AppointmentDTO findById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
        return toDTO(appointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO> findByPatient(Long patientId) {
        return appointmentRepository.findByPatientId(patientId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO> findByDoctor(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AppointmentDTO create(AppointmentDTO dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + dto.getPatientId()));
        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + dto.getDoctorId()));
        Department department = dto.getDepartmentId() != null
                ? departmentRepository.findById(dto.getDepartmentId()).orElse(doctor.getDepartment())
                : doctor.getDepartment();

        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .department(department)
                .appointmentDate(dto.getAppointmentDate())
                .status(dto.getStatus() != null ? dto.getStatus() : "SCHEDULED")
                .notes(dto.getNotes())
                .build();
        appointment = appointmentRepository.save(appointment);
        return toDTO(appointment);
    }

    @Transactional
    public AppointmentDTO update(Long id, AppointmentDTO dto) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));

        if (dto.getPatientId() != null) {
            Patient patient = patientRepository.findById(dto.getPatientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + dto.getPatientId()));
            appointment.setPatient(patient);
        }
        if (dto.getDoctorId() != null) {
            Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + dto.getDoctorId()));
            appointment.setDoctor(doctor);
            if (doctor.getDepartment() != null) {
                appointment.setDepartment(doctor.getDepartment());
            }
        }
        if (dto.getAppointmentDate() != null) {
            appointment.setAppointmentDate(dto.getAppointmentDate());
        }
        if (dto.getStatus() != null) {
            appointment.setStatus(dto.getStatus());
        }
        if (dto.getNotes() != null) {
            appointment.setNotes(dto.getNotes());
        }

        appointment = appointmentRepository.save(appointment);
        return toDTO(appointment);
    }

    @Transactional
    public void delete(Long id) {
        if (!appointmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Appointment not found with id: " + id);
        }
        appointmentRepository.deleteById(id);
    }

    private AppointmentDTO toDTO(Appointment appointment) {
        return AppointmentDTO.builder()
                .id(appointment.getId())
                .patientId(appointment.getPatient().getId())
                .patientName(appointment.getPatient().getName())
                .doctorId(appointment.getDoctor().getId())
                .doctorName(appointment.getDoctor().getName())
                .departmentId(appointment.getDepartment() != null ? appointment.getDepartment().getId() : null)
                .departmentName(appointment.getDepartment() != null ? appointment.getDepartment().getName() : null)
                .appointmentDate(appointment.getAppointmentDate())
                .status(appointment.getStatus())
                .notes(appointment.getNotes())
                .build();
    }
}
