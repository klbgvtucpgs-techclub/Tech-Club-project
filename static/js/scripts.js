// ===================================
// MODAL (POP-UP) FUNCTIONS
// ===================================

// Function to open the modal (Triggered by the image's onclick)
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        
        // Use a timeout to trigger the CSS transition (fade-in/zoom-in)
        setTimeout(() => {
            modal.classList.add('active');
        }, 10); 

        // Prevent main page scrolling when modal is open
        document.body.style.overflow = 'hidden'; 
    }
    // Re-initialize accordions inside the newly opened modal
    initializeAccordions();
}

// Function to close the modal (Triggered by the 'X' button or window click)
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        // 1. Start the reverse animation (fade-out/zoom-out)
        modal.classList.remove('active');

        // 2. Hide the element only after the animation finishes (300ms matches CSS transition)
        setTimeout(() => {
            modal.style.display = 'none';
            // Re-enable main page scrolling
            document.body.style.overflow = 'auto'; 
        }, 300); 
    }
}

// Close the modal if the user clicks anywhere on the dark background
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        const modalId = event.target.id;
        closeModal(modalId);
    }
}

// ===================================
// ACCORDION FUNCTIONS (Inside the Modal)
// ===================================

function initializeAccordions() {
    // We select all accordion buttons that exist in the DOM
    const buttons = document.querySelectorAll('.accordion-button');

    buttons.forEach(button => {
        // Prevent adding multiple listeners if called multiple times (e.g., inside openModal)
        if (!button.getAttribute('data-listener-added')) {
            button.addEventListener('click', function() {
                this.classList.toggle('active');
                const content = this.nextElementSibling;
                
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                }
            });
            button.setAttribute('data-listener-added', 'true');
        }
    });
}

// ===================================
// NEW DYNAMIC DATA ACTIONS
// ===================================

function removeFaculty(facultyId) {
    if (!confirm("Are you sure you want to remove this faculty member? This cannot be undone.")) {
        return;
    }

    let facultyList = JSON.parse(localStorage.getItem('dynamicFaculty')) || [];
    
    // Filter out the faculty member with the matching ID
    facultyList = facultyList.filter(faculty => faculty.id !== facultyId);

    localStorage.setItem('dynamicFaculty', JSON.stringify(facultyList));
    
    // Close modal and refresh the page to show the updated list
    location.reload(); 
}

function editFaculty(facultyId) {
    // Redirect to the enter.html page, passing the faculty ID as a URL parameter
    window.location.href = `enter.html?id=${facultyId}`;
}


// ===================================
// DYNAMIC DATA LOADING LOGIC
// ===================================

