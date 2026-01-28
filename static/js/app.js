// Function to format "YYYY-MM" to "Mon YYYY"
function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr + "-01");
    // Handle Year only or Month-Year
    if(dateStr.length === 4) return dateStr; 
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Helper to attempt parsing old dates
function parseLegacyDate(dateStr) {
    if(!dateStr || dateStr.toLowerCase() === 'present') return "";
    // Check if it's just a year "2007"
    if(dateStr.trim().match(/^\d{4}$/)) return dateStr.trim() + "-01";
    
    const date = new Date(dateStr);
    if(isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 7); // Returns YYYY-MM
}

function getSafeDefaults() {
    let data = window.hugoDefaultData;
    if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { data = null; }
    }
    
    const base = {
        profile: { name: "", tagline: "", location: "", email: "", phone: "", linkedin: "", summary: "", impact_statement: "", image: "" },
        personal_details: { dob: "", nationality: "Indian", marital_status: "Single", languages: ["English"] },
        signature_achievements: [],
        experience: [],
        education: [],
        certifications: [],
        skills: [],
        custom_sections: [] 
    };

    return { ...base, ...data, profile: { ...base.profile, ...(data?.profile || {}) } };
}

const resumeAppData = () => ({
    user: null,
    loading: false,
    isDirty: false,
    defaultImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
    resume: getSafeDefaults(),

    async init() {
        console.log("App Init");
        const localData = localStorage.getItem('localResumeDraft');
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                this.resume = { ...this.resume, ...parsed };
                
                // MIGRATION: Convert old experience strings
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
                
                // MIGRATION: Convert old Education strings
                if (this.resume.education) {
                    this.resume.education.forEach(edu => {
                        if (edu.dates && !edu.startDate) {
                            const parts = edu.dates.split(' - ');
                            edu.startDate = parseLegacyDate(parts[0]);
                            edu.endDate = parseLegacyDate(parts[1]);
                        }
                    });
                }
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

        setTimeout(() => { this.$nextTick(() => { document.querySelectorAll('textarea').forEach(el => this.resize(el)); }); }, 300);
    },

    resetToDefaults() {
        if (confirm("Reset to YAML defaults? Local changes will be lost.")) {
            localStorage.removeItem('localResumeDraft');
            this.resume = JSON.parse(JSON.stringify(getSafeDefaults()));
            // Re-run migration immediately on reset data
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
            this.$nextTick(() => window.location.reload());
        }
    },

    resize(el) {
        if(!el) return;
        el.style.height = 'auto'; 
        el.style.height = (el.scrollHeight + 2) + 'px';
    },

    promptImage() {
        const url = prompt("Photo URL:", this.resume.profile.image || "");
        if (url !== null) this.resume.profile.image = url;
    },

    formatDate(dateStr) { return formatDate(dateStr); },

    addItem(section) {
        const defaults = {
            experience: { 
                role: "New Role", 
                company: "Company", 
                startDate: new Date().toISOString().slice(0, 7), 
                isCurrent: true, 
                achievements: ["Add Experience details..."] 
            },
            education: { 
                degree: "Degree", 
                institution: "Institute", 
                startDate: "2020-01", // Default to date pickers
                endDate: "2024-05", 
                details: "Details..." 
            },
            certifications: { 
                name: "Certification Name", 
                start: "2024", 
                end: "Present", 
                icon: "fas fa-certificate" 
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
        if (confirm("Remove?")) this.resume[section].splice(index, 1);
    },

    async login() { const e = prompt("Email:"); if(e) window.AuthService.login(e).then(()=>alert("Check email")); },
    async logout() { if(confirm("Logout?")){await window.AuthService.logout();window.location.reload();} },
    async saveToCloud() { if(!this.user)return this.login();this.loading=true;await window.AuthService.saveResume(this.user.id,this.resume);this.loading=false;this.isDirty=false;alert("Saved!"); },
    async syncFromCloud() { this.loading=true;const{data}=await window.AuthService.loadResume(this.user.id);this.loading=false;if(data){if(this.isDirty&&!confirm("Overwrite local?"))return;this.resume=data;this.$nextTick(()=>document.querySelectorAll('textarea').forEach(el=>this.resize(el)));}}
});

document.addEventListener('alpine:init', () => { Alpine.data('resumeApp', resumeAppData); });