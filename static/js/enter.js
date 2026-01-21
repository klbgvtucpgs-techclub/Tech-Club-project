// ===================================
// FACULTY PROFILE SYSTEM - COMPLETE JAVASCRIPT
// Version 2.0 - NAAC Compliant
// ===================================

// ===================================
// GLOBAL VARIABLES & CONFIGURATION
// ===================================
let preservedPhotoBase64 = null;
let originalImage = null;
let rowCounter = 0;
let autoSaveTimeout = null;
let isDraftLoaded = false;

const CONFIG = {
    CANVAS_DISPLAY_SIZE: 300,
    FINAL_OUTPUT_SIZE: 200,
    CANVAS_ID: 'crop-canvas',
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    AUTO_SAVE_DELAY: 3000, // 3 seconds
    ANIMATION_DURATION: 500,
    SCROLL_ANIMATION_DELAY: 100
};

// ===================================
// UTILITY FUNCTIONS
// ===================================
const Utils = {
    // Format date for display
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
    },

    // Validate email format
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // Generate unique ID
    generateUniqueId(prefix = 'faculty') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    },

    // Show toast notification
    showToast(message, type = 'info') {
        console.log(`%c${type.toUpperCase()}: ${message}`, 
            `color: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#004d99'}; font-weight: bold;`);
        // Can be enhanced with actual toast UI component
    },

    // Smooth scroll to element
    smoothScrollTo(element, offset = 0) {
        if (!element) return;
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// ===================================
// PROGRESS BAR MANAGEMENT
// ===================================
const ProgressBar = {
    update() {
        const form = document.getElementById('faculty-submission-form');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        if (!form || !progressBar) return;
        
        const inputs = form.querySelectorAll('input[required], select[required]');
        let filled = 0;
        
        inputs.forEach(input => {
            if (input.type === 'file') {
                if (input.files && input.files.length > 0) filled++;
            } else if (input.value.trim() !== '') {
                filled++;
            }
        });
        
        const progress = Math.round((filled / inputs.length) * 100);
        progressBar.style.width = progress + '%';
        
        if (progressText) {
            progressText.textContent = progress + '% Complete';
            progressText.style.opacity = progress > 0 ? '1' : '0';
        }
    },

    reset() {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        if (progressBar) progressBar.style.width = '0%';
        if (progressText) {
            progressText.textContent = '0% Complete';
            progressText.style.opacity = '0';
        }
    }
};

// ===================================
// MODAL MANAGEMENT
// ===================================
const ModalManager = {
    open(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        document.body.style.overflow = 'hidden';
    },

    close(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 400);
    },

    closeAll() {
        const activeModals = document.querySelectorAll('.modal.active');
        activeModals.forEach(modal => {
            this.close(modal.id);
        });
    }
};

// Global modal functions for HTML onclick handlers
function openModal(modalId) { ModalManager.open(modalId); }
function closeModal(modalId) { ModalManager.close(modalId); }
function openCropModal() { ModalManager.open('crop-modal'); }
function closeCropModal() { ModalManager.close('crop-modal'); }

