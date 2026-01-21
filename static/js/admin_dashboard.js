// Admin Dashboard JavaScript
let dataLoaded = false;

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!checkAuth('admin')) return;

    // Prevent duplicate loading
    if (dataLoaded) return;
    dataLoaded = true;

    // Display admin name
    const adminName = localStorage.getItem('user_name');
    document.getElementById('admin-name').textContent = `Welcome, ${adminName}`;

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });

    // Add Faculty Form
    setupAddFacultyForm();

    // Load initial data (only faculty list since departments/years are hardcoded)
    loadFacultyList();
});

function switchTab(tabId) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`${tabId}-tab`).classList.remove('hidden');
}

function setupAddFacultyForm() {
    const form = document.getElementById('add-faculty-form');
    const btn = document.getElementById('generate-btn');
    const message = document.getElementById('form-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> Processing...';
        message.classList.add('hidden');

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/generate-password', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                showFormMessage(result.message, 'success');
                form.reset();
            } else {
                showFormMessage(result.detail || 'Failed to create faculty', 'error');
            }
        } catch (error) {
            showFormMessage('Network error. Please try again.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '🔐 Generate & Send Password';
        }
    });
}

function showFormMessage(text, type) {
    const message = document.getElementById('form-message');
    message.textContent = text;
    message.className = `text-center text-sm mt-4 p-3 rounded-lg ${type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
        }`;
    message.classList.remove('hidden');
}

async function loadFacultyList(search = '', dept = '', designation = '') {
    const tbody = document.getElementById('faculty-list');
    tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-400"><span class="loading"></span> Loading...</td></tr>';

    try {
        let url = '/api/admin/faculty';
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (dept) params.append('department', dept);
        if (designation) params.append('designation', designation);
        if (params.toString()) url += '?' + params.toString();

        const response = await fetch(url, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.faculty && data.faculty.length > 0) {
            tbody.innerHTML = data.faculty.map(f => `
                <tr class="hover:bg-gray-700/50">
                    <td class="px-6 py-4 text-white font-medium">${f.name}</td>
                    <td class="px-6 py-4 text-gray-300">${f.email}</td>
                    <td class="px-6 py-4 text-gray-300">${f.employee_id}</td>
                    <td class="px-6 py-4 text-gray-300">${f.designation || '-'}</td>
                    <td class="px-6 py-4 text-gray-300">${f.department || '-'}</td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="viewFacultyDetails('${f.id}')" class="action-btn view mr-2">👁 View</button>
                        <button onclick="exportFacultyPDF('${f.id}')" class="action-btn pdf">📄 PDF</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-400">No faculty found</td></tr>';
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-red-400">Error loading data</td></tr>';
    }
}

// loadDepartments and loadAcademicYears removed - using hardcoded values in HTML


async function loadAcademicYears() {
    try {
        const response = await fetch('/api/admin/academic-years', {
            headers: getAuthHeaders()
        });
        const data = await response.json();

        const select = document.getElementById('year-filter');
        // Clear existing options except first
        while (select.options.length > 1) {
            select.remove(1);
        }

        data.academic_years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load academic years:', error);
    }
}

function searchFaculty() {
    const search = document.getElementById('search-input').value;
    const dept = document.getElementById('dept-filter').value;
    const designation = document.getElementById('designation-filter').value;
    loadFacultyList(search, dept, designation);
}

async function viewFacultyDetails(facultyId) {
    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('modal-content');
    const yearFilter = document.getElementById('year-filter').value;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    content.innerHTML = '<div class="text-center py-8"><span class="loading"></span> Loading details...</div>';

    try {
        let url = `/api/admin/faculty/${facultyId}`;
        if (yearFilter) url += `?academic_year=${yearFilter}`;

        const response = await fetch(url, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        document.getElementById('modal-title').textContent = data.user.name;

        const profile = data.profile[0] || {};

        content.innerHTML = `
            <div class="detail-section">
                <h4>📋 Basic Information</h4>
                <div class="detail-item"><span class="label">Name:</span><span class="value">${profile.name_prefix || ''} ${data.user.name}</span></div>
                <div class="detail-item"><span class="label">Email:</span><span class="value">${data.user.email}</span></div>
                <div class="detail-item"><span class="label">Employee ID:</span><span class="value">${data.user.employee_id}</span></div>
                <div class="detail-item"><span class="label">Phone:</span><span class="value">${data.user.phone || '-'}</span></div>
                <div class="detail-item"><span class="label">Designation:</span><span class="value">${profile.designation || '-'}</span></div>
                <div class="detail-item"><span class="label">Department:</span><span class="value">${profile.department || '-'}</span></div>
            </div>
            
            ${renderSection('📚 Publications', data.publications, ['title', 'journal_name', 'academic_year'])}
            ${renderSection('🏆 Awards', data.awards, ['title', 'awarding_agency', 'academic_year'])}
            ${renderSection('🔬 Research Projects', data.research_projects, ['title', 'agency', 'academic_year'])}
            ${renderSection('📜 Patents', data.patents, ['title', 'patent_number', 'academic_year'])}
            ${renderSection('🎤 Conferences', data.conferences, ['paper_title', 'level', 'academic_year'])}
            
            <div class="mt-6 flex gap-4">
                <button onclick="exportFacultyPDF('${facultyId}')" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition">
                    📄 Download PDF
                </button>
            </div>
        `;
    } catch (error) {
        content.innerHTML = '<div class="text-red-400 text-center py-8">Error loading faculty details</div>';
    }
}

function renderSection(title, items, fields) {
    if (!items || items.length === 0) return '';

    return `
        <div class="detail-section">
            <h4>${title} (${items.length})</h4>
            ${items.map((item, i) => `
                <div class="detail-item">
                    <span class="label">${i + 1}.</span>
                    <span class="value">${fields.map(f => item[f] || '').filter(v => v).join(' | ')}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function closeModal() {
    const modal = document.getElementById('detail-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

async function exportFacultyPDF(facultyId) {
    const yearFilter = document.getElementById('year-filter').value;
    let url = `/api/admin/export/faculty/${facultyId}/pdf`;
    if (yearFilter) url += `?academic_year=${yearFilter}`;

    window.open(url + `&token=${localStorage.getItem('access_token')}`, '_blank');
}

async function exportAllExcel() {
    const yearFilter = document.getElementById('year-filter').value;
    const deptFilter = document.getElementById('dept-filter').value;
    const designationFilter = document.getElementById('designation-filter').value;

    let url = '/api/admin/export/all/excel?';
    if (yearFilter) url += `academic_year=${yearFilter}&`;
    if (deptFilter) url += `department=${deptFilter}&`;
    if (designationFilter) url += `designation=${designationFilter}&`;

    window.open(url + `token=${localStorage.getItem('access_token')}`, '_blank');
}

async function exportAllPDF() {
    const yearFilter = document.getElementById('year-filter').value;
    const deptFilter = document.getElementById('dept-filter').value;
    const designationFilter = document.getElementById('designation-filter').value;

    let url = '/api/admin/export/all/pdf?';
    if (yearFilter) url += `academic_year=${yearFilter}&`;
    if (deptFilter) url += `department=${deptFilter}&`;
    if (designationFilter) url += `designation=${designationFilter}&`;

    window.open(url + `token=${localStorage.getItem('access_token')}`, '_blank');
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// Close modal on backdrop click
document.getElementById('detail-modal').addEventListener('click', (e) => {
    if (e.target.id === 'detail-modal') closeModal();
});
