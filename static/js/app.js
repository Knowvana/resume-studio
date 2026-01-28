// ==============================================
// 1. HELPER FUNCTIONS
// ==============================================

// Format "YYYY-MM" string to "Mon YYYY" for display
function formatDate(dateStr) {
    if (!dateStr) return "";
    // If it's just a year "2024"
    if (dateStr.length === 4) return dateStr;
    
    // Add day to parse correctly
    const date = new Date(dateStr + "-01");
    // Check if valid
    if (isNaN(date.getTime())) return dateStr;
    
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Attempt to parse old date strings back to "YYYY-MM" for inputs
function parseLegacyDate(dateStr) {
    if (!dateStr || dateStr.toLowerCase() === 'present') return "";
    // If it's just year
    if (dateStr.trim().match(/^\d{4}$/)) return dateStr.trim() + "-01";
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 7); // Returns YYYY-MM
}

// Generate default data structure (Merged with Hugo data if available)
function getSafeDefaults() {
    let data = window.hugoDefaultData;
    
    // Safety check if hugo data is stringified
    if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { data = null; }
    }
    
    const base = {
        theme: { 
            font: "Lato", 
            sidebar_color: "#0b1120" 
        },
        profile: { 
            name: "", 
            tagline: "", 
            location: "", 
            email: "", 
            phone: "", 
            linkedin: "", 
            summary: "", 
            impact_statement: "", 
            image: "",
            image_align: "center center" // Default Alignment
        },
        personal_details: { 
            dob: "", 
            nationality: "Indian", 
            marital_status: "Single", 
            languages: ["English"] 
        },
        signature_achievements: [],
        experience: [],
        education: [],
        certifications: [],
        skills: [],
        custom_sections: [] 
    };

    // Merge base with any existing data
    const merged = { 
        ...base, 
        ...data, 
        profile: { ...base.profile, ...(data?.profile || {}) },
        // Ensure arrays exist
        signature_achievements: data?.signature_achievements || [],
        experience: data?.experience || [],
        education: data?.education || [],
        certifications: data?.certifications || [],
        skills: data?.skills || [],
        custom_sections: data?.custom_sections || []
    };

    // CRITICAL: Ensure theme object exists
    if (!merged.theme) merged.theme = base.theme;
    
    return merged;
}

// ==============================================
// 2. ALPINE.JS DATA COMPONENT
// ==============================================

