document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    const body = document.body;

    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
            mainNav.classList.toggle('active');
            body.classList.toggle('no-scroll');
        });

        // Close menu when clicking links
        const menuLinks = mainNav.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                mainNav.classList.remove('active');
                body.classList.remove('no-scroll');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (mainNav.classList.contains('active') && 
                !mainNav.contains(e.target) && 
                !mobileMenuBtn.contains(e.target)) {
                mobileMenuBtn.classList.remove('active');
                mainNav.classList.remove('active');
                body.classList.remove('no-scroll');
            }
        });
    }

    const form = document.getElementById('life-insurance-form');
    const downloadBtn = document.querySelector('.btn-secondary');
    let currentQuoteData = null;

    // Validate form data
    function validateForm(data) {
        const errors = {};
        
        if (!data.full_name || data.full_name.trim().length < 3) {
            errors.full_name = 'Please enter your full name (minimum 3 characters)';
        }
        
        if (parseInt(data.your_age) < 18 || parseInt(data.your_age) > 70) {
            errors.your_age = 'Age must be between 18 and 70 years';
        }

        if (parseInt(data.coverage_amount) < 10000) {
            errors.coverage_amount = 'Minimum coverage amount is KES 10,000';
        
        
        }

        if (parseInt(data.policy_term) < 5 || parseInt(data.policy_term) > 20) {
            errors.policy_term = 'Policy term must be between 5 and 20 years';
        }

        if (!/^(?:\+254|0)[17][0-9]{8}$/.test(data.phone_number.replace(/\s/g, ''))) {
            errors.phone_number = 'Please enter a valid Kenyan phone number';
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email_address)) {
            errors.email_address = 'Please enter a valid email address';
        }

        return errors;
    }

    function generatePDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const quoteRef = generateQuoteRef();

        doc.setFontSize(20);
        doc.text('Life Insurance Quote', 105, 20, { align: 'center' });
        
       

        doc.setFontSize(12);
        doc.text(`Quote Reference: ${quoteRef}`, 20, 40);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
        

        doc.text('Personal Details:', 20, 70);
        doc.text(`Full Name: ${data.full_name}`, 30, 80);
        doc.text(`Age: ${data.your_age} years`, 30, 90);
        doc.text(`Email: ${data.email_address}`, 30, 100);
        doc.text(`Phone: ${data.phone_number}`, 30, 110);

        // Add policy details
        doc.text('Policy Details:', 20, 130);
        doc.text(`Coverage Amount: KES ${parseInt(data.coverage_amount).toLocaleString()}`, 30, 140);
        doc.text(`Policy Term: ${data.policy_term} years`, 30, 150);

        // Calculate and add premium details
        const monthlyPremium = calculatePremium(data);
        doc.text('Premium Details:', 20, 170);
        doc.text(`Estimated Monthly Premium: KES ${monthlyPremium.toLocaleString()}`, 30, 180);

        // Add footer
        doc.setFontSize(10);
        doc.text('This is a quote only and does not constitute a contract.', 105, 270, { align: 'center' });
        doc.text('For more information, please contact us.', 105, 280, { align: 'center' });

        doc.save(`life_insurance_quote_${quoteRef}.pdf`);
    }

  
    function calculatePremium(data) {
        const baseRate = 0.002;
        const ageMultiplier = data.your_age / 50;
        const termDivisor = data.policy_term / 10;
        return Math.round((data.coverage_amount * baseRate * ageMultiplier) / termDivisor);
    }

  
    function generateQuoteRef() {
        return 'LIFE-' + new Date().getTime().toString(36).toUpperCase();
    }

    function showError(inputName, message) {
        const errorElement = form.querySelector(`[name="${inputName}"] + .error-message`);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    function clearErrors() {
        form.querySelectorAll('.error-message').forEach(error => error.textContent = '');
    }


    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearErrors();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
     
        const errors = validateForm(data);
        if (Object.keys(errors).length > 0) {
            Object.entries(errors).forEach(([field, message]) => {
                showError(field, message);
            });
            return;
        }

        try {
           
            currentQuoteData = data;
            
            const submission = await storageManager.saveSubmission({
                type: 'life',
                id: generateQuoteRef(),
                customerName: data.full_name,
                packageType: `Life Cover - ${parseInt(data.coverage_amount).toLocaleString()} KES`,
                status: 'pending',
                timestamp: new Date().toISOString(),
                coverage: {
                    amount: data.coverage_amount,
                    term: data.policy_term
                },
                personal: {
                    age: data.your_age
                },
                contact: {
                    phone: data.phone_number,
                    email: data.email_address
                }
            });

            if (submission) {
                alert('Quote submitted successfully! You can now download your quote.');
                generatePDF(data);
                form.reset();
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Error submitting form. Please try again.');
        }
    });

    
    downloadBtn.addEventListener('click', function() {
        if (!currentQuoteData) {
            alert('Please fill and submit the form first to generate a quote.');
            return;
        }
        generatePDF(currentQuoteData);
    });
});