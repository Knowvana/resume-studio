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
                // Fix old cert structure if needed
                if(this.resume.certifications && this.resume.certifications.length > 0 && !this.resume.certifications[0].icon) {
                     this.resume.certifications = this.resume.certifications.map(c => ({...c, start: c.year, end: "Present", icon: "fas fa-certificate"}));
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

    addItem(section) {
        const defaults = {
            experience: { 
                role: "New Role", 
                company: "Company", 
                dates: "Jan 2024 - Present", // NEW DEFAULT
                achievements: ["Add Experience details of this Role..."] 
            },
            education: { 
                degree: "Degree", 
                institution: "Institute", 
                dates: "2020 - 2024", 
                details: "Details..." 
            },
            certifications: { 
                name: "Certification Name", 
                start: "Jan 2024", 
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