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
            if (!mainNav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                mobileMenuBtn.classList.remove('active');
                mainNav.classList.remove('active');
                body.classList.remove('no-scroll');
            }
        });
    }

    const form = document.getElementById('funeral-quote-form');

    // Validate form data
    function validateForm(data) {
        const errors = {};
        
        if (parseInt(data.your_age) < 18 || parseInt(data.your_age) > 65) {
            errors.your_age = 'Age must be between 18 and 65 years';
        }

        if (data.spouse_age && (parseInt(data.spouse_age) < 18 || parseInt(data.spouse_age) > 65)) {
            errors.spouse_age = 'Spouse age must be between 18 and 65 years';
        }

        if (!/^(?:\+254|0)[17][0-9]{8}$/.test(data.phone_number.replace(/\s/g, ''))) {
            errors.phone_number = 'Please enter a valid Kenyan phone number';
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email_address)) {
            errors.email_address = 'Please enter a valid email address';
        }

        return errors;
    }

    // Generate PDF quote
    async function generatePDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text('Family Funeral Plan Quote', 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Quote Reference: ${generateQuoteRef()}`, 20, 40);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
        
        doc.text('Family Members Covered:', 20, 70);
        doc.text(`Principal Member (${data.your_age} years)`, 30, 80);
        if (data.spouse_age) doc.text(`Spouse (${data.spouse_age} years)`, 30, 90);
        if (data.num_children) doc.text(`Children: ${data.num_children}`, 30, 100);
        if (data.father_age) doc.text(`Father (${data.father_age} years)`, 30, 110);
        if (data.mother_age) doc.text(`Mother (${data.mother_age} years)`, 30, 120);

        // Calculate estimated premium (simplified example)
        const basePremium = 500;
        const memberCount = [
            data.spouse_age, data.father_age, data.mother_age,
            data.father_in_law_age, data.mother_in_law_age
        ].filter(Boolean).length + 1 + (parseInt(data.num_children) || 0);
        
        const monthlyPremium = (basePremium * memberCount).toFixed(2);
        doc.text(`Estimated Monthly Premium: KES ${monthlyPremium}`, 20, 140);

        doc.save(`funeral_plan_quote_${generateQuoteRef()}.pdf`);
    }

    // Generate unique quote reference
    function generateQuoteRef() {
        return 'FNL-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Clear previous errors
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validate form
        const errors = validateForm(data);
        if (Object.keys(errors).length > 0) {
            for (const [field, message] of Object.entries(errors)) {
                const errorEl = form.querySelector(`[name="${field}"] + .error-message`);
                if (errorEl) errorEl.textContent = message;
            }
            return;
        }

        try {
            // Save to local storage
            const submission = await storageManager.saveSubmission({
                type: 'funeral',
                id: generateQuoteRef(),
                customerName: data.full_name,
                packageType: 'Family Funeral Plan',
                status: 'pending',
                timestamp: new Date().toISOString(),
                members: {
                    principal: { age: data.your_age },
                    spouse: data.spouse_age ? { age: data.spouse_age } : null,
                    children: data.num_children || 0,
                    parents: {
                        father: data.father_age ? { age: data.father_age } : null,
                        mother: data.mother_age ? { age: data.mother_age } : null,
                        fatherInLaw: data.father_in_law_age ? { age: data.father_in_law_age } : null,
                        motherInLaw: data.mother_in_law_age ? { age: data.mother_in_law_age } : null
                    }
                },
                contact: {
                    phone: data.phone_number,
                    email: data.email_address
                }
            });

            if (submission) {
                alert('Quote submitted successfully!');
                generatePDF(data);
                form.reset();
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Error submitting form. Please try again.');
        }
    });

    // Handle download quote button
    document.querySelector('.btn-secondary').addEventListener('click', function() {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        if (!data.full_name || !data.your_age) {
            alert('Please fill in all required fields before downloading quote');
            return;
        }
        
        generatePDF(data);
    });
});