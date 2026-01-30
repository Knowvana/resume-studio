// static/js/crud.js
window.crudMixin = function() {
    return {
        addItem(section) {
            const newItem = window.ResumeDefaults.getNewItem(section);
            if (this.resume[section] && newItem) {
                this.resume[section].push(newItem);
                this.$nextTick(() => document.querySelectorAll('textarea').forEach(el => window.ResumeHelpers.resize(el)));
            }
        },
        addSkillItem(idx) { this.resume.skills[idx].list.push({ name: "New Skill", level: 3 }); },
        removeItem(sec, idx) { if (confirm("Remove?")) this.resume[sec].splice(idx, 1); },
        
        resetToDefaults() {
            if (confirm("Reset everything to default? All local changes will be lost.")) {
                localStorage.removeItem('localResumeDraft');
                const defaults = window.ResumeDefaults.getSafeDefaults();
                this.resume = JSON.parse(JSON.stringify(defaults));
                
                // Legacy Fix: Array -> HTML
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
        }
    };
};