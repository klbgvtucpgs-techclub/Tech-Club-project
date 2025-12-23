// --- Global Variables for Photo Handling ---
let preservedPhotoBase64 = null; 
let originalImage = null; // Used to hold the uploaded Image object for cropping
const CANVAS_DISPLAY_SIZE = 300; 
const FINAL_OUTPUT_SIZE = 200; 
let rowCounter = 0; // Global counter for unique row IDs

// Constants for Cropping
const CANVAS_ID = 'crop-canvas'; // ID of the canvas element in enter.html

// ==========================================================
// ** HELPER FUNCTIONS & MODALS **
// ==========================================================

// --- Modal Functions ---
function openModal(modalId) {
    document.getElementById(modalId).style.display = "block";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
    if (modalId === 'confirmation-modal') {
        // Redirect to index.html after confirmation
        window.location.href = 'index.html'; 
    }
}

function openCropModal() {
    document.getElementById('crop-modal').style.display = "block";
}

function closeCropModal() {
    document.getElementById('crop-modal').style.display = "none";
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}

// --- Dynamic Form Functions ---

/**
 * Creates and appends a dynamic data entry row to a container.
 * @param {Array<Object>} fields - Array of objects defining input fields.
 * @param {string} containerId - ID of the container element (e.g., 'publication-entries').
 * @param {string} gridClass - CSS class defining the grid layout (e.g., 'publication-grid').
 */
function createDataEntryRow(fields, containerId, gridClass) {
    const container = document.getElementById(containerId);
    if (!container) return;

    rowCounter++;
    const rowId = `${containerId.split('-')[0]}-row-${rowCounter}`;
    
    // Create the row element
    const row = document.createElement('div');
    row.id = rowId;
    // Use the specific grid class for correct column layout
    row.className = `data-entry-row ${gridClass}`; 

    // Add SI No. (Serial Number) as the first element for relevant grids
    if (gridClass.includes('-grid') || gridClass.includes('Course-tauhgt-grid')) {
        const siNo = document.createElement('span');
        siNo.className = 'si-no-placeholder';
        // Placeholder for SI No. which is often handled by CSS or dynamic index
        siNo.textContent = container.children.length + 1 + '.'; 
        row.appendChild(siNo);
    }

    // Create the input fields
    fields.forEach(field => {
        const inputId = `${field.name}-${rowCounter}`;
        let inputHTML = '';
        
        if (field.tag === 'input') {
            inputHTML = `<input type="${field.type || 'text'}" id="${inputId}" name="${field.name}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>`;
        } else if (field.tag === 'select') {
            inputHTML = `<select id="${inputId}" name="${field.name}" ${field.required ? 'required' : ''}>`;
            field.options.forEach(opt => {
                inputHTML += `<option value="${opt.value}">${opt.text}</option>`;
            });
            inputHTML += `</select>`;
        } else if (field.tag === 'file') {
             // Special handling for file uploads
             inputHTML = `<input type="file" id="${inputId}" name="${field.name}" accept="${field.accept || '*/*'}">`;
        }
        
        row.insertAdjacentHTML('beforeend', inputHTML);
    });

    // Add the Remove button
    const removeButtonHTML = `<button type="button" class="remove-button" onclick="document.getElementById('${rowId}').remove()">X</button>`;
    row.insertAdjacentHTML('beforeend', removeButtonHTML);

    container.appendChild(row);
}


// ==========================================================
// ** NAAC SECTION DYNAMIC ROW DEFINITIONS (COMPLETED) **
// ==========================================================

// 1. Previous Work/Position held
function addPreviousWorkEntry() {
    const fields = [
        { tag: 'input', type: 'text', name: 'prev-organization', placeholder: 'Institution' },
        { tag: 'input', type: 'text', name: 'prev-designation', placeholder: 'Position Held' },
        { tag: 'input', type: 'number', name: 'prev-from-year', placeholder: 'From (YYYY)', required: true },
        { tag: 'input', type: 'number', name: 'prev-to-year', placeholder: 'To (YYYY)', required: true },
    ];
    createDataEntryRow(fields, 'previous-work-entries', 'previous-work-grid');
}

// 2. Course Taught
function addCourseTaughtEntry() {
    const fields = [
        { tag: 'input', type: 'text', name: 'course-taught', placeholder: 'Course Taught Name', required: true },
    ];
    // Note: The HTML Course-tauhgt-grid has 2 columns: SI No. and course Tauhgt
    createDataEntryRow(fields, 'Course-tauhgt', 'Course-tauhgt-grid'); 
}

