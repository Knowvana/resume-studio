// static/js/app.js
import { AuthService } from './auth-service.js';

document.addEventListener('alpine:init', () => {
    Alpine.data('resumeApp', () => ({
        // ==========================================
        // 1. STATE MANAGEMENT
        // ==========================================
        user: null,
        loading: false,
        isDirty: false, // Tracks if changes are unsaved
        
        // The Core Resume Data Structure
        resume: {
            profile: {
                name: "",
                tagline: "",
                location: "",
                email: "",
                phone: "",
                linkedin: "",
                summary: "",
                image: "" // URL for the profile picture
            },
            experience: [],
            education: [],
            skills: []
        },

        // ==========================================
        // 2. LIFECYCLE (Runs on Page Load)
        // ==========================================
        async init() {
            // A. Load LocalStorage backup (Offline Support)
            const localData = localStorage.getItem('localResumeDraft');
            if (localData) {
                try {
                    // Merge local data with default structure to prevent errors if fields are missing
                    const parsed = JSON.parse(localData);
                    this.resume = { ...this.resume, ...parsed };
                } catch (e) {
                    console.error("Error parsing local data", e);
                }
            }

            // B. Check Cloud Auth (Supabase)
            try {
                this.user = await AuthService.getUser();
                if (this.user) {
                    await this.syncFromCloud();
                }
            } catch (error) {
                console.error("Auth check failed:", error);
            }

            // C. Auto-save to LocalStorage on ANY change
            this.$watch('resume', (value) => {
                this.isDirty = true;
                localStorage.setItem('localResumeDraft', JSON.stringify(value));
            });
        },

        // ==========================================
        // 3. UI ACTIONS
        // ==========================================
        
        // Change Profile Picture URL
        promptImage() {
            const current = this.resume.profile.image || "";
            const url = prompt("Enter the URL of your profile picture (e.g. from LinkedIn or GitHub):", current);
            if (url !== null) { // Only update if user didn't cancel
                this.resume.profile.image = url;
            }
        },

        // Add dynamic items (Experience, Edu, Skills)
        addItem(section) {
            if (section === 'experience') {
                this.resume.experience.unshift({ 
                    role: "New Role", 
                    company: "Company Name", 
                    dates: "Dates", 
                    achievements: ["New Achievement"] 
                });
            } else if (section === 'education') {
                this.resume.education.push({ 
                    degree: "Degree / Course", 
                    institution: "University / Institute", 
                    dates: "Year" 
                });
            } else if (section === 'skills') {
                this.resume.skills.push({ 
                    category: "CATEGORY", 
                    items: "Skill 1, Skill 2, Skill 3" 
                });
            }
        },

        // Remove dynamic items
        removeItem(section, index) {
            if (confirm("Are you sure you want to remove this item?")) {
                this.resume[section].splice(index, 1);
            }
        },

        // ==========================================
        // 4. AUTHENTICATION & CLOUD SYNC
        // ==========================================
        
        async login() {
            const email = prompt("Enter your email to receive a secure login link:");
            if (!email) return;
            
            this.loading = true;
            const { error } = await AuthService.login(email);
            this.loading = false;
            
            if (error) {
                alert("Login Error: " + error.message);
            } else {
                alert("Check your email for the magic login link!");
            }
        },

        async logout() {
            if (confirm("Are you sure you want to logout?")) {
                await AuthService.logout();
                this.user = null;
                // Optional: Clear local storage on logout if you want privacy
                // localStorage.removeItem('localResumeDraft'); 
                window.location.reload();
            }
        },

        async saveToCloud() {
            if (!this.user) return this.login();
            
            this.loading = true;
            const { error } = await AuthService.saveResume(this.user.id, this.resume);
            this.loading = false;

            if (error) {
                alert("Cloud Save Failed: " + error.message);
            } else {
                this.isDirty = false; // Changes are now saved
                alert("Resume successfully saved to the cloud!");
            }
        },

        async syncFromCloud() {
            this.loading = true;
            const { data, error } = await AuthService.loadResume(this.user.id);
            this.loading = false;

            if (error && error.code !== 'PGRST116') { // Ignore "Row not found" error for new users
                console.error("Sync Error:", error.message);
            } else if (data) {
                // Confirm before overwriting local work if it's dirty
                if (this.isDirty && !confirm("You have unsaved local changes. Overwrite them with cloud data?")) {
                    return;
                }
                this.resume = data;
                this.isDirty = false;
            }
        }
    }));
});