// ===================================
// PHOTO CROPPING & UPLOAD
// ===================================
const PhotoManager = {
    setupCropper(file) {
        if (!file) return;
        
        // Validate file type
        if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
            alert('⚠️ Please upload a valid image file (JPEG or PNG).');
            return;
        }
        
        // Validate file size
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            alert('⚠️ File size exceeds 5MB. Please choose a smaller image.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            originalImage = new Image();
            originalImage.onload = () => {
                this.drawCropCanvas();
                openCropModal();
            };
            originalImage.onerror = () => {
                alert('❌ Failed to load image. Please try another file.');
            };
            originalImage.src = e.target.result;
        };
        reader.onerror = () => {
            alert('❌ Failed to read file. Please try again.');
        };
        reader.readAsDataURL(file);
    },

    drawCropCanvas() {
        const canvas = document.getElementById(CONFIG.CANVAS_ID);
        if (!canvas || !originalImage) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, CONFIG.CANVAS_DISPLAY_SIZE, CONFIG.CANVAS_DISPLAY_SIZE);

        // Calculate scaling
        const imgWidth = originalImage.width;
        const imgHeight = originalImage.height;
        const ratio = Math.min(
            CONFIG.CANVAS_DISPLAY_SIZE / imgWidth, 
            CONFIG.CANVAS_DISPLAY_SIZE / imgHeight
        );
        
        const drawWidth = imgWidth * ratio;
        const drawHeight = imgHeight * ratio;
        const offsetX = (CONFIG.CANVAS_DISPLAY_SIZE - drawWidth) / 2;
        const offsetY = (CONFIG.CANVAS_DISPLAY_SIZE - drawHeight) / 2;

        // Draw image
        ctx.drawImage(originalImage, offsetX, offsetY, drawWidth, drawHeight);

        // Draw crop guide circle
        const center = CONFIG.CANVAS_DISPLAY_SIZE / 2;
        const radius = (CONFIG.FINAL_OUTPUT_SIZE / 2) * (CONFIG.CANVAS_DISPLAY_SIZE / CONFIG.FINAL_OUTPUT_SIZE);
        
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI);
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(0, 77, 153, 0.9)';
        ctx.stroke();
        
        // Add semi-transparent overlay outside circle
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_DISPLAY_SIZE, CONFIG.CANVAS_DISPLAY_SIZE);
        
        // Clear the circle area
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.globalCompositeOperation = 'source-over';
    },

    cropAndSave() {
        if (!originalImage) {
            closeCropModal();
            return;
        }

        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = CONFIG.FINAL_OUTPUT_SIZE;
        outputCanvas.height = CONFIG.FINAL_OUTPUT_SIZE;
        const ctx = outputCanvas.getContext('2d');

        const size = Math.min(originalImage.width, originalImage.height);
        const cropX = (originalImage.width - size) / 2;
        const cropY = (originalImage.height - size) / 2;

        // Draw cropped image
        ctx.drawImage(
            originalImage, 
            cropX, cropY, size, size,
            0, 0, CONFIG.FINAL_OUTPUT_SIZE, CONFIG.FINAL_OUTPUT_SIZE
        );
        
        // Apply circular mask
        ctx.globalCompositeOperation = 'destination-in';
        ctx.beginPath();
        ctx.arc(
            CONFIG.FINAL_OUTPUT_SIZE / 2, 
            CONFIG.FINAL_OUTPUT_SIZE / 2, 
            CONFIG.FINAL_OUTPUT_SIZE / 2, 
            0, 
            2 * Math.PI
        );
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        preservedPhotoBase64 = outputCanvas.toDataURL('image/png');
        
        this.updatePhotoPreview();
        closeCropModal();
        Utils.showToast('Photo cropped and saved successfully!', 'success');
    },

    updatePhotoPreview() {
        const photoPreview = document.getElementById('photo-preview');
        const removePhotoBtn = document.getElementById('remove-photo-btn');

        if (preservedPhotoBase64 && photoPreview) {
            photoPreview.innerHTML = `<img src="${preservedPhotoBase64}" alt="Faculty Photo" style="width:180px; height:180px; border-radius:50%; object-fit: cover;">`;
            photoPreview.classList.remove('photo-preview-empty');
            if (removePhotoBtn) removePhotoBtn.style.display = 'inline-flex';
        }
    },

    removePhoto() {
        preservedPhotoBase64 = null;
        originalImage = null;
        
        const photoPreview = document.getElementById('photo-preview');
        const photoInput = document.getElementById('photo');
        const removePhotoBtn = document.getElementById('remove-photo-btn');
        
        if (photoPreview) {
            photoPreview.innerHTML = `
                <div class="upload-placeholder">
                    <span class="upload-icon">📷</span>
                    <p>Upload Faculty Photo</p>
                    <span class="upload-subtext">Click to select image</span>
                </div>
            `;
            photoPreview.classList.add('photo-preview-empty');
        }
        
        if (photoInput) photoInput.value = '';
        if (removePhotoBtn) removePhotoBtn.style.display = 'none';
        
        Utils.showToast('Photo removed', 'info');
    }
};

// ===================================
// DYNAMIC ROW MANAGEMENT
// ===================================
const RowManager = {
    create(fields, containerId, gridClass) {
        const container = document.getElementById(containerId);
        if (!container) return;

        rowCounter++;
        const rowId = `${containerId.split('-')[0]}-row-${rowCounter}`;
        
        const row = document.createElement('div');
        row.id = rowId;
        row.className = `data-entry-row ${gridClass}`;
        row.style.opacity = '0';
        row.style.transform = 'translateY(30px)';

        // Add SI No.
        const siNo = document.createElement('span');
        siNo.className = 'si-no-placeholder';
        siNo.textContent = (container.children.length + 1) + '.';
        row.appendChild(siNo);

        // Create input fields
        fields.forEach(field => {
            const inputId = `${field.name}-${rowCounter}`;
            const inputElement = this.createInputElement(field, inputId);
            if (inputElement) {
                row.appendChild(inputElement);
            }
        });

        // Add Remove button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-button';
        removeBtn.title = 'Remove this entry';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = () => this.remove(rowId);
        row.appendChild(removeBtn);

        container.appendChild(row);
        
        // Animate entry
        setTimeout(() => {
            row.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        }, 10);
        
        // Add input listeners
        row.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', () => {
                ProgressBar.update();
                DraftManager.autoSave();
            });
        });
    },

    createInputElement(field, inputId) {
        let element;
        
        if (field.tag === 'input') {
            element = document.createElement('input');
            element.type = field.type || 'text';
            element.id = inputId;
            element.name = field.name;
            element.placeholder = field.placeholder || '';
            if (field.required) element.required = true;
            if (field.accept) element.accept = field.accept;
        } else if (field.tag === 'select') {
            element = document.createElement('select');
            element.id = inputId;
            element.name = field.name;
            if (field.required) element.required = true;
            
            field.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.text;
                element.appendChild(option);
            });
        } else if (field.tag === 'file') {
            element = document.createElement('input');
            element.type = 'file';
            element.id = inputId;
            element.name = field.name;
            element.accept = field.accept || '*/*';
        }
        
        return element;
    },

    remove(rowId) {
        const row = document.getElementById(rowId);
        if (!row) return;
        
        row.style.opacity = '0';
        row.style.transform = 'translateX(-30px) scale(0.95)';
        
        setTimeout(() => {
            const container = row.parentElement;
            row.remove();
            ProgressBar.update();
            this.updateSINumbers(container);
            DraftManager.autoSave();
        }, 350);
    },

    updateSINumbers(container) {
        if (!container) return;
        const rows = container.querySelectorAll('.data-entry-row');
        rows.forEach((row, index) => {
            const siNo = row.querySelector('.si-no-placeholder');
            if (siNo) {
                siNo.textContent = (index + 1) + '.';
            }
        });
    }
};