// 3. Publications (NAAC 01)
function addPublicationEntry() {
    const fields = [
        { tag: 'input', type: 'number', name: 'pub-year', placeholder: 'Academic Year', required: true },
        { tag: 'input', type: 'text', name: 'pub-authors', placeholder: 'Authors Details', required: true },
        { tag: 'input', type: 'text', name: 'pub-title', placeholder: 'Title/Article Name', required: true },
        { tag: 'input', type: 'text', name: 'pub-journal', placeholder: 'Journal Name', required: true },
        { tag: 'input', type: 'text', name: 'pub-issn', placeholder: 'ISSN/ISBN No.' },
        { tag: 'input', type: 'url', name: 'pub-url', placeholder: 'URL' },
        { tag: 'file', name: 'pub-upload', accept: '.pdf,.jpg,.png' },
    ];
    createDataEntryRow(fields, 'publication-entries', 'publication-grid');
}

// 4. Book Chapters/Book Publications (NAAC 02)
function addBookPublicationEntry() {
    const fields = [
        { tag: 'input', type: 'number', name: 'book-pub-year', placeholder: 'Academic Year', required: true },
        { tag: 'input', type: 'text', name: 'book-pub-name', placeholder: 'Chapter/Book Name', required: true },
        { tag: 'select', name: 'book-pub-level', options: [
            {value: 'International', text: 'International'}, 
            {value: 'National', text: 'National'},
            {value: 'Regional', text: 'Regional'},
        ]},
        { tag: 'input', type: 'text', name: 'book-pub-editor-author', placeholder: 'Editor/Author' },
        { tag: 'input', type: 'text', name: 'book-pub-issn', placeholder: 'ISSN/ISBN No.' },
        { tag: 'input', type: 'url', name: 'book-pub-url', placeholder: 'URL' },
        { tag: 'file', name: 'book-pub-upload', accept: '.pdf,.jpg,.png' },
    ];
    createDataEntryRow(fields, 'book-publication-entries', 'book-publication-grid');
}

// 5. Awards (NAAC 03)
function addAwardEntry() {
    const fields = [
        { tag: 'input', type: 'number', name: 'award-year', placeholder: 'Academic Year', required: true },
        { tag: 'input', type: 'text', name: 'award-title-agency', placeholder: 'Title and Awarding Agency', required: true },
        { tag: 'select', name: 'award-level', options: [
            {value: 'International', text: 'International'}, 
            {value: 'National', text: 'National'},
            {value: 'State', text: 'State'},
            {value: 'University', text: 'University'},
        ]},
        { tag: 'input', type: 'date', name: 'award-date', placeholder: 'Date of Award (DD-MM-YYYY)' },
        { tag: 'file', name: 'award-upload', accept: '.pdf,.jpg,.png' },
    ];
    createDataEntryRow(fields, 'award-entries', 'award-grid');
}

// 6. Creation of ICT mediated Teaching Learning Pedagogy (NAAC 04)
function addCreationOfICTEntry() {
    const fields = [
        { tag: 'input', type: 'number', name: 'ict-year', placeholder: 'Academic Year', required: true },
        { tag: 'input', type: 'text', name: 'ict-title', placeholder: 'Title', required: true },
        { tag: 'input', type: 'text', name: 'ict-content', placeholder: 'Content Description' },
        { tag: 'input', type: 'url', name: 'ict-url', placeholder: 'URL/link' },
        { tag: 'file', name: 'ict-upload', accept: '.pdf,.jpg,.png' },
    ];
    createDataEntryRow(fields, 'creation-of-ICT', 'creation-ict-grid');
}

// 7. Research Guidance (NAAC 05)
function addResearchGuidanceEntry() {
    const fields = [
        { tag: 'input', type: 'number', name: 'rg-year', placeholder: 'Academic Year', required: true },
        { tag: 'input', type: 'number', name: 'rg-enrolled', placeholder: 'Number enrolled' },
        { tag: 'input', type: 'number', name: 'rg-submitted', placeholder: 'Thesis Submitted' },
        { tag: 'input', type: 'number', name: 'rg-awarded', placeholder: 'Degree Awarded' },
        { tag: 'file', name: 'rg-upload', accept: '.pdf,.jpg,.png' },
    ];
    createDataEntryRow(fields, 'research-guidance-entries', 'Research-guid-grid');
}

