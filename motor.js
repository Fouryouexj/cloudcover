document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('quote-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const submission = storageManager.saveSubmission({
                type: 'motor',
                customerName: data.insured_name,
                packageType: `${data.scope_of_vehicle} - ${data.type_of_coverage}`,
                status: 'pending',
                vehicle: {
                    make: data.vehicle_make,
                    model: data.vehicle_model,
                    year: data.year_of_manufacture,
                    value: data.value_of_vehicle,
                    registration: data.registration_number,
                    bodyType: data.vehicle_body_type,
                    passengers: data.num_passengers,
                },
                contact: {
                    phone: data.phone_number,
                    email: data.email_address,
                },
            });

            if (submission) {
                generateQuote(data);
                showSuccessMessage('Form submitted successfully! Your quote has been generated.');
                form.reset();
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            showErrorMessage('Error submitting form. Please try again.');
        }
    });
});




// Form validation
function validateForm() {
    const requiredFields = [
        'scope_of_vehicle',
        'type_of_coverage',
        'vehicle_make',
        'vehicle_model',
        'year_of_manufacture',
        'value_of_vehicle',
        'registration_number',
        'insured_name',
        'phone_number',
        'email_address'
    ];

    let isValid = true;
    const currentYear = new Date().getFullYear();

    requiredFields.forEach(field => {
        const input = document.getElementById(field);
        const value = input.value.trim();

        if (!value) {
            showFieldError(input, 'This field is required');
            isValid = false;
            return;
        }

        // Specific validations
        switch(field) {
            case 'year_of_manufacture':
                if (value < 1980 || value > currentYear) {
                    showFieldError(input, `Year must be between 1980 and ${currentYear}`);
                    isValid = false;
                }
                break;
            case 'value_of_vehicle':
                if (value <= 0) {
                    showFieldError(input, 'Vehicle value must be greater than 0');
                    isValid = false;
                }
                break;
            case 'phone_number':
                if (!validatePhone(value)) {
                    showFieldError(input, 'Please enter a valid phone number');
                    isValid = false;
                }
                break;
            case 'email_address':
                if (!validateEmail(value)) {
                    showFieldError(input, 'Please enter a valid email address');
                    isValid = false;
                }
                break;
        }
    });

    return isValid;
}

// Quote generation
function generateQuote(data) {
    // Add jsPDF library dynamically if not present
    if (typeof jsPDF === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => generatePDF(data);
        document.head.appendChild(script);
    } else {
        generatePDF(data);
    }
}

function generatePDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add company logo
    // doc.addImage('img/logo.jpeg', 'JPEG', 10, 10, 30, 30);

    // Document title
    doc.setFontSize(20);
    doc.setTextColor(0, 33, 71);
    doc.text("Motor Insurance Quotation", 20, 20);

    // Quote details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    // Quote information
    doc.text(`Quote Date: ${new Date().toLocaleDateString()}`, 20, 40);
    doc.text(`Quote Reference: ${generateQuoteReference()}`, 20, 50);

    // Personal Information
    doc.setFontSize(14);
    doc.setTextColor(227, 24, 55);
    doc.text("Personal Information", 20, 70);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Name: ${data.insured_name}`, 30, 80);
    doc.text(`Phone: ${data.phone_number}`, 30, 90);
    doc.text(`Email: ${data.email_address}`, 30, 100);

    // Vehicle Information
    doc.setFontSize(14);
    doc.setTextColor(227, 24, 55);
    doc.text("Vehicle Information", 20, 120);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Make: ${data.vehicle_make}`, 30, 130);
    doc.text(`Model: ${data.vehicle_model}`, 30, 140);
    doc.text(`Year: ${data.year_of_manufacture}`, 30, 150);
    doc.text(`Value: KES ${formatCurrency(data.value_of_vehicle)}`, 30, 160);
    doc.text(`Registration: ${data.registration_number}`, 30, 170);

    // Coverage Details
    doc.setFontSize(14);
    doc.setTextColor(227, 24, 55);
    doc.text("Coverage Details", 20, 190);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Type: ${data.type_of_coverage}`, 30, 200);
    doc.text(`Scope: ${data.scope_of_vehicle}`, 30, 210);

    doc.save(`${data.insured_name}-Motor-Quotation.pdf`);
}

// Utility functions
function showFieldError(input, message) {
    const formGroup = input.closest('.form-group');
    formGroup.classList.add('error');
    
    let errorDiv = formGroup.querySelector('.error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        formGroup.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
}

function validatePhone(phone) {
    return /^(\+254|0)[17]\d{8}$/.test(phone);
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateQuoteReference() {
    return `MOT${Date.now().toString().slice(-6)}`;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-KE').format(value);
}

function showSuccessMessage(message) {
    const toast = createToast('success', message);
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

function showErrorMessage(message) {
    const toast = createToast('error', message);
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

function createToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    return toast;
}