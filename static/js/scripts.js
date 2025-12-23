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
                    // This sets the height dynamically based on content
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
    
    // Re-load the directory to update the view
    loadDynamicFaculty();
}


/**
 * Helper function to generate table for dynamic data in accordions.
 * This function has been expanded to better display the structured NAAC data.
 */
function generateAccordionTableHTML(data, type) {
    if (!data || data.length === 0) return `<p>No ${type} reported.</p>`;
    
    // Helper to format table rows based on data structure
    const mapDataToRows = (data, keys) => {
        return data.map(item => `
            <tr>
                ${keys.map(key => `<td>${item[key] || 'N/A'}</td>`).join('')}
            </tr>
        `).join('');
    };

    switch (type) {
        case 'Previous Work':
            return `
                <table>
                    <thead>
                        <tr>
                            <th>Institution</th>
                            <th>Position held</th>
                            <th>From (YYYY)</th>
                            <th>To (YYYY)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mapDataToRows(data, ['prev-organization', 'prev-designation', 'prev-from-year', 'prev-to-year'])}
                    </tbody>
                </table>
            `;
        case 'Course Taught':
             return `
                <ul>
                    ${data.map(item => `<li>${item['course-taught'] || 'N/A'}</li>`).join('')}
                </ul>
            `;
        case 'Publications':
            return `<p>Detailed publications table (e.g., Title, Journal, ISSN) would be here.</p>`; // Placeholder
        case 'Awards':
             return `<p>Detailed awards table (e.g., Title, Agency, Date) would be here.</p>`; // Placeholder
        default:
            return `<p>Detailed ${type} data summary loaded.</p>`;
    }
}


/**
 * Generates the HTML for the faculty card (icon preview) and the detailed modal pop-up.
 * @param {Object} faculty - The faculty data object from localStorage.
 * @returns {Object} An object containing the card HTML and modal HTML strings.
 */
function generateDynamicFacultyHTML(faculty) {
    // Generate a unique ID for the modal
    const modalId = `modal-dynamic-${faculty.id}`;
    
    // Default image if none is provided (should match the placeholder in enter.js)
    const imageSource = faculty.croppedPhotoBase64 || 'path/to/default/icon.png'; 
    const fullName = `${faculty.namePrefix} ${faculty.name}`;

    // --- Directory Card HTML (Icon Preview) ---
    const cardHTML = `
        <div class="faculty-member-card">
            <img src="${imageSource}" alt="${fullName}" class="professor-image" onclick="openModal('${modalId}')">
            <h3>${fullName}</h3>
            <p style="color: #666; font-size: 0.9em;">${faculty.designation}</p>
            <button class="remove-button-directory" onclick="removeFaculty('${faculty.id}')">Remove</button>
        </div>
    `;

    // Helper to generate the main requested details for the modal
    function generateMainDetailsHTML(faculty) {
        return `
            <div class="details-card">
                <h3>Profile Overview</h3>
                <div class="contact-grid">
                    <div>
                        <strong>Designation:</strong> 
                        <span>${faculty.designation || 'N/A'}</span>
                    </div>
                    <div>
                        <strong>Department:</strong> 
                        <span>${faculty.department || 'N/A'}</span>
                    </div>
                    <div>
                        <strong>Qualification (Main):</strong> 
                        <span>${faculty.designation || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div class="details-card">
                <h3>Contact Details</h3>
                <div class="contact-grid">
                    <div>
                        <strong>E-mail:</strong> 
                        <a href="mailto:${faculty.email}">${faculty.email || 'N/A'}</a>
                    </div>
                    <div>
                        <strong>Mobile Number:</strong> 
                        <a href="tel:${faculty.phone}">${faculty.phone || 'N/A'}</a>
                    </div>
                </div>
            </div>
        `;
    }


    // --- Modal Pop-up HTML (Full Details) ---
    const modalHTML = `
        <div id="${modalId}" class="modal" role="dialog" aria-modal="true" aria-labelledby="profile-title-${faculty.id}">
            <div class="modal-content">
                <span class="close-button" onclick="closeModal('${modalId}')">&times;</span>
                
                <div class="profile-header">
                    <img src="${imageSource}" alt="${fullName}" class="profile-photo">
                    <h1 id="profile-title-${faculty.id}">${fullName}</h1>
                    <p>${faculty.designation}, ${faculty.department}</p>
                </div>

                <div class="modal-profile-body container">
                    ${generateMainDetailsHTML(faculty)}

                    <button class="accordion-button">Courses Taught</button>
                    <div class="accordion-content">
                        ${generateAccordionTableHTML(faculty.courseTaught, 'Course Taught')}
                    </div>

                    <button class="accordion-button">Work Experience (Previous)</button>
                    <div class="accordion-content">
                        ${generateAccordionTableHTML(faculty.prevWork, 'Previous Work')}
                    </div>

                    <button class="accordion-button">Publications & Research</button>
                    <div class="accordion-content">
                        ${generateAccordionTableHTML(faculty.publications, 'Publications')}
                    </div>

                    <button class="accordion-button">Awards & Achievements</button>
                    <div class="accordion-content">
                        ${generateAccordionTableHTML(faculty.awards, 'Awards')}
                    </div>
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
        // Ensure faculty has an ID before proceeding (safety check for old data)
        if (!faculty.id) {
            faculty.id = `faculty-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
        
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