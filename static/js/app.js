// ==============================================
// 1. HELPER FUNCTIONS
// ==============================================
function formatDate(dateStr) {
    if (!dateStr) return "";
    if (dateStr.length === 4) return dateStr;
    const date = new Date(dateStr + "-01");
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function parseLegacyDate(dateStr) {
    if (!dateStr || dateStr.toLowerCase() === 'present') return "";
    if (dateStr.trim().match(/^\d{4}$/)) return dateStr.trim() + "-01";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 7);
}

function getSafeDefaults() {
    let data = window.hugoDefaultData;
    if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { data = null; } }
    
    const base = {
        theme: { font: "Lato", sidebar_color: "#0b1120" },
        profile: { name: "", tagline: "", location: "", email: "", phone: "", linkedin: "", summary: "", impact_statement: "", image: "", image_align: "center center" },
        personal_details: { dob: "", nationality: "Indian", marital_status: "Single", languages: ["English"] },
        signature_achievements: [], experience: [], education: [], certifications: [], skills: [], custom_sections: [] 
    };

    const merged = { 
        ...base, ...data, 
        profile: { ...base.profile, ...(data?.profile || {}) },
        signature_achievements: data?.signature_achievements || [],
        experience: data?.experience || [],
        education: data?.education || [],
        certifications: data?.certifications || [],
        skills: data?.skills || [],
        custom_sections: data?.custom_sections || []
    };
    if (!merged.theme) merged.theme = base.theme;
    return merged;
}