// Global function for HTML onclick
function removeRow(rowId) { RowManager.remove(rowId); }

// ===================================
// FIELD DEFINITIONS FOR ALL SECTIONS
// ===================================
const FieldDefinitions = {
    previousWork: [
        { tag: 'input', type: 'text', name: 'prev-organization', placeholder: 'Institution Name' },
        { tag: 'input', type: 'text', name: 'prev-designation', placeholder: 'Position Title' },
        { tag: 'input', type: 'number', name: 'prev-from-year', placeholder: 'YYYY', required: true },
        { tag: 'input', type: 'number', name: 'prev-to-year', placeholder: 'YYYY', required: true }
    ],
    courseTaught: [
        { tag: 'input', type: 'text', name: 'course-taught', placeholder: 'Enter course name', required: true }
    ],
    publications: [
        { tag: 'input', type: 'number', name: 'pub-year', placeholder: 'YYYY', required: true },
        { tag: 'input', type: 'text', name: 'pub-authors', placeholder: 'Author names', required: true },
        { tag: 'input', type: 'text', name: 'pub-title', placeholder: 'Paper title', required: true },
        { tag: 'input', type: 'text', name: 'pub-journal', placeholder: 'Journal name', required: true },
        { tag: 'input', type: 'text', name: 'pub-issn', placeholder: 'ISSN/ISBN' },
        { tag: 'input', type: 'url', name: 'pub-url', placeholder: 'https://' },
        { tag: 'file', name: 'pub-upload', accept: '.pdf,.jpg,.png' }
    ],
    bookPublications: [
        { tag: 'input', type: 'number', name: 'book-pub-year', placeholder: 'YYYY', required: true },
        { tag: 'input', type: 'text', name: 'book-pub-name', placeholder: 'Chapter/Book title', required: true },
        { tag: 'select', name: 'book-pub-level', options: [
            {value: '', text: 'Select Level'},
            {value: 'International', text: 'International'}, 
            {value: 'National', text: 'National'},
            {value: 'Regional', text: 'Regional'}
        ]},
        { tag: 'input', type: 'text', name: 'book-pub-editor-author', placeholder: 'Editor/Author name' },
        { tag: 'input', type: 'text', name: 'book-pub-issn', placeholder: 'ISSN/ISBN' },
        { tag: 'input', type: 'url', name: 'book-pub-url', placeholder: 'https://' },
        { tag: 'file', name: 'book-pub-upload', accept: '.pdf,.jpg,.png' }
    ],
    awards: [
        { tag: 'input', type: 'number', name: 'award-year', placeholder: 'YYYY', required: true },
        { tag: 'input', type: 'text', name: 'award-title-agency', placeholder: 'Award title & agency', required: true },
        { tag: 'select', name: 'award-level', options: [
            {value: '', text: 'Select Level'},
            {value: 'International', text: 'International'}, 
            {value: 'National', text: 'National'},
            {value: 'State', text: 'State'},
            {value: 'University', text: 'University'}
        ]},
        { tag: 'input', type: 'date', name: 'award-date', placeholder: 'DD-MM-YYYY' },
        { tag: 'file', name: 'award-upload', accept: '.pdf,.jpg,.png' }
    ],
    ictCreations: [
        { tag: 'input', type: 'number', name: 'ict-year', placeholder: 'YYYY', required: true },
        { tag: 'input', type: 'text', name: 'ict-title', placeholder: 'Title', required: true },
        { tag: 'input', type: 'text', name: 'ict-content', placeholder: 'Content description' },
        { tag: 'input', type: 'url', name: 'ict-url', placeholder: 'https://' },
        { tag: 'file', name: 'ict-upload', accept: '.pdf,.jpg,.png' }
    ],
    researchGuidance: [
        { tag: 'input', type: 'number', name: 'rg-year', placeholder: 'YYYY', required: true },
        { tag: 'input', type: 'number', name: 'rg-enrolled', placeholder: 'Number' },
        { tag: 'input', type: 'number', name: 'rg-submitted', placeholder: 'Number' },
        { tag: 'input', type: 'number', name: 'rg-awarded', placeholder: 'Number' },
        { tag: 'file', name: 'rg-upload', accept: '.pdf,.jpg,.png' }
    ],
    pgDissertation: [
        { tag: 'input', type: 'text', name: 'pg-student-name', placeholder: 'Student name', required: true },
        { tag: 'input', type: 'text', name: 'pg-usn', placeholder: 'USN/Roll No.' },
        { tag: 'file', name: 'pg-upload', accept: '.pdf,.jpg,.png' }
    ],
    researchProjects: [
        { tag: 'input', type: 'number', name: 'proj-year', placeholder: 'YYYY', required: true },
        { tag: 'input', type: 'text', name: 'proj-title', placeholder: 'Project title', required: true },
        { tag: 'input', type: 'text', name: 'proj-agency', placeholder: 'Funding agency' },
        { tag: 'input', type: 'text', name: 'proj-period', placeholder: '2023-2025' },
        { tag: 'select', name: 'proj-role', options: [
            {value: '', text: 'Select Role'},
            {value: 'PI', text: 'Principal Investigator'}, 
            {value: 'Co-PI', text: 'Co-Principal Investigator'}
        ]},
        { tag: 'input', type: 'number', name: 'proj-grant', placeholder: 'Amount in ₹' },
        { tag: 'file', name: 'proj-upload', accept: '.pdf,.jpg,.png' }
    ],
    patents: [
        { tag: 'input', type: 'number', name: 'patent-year', placeholder: 'YYYY', required: true },
        { tag: 'input', type: 'text', name: 'patent-title', placeholder: 'Patent title', required: true },
        { tag: 'input', type: 'text', name: 'patent-number', placeholder: 'Patent number' },
        { tag: 'file', name: 'patent-upload', accept: '.pdf,.jpg,.png' }
    ],
    conferences: [
        { tag: 'input', type: 'number', name: 'conf-year', placeholder: 'YYYY', required: true },
        { tag: 'input', type: 'text', name: 'conf-title', placeholder: 'Paper title', required: true },
        { tag: 'input', type: 'text', name: 'conf-issn', placeholder: 'ISSN/ISBN' },
        { tag: 'input', type: 'text', name: 'conf-details', placeholder: 'Conference details', required: true },
        { tag: 'file', name: 'conf-upload', accept: '.pdf,.jpg,.png' }
    ],
    seminars: [
        { tag: 'input', type: 'number', name: 'seminar-year', placeholder: 'YYYY', required: true },
        { tag: 'input', type: 'text', name: 'seminar-title', placeholder: 'Seminar/Workshop title', required: true },
        { tag: 'input', type: 'text', name: 'seminar-details', placeholder: 'Event details' },
        { tag: 'input', type: 'text', name: 'seminar-degree', placeholder: 'Certificate/Award' },
        { tag: 'file', name: 'seminar-upload', accept: '.pdf,.jpg,.png' }
    ],
    invitedLectures: [
        { tag: 'input', type: 'number', name: 'lecture-year', placeholder: 'YYYY', required: true },
        { tag: 'input', type: 'text', name: 'lecture-name', placeholder: 'Lecture title', required: true },
        { tag: 'input', type: 'date', name: 'lecture-date', placeholder: 'DD-MM-YYYY' },
        { tag: 'input', type: 'text', name: 'lecture-location', placeholder: 'Venue/Location' },
        { tag: 'file', name: 'lecture-upload', accept: '.pdf,.jpg,.png' }
    ],
    otherDetails: [
        { tag: 'input', type: 'number', name: 'other-year', placeholder: 'YYYY', required: true },
        { tag: 'input', type: 'text', name: 'other-details', placeholder: 'Activity details', required: true },
        { tag: 'input', type: 'date', name: 'other-date', placeholder: 'DD-MM-YYYY' },
        { tag: 'input', type: 'text', name: 'other-location', placeholder: 'Location' },
        { tag: 'file', name: 'other-upload', accept: '.pdf,.jpg,.png' }
    ],
    memberships: [
        { tag: 'input', type: 'number', name: 'membership-year', placeholder: 'YYYY', required: true },
        { tag: 'input', type: 'text', name: 'membership-details', placeholder: 'Details/BoE/BoS', required: true },
        { tag: 'input', type: 'text', name: 'membership-institute', placeholder: 'Institute name' },
        { tag: 'input', type: 'text', name: 'membership-period', placeholder: '2023-Present' },
        { tag: 'input', type: 'text', name: 'membership-location', placeholder: 'Location' },
        { tag: 'file', name: 'membership-upload', accept: '.pdf,.jpg,.png' }
    ]
};

