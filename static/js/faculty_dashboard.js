// Faculty Dashboard JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!checkAuth('faculty')) return;

    // Display welcome message
    const userName = localStorage.getItem('user_name');
    document.getElementById('welcome-text').textContent = `Welcome, ${userName}!`;

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });

    // Load data
    loadMyData();

    // Setup quick add form
    setupQuickAddForm();
});

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`${tabId}-tab`).classList.remove('hidden');
}

async function loadMyData() {
    const yearFilter = document.getElementById('data-year-filter').value;

    try {
        // Load all data
        let url = '/api/faculty/all-data';
        if (yearFilter) url += `?academic_year=${yearFilter}`;

        const response = await fetch(url, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        // Render profile
        renderProfile(data.profile);

        // Render data sections
        renderDataSections(data);

    } catch (error) {
        console.error('Failed to load data:', error);
        document.getElementById('data-sections').innerHTML =
            '<p class="text-red-400 text-center py-8">Error loading data. Please try again.</p>';
    }
}

function renderProfile(profileData) {
    const profile = profileData && profileData[0] ? profileData[0] : {};
    const container = document.getElementById('profile-content');

    const fields = [
        { label: 'Name', value: `${profile.name_prefix || ''} ${profile.name || localStorage.getItem('user_name') || ''}` },
        { label: 'Email', value: profile.email || '' },
        { label: 'Employee ID', value: profile.employee_id || '' },
        { label: 'Department', value: profile.department || '-' },
        { label: 'Designation', value: profile.designation || '-' },
        { label: 'Phone', value: profile.phone || '-' }
    ];

    container.innerHTML = `
        <div class="profile-grid">
            ${fields.map(f => `
                <div class="profile-item">
                    <div class="label">${f.label}</div>
                    <div class="value">${f.value || '-'}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderDataSections(data) {
    const container = document.getElementById('data-sections');

    const sections = [
        { key: 'publications', title: '📚 Publications', fields: ['title', 'journal_name', 'academic_year'] },
        { key: 'book_publications', title: '📖 Book Publications', fields: ['chapter_book_name', 'editor_author', 'academic_year'] },
        { key: 'awards', title: '🏆 Awards', fields: ['title', 'awarding_agency', 'academic_year'] },
        { key: 'research_projects', title: '🔬 Research Projects', fields: ['title', 'agency', 'academic_year'] },
        { key: 'patents', title: '📜 Patents', fields: ['title', 'patent_number', 'academic_year'] },
        { key: 'conferences', title: '🎤 Conferences', fields: ['paper_title', 'level', 'academic_year'] },
        { key: 'seminars', title: '📢 Seminars/Workshops', fields: ['title', 'details', 'academic_year'] },
        { key: 'lectures', title: '🎯 Invited Lectures', fields: ['lecture_name', 'location', 'academic_year'] },
        { key: 'memberships', title: '🤝 Professional Memberships', fields: ['details', 'institute', 'academic_year'] }
    ];

    let html = '';

    sections.forEach(section => {
        const items = data[section.key] || [];

        html += `
            <div class="data-card">
                <h3>
                    ${section.title}
                    <span class="count">${items.length}</span>
                </h3>
                ${items.length > 0 ? `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                ${section.fields.map(f => `<th>${formatFieldName(f)}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map((item, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    ${section.fields.map(f => `<td>${item[f] || '-'}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `
                    <div class="empty-state">
                        <div class="icon">📭</div>
                        <p>No ${section.title.replace(/[^\w\s]/g, '').trim().toLowerCase()} added yet</p>
                    </div>
                `}
            </div>
        `;
    });

    container.innerHTML = html;
}

function formatFieldName(field) {
    return field
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function setupQuickAddForm() {
    const form = document.getElementById('quick-pub-form');
    const message = document.getElementById('pub-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/faculty/publications', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                message.textContent = '✓ Publication added successfully!';
                message.className = 'text-sm mt-2 text-green-400';
                message.classList.remove('hidden');
                form.reset();

                // Reload data
                loadMyData();

                setTimeout(() => message.classList.add('hidden'), 3000);
            } else {
                message.textContent = result.detail || 'Failed to add publication';
                message.className = 'text-sm mt-2 text-red-400';
                message.classList.remove('hidden');
            }
        } catch (error) {
            message.textContent = 'Network error. Please try again.';
            message.className = 'text-sm mt-2 text-red-400';
            message.classList.remove('hidden');
        }
    });
}

// Download faculty's own profile as PDF
function downloadMyPDF() {
    const yearFilter = document.getElementById('data-year-filter').value;
    let url = '/api/faculty/export/my-pdf';
    if (yearFilter) url += `?academic_year=${yearFilter}`;

    // Open download in new window with auth
    const token = localStorage.getItem('access_token');

    fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => response.blob())
        .then(blob => {
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `my_profile_${yearFilter || 'all'}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            a.remove();
        })
        .catch(error => {
            console.error('Download failed:', error);
            alert('Failed to download PDF. Please try again.');
        });
}