const resumeAppData = () => ({
    user: null,
    loading: false,
    isDirty: false,
    
    // UI States
    showThemePanel: false,
    showImageModal: false,
    
    // AI-Style Default Avatar
    defaultImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Atul&backgroundColor=c0aede",
    
    // Data Storage
    resume: getSafeDefaults(),

    // --- INITIALIZATION ---
    async init() {
        console.log("Resume App Initialized");
        
        // 1. Load from LocalStorage
        const localData = localStorage.getItem('localResumeDraft');
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                this.resume = { ...this.resume, ...parsed };
                
                // Safety: Ensure theme exists if loaded from old data
                if (!this.resume.theme) {
                    this.resume.theme = { font: "Lato", sidebar_color: "#0b1120" };
                }

                // Migration: Fix Dates
                if (this.resume.experience) {
                    this.resume.experience.forEach(job => {
                        if (job.dates && !job.startDate) {
                            const parts = job.dates.split(' - ');
                            job.startDate = parseLegacyDate(parts[0]);
                            job.isCurrent = (parts[1] || "").toLowerCase().includes("present");
                            if (!job.isCurrent) job.endDate = parseLegacyDate(parts[1]);
                        }
                    });
                }
                if (this.resume.education) {
                    this.resume.education.forEach(edu => {
                        if (edu.dates && !edu.startDate) {
                            const parts = edu.dates.split(' - ');
                            edu.startDate = parseLegacyDate(parts[0]);
                            edu.endDate = parseLegacyDate(parts[1]);
                        }
                    });
                }
            } catch (e) { console.error("Error loading local data:", e); }
        }

        // 2. Apply Theme
        this.updateTheme();

        // 3. Setup Watchers (Auto-save & Live Theme)
        this.$watch('resume.theme', () => this.updateTheme());
        this.$watch('resume', (value) => {
            this.isDirty = true;
            localStorage.setItem('localResumeDraft', JSON.stringify(value));
        });

        // 4. Check Auth (if available)
        if (window.AuthService) {
            try {
                this.user = await window.AuthService.getUser();
                if (this.user) await this.syncFromCloud();
            } catch (e) { console.error(e); }
        }

        // 5. Resize Textareas after render
        setTimeout(() => { 
            this.$nextTick(() => { 
                document.querySelectorAll('textarea').forEach(el => this.resize(el)); 
            }); 
        }, 300);
    },

    // --- THEME LOGIC ---
    updateTheme() {
        const r = document.documentElement;
        if (this.resume.theme) {
            r.style.setProperty('--sidebar-bg', this.resume.theme.sidebar_color);
            r.style.setProperty('--doc-font', this.resume.theme.font);
        }
    },

    resetThemeOnly() {
        this.resume.theme = { font: "Lato", sidebar_color: "#0b1120" };
        this.updateTheme();
    },

    resetToDefaults() {
        if (confirm("Reset everything to default? All local changes will be lost.")) {
            localStorage.removeItem('localResumeDraft');
            const defaults = getSafeDefaults();
            this.resume = JSON.parse(JSON.stringify(defaults));
            this.updateTheme();
            this.$nextTick(() => window.location.reload());
        }
    },

    // --- IMAGE HANDLING ---
    openImageModal() {
        this.showImageModal = true;
    },
    
    promptImageUrl() {
        const url = prompt("Enter Image URL:", this.resume.profile.image || "");
        if (url !== null) {
            this.resume.profile.image = url;
            this.showImageModal = false;
        }
    },

    triggerFileUpload() {
        // Trigger the hidden input in HTML
        const input = document.getElementById('hidden-file-input');
        if(input) input.click();
    },

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.resume.profile.image = e.target.result; // Base64 string
                this.showImageModal = false;
            };
            reader.readAsDataURL(file);
        }
    },

    // --- ICON HANDLING ---
    promptIcon(item) {
        const current = item.icon || "";
        const icon = prompt("Enter FontAwesome Icon Class (e.g. 'fab fa-google', 'fas fa-certificate'):", current);
        if (icon !== null) {
            item.icon = icon;
        }
    },

    // --- UTILS ---
    resize(el) {
        if (!el) return;
        el.style.height = 'auto'; 
        el.style.height = (el.scrollHeight + 2) + 'px';
    },

    promptImage() {
        // Legacy fallback, now redirects to modal
        this.openImageModal();
    },

    formatDate(dateStr) { return formatDate(dateStr); },

    // --- LIST MANAGEMENT ---
    addItem(section) {
        const defaults = {
            experience: { 
                role: "New Role", company: "Company", 
                startDate: new Date().toISOString().slice(0, 7), isCurrent: true, 
                achievements: ["Add details..."] 
            },
            education: { 
                degree: "Degree", institution: "Institute", 
                startDate: "2020-01", endDate: "2024-05", details: "Details..." 
            },
            certifications: { 
                name: "Certification Name", start: "2024", end: "Present", icon: "fas fa-certificate" 
            },
            skills: { category: "NEW CATEGORY", list: [{ name: "New Skill", level: 3 }] },
            signature_achievements: { title: "Title", icon: "fas fa-star", description: "Impact..." },
            custom_sections: { title: "Section", content: ["Point 1"] }
        };
        
        if (this.resume[section]) {
            this.resume[section].push(JSON.parse(JSON.stringify(defaults[section])));
            this.$nextTick(() => { document.querySelectorAll('textarea').forEach(el => this.resize(el)); });
        }
    },

    addSkillItem(catIndex) {
        this.resume.skills[catIndex].list.push({ name: "New Skill", level: 3 });
    },

    removeItem(section, index) {
        if (confirm("Remove this item?")) {
            this.resume[section].splice(index, 1);
        }
    },

    // --- CLOUD AUTH (Optional Placeholder) ---
    async login() { 
        const e = prompt("Email:"); 
        if(e && window.AuthService) window.AuthService.login(e).then(() => alert("Check email")); 
    },
    async logout() { 
        if(window.AuthService && confirm("Logout?")) {
            await window.AuthService.logout();
            window.location.reload();
        } 
    },
    async saveToCloud() { 
        if(!this.user) return this.login();
        this.loading = true;
        await window.AuthService.saveResume(this.user.id, this.resume);
        this.loading = false;
        this.isDirty = false;
        alert("Saved!"); 
    },
    async syncFromCloud() { 
        this.loading = true;
        const {data} = await window.AuthService.loadResume(this.user.id);
        this.loading = false;
        if (data) {
            if (this.isDirty && !confirm("Overwrite local changes with cloud data?")) return;
            this.resume = data;
            this.$nextTick(() => document.querySelectorAll('textarea').forEach(el => this.resize(el)));
        }
    }
});

// Initialize Alpine Data
document.addEventListener('alpine:init', () => { 
    Alpine.data('resumeApp', resumeAppData); 
});