// ===================================
// SECTION ENTRY FUNCTIONS
// ===================================
const SectionManager = {
    addPreviousWork() {
        RowManager.create(FieldDefinitions.previousWork, 'previous-work-entries', 'previous-work-grid');
    },
    addCourseTaught() {
        RowManager.create(FieldDefinitions.courseTaught, 'Course-tauhgt', 'Course-tauhgt-grid');
    },
    addPublication() {
        RowManager.create(FieldDefinitions.publications, 'publication-entries', 'publication-grid');
    },
    addBookPublication() {
        RowManager.create(FieldDefinitions.bookPublications, 'book-publication-entries', 'book-publication-grid');
    },
    addAward() {
        RowManager.create(FieldDefinitions.awards, 'award-entries', 'award-grid');
    },
    addICTCreation() {
        RowManager.create(FieldDefinitions.ictCreations, 'creation-of-ICT', 'creation-ict-grid');
    },
    addResearchGuidance() {
        RowManager.create(FieldDefinitions.researchGuidance, 'research-guidance-entries', 'Research-guid-grid');
    },
    addPGDissertation() {
        RowManager.create(FieldDefinitions.pgDissertation, 'pg-dissertation-entries', 'pg-grid');
    },
    addResearchProject() {
        RowManager.create(FieldDefinitions.researchProjects, 'research-project-entries', 'project-grid');
    },
    addPatent() {
        RowManager.create(FieldDefinitions.patents, 'patent-entries', 'patent-grid');
    },
    addConference() {
        RowManager.create(FieldDefinitions.conferences, 'Conference-entries', 'conference-grid');
    },
    addSeminar() {
        RowManager.create(FieldDefinitions.seminars, 'seminar-entries', 'Seminars-grid');
    },
    addLecture() {
        RowManager.create(FieldDefinitions.invitedLectures, 'lectures-entries', 'Lectures-grid');
    },
    addOtherDetails() {
        RowManager.create(FieldDefinitions.otherDetails, 'other-details-entries', 'other-details-grid');
    },
    addMembership() {
        RowManager.create(FieldDefinitions.memberships, 'membership-entries', 'membership-grid');
    }
};