// 8. PG Dissertation (NAAC 06)
function addPGDissertationEntry() {
    const fields = [
        { tag: 'input', type: 'text', name: 'pg-student-name', placeholder: 'Student Name', required: true },
        { tag: 'input', type: 'text', name: 'pg-usn', placeholder: 'USN' },
        { tag: 'file', name: 'pg-upload', accept: '.pdf,.jpg,.png' },
    ];
    createDataEntryRow(fields, 'pg-dissertation-entries', 'pg-grid');
}

// 9. Ongoing/Completed Research projects and consultancies (NAAC 07)
function addResearchProjectEntry() {
    const fields = [
        { tag: 'input', type: 'number', name: 'proj-year', placeholder: 'Academic Year', required: true },
        { tag: 'input', type: 'text', name: 'proj-title', placeholder: 'Title', required: true },
        { tag: 'input', type: 'text', name: 'proj-agency', placeholder: 'Funding Agency' },
        { tag: 'input', type: 'text', name: 'proj-period', placeholder: 'Period (e.g., 2023-2025)' },
        { tag: 'select', name: 'proj-role', options: [
            {value: 'PI', text: 'Principle Investigator'}, 
            {value: 'Co-PI', text: 'Co Principle Investigator'},
        ]},
        { tag: 'input', type: 'number', name: 'proj-grant', placeholder: 'Grant/Amount (in Rs)' },
        { tag: 'file', name: 'proj-upload', accept: '.pdf,.jpg,.png' },
    ];
    createDataEntryRow(fields, 'research-project-entries', 'project-grid');
}

// 10. Patent Information (NAAC 08)
function addPatentEntry() {
    const fields = [
        { tag: 'input', type: 'number', name: 'patent-year', placeholder: 'Academic Year', required: true },
        { tag: 'input', type: 'text', name: 'patent-title', placeholder: 'Title(Patents)', required: true },
        { tag: 'input', type: 'text', name: 'patent-number', placeholder: 'Patent Number' },
        { tag: 'file', name: 'patent-upload', accept: '.pdf,.jpg,.png' },
    ];
    createDataEntryRow(fields, 'patent-entries', 'patent-grid');
}

// 11. Conference paper/ proceeding (NAAC 09)
function addConferenceEntry() {
    const fields = [
        { tag: 'input', type: 'number', name: 'conf-year', placeholder: 'Academic Year', required: true },
        { tag: 'input', type: 'text', name: 'conf-title', placeholder: 'Conference paper/proceeding', required: true },
        { tag: 'input', type: 'text', name: 'conf-issn', placeholder: 'ISSN/ISBN No' },
        { tag: 'input', type: 'text', name: 'conf-details', placeholder: 'Details of Conference (Level, Name)', required: true },
        { tag: 'file', name: 'conf-upload', accept: '.pdf,.jpg,.png' },
    ];
    createDataEntryRow(fields, 'Conference-entries', 'book-publication-grid'); // Reusing a similar grid class
}

// 12. Seminar/workshops/Conferences (NAAC 10)
function addSeminarEntry() {
    const fields = [
        { tag: 'input', type: 'number', name: 'seminar-year', placeholder: 'Academic Year', required: true },
        { tag: 'input', type: 'text', name: 'seminar-title', placeholder: 'Title of Seminar/Workshop/Conference', required: true },
        { tag: 'input', type: 'text', name: 'seminar-details', placeholder: 'Details of Seminar, Workshops, Conferences' },
        { tag: 'input', type: 'text', name: 'seminar-degree', placeholder: 'Degree Awarded (e.g. Certificate)' }, // Assuming this means certificate earned
        { tag: 'file', name: 'seminar-upload', accept: '.pdf,.jpg,.png' },
    ];
    createDataEntryRow(fields, 'seminar-entries', 'Seminars-grid');
}

// 13. Invited Lectures/paper Assign (NAAC 11)
function addLectureEntry() {
    const fields = [
        { tag: 'input', type: 'number', name: 'lecture-year', placeholder: 'Academic Year', required: true },
        { tag: 'input', type: 'text', name: 'lecture-name', placeholder: 'Lecture Name', required: true },
        { tag: 'input', type: 'date', name: 'lecture-date', placeholder: 'Date (DD-MM-YYYY)' },
        { tag: 'input', type: 'text', name: 'lecture-location', placeholder: 'Location' },
        { tag: 'file', name: 'lecture-upload', accept: '.pdf,.jpg,.png' },
    ];
    createDataEntryRow(fields, 'lectures-entries', 'Lectures-grid');
}

