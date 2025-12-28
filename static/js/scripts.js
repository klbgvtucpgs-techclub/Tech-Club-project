// ===================================
// MODAL (POP-UP) FUNCTIONS
// ===================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        
        setTimeout(() => {
            modal.classList.add('active');
        }, 10); 

        document.body.style.overflow = 'hidden'; 
    }
    initializeAccordions();
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');

        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto'; 
        }, 400); 
    }
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        const modalId = event.target.id;
        closeModal(modalId);
    }
}

// ===================================
// ACCORDION FUNCTIONS
// ===================================

function initializeAccordions() {
    const buttons = document.querySelectorAll('.accordion-button');

    buttons.forEach(button => {
        if (!button.getAttribute('data-listener-added')) {
            button.addEventListener('click', function() {
                this.classList.toggle('active');
                const content = this.nextElementSibling;
                
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                    content.classList.remove('active');
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                    content.classList.add('active');
                }
            });
            button.setAttribute('data-listener-added', 'true');
        }
    });
}

// ===================================
// DYNAMIC DATA ACTIONS
// ===================================

function removeFaculty(facultyId) {
    if (!confirm("Are you sure you want to remove this faculty member? This cannot be undone.")) {
        return;
    }

    let facultyList = JSON.parse(localStorage.getItem('dynamicFaculty')) || [];
    facultyList = facultyList.filter(faculty => faculty.id !== facultyId);
    localStorage.setItem('dynamicFaculty', JSON.stringify(facultyList));
    
    // Smooth removal animation
    const card = document.querySelector(`[onclick*="${facultyId}"]`)?.closest('.faculty-member-card');
    if (card) {
        card.style.transform = 'scale(0.8) translateY(20px)';
        card.style.opacity = '0';
        setTimeout(() => {
            loadDynamicFaculty();
        }, 300);
    } else {
        loadDynamicFaculty();
    }
}

