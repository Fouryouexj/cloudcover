document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    const menuLinks = document.querySelectorAll('.main-nav a');

    // Toggle menu
    mobileMenuBtn?.addEventListener('click', function() {
        this.classList.toggle('active');
        mainNav.classList.toggle('active');
        document.body.classList.toggle('no-scroll');
    });

    // Close menu when clicking links
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuBtn.classList.remove('active');
            mainNav.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mainNav.classList.contains('active') && 
            !mainNav.contains(e.target) && 
            !mobileMenuBtn.contains(e.target)) {
            mobileMenuBtn.classList.remove('active');
            mainNav.classList.remove('active');
            document.body.classList.remove('no-scroll');
        }
    });
   
    const form = document.getElementById('insurance-form');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
        submitBtn.disabled = true;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await emailjs.send(
                'service_6147sc8',
                'template_231paf4', // Remove the space after template ID
                {
                    to_email: 'requests@cloudcover.co.ke',
                    to_name: 'Admin',
                    from_name: data.full_name,
                    student_email: data.email,
                    phone_number: data.phone,
                    university: data.university,
                    id_number: data.id_number,
                    kra_number: data.kra_number,
                    insurance_period: data.period,
                    insurance_provider: data.insurance_company
                }
            );
        
            if (response.status === 200) {
                // Add saveToAdminPanel function if missing
                saveToAdminPanel(data);
                alert('Application submitted successfully! We will contact you shortly.');
                form.reset();
            }

        else {
                throw new Error('Failed to send email');
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('There was an error submitting your application. Please try again.');
        } finally {
            btnText.style.display = 'inline-block';
            btnLoader.style.display = 'none';
            submitBtn.disabled = false;
        }
    });
});

function saveToAdminPanel(data) {
    // Get existing submissions
    let submissions = JSON.parse(localStorage.getItem('insurance_submissions') || '[]');

    // Create new submission
    const newSubmission = {
        id: generateApplicationId(),
        type: 'student',
        customerName: data.full_name,
        packageType: 'InternCare',
        timestamp: new Date().toISOString(),
        status: 'pending',
        contact: {
            phone: data.phone,
            email: data.email
        },
        details: {
            idNumber: data.id_number,
            kraNumber: data.kra_number,
            university: data.university,
            period: data.period,
            provider: data.insurance_company
        }
    };

    // Add to submissions
    submissions.push(newSubmission);

    // Save back to localStorage
    localStorage.setItem('insurance_submissions', JSON.stringify(submissions));
}

function generateApplicationId() {
    return 'STU-' + Date.now().toString(36).toUpperCase() + 
           Math.random().toString(36).substring(2, 5).toUpperCase();
}

   