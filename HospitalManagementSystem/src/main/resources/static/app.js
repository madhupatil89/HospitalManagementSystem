const API_BASE = '/api';

// Tab navigation
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.section).classList.add('active');
        loadSection(tab.dataset.section);
    });
});

function loadSection(section) {
    switch (section) {
        case 'dashboard': loadDashboard(); break;
        case 'patients': loadPatients(); break;
        case 'doctors': loadDoctors(); break;
        case 'departments': loadDepartments(); break;
        case 'appointments': loadAppointments(); break;
    }
}

async function fetchAPI(endpoint, options = {}) {
    const res = await fetch(API_BASE + endpoint, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
    });
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
    return data;
}

// Dashboard
async function loadDashboard() {
    try {
        const [patients, doctors, departments, appointments] = await Promise.all([
            fetchAPI('/patients'),
            fetchAPI('/doctors'),
            fetchAPI('/departments'),
            fetchAPI('/appointments')
        ]);
        document.getElementById('stat-patients').textContent = patients.length;
        document.getElementById('stat-doctors').textContent = doctors.length;
        document.getElementById('stat-departments').textContent = departments.length;
        document.getElementById('stat-appointments').textContent = appointments.length;

        const recent = appointments.slice(0, 5);
        const html = recent.length
            ? recent.map(a => `
                <div class="appointment-item">
                    <span>${a.patientName} → ${a.doctorName}</span>
                    <span class="status-badge status-${a.status}">${a.status}</span>
                </div>
            `).join('')
            : '<div class="empty-state">No appointments yet</div>';
        document.getElementById('recent-appointments').innerHTML = html;
    } catch (e) {
        document.getElementById('recent-appointments').innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
    }
}

// Patients
async function loadPatients() {
    try {
        const data = await fetchAPI('/patients');
        const tbody = document.getElementById('patients-table');
        tbody.innerHTML = data.length ? data.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>${escapeHtml(p.name)}</td>
                <td>${escapeHtml(p.email || '-')}</td>
                <td>${escapeHtml(p.phone || '-')}</td>
                <td>${p.dateOfBirth || '-'}</td>
                <td>${escapeHtml(p.bloodGroup || '-')}</td>
                <td class="actions-cell">
                    <button class="btn btn-secondary btn-sm" onclick="editPatient(${p.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deletePatient(${p.id}, '${escapeHtml(p.name)}')">Delete</button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="7" class="empty-state">No patients</td></tr>';
    } catch (e) {
        document.getElementById('patients-table').innerHTML = `<tr><td colspan="7" class="empty-state">Error: ${e.message}</td></tr>`;
    }
}

function openPatientModal(patient = null) {
    const isEdit = !!patient;
    document.getElementById('modal-title').textContent = isEdit ? 'Edit Patient' : 'Add Patient';
    document.getElementById('modal-content').innerHTML = `
        <form id="patient-form">
            <div class="form-group">
                <label>Name *</label>
                <input name="name" required value="${patient ? escapeHtml(patient.name) : ''}">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input name="email" type="email" value="${patient ? escapeHtml(patient.email || '') : ''}">
            </div>
            <div class="form-group">
                <label>Phone</label>
                <input name="phone" value="${patient ? escapeHtml(patient.phone || '') : ''}">
            </div>
            <div class="form-group">
                <label>Date of Birth</label>
                <input name="dateOfBirth" type="date" value="${patient && patient.dateOfBirth ? patient.dateOfBirth : ''}">
            </div>
            <div class="form-group">
                <label>Address</label>
                <input name="address" value="${patient ? escapeHtml(patient.address || '') : ''}">
            </div>
            <div class="form-group">
                <label>Blood Group</label>
                <input name="bloodGroup" placeholder="e.g. O+" value="${patient ? escapeHtml(patient.bloodGroup || '') : ''}">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'}</button>
            </div>
        </form>
    `;
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('patient-form').onsubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        const body = {
            name: form.name.value,
            email: form.email.value || null,
            phone: form.phone.value || null,
            dateOfBirth: form.dateOfBirth.value || null,
            address: form.address.value || null,
            bloodGroup: form.bloodGroup.value || null
        };
        try {
            if (isEdit) await fetchAPI(`/patients/${patient.id}`, { method: 'PUT', body: JSON.stringify(body) });
            else await fetchAPI('/patients', { method: 'POST', body: JSON.stringify(body) });
            closeModal();
            loadPatients();
        } catch (err) {
            alert(err.message);
        }
    };
}

async function editPatient(id) {
    const patient = await fetchAPI(`/patients/${id}`);
    openPatientModal(patient);
}