// ===================================
// DATA COLLECTION
// ===================================
const DataCollector = {
    collectDynamicData(containerId, fieldNames) {
        const results = [];
        const container = document.getElementById(containerId);
        if (!container) return results;
        
        const rows = container.querySelectorAll('.data-entry-row');
        
        rows.forEach(row => {
            let entry = {};
            let isRowPopulated = false;
            
            fieldNames.forEach(name => {
                const input = row.querySelector(`[name="${name}"]`);
                if (input) {
                    const value = input.type === 'file' ? input.files[0]?.name || '' : input.value;
                    entry[name] = value;
                    if (value) isRowPopulated = true;
                }
            });
            
            if (isRowPopulated) results.push(entry);
        });
        
        return results;
    },

    collectAllFormData(formData) {
        return {
            id: null,
            timestamp: new Date().toISOString(),
            croppedPhotoBase64: preservedPhotoBase64,
            photo: preservedPhotoBase64,
            namePrefix: formData.get('name-prefix'),
            name: formData.get('name'),
            designation: formData.get('designation'),
            department: formData.get('department'),
            employeeId: formData.get('employee-id'),
            facultyId: formData.get('Faculty'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            
            prevWork: this.collectDynamicData('previous-work-entries', 
                ['prev-organization', 'prev-designation', 'prev-from-year', 'prev-to-year']),
            courseTaught: this.collectDynamicData('Course-tauhgt', ['course-taught']),
            publications: this.collectDynamicData('publication-entries', 
                ['pub-year', 'pub-authors', 'pub-title', 'pub-journal', 'pub-issn', 'pub-url', 'pub-upload']),
            bookPublications: this.collectDynamicData('book-publication-entries', 
                ['book-pub-year', 'book-pub-name', 'book-pub-level', 'book-pub-editor-author', 'book-pub-issn', 'book-pub-url', 'book-pub-upload']),
            awards: this.collectDynamicData('award-entries', 
                ['award-year', 'award-title-agency', 'award-level', 'award-date', 'award-upload']),
            ictCreations: this.collectDynamicData('creation-of-ICT', 
                ['ict-year', 'ict-title', 'ict-content', 'ict-url', 'ict-upload']),
            researchGuidance: this.collectDynamicData('research-guidance-entries', 
                ['rg-year', 'rg-enrolled', 'rg-submitted', 'rg-awarded', 'rg-upload']),
            pgDissertations: this.collectDynamicData('pg-dissertation-entries', 
                ['pg-student-name', 'pg-usn', 'pg-upload']),
            researchProjects: this.collectDynamicData('research-project-entries', 
                ['proj-year', 'proj-title', 'proj-agency', 'proj-period', 'proj-role', 'proj-grant', 'proj-upload']),
            patents: this.collectDynamicData('patent-entries', 
                ['patent-year', 'patent-title', 'patent-number', 'patent-upload']),
            conferences: this.collectDynamicData('Conference-entries', 
                ['conf-year', 'conf-title', 'conf-issn', 'conf-details', 'conf-upload']),
            seminars: this.collectDynamicData('seminar-entries', 
                ['seminar-year', 'seminar-title', 'seminar-details', 'seminar-degree', 'seminar-upload']),
            invitedLectures: this.collectDynamicData('lectures-entries', 
                ['lecture-year', 'lecture-name', 'lecture-date', 'lecture-location', 'lecture-upload']),
            otherDetails: this.collectDynamicData('other-details-entries', 
                ['other-year', 'other-details', 'other-date', 'other-location', 'other-upload']),
            memberships: this.collectDynamicData('membership-entries', 
                ['membership-year', 'membership-details', 'membership-institute', 'membership-period', 'membership-location', 'membership-upload'])
        };
    }
};

// ===================================
// FORM VALIDATION
// ===================================
const FormValidator = {
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    validatePhone(phone) {
        return !phone || /^[\d\s\+\-\(\)]+$/.test(phone);
    },

    validateForm(data) {
        const errors = [];

        if (!data.name || data.name.trim() === '') {
            errors.push('Name is required');
        }

        if (!data.employeeId || data.employeeId.trim() === '') {
            errors.push('Employee ID is required');
        }

        if (!data.email || !this.validateEmail(data.email)) {
            errors.push('Valid email is required');
        }

        if (data.phone && !this.validatePhone(data.phone)) {
            errors.push('Invalid phone number format');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    showValidationErrors(errors) {
        const errorMessage = errors.join('\n• ');
        alert('⚠️ Please fix the following errors:\n\n• ' + errorMessage);
    }
};

// ===================================
// FORM SUBMISSION
// ===================================
const FormSubmitter = {
    async handleSubmit(e) {
        e.preventDefault();
        
        // Check if photo needs to be cropped
        const photoInput = document.getElementById('photo');
        if (photoInput && photoInput.files.length > 0 && preservedPhotoBase64 === null) {
            alert("📸 Please crop and save your photo before submitting.");
            photoInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const formData = new FormData(e.target);
        const data = DataCollector.collectAllFormData(formData);

        // Validate form
        const validation = FormValidator.validateForm(data);
        if (!validation.isValid) {
            FormValidator.showValidationErrors(validation.errors);
            return;
        }

        // Show loading state
        const submitBtn = document.getElementById('submit-profile-btn');
        this.setLoadingState(submitBtn, true);

        try {
            // Simulate processing delay
            await this.saveToStorage(data);
            
            // Show success modal
            this.showSuccessModal(data);
            
            // Clear draft
            DraftManager.clearDraft();
            
        } catch (error) {
            console.error('Submission error:', error);
            alert('❌ An error occurred while saving. Please try again.');
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    },

    setLoadingState(button, isLoading) {
        if (!button) return;
        
        const submitText = button.querySelector('.submit-text');
        const submitIcon = button.querySelector('.submit-icon');
        const submitLoader = button.querySelector('.submit-loader');
        
        if (isLoading) {
            button.classList.add('loading');
            if (submitText) submitText.style.display = 'none';
            if (submitIcon) submitIcon.style.display = 'none';
            if (submitLoader) submitLoader.style.display = 'block';
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            if (submitText) submitText.style.display = 'inline';
            if (submitIcon) submitIcon.style.display = 'inline';
            if (submitLoader) submitLoader.style.display = 'none';
            button.disabled = false;
        }
    },

    async saveToStorage(data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    let facultyList = JSON.parse(localStorage.getItem('dynamicFaculty')) || [];
                    const existingIndex = facultyList.findIndex(f => f.employeeId === data.employeeId);

                    if (existingIndex > -1) {
                        // Update existing - preserve ID
                        data.id = facultyList[existingIndex].id;
                        facultyList[existingIndex] = data;
                    } else {
                        // Create new with unique ID
                        data.id = Utils.generateUniqueId('faculty');
                        facultyList.push(data);
                    }
                    
                    localStorage.setItem('dynamicFaculty', JSON.stringify(facultyList));
                    resolve(data);
                } catch (error) {
                    throw new Error('Failed to save to storage');
                }
            }, 1800);
        });
    },

    showSuccessModal(data) {
        const nameElement = document.getElementById('submitted-faculty-name');
        const idElement = document.getElementById('submitted-faculty-id');
        
        if (nameElement) nameElement.textContent = data.namePrefix + ' ' + data.name;
        if (idElement) idElement.textContent = data.employeeId;
        
        openModal('confirmation-modal');
    }
};

