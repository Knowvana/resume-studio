# Resume Architect Studio

**Resume Architect Studio** is a modern, serverless, and interactive resume builder. It combines the speed of a Static Site Generator (Hugo) with the interactivity of a lightweight JavaScript framework (Alpine.js) to create a dynamic resume editing experience that runs entirely in the browser.

---

## 🔗 Live Demo & Repository

- **Live Site:** [https://knowvanalabs.netlify.app/](https://knowvanalabs.netlify.app/)
- **GitHub Repository:** [https://github.com/Knowvana/resume-studio](https://github.com/Knowvana/resume-studio)

---
## Features

-   **Live Resume Editing:** Edit your resume content directly in the browser.
-   **Real-time Preview:** See the changes you make to your resume in real-time.
-   **Customizable Sections:** Add, remove, and reorder sections to fit your needs.
-   **Multiple Themes:** Choose from a variety of themes to style your resume.
-   **Print to PDF:** Print your resume to a PDF file with a single click.
-   **Data Driven:** Resume data is powered by a simple `resume.yaml` file.

## 🛠️ Technology Stack

* **Core Framework:** [Hugo](https://gohugo.io/) (Static Site Generator)
* **Interactivity:** [Alpine.js](https://alpinejs.dev/) (Lightweight Reactivity)
* **Styling:** Bootstrap 5 (Grid System) + Custom CSS
* **Icons:** FontAwesome
* **Hosting/CI:** Netlify

---

## 📂 Project Structure

Here is a detailed breakdown of the file structure and the purpose of each key file:

```text
resume-studio/
├── archetypes/
│   └── default.md          # Default template for new content files (standard Hugo).
├── data/
│   └── resume.yaml         # THE DATA SOURCE. This file contains the default profile info, 
│                           # experience, and skills loaded when the app first starts 
│                           # or when "Reset" is clicked.
├── layouts/
│   ├── partials/
│   │   ├── head.html       # HTML <head> section (meta tags, CSS links, fonts).
│   │   └── toolbar.html    # (Deprecated/Legacy) Old navigation components.
│   └── index.html          # THE MAIN UI. This file contains the HTML structure, 
│                           # Alpine.js directives (x-data, x-model), and the layout 
│                           # for the Sidebar and Main Content areas.
├── static/                 # Assets served directly to the client.
│   ├── css/
│   │   └── style.css       # THE STYLING. Contains:
│   │                           - Dynamic CSS variables for theming.
│   │                           - Print media queries (@media print) for PDF export.
│   │                           - Layout styles for the sidebar, timeline, and modals.
│   └── js/
│       ├── app.js          # THE LOGIC. Contains the Alpine.js component:
│       │                       - Handles LocalStorage saving/loading.
│       │                       - Manages Image uploads/alignment.
│       │                       - Controls Theme toggling.
│       │                       - Handles data migration and defaults.
│       └── auth-service.js # Placeholder for future cloud authentication features.
├── hugo.toml               # Main configuration file for the Hugo site generator.
├── netlify.toml            # Build configuration instructions specifically for Netlify deployment.
└── README.md               # Project documentation.
```
## Getting Started

### Prerequisites

-   **[Hugo](https://gohugo.io/getting-started/installing/):** Make sure you have Hugo installed on your local machine.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/Knowvana/resume-studio.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd resume-studio
    ```
3.  Start the Hugo development server:
    ```bash
    hugo server
    ```
4.  Open your browser and navigate to `http://localhost:1313/` to see the application running.

## Usage

To customize your resume, you can edit the `data/resume.yaml` file. The changes will be reflected in real-time in the browser.

## Deployment

This project is configured for deployment on [Netlify](https://www.netlify.com/). Simply connect your GitHub repository to Netlify and it will be deployed automatically.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue if you have any suggestions or find any bugs.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.