async function deletePatient(id, name) {
    if (!confirm(`Delete patient "${name}"?`)) return;
    try {
        await fetchAPI(`/patients/${id}`, { method: 'DELETE' });
        loadPatients();
    } catch (e) {
        alert(e.message);
    }
}

// Doctors
async function loadDoctors() {
    try {
        const data = await fetchAPI('/doctors');
        const tbody = document.getElementById('doctors-table');
        tbody.innerHTML = data.length ? data.map(d => `
            <tr>
                <td>${d.id}</td>
                <td>${escapeHtml(d.name)}</td>
                <td>${escapeHtml(d.specialization)}</td>
                <td>${escapeHtml(d.email || '-')}</td>
                <td>${escapeHtml(d.phone || '-')}</td>
                <td>${escapeHtml(d.departmentName || '-')}</td>
                <td class="actions-cell">
                    <button class="btn btn-secondary btn-sm" onclick="editDoctor(${d.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteDoctor(${d.id}, '${escapeHtml(d.name)}')">Delete</button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="7" class="empty-state">No doctors</td></tr>';
    } catch (e) {
        document.getElementById('doctors-table').innerHTML = `<tr><td colspan="7" class="empty-state">Error: ${e.message}</td></tr>`;
    }
}

async function openDoctorModal(doctor = null) {
    const departments = await fetchAPI('/departments');
    const opts = departments.map(d => `<option value="${d.id}" ${doctor && doctor.departmentId === d.id ? 'selected' : ''}>${escapeHtml(d.name)}</option>`).join('');
    const isEdit = !!doctor;
    document.getElementById('modal-title').textContent = isEdit ? 'Edit Doctor' : 'Add Doctor';
    document.getElementById('modal-content').innerHTML = `
        <form id="doctor-form">
            <div class="form-group">
                <label>Name *</label>
                <input name="name" required value="${doctor ? escapeHtml(doctor.name) : ''}">
            </div>
            <div class="form-group">
                <label>Specialization *</label>
                <input name="specialization" required value="${doctor ? escapeHtml(doctor.specialization) : ''}">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input name="email" type="email" value="${doctor ? escapeHtml(doctor.email || '') : ''}">
            </div>
            <div class="form-group">
                <label>Phone</label>
                <input name="phone" value="${doctor ? escapeHtml(doctor.phone || '') : ''}">
            </div>
            <div class="form-group">
                <label>Department</label>
                <select name="departmentId"><option value="">-- None --</option>${opts}</select>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'}</button>
            </div>
        </form>
    `;
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('doctor-form').onsubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        const body = {
            name: form.name.value,
            specialization: form.specialization.value,
            email: form.email.value || null,
            phone: form.phone.value || null,
            departmentId: form.departmentId.value ? +form.departmentId.value : null
        };
        try {
            if (isEdit) await fetchAPI(`/doctors/${doctor.id}`, { method: 'PUT', body: JSON.stringify(body) });
            else await fetchAPI('/doctors', { method: 'POST', body: JSON.stringify(body) });
            closeModal();
            loadDoctors();
        } catch (err) {
            alert(err.message);
        }
    };
}

async function editDoctor(id) {
    const doctor = await fetchAPI(`/doctors/${id}`);
    openDoctorModal(doctor);
}

async function deleteDoctor(id, name) {
    if (!confirm(`Delete doctor "${name}"?`)) return;
    try {
        await fetchAPI(`/doctors/${id}`, { method: 'DELETE' });
        loadDoctors();
    } catch (e) {
        alert(e.message);
    }
}

// Departments
async function loadDepartments() {
    try {
        const data = await fetchAPI('/departments');
        const tbody = document.getElementById('departments-table');
        tbody.innerHTML = data.length ? data.map(d => `
            <tr>
                <td>${d.id}</td>
                <td>${escapeHtml(d.name)}</td>
                <td>${escapeHtml(d.description || '-')}</td>
                <td class="actions-cell">
                    <button class="btn btn-secondary btn-sm" onclick="editDepartment(${d.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteDepartment(${d.id}, '${escapeHtml(d.name)}')">Delete</button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="4" class="empty-state">No departments</td></tr>';
    } catch (e) {
        document.getElementById('departments-table').innerHTML = `<tr><td colspan="4" class="empty-state">Error: ${e.message}</td></tr>`;
    }
}

function openDepartmentModal(dept = null) {
    const isEdit = !!dept;
    document.getElementById('modal-title').textContent = isEdit ? 'Edit Department' : 'Add Department';
    document.getElementById('modal-content').innerHTML = `
        <form id="department-form">
            <div class="form-group">
                <label>Name *</label>
                <input name="name" required value="${dept ? escapeHtml(dept.name) : ''}">
            </div>
            <div class="form-group">
                <label>Description</label>
                <input name="description" value="${dept ? escapeHtml(dept.description || '') : ''}">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'}</button>
            </div>
        </form>
    `;
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('department-form').onsubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        const body = { name: form.name.value, description: form.description.value || null };
        try {
            if (isEdit) await fetchAPI(`/departments/${dept.id}`, { method: 'PUT', body: JSON.stringify(body) });
            else await fetchAPI('/departments', { method: 'POST', body: JSON.stringify(body) });
            closeModal();
            loadDepartments();
        } catch (err) {
            alert(err.message);
        }
    };
}

