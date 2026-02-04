package com.example.demo.config;


import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entity.Appointment;
import com.example.demo.entity.Department;
import com.example.demo.entity.Doctor;
import com.example.demo.entity.Patient;
import com.example.demo.repository.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (departmentRepository.count() > 0) return;

        Department cardio = departmentRepository.save(Department.builder()
                .name("Cardiology")
                .description("Heart and cardiovascular system")
                .build());
        Department neuro = departmentRepository.save(Department.builder()
                .name("Neurology")
                .description("Brain and nervous system")
                .build());
        Department ortho = departmentRepository.save(Department.builder()
                .name("Orthopedics")
                .description("Bones and musculoskeletal system")
                .build());

        Doctor d1 = doctorRepository.save(Doctor.builder()
                .name("Dr. Sarah Mitchell")
                .specialization("Cardiologist")
                .email("sarah.mitchell@hospital.com")
                .phone("555-0101")
                .department(cardio)
                .build());
        Doctor d2 = doctorRepository.save(Doctor.builder()
                .name("Dr. James Wilson")
                .specialization("Neurologist")
                .email("james.wilson@hospital.com")
                .phone("555-0102")
                .department(neuro)
                .build());
        Doctor d3 = doctorRepository.save(Doctor.builder()
                .name("Dr. Emily Chen")
                .specialization("Orthopedic Surgeon")
                .email("emily.chen@hospital.com")
                .phone("555-0103")
                .department(ortho)
                .build());

        Patient p1 = patientRepository.save(Patient.builder()
                .name("John Doe")
                .email("john.doe@email.com")
                .phone("555-1001")
                .dateOfBirth(LocalDate.of(1985, 3, 15))
                .address("123 Main St")
                .bloodGroup("O+")
                .build());
        Patient p2 = patientRepository.save(Patient.builder()
                .name("Jane Smith")
                .email("jane.smith@email.com")
                .phone("555-1002")
                .dateOfBirth(LocalDate.of(1990, 7, 22))
                .address("456 Oak Ave")
                .bloodGroup("A+")
                .build());

        appointmentRepository.save(Appointment.builder()
                .patient(p1)
                .doctor(d1)
                .department(cardio)
                .appointmentDate(LocalDateTime.now().plusDays(1))
                .status("SCHEDULED")
                .notes("Annual checkup")
                .build());
        appointmentRepository.save(Appointment.builder()
                .patient(p2)
                .doctor(d2)
                .department(neuro)
                .appointmentDate(LocalDateTime.now().plusDays(2))
                .status("SCHEDULED")
                .notes("Follow-up consultation")
                .build());
    }
}

