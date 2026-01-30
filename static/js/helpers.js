// static/js/helpers.js
function formatDate(dateStr) {
    if (!dateStr) return "";
    if (dateStr.length === 4) return dateStr;
    const date = new Date(dateStr + "-01");
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

window.ResumeHelpers = {
    resize(el) { 
        if (!el) return; 
        el.style.height = 'auto'; 
        el.style.height = (el.scrollHeight + 2) + 'px'; 
    },
    promptIcon(item) { 
        const i = prompt("Icon Class:", item.icon); 
        if (i !== null) item.icon = i; 
    },
    exportToWord() { 
        alert("Word export is coming soon! Please use PDF export for now."); 
    }
};