// static/js/app.js

// HELPER: Safely get defaults & ensure structure
function getSafeDefaults() {
    let data = window.hugoDefaultData;
    if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { console.error("Bad data", e); data = null; }
    }
    
    const base = {
        profile: { name: "", tagline: "", location: "", email: "", phone: "", linkedin: "", summary: "", impact_statement: "", image: "" },
        // New Section: Personal Details
        personal_details: { dob: "", nationality: "", marital_status: "", languages: "" },
        signature_achievements: [],
        experience: [],
        education: [],
        skills: [],
        // New Section: Custom generic sections at the end
        custom_sections: [] 
    };

    // Merge defaults with loaded data
    return { ...base, ...data, profile: { ...base.profile, ...(data?.profile || {}) }, personal_details: { ...base.personal_details, ...(data?.personal_details || {}) } };
}

const resumeAppData = () => ({
    user: null,
    loading: false,
    isDirty: false,
    // Professional Default Placeholder Image
    defaultImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",

    resume: getSafeDefaults(),

    async init() {
        console.log("Init...");
        const localData = localStorage.getItem('localResumeDraft');
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                // Deep merge back into safe defaults
                this.resume = { 
                    ...this.resume, 
                    ...parsed,
                    profile: { ...this.resume.profile, ...parsed.profile },
                    personal_details: { ...this.resume.personal_details, ...(parsed.personal_details || {}) }
                };
            } catch (e) { console.error(e); }
        }

        if (window.AuthService) {
            try {
                this.user = await window.AuthService.getUser();
                if (this.user) await this.syncFromCloud();
            } catch (e) { console.error(e); }
        }

        this.$watch('resume', (value) => {
            this.isDirty = true;
            localStorage.setItem('localResumeDraft', JSON.stringify(value));
        });

        // CRITICAL FIX FOR SCROLLBARS ON LOAD
        // Wait for Vue/Alpine to render, then resize.
        setTimeout(() => {
            this.$nextTick(() => {
                document.querySelectorAll('textarea').forEach(el => this.resize(el));
            });
        }, 300);
    },

    resetToDefaults() {
        if (confirm("Reset to defaults? Local changes will be lost.")) {
            localStorage.removeItem('localResumeDraft');
            this.resume = JSON.parse(JSON.stringify(getSafeDefaults()));
            this.$nextTick(() => window.location.reload());
        }
    },

    // IMPROVED RESIZE LOGIC
    resize(el) {
        if(!el) return;
        // 1. Reset height to auto to shrink if content was deleted
        el.style.height = 'auto'; 
        // 2. Set to scrollHeight to expand to fit content
        // Add a tiny buffer (2px) to prevent occasional flicker
        el.style.height = (el.scrollHeight + 2) + 'px';
    },

    promptImage() {
        const url = prompt("Paste photo URL:", this.resume.profile.image || "");
        if (url !== null) this.resume.profile.image = url;
    },

    addItem(section) {
        const defaults = {
            experience: { role: "New Role", company: "Company", dates: "Dates", achievements: ["Result..."] },
            education: { degree: "Degree / Certificate", institution: "University / Institute", dates: "Year", details: "Optional details..." },
            skills: { category: "CATEGORY", items: "List skills..." },
            signature_achievements: { title: "New Achievement", icon: "fas fa-star", description: "Description..." },
            // Default for custom section
            custom_sections: { title: "New Section Title", content: ["Add content points..."] }
        };
        
        if (this.resume[section]) {
            this.resume[section].push(JSON.parse(JSON.stringify(defaults[section])));
            // Wait for DOM update then resize new textareas
            this.$nextTick(() => { document.querySelectorAll('textarea').forEach(el => this.resize(el)); });
        }
    },

    removeItem(section, index) {
        if (confirm("Remove this item?")) {
            this.resume[section].splice(index, 1);
        }
    },

    // Cloud actions (omitted for brevity, kept same as before)
    async login() { const e = prompt("Email:"); if(e) window.AuthService.login(e).then(()=>alert("Check email")); },
    async logout() { if(confirm("Logout?")){await window.AuthService.logout();window.location.reload();} },
    async saveToCloud() { if(!this.user)return this.login();this.loading=true;await window.AuthService.saveResume(this.user.id,this.resume);this.loading=false;this.isDirty=false;alert("Saved!"); },
    async syncFromCloud() { this.loading=true;const{data}=await window.AuthService.loadResume(this.user.id);this.loading=false;if(data){if(this.isDirty&&!confirm("Overwrite local?"))return;this.resume=data;this.$nextTick(()=>document.querySelectorAll('textarea').forEach(el=>this.resize(el)));}}
});

document.addEventListener('alpine:init', () => { Alpine.data('resumeApp', resumeAppData); });