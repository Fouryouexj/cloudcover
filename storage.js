class InsuranceStorage {
    constructor() {
        this.storage = localStorage;
        this.STORAGE_KEY = 'insurance_submissions';
    }

    saveSubmission(data) {
        try {
            const submissions = this.getSubmissions();
            const id = `${data.type.charAt(0).toUpperCase()}${String(submissions.length + 1).padStart(3, '0')}`;

            const submission = {
                id,
                ...data,
                timestamp: new Date().toISOString(),
            };

            submissions.push(submission);
            this.storage.setItem(this.STORAGE_KEY, JSON.stringify(submissions));

            // Dispatch storage event for real-time updates
            window.dispatchEvent(
                new StorageEvent('storage', {
                    key: this.STORAGE_KEY,
                    newValue: JSON.stringify(submissions),
                })
            );

            return submission;
        } catch (error) {
            console.error('Error saving submission:', error);
            throw error;
        }
    }

    getSubmissions() {
        try {
            const submissions = this.storage.getItem(this.STORAGE_KEY);
            return submissions ? JSON.parse(submissions) : [];
        } catch (error) {
            console.error('Error getting submissions:', error);
            return [];
        }
    }

    getSubmissionsByType(type) {
        try {
            return this.getSubmissions().filter((sub) => sub.type === type);
        } catch (error) {
            console.error('Error getting submissions by type:', error);
            return [];
        }
    }
}


const storageManager = new InsuranceStorage();