async function editDepartment(id) {
    const dept = await fetchAPI(`/departments/${id}`);
    openDepartmentModal(dept);
}

async function deleteDepartment(id, name) {
    if (!confirm(`Delete department "${name}"?`)) return;
    try {
        await fetchAPI(`/departments/${id}`, { method: 'DELETE' });
        loadDepartments();
    } catch (e) {
        alert(e.message);
    }
}

// Appointments
async function loadAppointments() {
    try {
        const data = await fetchAPI('/appointments');
        const tbody = document.getElementById('appointments-table');
        const formatDt = dt => new Date(dt).toLocaleString();
        tbody.innerHTML = data.length ? data.map(a => `
            <tr>
                <td>${a.id}</td>
                <td>${escapeHtml(a.patientName)}</td>
                <td>${escapeHtml(a.doctorName)}</td>
                <td>${escapeHtml(a.departmentName || '-')}</td>
                <td>${formatDt(a.appointmentDate)}</td>
                <td><span class="status-badge status-${a.status}">${a.status}</span></td>
                <td class="actions-cell">
                    <button class="btn btn-secondary btn-sm" onclick="editAppointment(${a.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteAppointment(${a.id})">Delete</button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="7" class="empty-state">No appointments</td></tr>';
    } catch (e) {
        document.getElementById('appointments-table').innerHTML = `<tr><td colspan="7" class="empty-state">Error: ${e.message}</td></tr>`;
    }
}

async function openAppointmentModal(apt = null) {
    const [patients, doctors] = await Promise.all([fetchAPI('/patients'), fetchAPI('/doctors')]);
    const patientOpts = patients.map(p => `<option value="${p.id}" ${apt && apt.patientId === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('');
    const doctorOpts = doctors.map(d => `<option value="${d.id}" ${apt && apt.doctorId === d.id ? 'selected' : ''}>${escapeHtml(d.name)} (${escapeHtml(d.specialization)})</option>`).join('');
    const statusOpts = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map(s => `<option value="${s}" ${apt && apt.status === s ? 'selected' : ''}>${s}</option>`).join('');

    let dt = '';
    if (apt && apt.appointmentDate) {
        const d = new Date(apt.appointmentDate);
        dt = d.toISOString().slice(0, 16);
    } else {
        const now = new Date();
        now.setMinutes(0);
        dt = now.toISOString().slice(0, 16);
    }

    const isEdit = !!apt;
    document.getElementById('modal-title').textContent = isEdit ? 'Edit Appointment' : 'Book Appointment';
    document.getElementById('modal-content').innerHTML = `
        <form id="appointment-form">
            <div class="form-group">
                <label>Patient *</label>
                <select name="patientId" required>${patientOpts}</select>
            </div>
            <div class="form-group">
                <label>Doctor *</label>
                <select name="doctorId" required>${doctorOpts}</select>
            </div>
            <div class="form-group">
                <label>Date & Time *</label>
                <input name="appointmentDate" type="datetime-local" required value="${dt}">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select name="status">${statusOpts}</select>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <input name="notes" value="${apt ? escapeHtml(apt.notes || '') : ''}">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Book'}</button>
            </div>
        </form>
    `;
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('appointment-form').onsubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        const body = {
            patientId: +form.patientId.value,
            doctorId: +form.doctorId.value,
            appointmentDate: form.appointmentDate.value,
            status: form.status.value,
            notes: form.notes.value || null
        };
        try {
            if (isEdit) await fetchAPI(`/appointments/${apt.id}`, { method: 'PUT', body: JSON.stringify(body) });
            else await fetchAPI('/appointments', { method: 'POST', body: JSON.stringify(body) });
            closeModal();
            loadAppointments();
            loadDashboard();
        } catch (err) {
            alert(err.message);
        }
    };
}

async function editAppointment(id) {
    const apt = await fetchAPI(`/appointments/${id}`);
    openAppointmentModal(apt);
}

async function deleteAppointment(id) {
    if (!confirm('Delete this appointment?')) return;
    try {
        await fetchAPI(`/appointments/${id}`, { method: 'DELETE' });
        loadAppointments();
        loadDashboard();
    } catch (e) {
        alert(e.message);
    }
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Initial load
loadDashboard();