// ===================================
// DRAFT MANAGEMENT (AUTO-SAVE)
// ===================================
const DraftManager = {
    autoSave: Utils.debounce(function() {
        if (isDraftLoaded) return; // Don't save while loading
        
        const form = document.getElementById('faculty-submission-form');
        if (!form) return;
        
        try {
            const formData = new FormData(form);
            const draft = {
                timestamp: new Date().toISOString(),
                photo: preservedPhotoBase64,
                data: Object.fromEntries(formData)
            };
            
            localStorage.setItem('facultyFormDraft', JSON.stringify(draft));
            console.log('✅ Draft auto-saved at', new Date().toLocaleTimeString());
        } catch (e) {
            console.warn('⚠️ Could not auto-save draft:', e);
        }
    }, CONFIG.AUTO_SAVE_DELAY),

    loadDraft() {
        try {
            const draftStr = localStorage.getItem('facultyFormDraft');
            if (!draftStr) return false;
            
            const draft = JSON.parse(draftStr);
            const draftAge = Date.now() - new Date(draft.timestamp).getTime();
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
            
            if (draftAge > maxAge) {
                this.clearDraft();
                return false;
            }
            
            const shouldLoad = confirm(
                `📝 A draft was found from ${Utils.formatDate(draft.timestamp)}.\n\nWould you like to restore it?`
            );
            
            if (!shouldLoad) {
                this.clearDraft();
                return false;
            }
            
            isDraftLoaded = true;
            
            // Restore photo
            if (draft.photo) {
                preservedPhotoBase64 = draft.photo;
                PhotoManager.updatePhotoPreview();
            }
            
            // Restore form data
            Object.entries(draft.data).forEach(([key, value]) => {
                const input = document.querySelector(`[name="${key}"]`);
                if (input && value) {
                    input.value = value;
                }
            });
            
            ProgressBar.update();
            Utils.showToast('Draft restored successfully!', 'success');
            
            setTimeout(() => { isDraftLoaded = false; }, 1000);
            return true;
            
        } catch (e) {
            console.error('Failed to load draft:', e);
            this.clearDraft();
            return false;
        }
    },

    clearDraft() {
        try {
            localStorage.removeItem('facultyFormDraft');
            console.log('🗑️ Draft cleared');
        } catch (e) {
            console.warn('Could not clear draft:', e);
        }
    }
};