function generateDynamicFacultyHTML(faculty) {
    // Helper function to build a list/table for dynamic sections
    const buildDynamicList = (data, type) => {
        if (!data || data.length === 0) return `<p>No ${type} reported.</p>`;

        if (type === 'Previous Work') {
            return `
                <table>
                    <thead>
                        <tr>
                            <th>Institution</th>
                            <th>Position held</th>
                            <th>Period</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                <td>${item.institution || 'N/A'}</td>
                                <td>${item.position || 'N/A'}</td>
                                <td>${item.period || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else if (type === 'Research Papers') {
            return data.map((item, index) => 
                `<p>${index + 1}. ${item.citation || 'N/A'} ${item.issn ? `[ISSN: ${item.issn}]` : ''}</p>`
            ).join('');
        } else if (type === 'Projects') {
             return data.map(item => 
                `<p>Project Title: <strong>${item['project-title'] || 'N/A'}</strong>. Agency: ${item.agency || 'N/A'}. Period: ${item['project-period'] || 'N/A'}. Amount: ${item.amount || 'N/A'}.</p>`
            ).join('');
        } else if (type === 'Awards') {
             return data.map((item, index) => 
                `<p>${index + 1}. Award Title: <strong>${item['award-title'] || 'N/A'}</strong>. Awarding Agency: ${item.agency || 'N/A'}. Date: ${item.date || 'N/A'}.</p>`
            ).join('');
        }
        return '';
    };

    // Use placeholder if photo is missing, or the Base64 data if available
    const photoSrc = faculty.photo || `https://via.placeholder.com/150?text=${faculty.name.split(' ').pop() || 'Faculty'}`;
    const modalId = `modal-${faculty.id}`;

    // Create the card for the directory
    const cardHTML = `
        <div class="faculty-member-card"> 
            <img src="${photoSrc}" alt="${faculty.name}" class="professor-image"
                onclick="openModal('${modalId}')">
            <h3>${faculty.name}</h3>
            <p>${faculty.designation}, ${faculty.department}</p>
        </div>
    `;

    // Create the modal for the profile view
    const modalHTML = `
        <div id="${modalId}" class="modal">
            <div class="modal-content">
                <span class="close-button" onclick="closeModal('${modalId}')">&times;</span>

                <div class="modal-actions">
                    <button class="edit-button" onclick="editFaculty('${faculty.id}')"> Edit</button>
                    <button class="remove-button-directory" onclick="removeFaculty('${faculty.id}')"> Remove</button>
                </div>
                <div class="modal-profile-body">
                    <header class="profile-header">
                        <img src="${photoSrc}" alt="Faculty Photo" class="profile-photo">
                        <h1>${faculty.name}</h1>
                        <p>${faculty.designation} | ${faculty.department}</p>
                        <p>Employee ID: ${faculty.employeeId || 'N/A'}</p>
                    </header>

                    <main class="container">
                        <section class="details-card">
                            <h2> Contact & Background</h2>
                            <div class="contact-grid">
                                <p><strong>Qualification:</strong> ${faculty.qualification || 'N/A'}</p>
                                <p><strong>Email:</strong> ${faculty.email || 'N/A'}</p>
                                <p class="full-width"><strong>Specialization:</strong> ${faculty.specialization || 'N/A'}</p>
                            </div>
                        </section>

                        <div class="accordion">

                            <button class="accordion-button"> Previous Work/Position Held</button>
                            <div class="accordion-content">
                                ${buildDynamicList(faculty.previousWork, 'Previous Work')}
                            </div>

                            <button class="accordion-button"> Research Papers in Peer-reviewed Journals</button>
                            <div class="accordion-content">
                                ${buildDynamicList(faculty.researchPapers, 'Research Papers')}
                            </div>

                            <button class="accordion-button"> Research Guidance & Projects</button>
                            <div class="accordion-content">
                                <h3>Research Guidance (PG Dissertation/Thesis)</h3>
                                <ul>
                                    <li>Total Thesis Submitted: ${faculty.thesisSubmitted || 0}</li>
                                    <li>Degree Awarded: ${faculty.degreeAwarded || 0}</li>
                                </ul>
                                <h3>Ongoing/Completed Research Projects</h3>
                                ${buildDynamicList(faculty.projects, 'Projects')}
                            </div>

                            <button class="accordion-button"> Awards & Professional Activities</button>
                            <div class="accordion-content">
                                ${buildDynamicList(faculty.awards, 'Awards')}
                            </div>

                        </div>
                    </main>
                </div>
            </div>
        </div>
    `;

    return { cardHTML, modalHTML };
}

function loadDynamicFaculty() {
    // Clear existing dynamic content before loading to prevent duplicates
    document.getElementById('dynamic-faculty-list').innerHTML = '';
    // Remove old dynamic modals (those with ID starting with modal-dynamic-)
    document.querySelectorAll('.modal[id^="modal-dynamic-"]').forEach(modal => modal.remove());
    
    const facultyList = JSON.parse(localStorage.getItem('dynamicFaculty')) || [];
    const directoryContainer = document.getElementById('dynamic-faculty-list');
    const body = document.body;

    facultyList.forEach(faculty => {
        const { cardHTML, modalHTML } = generateDynamicFacultyHTML(faculty);
        
        // Insert the Card into the directory container
        directoryContainer.insertAdjacentHTML('beforeend', cardHTML);
        
        // Insert the Modal at the end of the body
        body.insertAdjacentHTML('beforeend', modalHTML);
    });

    // Initialize accordions for all modals (static and dynamic)
    initializeAccordions();
}

document.addEventListener('DOMContentLoaded', function() {
    // Load data only on the directory page (index.html)
    if (document.querySelector('.directory-container')) {
        loadDynamicFaculty();
    }
    
    // Fallback for accordions on static content (already handled by loadDynamicFaculty)
    initializeAccordions();
});