// 14. Other details (NAAC 12)
function addOtherDetailsEntry() {
    const fields = [
        { tag: 'input', type: 'number', name: 'other-year', placeholder: 'Academic Year', required: true },
        { tag: 'input', type: 'text', name: 'other-details', placeholder: 'Details', required: true },
        { tag: 'input', type: 'date', name: 'other-date', placeholder: 'Date (DD-MM-YYYY)' },
        { tag: 'input', type: 'text', name: 'other-location', placeholder: 'Location' },
        { tag: 'file', name: 'other-upload', accept: '.pdf,.jpg,.png' },
    ];
    createDataEntryRow(fields, 'other-details-entries', 'other-details-grid');
}

// 15. Membership in Professional Bodies (NAAC 13)
function addMembershipEntry() {
    const fields = [
        { tag: 'input', type: 'number', name: 'membership-year', placeholder: 'Academic Year', required: true },
        { tag: 'input', type: 'text', name: 'membership-details', placeholder: 'Details/BoE/Bos', required: true },
        { tag: 'input', type: 'text', name: 'membership-institute', placeholder: 'Institute' },
        { tag: 'input', type: 'text', name: 'membership-period', placeholder: 'Date/Period (e.g., 2023-Present)' },
        { tag: 'input', type: 'text', name: 'membership-location', placeholder: 'Place/Location' },
        { tag: 'file', name: 'membership-upload', accept: '.pdf,.jpg,.png' },
    ];
    createDataEntryRow(fields, 'membership-entries', 'membership-grid');
}

// ==========================================================
// ** IMAGE CROPPING LOGIC (IMPLEMENTED) **
// ==========================================================

