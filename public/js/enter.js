// --- Global Variables for Photo Handling ---
// Stores the cropped Base64 string for submission (replaces file upload during submission)
let preservedPhotoBase64 = null; 
// Stores the Image object of the currently uploaded file for cropping
let originalImage = null; 
const CANVAS_DISPLAY_SIZE = 300; // Size of the canvas element in the modal (for preview)
const FINAL_OUTPUT_SIZE = 200; // Size of the final cropped image (pixels)

// --- Modal Functions (Updated to include crop modal) ---
function openModal(modalId) {
    document.getElementById(modalId).style.display = "block";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
    if (modalId === 'confirmation-modal') {
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

// --- Dynamic Form Functions (Unchanged) ---

function createDataEntryRow(fields, containerId, values = {}) {
    const container = document.getElementById(containerId);
    const entryDiv = document.createElement('div');
    entryDiv.classList.add('data-entry-row');

    fields.forEach(field => {
        const input = document.createElement('input');
        input.type = field.type || 'text';
        input.placeholder = field.placeholder;
        input.setAttribute('data-field-name', field.name); 
        input.required = field.required || false;
        
        input.value = values[field.name] || ''; 
        
        entryDiv.appendChild(input);
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.classList.add('remove-button');
    removeBtn.innerHTML = 'X';
    removeBtn.onclick = () => entryDiv.remove();
    entryDiv.appendChild(removeBtn);

    container.appendChild(entryDiv);
    return entryDiv;
}

function createEmptyEntry(containerId, fields) {
    createDataEntryRow(fields, containerId, {});
}


function addPreviousWorkEntry() {
    const fields = [
        { placeholder: 'Institution Name', name: 'institution', required: true },
        { placeholder: 'Position Held', name: 'position', required: true },
        { placeholder: 'Period (e.g., 2018-2020)', name: 'period', required: true }
    ];
    createEmptyEntry('previous-work-entries', fields);
}

function addResearchPaperEntry() {
    const fields = [
        { placeholder: 'Paper Title, Journal, Volume, Pages, etc. (Full Citation)', name: 'citation', required: true },
        { placeholder: 'ISSN', name: 'issn' }
    ];
    createEmptyEntry('research-paper-entries', fields);
}

function addProjectEntry() {
    const fields = [
        { placeholder: 'Project Title', name: 'project-title', required: true },
        { placeholder: 'Funding Agency', name: 'agency' },
        { placeholder: 'Amount (e.g., Rs. 5 Lakhs)', name: 'amount' },
        { placeholder: 'Period (e.g., 2024-2025)', name: 'project-period' }
    ];
    createEmptyEntry('project-entries', fields);
}

function addAwardEntry() {
    const fields = [
        { placeholder: 'Award Title', name: 'award-title', required: true },
        { placeholder: 'Awarding Agency', name: 'agency' },
        { placeholder: 'Date (e.g., 2023-08-15)', name: 'date' }
    ];
    createEmptyEntry('award-entries', fields);
}

// ===================================
// IMAGE CROPPING LOGIC (NEW)
// ===================================

/**
 * Sets up the canvas with the uploaded image and a circular crop guide.
 */
function setupCropper(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        originalImage = new Image();
        originalImage.onload = function() {
            const canvas = document.getElementById('crop-canvas');
            canvas.width = CANVAS_DISPLAY_SIZE;
            canvas.height = CANVAS_DISPLAY_SIZE;
            const ctx = canvas.getContext('2d');
            
            ctx.clearRect(0, 0, CANVAS_DISPLAY_SIZE, CANVAS_DISPLAY_SIZE);

            // Calculate scaling and centering to cover the canvas (like 'background-size: cover')
            const imgRatio = originalImage.width / originalImage.height;
            const canvasRatio = CANVAS_DISPLAY_SIZE / CANVAS_DISPLAY_SIZE;
            
            let drawWidth, drawHeight, xOffset, yOffset;

            if (imgRatio > canvasRatio) { 
                // Image is wider than canvas, fit height and crop sides
                drawHeight = CANVAS_DISPLAY_SIZE;
                drawWidth = drawHeight * imgRatio;
                xOffset = (CANVAS_DISPLAY_SIZE - drawWidth) / 2;
                yOffset = 0;
            } else { 
                // Image is taller than canvas, fit width and crop top/bottom
                drawWidth = CANVAS_DISPLAY_SIZE;
                drawHeight = drawWidth / imgRatio;
                xOffset = 0;
                yOffset = (CANVAS_DISPLAY_SIZE - drawHeight) / 2;
            }

            // 1. Draw the image scaled to cover the canvas view
            ctx.drawImage(originalImage, 0, 0, originalImage.width, originalImage.height, xOffset, yOffset, drawWidth, drawHeight);
            
            // 2. Draw Circular Overlay (Visual Guide)
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, CANVAS_DISPLAY_SIZE, CANVAS_DISPLAY_SIZE);

            // 3. Create the circular "hole" for the crop area (destination-out clears the overlap)
            const centerX = CANVAS_DISPLAY_SIZE / 2;
            const centerY = CANVAS_DISPLAY_SIZE / 2;
            const radius = CANVAS_DISPLAY_SIZE / 2 - 2; 

            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            ctx.fill();
            
            ctx.globalCompositeOperation = 'source-over'; // Restore context settings

            openCropModal();
        };
        originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * Crops the center square of the original image, makes it circular, and saves the Base64 result.
 */
function cropAndSave() {
    if (!originalImage) {
        alert("Error: No image loaded for cropping.");
        closeCropModal();
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set final output size
    canvas.width = FINAL_OUTPUT_SIZE;
    canvas.height = FINAL_OUTPUT_SIZE;

    // 1. Draw a circular clip path on the output canvas
    const centerX = FINAL_OUTPUT_SIZE / 2;
    const centerY = FINAL_OUTPUT_SIZE / 2;
    const radius = FINAL_OUTPUT_SIZE / 2;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, true);
    ctx.closePath();
    ctx.clip(); // Clip everything drawn outside the circle
    
    // 2. Calculate the source rectangle (center square crop from original image)
    const imgWidth = originalImage.width;
    const imgHeight = originalImage.height;
    const minDim = Math.min(imgWidth, imgHeight);
    
    // Coordinates for a center-square crop on the original image
    const sourceX = (imgWidth - minDim) / 2;
    const sourceY = (imgHeight - minDim) / 2;
    const sourceDim = minDim;
    
    // 3. Draw the center square from the original image onto the small, circular canvas
    ctx.drawImage(originalImage, sourceX, sourceY, sourceDim, sourceDim, 0, 0, FINAL_OUTPUT_SIZE, FINAL_OUTPUT_SIZE);
    
    // Get the cropped Base64 string
    const croppedPhotoBase64 = canvas.toDataURL('image/jpeg', 0.8);

    // Update the global variable used for submission
    preservedPhotoBase64 = croppedPhotoBase64; 

    // Update the preview element
    const photoPreviewContainer = document.getElementById('photo-preview-container');
    const photoPreview = document.getElementById('photo-preview');
    const removePhotoBtn = document.getElementById('remove-photo-btn');
    
    photoPreview.style.backgroundImage = `url('${croppedPhotoBase64}')`;
    photoPreviewContainer.style.display = 'block';
    removePhotoBtn.style.display = 'block';
    
    // Clear file input so 'change' event fires again if user picks same file later
    document.getElementById('photo').value = ''; 

    closeCropModal();
}

// ===================================
// EDIT/LOAD FUNCTIONS (Updated)
// ===================================

function clearDynamicContainers() {
    document.getElementById('previous-work-entries').innerHTML = '';
    document.getElementById('research-paper-entries').innerHTML = '';
    document.getElementById('project-entries').innerHTML = '';
    document.getElementById('award-entries').innerHTML = '';
}

function loadFacultyForEdit(facultyId) {
    const facultyList = JSON.parse(localStorage.getItem('dynamicFaculty')) || [];
    const faculty = facultyList.find(f => f.id === facultyId);

    if (!faculty) {
        alert("Error: Faculty profile not found for editing.");
        window.location.href = 'index.html';
        return;
    }
    
    // --- PHOTO EDITING SETUP ---
    // If editing, load the existing photo Base64 for submission
    preservedPhotoBase64 = faculty.photo; 
    
    const photoPreviewContainer = document.getElementById('photo-preview-container');
    const photoPreview = document.getElementById('photo-preview');
    const removePhotoBtn = document.getElementById('remove-photo-btn');
    
    if (preservedPhotoBase64) {
        photoPreview.style.backgroundImage = `url('${preservedPhotoBase64}')`;
        photoPreviewContainer.style.display = 'block';
        removePhotoBtn.style.display = 'block';
    } else {
        photoPreviewContainer.style.display = 'none';
        removePhotoBtn.style.display = 'none';
    }
    
    // Setup Remove Photo Button Handler
    // NOTE: This must be updated to clear originalImage too
    removePhotoBtn.onclick = () => {
        preservedPhotoBase64 = null; // Mark for removal/no photo on submission
        originalImage = null; // Clear source image if it was loaded
        document.getElementById('photo').value = ''; // Clear the file input
        
        photoPreview.style.backgroundImage = 'none';
        photoPreviewContainer.style.display = 'none';
        removePhotoBtn.style.display = 'none';
    };
    // --- END PHOTO EDITING SETUP ---

    // Update the form title and button text (unchanged)
    document.querySelector('h1').textContent = `Edit Profile: ${faculty.name}`;
    document.querySelector('button[type="submit"]').textContent = 'Update Faculty Profile';
    
    // Store the ID in the form element (unchanged)
    document.getElementById('faculty-submission-form').setAttribute('data-editing-id', facultyId);

    // Populate basic fields (unchanged)
    document.getElementById('name').value = faculty.name || '';
    document.getElementById('designation').value = faculty.designation || '';
    document.getElementById('department').value = faculty.department || '';
    document.getElementById('email').value = faculty.email || '';
    document.getElementById('employee-id').value = faculty.employeeId || '';
    document.getElementById('qualification').value = faculty.qualification || '';
    document.getElementById('specialization').value = faculty.specialization || '';
    document.getElementById('thesis-submitted').value = faculty.thesisSubmitted || '0';
    document.getElementById('degree-awarded').value = faculty.degreeAwarded || '0';

    // Clear and Recreate dynamic rows from saved data (unchanged)
    clearDynamicContainers();
    const workFields = [{ placeholder: 'Institution Name', name: 'institution', required: true }, { placeholder: 'Position Held', name: 'position', required: true }, { placeholder: 'Period (e.g., 2018-2020)', name: 'period', required: true }];
    faculty.previousWork.forEach(item => createDataEntryRow(workFields, 'previous-work-entries', item));
    const paperFields = [{ placeholder: 'Paper Title, Journal, Volume, Pages, etc. (Full Citation)', name: 'citation', required: true }, { placeholder: 'ISSN', name: 'issn' }];
    faculty.researchPapers.forEach(item => createDataEntryRow(paperFields, 'research-paper-entries', item));
    const projectFields = [{ placeholder: 'Project Title', name: 'project-title', required: true }, { placeholder: 'Funding Agency', name: 'agency' }, { placeholder: 'Amount (e.g., Rs. 5 Lakhs)', name: 'amount' }, { placeholder: 'Period (e.g., 2024-2025)', name: 'project-period' }];
    faculty.projects.forEach(item => createDataEntryRow(projectFields, 'project-entries', item));
    const awardFields = [{ placeholder: 'Award Title', name: 'award-title', required: true }, { placeholder: 'Awarding Agency', name: 'agency' }, { placeholder: 'Date (e.g., 2023-08-15)', name: 'date' }];
    faculty.awards.forEach(item => createDataEntryRow(awardFields, 'award-entries', item));
    
    addPreviousWorkEntry();
    addResearchPaperEntry();
    addProjectEntry();
    addAwardEntry();
}

// ===================================
// SUBMISSION LOGIC (Updated to use preservedPhotoBase64)
// ===================================

function getDynamicData(containerId) {
    const container = document.getElementById(containerId);
    const rows = container.querySelectorAll('.data-entry-row');
    const data = [];

    rows.forEach(row => {
        const rowData = {};
        const inputs = row.querySelectorAll('input');
        
        const isComplete = Array.from(inputs).some(input => input.value.trim() !== '');

        if (isComplete) { 
            inputs.forEach(input => {
                const fieldName = input.getAttribute('data-field-name');
                rowData[fieldName] = input.value.trim();
            });
            data.push(rowData);
        }
    });

    return data;
}

function processSubmission(photoBase64, isEditing, facultyId) {
    const facultyData = {
        id: facultyId || 'dynamic-' + Date.now(), 
        photo: photoBase64, // Uses the cropped/preserved Base64 string
        name: document.getElementById('name').value,
        designation: document.getElementById('designation').value,
        department: document.getElementById('department').value,
        email: document.getElementById('email').value,
        employeeId: document.getElementById('employee-id').value,
        qualification: document.getElementById('qualification').value,
        specialization: document.getElementById('specialization').value,
        thesisSubmitted: document.getElementById('thesis-submitted').value,
        degreeAwarded: document.getElementById('degree-awarded').value,
        previousWork: getDynamicData('previous-work-entries'),
        researchPapers: getDynamicData('research-paper-entries'),
        projects: getDynamicData('project-entries'),
        awards: getDynamicData('award-entries')
    };
    
    let facultyList = JSON.parse(localStorage.getItem('dynamicFaculty')) || [];
    
    if (isEditing) {
        const index = facultyList.findIndex(f => f.id === facultyId);
        if (index !== -1) {
            facultyList[index] = facultyData;
        } 
        document.querySelector('#confirmation-modal h1').textContent = '✅ Update Successful!';
    } else {
        facultyList.push(facultyData);
        document.querySelector('#confirmation-modal h1').textContent = '✅ Submission Successful!';
    }
    
    localStorage.setItem('dynamicFaculty', JSON.stringify(facultyList));
    
    document.getElementById('submitted-faculty-name').textContent = facultyData.name;
    document.getElementById('submitted-faculty-id').textContent = facultyData.employeeId;
    
    openModal('confirmation-modal');
    
    document.getElementById('faculty-submission-form').reset();
    preservedPhotoBase64 = null; // Clear the state after successful submission
    originalImage = null;
}


document.addEventListener('DOMContentLoaded', () => {
    
    const urlParams = new URLSearchParams(window.location.search);
    const facultyId = urlParams.get('id');
    const form = document.getElementById('faculty-submission-form');
    const photoInput = document.getElementById('photo');
    const saveCropBtn = document.getElementById('save-crop-btn'); 

    if (facultyId) {
        loadFacultyForEdit(facultyId);
    } else {
        addPreviousWorkEntry();
        addResearchPaperEntry();
        addProjectEntry();
        addAwardEntry();
    }
    
    // --- NEW: Event listener for file input to trigger the crop modal ---
    photoInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            setupCropper(e.target.files[0]);
        }
    });

    // --- NEW: Event listener for the crop button inside the modal ---
    if (saveCropBtn) {
        saveCropBtn.addEventListener('click', cropAndSave);
    }
    
    // --- Submission Handler (Updated to use preservedPhotoBase64 directly) ---
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const isEditing = !!form.getAttribute('data-editing-id');
        const currentId = form.getAttribute('data-editing-id') || null;

        // Validation: If a new file was selected but they failed to crop, stop submission.
        // If they are in edit mode and preservedPhotoBase64 is null, it means they explicitly removed the photo.
        if (photoInput.files.length > 0 && preservedPhotoBase64 === null) {
            alert("Please click 'Crop & Save Photo' in the modal to finalize your picture.");
            return;
        }

        // preservedPhotoBase64 now holds the final image data (cropped, existing, or null)
        const photoBase64 = preservedPhotoBase64; 
        processSubmission(photoBase64, isEditing, currentId);
    });
});