const resumeAppData = () => ({
    user: null, loading: false, isDirty: false,
    activeTab: 'about', showThemePanel: false, 
    
    // IMAGE EDITOR STATE
    showImageModal: false,
    imageUrlInput: '',
    cropperInstance: null,
    defaultImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Atul&backgroundColor=c0aede",
    
    resume: getSafeDefaults(),

    async init() {
        console.log("Resume App Initialized");
        const localData = localStorage.getItem('localResumeDraft');
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                this.resume = { ...this.resume, ...parsed };
                
                // MIGRATION: Array -> String
                if (this.resume.experience) {
                    this.resume.experience.forEach(job => {
                        if (Array.isArray(job.achievements)) {
                            const listItems = job.achievements.map(a => `<li>${a}</li>`).join("");
                            job.achievements = `<ul>${listItems}</ul>`;
                        }
                    });
                }
                
                if (!this.resume.theme) this.resume.theme = { font: "Lato", sidebar_color: "#0b1120" };
            } catch (e) { console.error("Error loading local data:", e); }
        }

        const savedTab = localStorage.getItem('activeTab');
        if (savedTab) this.activeTab = savedTab;

        this.updateTheme();
        this.$watch('resume.theme', () => this.updateTheme());
        this.$watch('activeTab', (val) => localStorage.setItem('activeTab', val));
        this.$watch('resume', (val) => {
            this.isDirty = true;
            localStorage.setItem('localResumeDraft', JSON.stringify(val));
        });

        if (window.AuthService) {
            try {
                this.user = await window.AuthService.getUser();
                if (this.user) await this.syncFromCloud();
            } catch (e) { console.error(e); }
        }
    },

    setTab(tabName) {
        this.activeTab = tabName;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    updateTheme() {
        const r = document.documentElement;
        if (this.resume.theme) {
            r.style.setProperty('--sidebar-bg', this.resume.theme.sidebar_color);
            r.style.setProperty('--doc-font', this.resume.theme.font);
        }
    },

    resetThemeOnly() { this.resume.theme = { font: "Lato", sidebar_color: "#0b1120" }; this.updateTheme(); },

    resetToDefaults() {
        if (confirm("Reset everything to default? All local changes will be lost.")) {
            localStorage.removeItem('localResumeDraft');
            const defaults = getSafeDefaults();
            this.resume = JSON.parse(JSON.stringify(defaults));
            // Ensure array conversion on reset
            if (this.resume.experience) {
                this.resume.experience.forEach(job => {
                    if (Array.isArray(job.achievements)) {
                        const listItems = job.achievements.map(a => `<li>${a}</li>`).join("");
                        job.achievements = `<ul>${listItems}</ul>`;
                    }
                });
            }
            this.updateTheme();
            this.setTab('editor');
            this.$nextTick(() => window.location.reload());
        }
    },

    // === IMAGE EDITOR LOGIC (CROPPING) ===
    openImageEditor() {
        this.showImageModal = true;
        const currentSrc = this.resume.profile.image || this.defaultImage;
        // Wait for modal to render in DOM
        this.$nextTick(() => {
            this.initCropper(currentSrc);
        });
    },

    closeImageEditor() {
        this.showImageModal = false;
        if (this.cropperInstance) {
            this.cropperInstance.destroy();
            this.cropperInstance = null;
        }
    },

    triggerFileUpload() {
        document.getElementById('hidden-file-input').click();
    },

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.initCropper(e.target.result);
            };
            reader.readAsDataURL(file);
        }
        event.target.value = ''; // Reset
    },

    loadImageFromUrl() {
        if (this.imageUrlInput) {
            this.initCropper(this.imageUrlInput);
            this.imageUrlInput = '';
        }
    },

    initCropper(imageSrc) {
        const imageElement = document.getElementById('cropper-target');
        
        if (this.cropperInstance) {
            this.cropperInstance.destroy();
        }

        imageElement.src = imageSrc;

        // Initialize Cropper.js with LinkedIn-style box
        this.cropperInstance = new Cropper(imageElement, {
            aspectRatio: 1, // Force square
            viewMode: 1,    // Restrict crop box to canvas
            dragMode: 'move',
            autoCropArea: 1,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
        });
    },

    saveCroppedImage() {
        if (this.cropperInstance) {
            // High quality export
            const canvas = this.cropperInstance.getCroppedCanvas({
                width: 400,
                height: 400
            });
            
            this.resume.profile.image = canvas.toDataURL('image/png');
            this.closeImageEditor();
        }
    },

    promptImage() { 
        this.openImageEditor(); 
    },

    // ... (Keep existing helpers) ...
    promptIcon(item) { const i = prompt("Icon Class:", item.icon); if (i !== null) item.icon = i; },
    resize(el) { if (!el) return; el.style.height = 'auto'; el.style.height = (el.scrollHeight + 2) + 'px'; },
    formatDate(dateStr) { return formatDate(dateStr); },
    exportToWord() { alert("Word export is coming soon! Please use PDF export for now."); },

    addItem(section) {
        const defaults = {
            experience: { 
                role: "New Role", company: "Company", 
                startDate: new Date().toISOString().slice(0, 7), isCurrent: true, 
                achievements: "<ul><li>Add details here...</li></ul>" 
            },
            education: { 
                degree: "Degree", institution: "Institute", 
                startDate: "2020-01", endDate: "2024-05", details: "<p>Details...</p>" 
            },
            certifications: { name: "Cert Name", start: "2024", end: "Present", icon: "fas fa-certificate" },
            skills: { category: "NEW", list: [{ name: "Skill", level: 3 }] },
            signature_achievements: { title: "Title", icon: "fas fa-star", description: "<p>Impact...</p>" },
            custom_sections: { title: "Section", content: ["<p>Point 1</p>"] }
        };
        if (this.resume[section]) {
            this.resume[section].push(JSON.parse(JSON.stringify(defaults[section])));
            this.$nextTick(() => { document.querySelectorAll('textarea').forEach(el => this.resize(el)); });
        }
    },
    addSkillItem(idx) { this.resume.skills[idx].list.push({ name: "New Skill", level: 3 }); },
    removeItem(sec, idx) { if (confirm("Remove?")) this.resume[sec].splice(idx, 1); },

    async login() { const e = prompt("Email:"); if(e && window.AuthService) window.AuthService.login(e).then(() => alert("Check email")); },
    async logout() { if(window.AuthService && confirm("Logout?")) { await window.AuthService.logout(); window.location.reload(); } },
    async saveToCloud() { if(!this.user) return this.login(); this.loading = true; await window.AuthService.saveResume(this.user.id, this.resume); this.loading = false; this.isDirty = false; alert("Saved!"); },
    async syncFromCloud() { 
        this.loading = true; const {data} = await window.AuthService.loadResume(this.user.id); this.loading = false;
        if (data) { if (this.isDirty && !confirm("Overwrite local?")) return; this.resume = data; this.$nextTick(() => document.querySelectorAll('textarea').forEach(el => this.resize(el))); }
    }
});

document.addEventListener('alpine:init', () => { 
    Alpine.data('resumeApp', resumeAppData); 

    Alpine.data('richText', (initialContent, modelCallback) => ({
        editor: null,
        content: initialContent,
        init() {
            this.$nextTick(() => {
                this.editor = new Quill(this.$refs.quillEditor, {
                    theme: 'snow',
                    modules: {
                        toolbar: [
                            [{ 'font': [] }],
                            ['bold', 'italic', 'underline'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['clean']
                        ]
                    },
                    placeholder: 'Type details here...'
                });
                if (this.content) { this.editor.root.innerHTML = this.content; }
                this.editor.on('text-change', () => {
                    let html = this.editor.root.innerHTML;
                    if (html === '<p><br></p>') html = '';
                    modelCallback(html);
                });
            });
        }
    }));
});