function generateAccordionTableHTML(data, type) {
    if (!data || data.length === 0) return `<p style="color: #666; padding: 10px;">No ${type} reported.</p>`;
    
    const mapDataToRows = (data, keys) => {
        return data.map(item => `
            <tr style="animation: fadeIn 0.3s ease-out;">
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
                <ul style="animation: fadeIn 0.3s ease-out;">
                    ${data.map(item => `<li>📚 ${item['course-taught'] || 'N/A'}</li>`).join('')}
                </ul>
            `;
        case 'Publications':
            return `<p style="color: #666; padding: 10px;">Detailed publications table (e.g., Title, Journal, ISSN) would be here.</p>`;
        case 'Awards':
             return `<p style="color: #666; padding: 10px;">Detailed awards table (e.g., Title, Agency, Date) would be here.</p>`;
        default:
            return `<p style="color: #666; padding: 10px;">Detailed ${type} data summary loaded.</p>`;
    }
}

function generateDynamicFacultyHTML(faculty) {
    const modalId = `modal-dynamic-${faculty.id}`;
    const imageSource = faculty.croppedPhotoBase64 || faculty.photo || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" font-size="60" text-anchor="middle" dy=".3em" fill="%23999"%3E%3F%3C/text%3E%3C/svg%3E';
    const fullName = `${faculty.namePrefix} ${faculty.name}`;

    const cardHTML = `
        <div class="faculty-member-card">
            <img src="${imageSource}" alt="${fullName}" class="professor-image" onclick="openModal('${modalId}')">
            <h3>${fullName}</h3>
            <p>${faculty.designation}</p>
            <p style="color: #999; font-size: 0.85em;">${faculty.department}</p>
            <button class="remove-button-directory" onclick="removeFaculty('${faculty.id}')">Remove</button>
        </div>
    `;

    function generateMainDetailsHTML(faculty) {
        return `
            <div class="details-card">
                <h3>📋 Profile Overview</h3>
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
                        <strong>Employee ID:</strong> 
                        <span>${faculty.employeeId || 'N/A'}</span>
                    </div>
                    <div>
                        <strong>Faculty ID:</strong> 
                        <span>${faculty.facultyId || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div class="details-card">
                <h3>📞 Contact Details</h3>
                <div class="contact-grid">
                    <div>
                        <strong>📧 E-mail:</strong> 
                        <a href="mailto:${faculty.email}">${faculty.email || 'N/A'}</a>
                    </div>
                    <div>
                        <strong>📱 Mobile Number:</strong> 
                        <a href="tel:${faculty.phone}">${faculty.phone || 'N/A'}</a>
                    </div>
                </div>
            </div>
        `;
    }

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

                    <button class="accordion-button">📚 Courses Taught</button>
                    <div class="accordion-content">
                        ${generateAccordionTableHTML(faculty.coursesTaught || faculty.courseTaught, 'Course Taught')}
                    </div>

                    <button class="accordion-button">💼 Work Experience (Previous)</button>
                    <div class="accordion-content">
                        ${generateAccordionTableHTML(faculty.previousWork || faculty.prevWork, 'Previous Work')}
                    </div>

                    <button class="accordion-button">📖 Publications & Research</button>
                    <div class="accordion-content">
                        ${generateAccordionTableHTML(faculty.publications, 'Publications')}
                    </div>

                    <button class="accordion-button">🏆 Awards & Achievements</button>
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
    const directoryContainer = document.getElementById('dynamic-faculty-list');
    const emptyState = document.getElementById('empty-state');
    
    // Clear existing content
    directoryContainer.innerHTML = '';
    document.querySelectorAll('.modal[id^="modal-dynamic-"]').forEach(modal => modal.remove());
    
    const facultyList = JSON.parse(localStorage.getItem('dynamicFaculty')) || [];
    
    // Show empty state if no faculty
    if (facultyList.length === 0) {
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        return;
    }
    
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    const body = document.body;

    facultyList.forEach((faculty, index) => {
        if (!faculty.id) {
            faculty.id = `faculty-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
        
        const { cardHTML, modalHTML } = generateDynamicFacultyHTML(faculty);
        
        // Insert with staggered animation
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHTML;
        const card = tempDiv.firstElementChild;
        card.style.animationDelay = `${index * 0.1}s`;
        directoryContainer.appendChild(card);
        
        body.insertAdjacentHTML('beforeend', modalHTML);
    });

    initializeAccordions();
}

// ===================================
// SEARCH FUNCTIONALITY
// ===================================

function initializeSearch() {
    const searchInput = document.getElementById('faculty-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.faculty-member-card');
        
        cards.forEach(card => {
            const name = card.querySelector('h3').textContent.toLowerCase();
            const designation = card.querySelector('p').textContent.toLowerCase();
            
            if (name.includes(searchTerm) || designation.includes(searchTerm)) {
                card.style.display = 'block';
                card.style.animation = 'fadeIn 0.3s ease-out';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// ===================================
// SCROLL TO TOP FUNCTIONALITY
// ===================================

function initializeScrollToTop() {
    const scrollBtn = document.getElementById('scrollToTop');
    if (!scrollBtn) return;
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });
    
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===================================
// LOADING ANIMATION
// ===================================

function hideLoadingSpinner() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        setTimeout(() => {
            spinner.classList.add('hidden');
            setTimeout(() => {
                spinner.style.display = 'none';
            }, 300);
        }, 800);
    }
}

// ===================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ===================================

function initializeIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('[data-anim]').forEach(el => {
        observer.observe(el);
    });
}

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    // Load faculty data
    if (document.querySelector('.directory-container')) {
        loadDynamicFaculty();
    }
    
    // Initialize all features
    initializeAccordions();
    initializeSearch();
    initializeScrollToTop();
    initializeIntersectionObserver();
    hideLoadingSpinner();
    
    // Add smooth animations to elements
    const actionBar = document.querySelector('.action-bar');
    if (actionBar) {
        setTimeout(() => {
            actionBar.style.animation = 'fadeInUp 0.8s ease-out';
        }, 200);
    }
});

// ===================================
// KEYBOARD ACCESSIBILITY
// ===================================

document.addEventListener('keydown', function(e) {
    // Close modal on Escape key
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            closeModal(activeModal.id);
        }
    }
});

// ===================================
// SMOOTH PAGE TRANSITIONS
// ===================================

window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});