// ===================================
// SCROLL ANIMATIONS
// ===================================
const ScrollAnimations = {
    init() {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -100px 0px'
        };
        
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeInUp 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards';
                    sectionObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('.form-section').forEach(section => {
            sectionObserver.observe(section);
        });
    },

    addInputAnimations() {
        document.querySelectorAll('.form-field input, .form-field select').forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.style.transform = 'scale(1.02)';
            });
            input.addEventListener('blur', function() {
                this.parentElement.style.transform = 'scale(1)';
            });
        });
    }
};

// ===================================
// KEYBOARD SHORTCUTS
// ===================================
const KeyboardShortcuts = {
    init() {
        document.addEventListener('keydown', (e) => {
            // ESC to close modals
            if (e.key === 'Escape') {
                ModalManager.closeAll();
            }
            
            // Ctrl/Cmd + S to scroll to submit button
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                const submitBtn = document.getElementById('submit-profile-btn');
                if (submitBtn) {
                    Utils.smoothScrollTo(submitBtn, 100);
                    submitBtn.style.animation = 'pulse 0.5s ease-in-out';
                    setTimeout(() => {
                        submitBtn.style.animation = '';
                    }, 500);
                }
            }
        });
    }
};

// ===================================
// BUTTON HANDLER MAPPING
// ===================================
const BUTTON_HANDLER_MAP = {
    'previousWork': SectionManager.addPreviousWork,
    'Coursetauhgt': SectionManager.addCourseTaught,
    'publications': SectionManager.addPublication,
    'bookpublications': SectionManager.addBookPublication,
    'awards': SectionManager.addAward,
    'creationofICT': SectionManager.addICTCreation,
    'researchGuidance': SectionManager.addResearchGuidance,
    'pgDissertation': SectionManager.addPGDissertation,
    'researchProjects': SectionManager.addResearchProject,
    'patententries': SectionManager.addPatent,
    'conference': SectionManager.addConference,
    'Seminar': SectionManager.addSeminar,
    'Lectures': SectionManager.addLecture,
    'otherDetails': SectionManager.addOtherDetails,
    'membership': SectionManager.addMembership
};

