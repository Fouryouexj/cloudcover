function incrementDependents() {
    const input = document.getElementById('num_dependents');
    const currentValue = parseInt(input.value);
    if (currentValue < 10) {
        input.value = currentValue + 1;
    }
}

function decrementDependents() {
    const input = document.getElementById('num_dependents');
    const currentValue = parseInt(input.value);
    if (currentValue > 0) {
        input.value = currentValue - 1;
    }
}
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('travel-quote-form');
    const sections = Array.from(document.querySelectorAll('.form-section'));
    const nextBtn = document.querySelector('.btn.next');
    const prevBtn = document.querySelector('.btn.prev');
    const submitBtn = document.querySelector('.btn.submit');
    let currentSection = 0;

    // Show the current section
    function showSection(index) {
        sections.forEach((section, i) => {
            section.classList.toggle('active', i === index);
        });

        // Update navigation buttons
        prevBtn.style.display = index === 0 ? 'none' : 'block';
        nextBtn.style.display = index === sections.length - 1 ? 'none' : 'block';
        submitBtn.style.display = index === sections.length - 1 ? 'block' : 'none';

        // Update progress bar
        document.querySelectorAll('.step').forEach((step, i) => {
            step.classList.toggle('active', i <= index);
        });
    }
    const minusBtn = document.querySelector('.counter-btn.minus');
    const plusBtn = document.querySelector('.counter-btn.plus');
    const dependentInput = document.getElementById('num_dependents');

    // Initialize input value
    dependentInput.value = 0;

    // Add click handlers
    minusBtn.addEventListener('click', () => {
        let currentValue = parseInt(dependentInput.value);
        if (currentValue > 0) {
            dependentInput.value = currentValue - 1;
        }
    });

    plusBtn.addEventListener('click', () => {
        let currentValue = parseInt(dependentInput.value);
        if (currentValue < 10) {
            dependentInput.value = currentValue + 1;
        }
    });

  
    nextBtn.addEventListener('click', () => {
        if (currentSection < sections.length - 1) {
            currentSection++;
            showSection(currentSection);
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentSection > 0) {
            currentSection--;
            showSection(currentSection);
        }
    });

  
    minusBtn.addEventListener('click', () => {
        let currentValue = parseInt(dependentInput.value);
        if (currentValue > 0) {
            dependentInput.value = currentValue - 1;
        }
    });

    plusBtn.addEventListener('click', () => {
        let currentValue = parseInt(dependentInput.value);
        if (currentValue < 10) { 
            dependentInput.value = currentValue + 1;
        }
    });

    dependentInput.addEventListener('keydown', (e) => {
        e.preventDefault();
    });


    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const submission = storageManager.saveSubmission({
                type: 'travel',
                customerName: data.full_name,
                packageType: `${data.travel_purpose} Trip`,
                status: 'pending',
                trip: {
                    from: data.traveling_from,
                    to: data.traveling_to,
                    departureDate: data.departure_date,
                    returnDate: data.return_date,
                    purpose: data.travel_purpose,
                },
                contact: {
                    phone: data.phone_number,
                    email: data.email_address,
                },
                personal: {
                    dob: data.dob,
                    dependents: data.num_dependents,
                },
            });

            if (submission) {
                alert('Form submitted successfully!');
                form.reset();
                currentSection = 0;
                showSection(currentSection);
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Error submitting form. Please try again.');
        }
    });


    showSection(0);
});