function setupCropper(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        originalImage = new Image();
        originalImage.onload = function() {
            const canvas = document.getElementById(CANVAS_ID);
            const ctx = canvas.getContext('2d');
            
            // Clear the canvas
            ctx.clearRect(0, 0, CANVAS_DISPLAY_SIZE, CANVAS_DISPLAY_SIZE);

            // Calculate the size to fit the image inside the display canvas (to show the user)
            const imgWidth = originalImage.width;
            const imgHeight = originalImage.height;
            const ratio = Math.min(CANVAS_DISPLAY_SIZE / imgWidth, CANVAS_DISPLAY_SIZE / imgHeight);
            
            const drawWidth = imgWidth * ratio;
            const drawHeight = imgHeight * ratio;
            const offsetX = (CANVAS_DISPLAY_SIZE - drawWidth) / 2;
            const offsetY = (CANVAS_DISPLAY_SIZE - drawHeight) / 2;

            // Draw the image scaled to fit
            ctx.drawImage(originalImage, offsetX, offsetY, drawWidth, drawHeight);

            // Draw a circular overlay for the crop guide (FINAL_OUTPUT_SIZE scaled up)
            const center = CANVAS_DISPLAY_SIZE / 2;
            // Use FINAL_OUTPUT_SIZE for the visual guide since it dictates the final aspect
            const radius = FINAL_OUTPUT_SIZE / 2 * (CANVAS_DISPLAY_SIZE / FINAL_OUTPUT_SIZE); 
            
            // Draw the circular selection overlay
            ctx.beginPath();
            ctx.arc(center, center, radius, 0, 2 * Math.PI);
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.stroke();

            openCropModal();
        };
        originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function cropAndSave() {
    if (!originalImage) {
        closeCropModal();
        return;
    }

    // 1. Create a temporary canvas for the final, correctly sized output (FINAL_OUTPUT_SIZE x FINAL_OUTPUT_SIZE)
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = FINAL_OUTPUT_SIZE;
    outputCanvas.height = FINAL_OUTPUT_SIZE;
    const ctx = outputCanvas.getContext('2d');

    // 2. Determine the largest centered square that can be cropped from the original image
    const size = Math.min(originalImage.width, originalImage.height);
    const cropX = (originalImage.width - size) / 2;
    const cropY = (originalImage.height - size) / 2;

    // 3. Draw the cropped square area from the original image onto the small output canvas
    ctx.drawImage(
        originalImage, 
        cropX, cropY, size, size, // Source: Centered square of size 'size' from original image
        0, 0, FINAL_OUTPUT_SIZE, FINAL_OUTPUT_SIZE // Destination: Entire output canvas
    );
    
    // 4. Create the circular mask on the output canvas
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(
        FINAL_OUTPUT_SIZE / 2, 
        FINAL_OUTPUT_SIZE / 2, 
        FINAL_OUTPUT_SIZE / 2, 
        0, 
        2 * Math.PI
    );
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over'; // Reset blend mode

    // 5. Save the result as Base64 PNG
    preservedPhotoBase64 = outputCanvas.toDataURL('image/png');
    
    // 6. Update the photo preview and remove button visibility
    const photoPreview = document.getElementById('photo-preview');
    const removePhotoBtn = document.getElementById('remove-photo-btn');

    if (preservedPhotoBase64) {
        photoPreview.innerHTML = `<img src="${preservedPhotoBase64}" alt="Cropped Faculty Photo" style="width:100px; height:100px; border-radius:50%; object-fit: cover;">`;
        removePhotoBtn.style.display = 'block';
    }

    closeCropModal();
}

document.getElementById('remove-photo-btn').addEventListener('click', function() {
    preservedPhotoBase64 = null;
    document.getElementById('photo-preview').innerHTML = '';
    document.getElementById('photo').value = '';
    this.style.display = 'none';
});


// ==========================================================
// ** INITIALIZATION AND SUBMISSION HANDLER (COMPLETED) **
// ==========================================================

function initializeListeners() {
    const form = document.getElementById('faculty-submission-form');
    const photoInput = document.getElementById('photo');
    const saveCropBtn = document.getElementById('save-crop-btn');
    
    // 1. Initialize one row for each dynamic section by default
    addPreviousWorkEntry(); 
    addCourseTaughtEntry();
    addPublicationEntry();
    addBookPublicationEntry();
    addAwardEntry();
    addCreationOfICTEntry();
    addResearchGuidanceEntry();
    addPGDissertationEntry();
    addResearchProjectEntry();
    addPatentEntry();
    addConferenceEntry();
    addSeminarEntry();
    addLectureEntry();
    addOtherDetailsEntry();
    addMembershipEntry();


    // 2. Attach listeners to all 'Add' buttons
    document.querySelectorAll('.add-button').forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            if (type === 'previousWork') addPreviousWorkEntry();
            else if (type === 'Coursetauhgt') addCourseTaughtEntry();
            else if (type === 'publications') addPublicationEntry();
            else if (type === 'bookpublications') addBookPublicationEntry();
            else if (type === 'awards') addAwardEntry();
            else if (type === 'creationofICT') addCreationOfICTEntry();
            else if (type === 'researchGuidance') addResearchGuidanceEntry();
            else if (type === 'pgDissertation') addPGDissertationEntry();
            else if (type === 'researchProjects') addResearchProjectEntry();
            else if (type === 'patententries') addPatentEntry();
            else if (type === 'conference') addConferenceEntry();
            else if (type === 'Seminar') addSeminarEntry();
            else if (type === 'Lectures') addLectureEntry();
            else if (type === 'otherDetails') addOtherDetailsEntry();
            else if (type === 'membership') addMembershipEntry();
        });
    });

    // 3. Photo and Crop Listeners
    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) setupCropper(e.target.files[0]);
        });
    }
    if (saveCropBtn) {
        saveCropBtn.addEventListener('click', cropAndSave);
    }
    
    // 4. Submission Handler
    if (form) { 
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validation: Ensure photo is saved if one was selected
            if (photoInput.files.length > 0 && preservedPhotoBase64 === null) {
                alert("Please click 'Crop & Save Photo' in the modal to finalize your picture.");
                return;
            }

            const formData = new FormData(form);
            const data = {
                // --- GENERAL INFO ---
                // ID will be assigned below based on new/existing record status
                photo: preservedPhotoBase64, 
                namePrefix: formData.get('name-prefix'),
                name: formData.get('name'),
                designation: formData.get('designation'),
                department: formData.get('department'),
                employeeId: formData.get('employee-id'),
                facultyId: formData.get('Faculty'), 
                email: formData.get('email'),
                phone: formData.get('phone'),
                
                // --- DYNAMIC/LIST DATA (Initialize arrays for ALL sections) ---
                previousWork: [],
                coursesTaught: [],
                publications: [],
                bookPublications: [],
                awards: [],
                ictCreations: [],
                researchGuidance: [],
                pgDissertations: [],
                researchProjects: [],
                patents: [],
                conferences: [],
                seminars: [],
                invitedLectures: [],
                otherDetails: [],
                memberships: []
            };

            // --- COLLECT DYNAMIC DATA Helper Function ---
            const collectDynamicData = (containerId, fieldNames) => {
                const results = [];
                const rows = document.getElementById(containerId).querySelectorAll('.data-entry-row');
                
                rows.forEach(row => {
                    let entry = {};
                    let isRowPopulated = false; // Flag to check if any field has a value
                    
                    fieldNames.forEach(name => {
                        const input = row.querySelector(`[name="${name}"]`);
                        if (input) {
                            entry[name.split('-')[1]] = input.value; // e.g., 'prev-from-year' becomes {from: value}
                            if (input.value) isRowPopulated = true;
                        }
                    });
                    
                    // Only push the entry if it contains data
                    if (isRowPopulated) results.push(entry);
                });
                return results;
            };

            // --- COLLECT ALL DYNAMIC DATA SECTIONS ---
            
            data.previousWork = collectDynamicData('previous-work-entries', 
                ['prev-organization', 'prev-designation', 'prev-from-year', 'prev-to-year']
            );
            
            data.coursesTaught = collectDynamicData('Course-tauhgt', 
                ['course-taught']
            );

            data.publications = collectDynamicData('publication-entries', 
                ['pub-year', 'pub-authors', 'pub-title', 'pub-journal', 'pub-issn', 'pub-url']
            );
            
            data.bookPublications = collectDynamicData('book-publication-entries', 
                ['book-pub-year', 'book-pub-name', 'book-pub-level', 'book-pub-editor-author', 'book-pub-issn', 'book-pub-url']
            );

            data.awards = collectDynamicData('award-entries', 
                ['award-year', 'award-title-agency', 'award-level', 'award-date']
            );

            data.ictCreations = collectDynamicData('creation-of-ICT', 
                ['ict-year', 'ict-title', 'ict-content', 'ict-url']
            );

            data.researchGuidance = collectDynamicData('research-guidance-entries', 
                ['rg-year', 'rg-enrolled', 'rg-submitted', 'rg-awarded']
            );
            
            data.pgDissertations = collectDynamicData('pg-dissertation-entries', 
                ['pg-student-name', 'pg-usn']
            );

            data.researchProjects = collectDynamicData('research-project-entries', 
                ['proj-year', 'proj-title', 'proj-agency', 'proj-period', 'proj-role', 'proj-grant']
            );
            
            data.patents = collectDynamicData('patent-entries', 
                ['patent-year', 'patent-title', 'patent-number']
            );

            data.conferences = collectDynamicData('Conference-entries', 
                ['conf-year', 'conf-title', 'conf-issn', 'conf-details']
            );
            
            data.seminars = collectDynamicData('seminar-entries', 
                ['seminar-year', 'seminar-title', 'seminar-details', 'seminar-degree']
            );

            data.invitedLectures = collectDynamicData('lectures-entries', 
                ['lecture-year', 'lecture-name', 'lecture-date', 'lecture-location']
            );

            data.otherDetails = collectDynamicData('other-details-entries', 
                ['other-year', 'other-details', 'other-date', 'other-location']
            );

            data.memberships = collectDynamicData('membership-entries', 
                ['membership-year', 'membership-details', 'membership-institute', 'membership-period', 'membership-location']
            );


            // --- SAVE TO LOCAL STORAGE & HANDLE ID ---
            let facultyList = JSON.parse(localStorage.getItem('dynamicFaculty')) || [];
            
            // Check if the faculty profile already exists (e.g., via employeeId)
            const existingIndex = facultyList.findIndex(f => f.employeeId === data.employeeId);

            if (existingIndex > -1) {
                // Update existing record: Preserve the original ID 
                data.id = facultyList[existingIndex].id; // PRESERVE EXISTING ID
                facultyList[existingIndex] = data;
            } else {
                // Add new record: Generate a robust unique ID 
                data.id = 'faculty-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9); 
                facultyList.push(data); 
            }
            
            localStorage.setItem('dynamicFaculty', JSON.stringify(facultyList));
            
            // --- DISPLAY SUCCESS MODAL ---
            document.getElementById('submitted-faculty-name').textContent = data.namePrefix + ' ' + data.name;
            document.getElementById('submitted-faculty-id').textContent = data.employeeId;
            
            openModal('confirmation-modal');
        });
    }
}

// Listener to run initialization on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeListeners);
} else {
    initializeListeners();
}