// ===================================
// EVENT LISTENERS INITIALIZATION
// ===================================
const EventListeners = {
    initializeAll() {
        const form = document.getElementById('faculty-submission-form');
        const photoInput = document.getElementById('photo');
        const saveCropBtn = document.getElementById('save-crop-btn');
        const removePhotoBtn = document.getElementById('remove-photo-btn');
        
        // Initialize one default row for each section
        this.initializeDefaultRows();
        
        // Add button listeners
        this.initializeAddButtons();
        
        // Photo handling
        if (photoInput) {
            photoInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    PhotoManager.setupCropper(e.target.files[0]);
                }
            });
        }
        
        if (saveCropBtn) {
            saveCropBtn.addEventListener('click', () => PhotoManager.cropAndSave());
        }
        
        if (removePhotoBtn) {
            removePhotoBtn.addEventListener('click', () => PhotoManager.removePhoto());
        }
        
        // Form submission
        if (form) {
            form.addEventListener('submit', (e) => FormSubmitter.handleSubmit(e));
            form.addEventListener('input', () => {
                ProgressBar.update();
                DraftManager.autoSave();
            });
            form.addEventListener('change', () => {
                ProgressBar.update();
                DraftManager.autoSave();
            });
        }
        
        // Modal close on background click
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                const modal = event.target;
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }, 400);
            }
        });
    },

    initializeDefaultRows() {
        SectionManager.addPreviousWork();
        SectionManager.addCourseTaught();
        SectionManager.addPublication();
        SectionManager.addBookPublication();
        SectionManager.addAward();
        SectionManager.addICTCreation();
        SectionManager.addResearchGuidance();
        SectionManager.addPGDissertation();
        SectionManager.addResearchProject();
        SectionManager.addPatent();
        SectionManager.addConference();
        SectionManager.addSeminar();
        SectionManager.addLecture();
        SectionManager.addOtherDetails();
        SectionManager.addMembership();
    },

    initializeAddButtons() {
        document.querySelectorAll('.add-button').forEach(button => {
            button.addEventListener('click', function() {
                const type = this.getAttribute('data-type');
                const handler = BUTTON_HANDLER_MAP[type];
                
                if (handler) {
                    handler();
                    
                    // Scroll to newly added row
                    setTimeout(() => {
                        const container = this.previousElementSibling?.querySelector('.data-entry-row:last-child');
                        if (container) {
                            Utils.smoothScrollTo(container, 100);
                        }
                    }, CONFIG.SCROLL_ANIMATION_DELAY);
                }
            });
        });
    }
};

// ===================================
// PAGE LOAD EFFECTS
// ===================================
const PageEffects = {
    init() {
        // Smooth page entrance
        document.body.style.opacity = '0';
        setTimeout(() => {
            document.body.style.transition = 'opacity 0.6s ease';
            document.body.style.opacity = '1';
        }, 100);
        
        // Console welcome
        this.showConsoleWelcome();
    },

    showConsoleWelcome() {
        console.log('%c🎓 Faculty Profile System', 'font-size: 20px; font-weight: bold; color: #004d99;');
        console.log('%c✨ Enhanced with beautiful animations and smooth UX', 'font-size: 12px; color: #666;');
        console.log('%cVersion 2.0 | All NAAC sections included', 'font-size: 10px; color: #999;');
        console.log('%c─────────────────────────────────────────', 'color: #ccc;');
        console.log('%cFeatures:', 'font-weight: bold; color: #004d99;');
        console.log('  • Auto-save drafts every 3 seconds');
        console.log('  • Photo cropping with preview');
        console.log('  • Progress tracking');
        console.log('  • Keyboard shortcuts (ESC, Ctrl+S)');
        console.log('  • Smooth animations & transitions');
        console.log('%c─────────────────────────────────────────', 'color: #ccc;');
    }
};

// ===================================
// MAIN INITIALIZATION FUNCTION
// ===================================
function initializeApp() {
    // Initialize all components
    EventListeners.initializeAll();
    ScrollAnimations.init();
    ScrollAnimations.addInputAnimations();
    KeyboardShortcuts.init();
    PageEffects.init();
    
    // Load draft if available
    DraftManager.loadDraft();
    
    // Initial progress update
    ProgressBar.update();
    
    console.log('✅ Faculty Profile System initialized successfully');
}

// ===================================
// DOCUMENT READY & PAGE LOAD
// ===================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Additional page load animations
window.addEventListener('load', () => {
    PageEffects.init();
});

// ===================================
// EXPORT FOR TESTING (if needed)
// ===================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Utils,
        ProgressBar,
        ModalManager,
        PhotoManager,
        RowManager,
        SectionManager,
        DataCollector,
        FormValidator,
        FormSubmitter,
        DraftManager
    };
}


