// static/js/app.js

// HELPER: Safely get the default data (Handles String vs Object issue)
function getSafeDefaults() {
    let data = window.hugoDefaultData;
    // If it's a string, parse it. If it's an object, use it.
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (e) {
            console.error("Failed to parse Hugo defaults:", e);
            data = null;
        }
    }
    // Fallback structure if data is missing
    return data || {
        profile: { name: "", tagline: "", location: "", email: "", phone: "", linkedin: "", summary: "", impact_statement: "", image: "" },
        signature_achievements: [],
        experience: [],
        education: [],
        skills: []
    };
}

const resumeAppData = () => ({
    user: null,
    loading: false,
    isDirty: false,
    
    // 1. Initialize with safe defaults
    resume: getSafeDefaults(),

    async init() {
        console.log("Resume App Initializing...");

        // 2. CHECK LOCAL STORAGE
        const localData = localStorage.getItem('localResumeDraft');
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                this.resume = { 
                    ...this.resume, 
                    ...parsed,
                    profile: { ...this.resume.profile, ...parsed.profile }
                };
            } catch (e) { console.error("Local data corrupted", e); }
        }

        if (window.AuthService) {
            try {
                this.user = await window.AuthService.getUser();
                if (this.user) await this.syncFromCloud();
            } catch (error) { console.error(error); }
        }

        this.$watch('resume', (value) => {
            this.isDirty = true;
            localStorage.setItem('localResumeDraft', JSON.stringify(value));
        });

        setTimeout(() => {
            document.querySelectorAll('textarea').forEach(el => this.resize(el));
        }, 500);
    },

    // 3. ROBUST RESET FUNCTION
    resetToDefaults() {
        if (confirm("This will RESET your resume to the default YAML data and clear your local changes. Are you sure?")) {
            localStorage.removeItem('localResumeDraft');
            // Use the helper to ensure we get a clean object, not a string
            this.resume = JSON.parse(JSON.stringify(getSafeDefaults()));
            
            // Force a UI update
            this.$nextTick(() => {
                window.location.reload();
            });
        }
    },

    resize(el) {
        if(!el) return;
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
    },

    promptImage() {
        const url = prompt("Paste your photo URL:", this.resume.profile.image || "");
        if (url) this.resume.profile.image = url;
    },

    addItem(section) {
        const defaults = {
            experience: { role: "New Role", company: "Company", dates: "Dates", achievements: ["Result"] },
            education: { degree: "Degree", institution: "University", dates: "Year" },
            skills: { category: "CATEGORY", items: "Skills..." },
            signature_achievements: { title: "New Achievement", icon: "fas fa-star", description: "Describe the impact..." }
        };
        
        if (this.resume[section]) {
            this.resume[section].push(JSON.parse(JSON.stringify(defaults[section])));
            this.$nextTick(() => { document.querySelectorAll('textarea').forEach(el => this.resize(el)); });
        }
    },

    removeItem(section, index) {
        if (confirm("Remove this item?")) {
            this.resume[section].splice(index, 1);
        }
    },

    async login() {
        const email = prompt("Enter email:");
        if (email) window.AuthService.login(email).then(() => alert("Check email!"));
    },
    async logout() {
        if (confirm("Logout?")) { window.AuthService.logout(); window.location.reload(); }
    },
    async saveToCloud() {
        if (!this.user) return this.login();
        this.loading = true;
        await window.AuthService.saveResume(this.user.id, this.resume);
        this.loading = false;
        this.isDirty = false;
        alert("Saved!");
    },
    async syncFromCloud() {
        this.loading = true;
        const { data } = await window.AuthService.loadResume(this.user.id);
        this.loading = false;
        if (data) {
            if (this.isDirty && !confirm("Overwrite local changes?")) return;
            this.resume = data;
            this.$nextTick(() => document.querySelectorAll('textarea').forEach(el => this.resize(el)));
        }
    }
});

document.addEventListener('alpine:init', () => {
    Alpine.data('resumeApp', resumeAppData);
});