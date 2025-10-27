// Document Template Functions - FIXED VERSION
function populateDocumentTemplate(letterData, formData) {
    // Set current date
    const currentDate = new Date();
    const dateOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    
    // Check if elements exist before setting textContent
    const currentDateEl = document.getElementById('currentDate');
    if (currentDateEl) {
        currentDateEl.textContent = currentDate.toLocaleDateString('ar-SA', dateOptions);
    }
    
    const dayNameEl = document.getElementById('dayName');
    if (dayNameEl) {
        dayNameEl.textContent = currentDate.toLocaleDateString('ar-SA', { weekday: 'long' });
    }
    
    // Set Hijri date (simplified - you might want to use a proper Hijri calendar library)
    const hijriDate = convertToHijri(currentDate);
    const hijriDateEl = document.getElementById('hijriDate');
    if (hijriDateEl) {
        hijriDateEl.textContent = hijriDate;
    }
    
    // Set letter number (you might want to generate this dynamically)
    const letterNumber = generateLetterNumber();
    const letterNumberEl = document.getElementById('letterNumber');
    if (letterNumberEl) {
        letterNumberEl.textContent = letterNumber;
    }
    
    // Set recipient information
    const recipientName = formData.get('recipient') || 'المحترم/ة';
    const recipientTitle = formData.get('recipient_title') || '';
    const organizationName = formData.get('organization_name') || '';
    
    // Check if recipient element exists before setting textContent
    const recipientEl = document.getElementById('recipient');
    if (recipientEl) {
        recipientEl.textContent = `${recipientTitle} ${recipientName}`;
    }
    
    // Update recipient section with organization if provided
    const recipientSection = document.getElementById('recipientSection');
    if (recipientSection) {
        if (organizationName) {
            recipientSection.innerHTML = `
                <p>إلى: ${recipientTitle} ${recipientName}</p>
                <p>${organizationName}</p>
                <p>المحترم/ة</p>
            `;
        } else {
            recipientSection.innerHTML = `
                <p>السيد/ة: ${recipientTitle} ${recipientName}</p>
                <p>المحترم/ة</p>
            `;
        }
    }
    
    // Set letter title based on letter type
    const letterType = formData.get('category') || 'خطاب';
    const letterPurpose = formData.get('title') || '';
    const letterTitleEl = document.getElementById('letterTitle');
    if (letterTitleEl) {
        letterTitleEl.textContent = `${letterType} - ${letterPurpose}`;
    }
    
    // Set main letter content
    const letterContent = letterData.Letter || letterData.content || '';
    const mainLetterContentEl = document.getElementById('mainLetterContent');
    if (mainLetterContentEl) {
        mainLetterContentEl.innerHTML = formatLetterContent(letterContent);
    }
    
    // Set sender information
    const senderName = formData.get('member_name') || 'زياد أحمد بن حكم عسيري';
    const senderNameEl = document.getElementById('senderName');
    if (senderNameEl) {
        senderNameEl.textContent = senderName;
    }
    
    // Also update the hidden textarea for backward compatibility
    const letterPreviewEl = document.getElementById('letterPreview');
    if (letterPreviewEl) {
        letterPreviewEl.value = letterContent;
    }
}

function formatLetterContent(content) {
    // Split content into paragraphs and format them
    const paragraphs = content.split('\n').filter(p => p.trim() !== '');
    return paragraphs.map(paragraph => `<p>${paragraph.trim()}</p>`).join('');
}

function generateLetterNumber() {
    // Generate a letter number based on current date and random number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${random}/${year}`;
}

function convertToHijri(gregorianDate) {
    // Simplified Hijri conversion - you might want to use a proper library like moment-hijri
    // This is a rough approximation
    const hijriYear = Math.floor((gregorianDate.getFullYear() - 622) * 1.030684);
    const hijriMonths = [
        'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الثانية',
        'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ];
    
    const monthIndex = Math.floor(Math.random() * 12); // Simplified - should be calculated properly
    const day = Math.floor(Math.random() * 29) + 1; // Simplified - should be calculated properly
    
    return `${day} ${hijriMonths[monthIndex]} ${hijriYear + 1400}هـ`;
}

function toggleTemplateView(templateType) {
    const documentTemplate = document.getElementById('documentTemplate');
    const letterPreview = document.getElementById('letterPreview');
    
    if (templateType === 'template1') {
        // Show document template
        if (documentTemplate) documentTemplate.style.display = 'block';
        if (letterPreview) letterPreview.style.display = 'none';
    } else {
        // Show simple textarea
        if (documentTemplate) documentTemplate.style.display = 'none';
        if (letterPreview) letterPreview.style.display = 'block';
    }
}

// Add event listeners for template selection
document.addEventListener('DOMContentLoaded', function() {
    const templateRadios = document.querySelectorAll('input[name="template"]');
    templateRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            toggleTemplateView(this.value);
        });
    });
    
    // Initialize with default template
    toggleTemplateView('template1');
});

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        populateDocumentTemplate,
        formatLetterContent,
        generateLetterNumber,
        convertToHijri,
        toggleTemplateView
    };
}
