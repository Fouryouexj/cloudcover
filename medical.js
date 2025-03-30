document.addEventListener('DOMContentLoaded', function () {
    // Initialize form elements
    const form = document.getElementById('quote-form');
    const sections = Array.from(document.querySelectorAll('.form-section'));
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const progressSteps = document.querySelectorAll('.step');
    let currentStep = 0;

    // Show the current section and update UI
    function showSection(index) {
        sections.forEach((section, i) => {
            section.classList.toggle('active', i === index);
        });

        // Update progress steps
        progressSteps.forEach((step, i) => {
            step.classList.toggle('active', i <= index);
        });

        // Update navigation buttons
        prevBtn.style.display = index === 0 ? 'none' : 'block';
        nextBtn.textContent = index === sections.length - 1 ? 'Submit Quote' : 'Next Step';
    }

    // Validate phone number format
    function validatePhone(phone) {
        const phoneRegex = /^(?:\+254|0)[17][0-9]{8}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    // Format phone number for storage
    function formatPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('0')) {
            return '+254' + cleaned.substring(1);
        }
        if (cleaned.startsWith('254')) {
            return '+' + cleaned;
        }
        return phone;
    }

    // Show error message
    function showError(input, message) {
        const formGroup = input.parentElement;
        formGroup.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        formGroup.appendChild(errorDiv);
    }

    // Clear error messages
    function clearErrors() {
        form.querySelectorAll('.error-message').forEach(error => error.remove());
        form.querySelectorAll('.error').forEach(field => field.classList.remove('error'));
    }

    // Validate the current section
    function validateCurrentSection() {
        clearErrors();
        const currentSection = sections[currentStep];
        const inputs = currentSection.querySelectorAll('input[required], select[required]');
        let isValid = true;

        inputs.forEach((input) => {
            const value = input.value.trim();
            
            switch(input.name) {
                case 'principal_age':
                    if (!value || parseInt(value) < 18) {
                        isValid = false;
                        showError(input, 'Principal must be at least 18 years old');
                    }
                    break;

                case 'phone_number':
                    if (!validatePhone(value)) {
                        isValid = false;
                        showError(input, 'Please enter a valid Kenyan phone number');
                    }
                    break;

                case 'email_address':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        isValid = false;
                        showError(input, 'Please enter a valid email address');
                    }
                    break;

                default:
                    if (!value) {
                        isValid = false;
                        showError(input, 'This field is required');
                    }
            }
        });

        return isValid;
    }

    // Populate review section
    function populateReview() {
        const reviewSection = document.querySelector('.review-summary');
        const formData = new FormData(form);
        let reviewHTML = '<h3>Please Review Your Information</h3>';

        formData.forEach((value, key) => {
            if (value) {
                const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                let displayValue = value;
                if (key === 'phone_number') {
                    displayValue = formatPhoneNumber(value);
                }
                reviewHTML += `
                    <div class="review-item">
                        <strong>${formattedKey}:</strong> 
                        <span>${displayValue}</span>
                    </div>
                `;
            }
        });

        reviewSection.innerHTML = reviewHTML;
    }

    // Handle form submission
    async function handleFormSubmission() {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const submission = await storageManager.saveSubmission({
                type: 'medical',
                customerName: data.full_name,
                packageType: `${data.coverage_type} Coverage`,
                status: 'pending',
                personal: {
                    age: data.principal_age,
                    dependents: data.num_dependents || 0,
                    childAge: data.child_age,
                },
                coverage: {
                    type: data.coverage_type,
                    frequency: data.payment_frequency,
                    startDate: data.start_date
                },
                contact: {
                    phone: formatPhoneNumber(data.phone_number),
                    email: data.email_address
                },
                submissionDate: new Date().toISOString()
            });

            if (submission) {
                showSuccessMessage('Quote submitted successfully! We will contact you shortly.');
                form.reset();
                currentStep = 0;
                showSection(currentStep);
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            showError(null, 'Error submitting form. Please try again.');
        }
    }

    // Show success message
    function showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        form.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }

    // Navigation button event listeners
    nextBtn.addEventListener('click', () => {
        if (currentStep < sections.length - 1) {
            if (validateCurrentSection()) {
                currentStep++;
                showSection(currentStep);
                if (currentStep === sections.length - 1) {
                    populateReview();
                }
            }
        } else {
            if (validateCurrentSection()) {
                handleFormSubmission();
            }
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            showSection(currentStep);
        }
    });

    // Initialize form
    showSection(0);
});