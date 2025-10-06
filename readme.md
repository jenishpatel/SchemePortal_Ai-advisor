# SchemeFinder - AI-Powered Government Scheme Discovery Portal

SchemeFinder is a modern, user-friendly web application designed to help citizens discover, understand, and compare government schemes. It leverages the power of AI to provide personalized recommendations, summarize complex information, and offer a conversational assistant. The portal also includes a comprehensive admin panel for easy management of scheme data, news, and settings.

✨ Features

### 👤 User Portal (`index.html`)

* **Explore & Filter:** Search for schemes by name or keyword. Filter them by Sector, Ministry, and State/UT.
* **Categorized Browsing:** View schemes grouped by state, ministry, or sector.
* **Scheme Details:** Get a comprehensive view of each scheme, including its description, benefits, eligibility criteria, and required documents.
* **AI-Powered Insights:**
    * **AI Summary:** Generate a concise summary of any scheme.
    * **AI Elaboration:** Get a detailed explanation of a scheme's nuances, potential challenges, and ideal beneficiaries.
* **Save Schemes:** Mark schemes as favorites to save them to the "My Schemes" page for easy access.
* **Scheme Comparison:** Select up to 4 schemes to compare their features side-by-side in a clear table format.
* **AI Comparison Analyst:** Describe your personal situation, and the AI will analyze your selected schemes to recommend the best one for you.
* **Personalized AI Advisor:** Fill out a profile to get personalized scheme recommendations tailored to your needs.
* **News & Updates:** Stay informed with the latest news and announcements related to government schemes.
* **AI Chatbot Assistant:** Ask questions about schemes in a conversational interface to get instant answers.
* **Responsive Design:** Fully functional on both desktop and mobile devices.

### 🔐 Admin Panel (`admin.html`)

* **Secure Login:** Password-protected dashboard to manage the portal's content. (Default password: `password123`)
* **Dashboard Analytics:** View key statistics, including the total number of schemes and the most popular (most saved) schemes.
* **Full CRUD for Schemes:** Easily add, view, edit, and delete schemes through a user-friendly form.
* **🚀 AI Scheme Fetcher:** Simply enter the name of a government scheme, and the AI will automatically fetch and populate its details (description, benefits, eligibility, etc.), saving significant manual effort.
* **Data Management:**
    * **JSON Import:** Bulk upload schemes by importing a JSON file, replacing all existing data.
    * **JSON Export:** Download all current scheme data as a JSON file for backup or migration.
* **News Management:** Add, edit, and delete news articles that appear on the user-facing portal.
* **Chatbot Configuration:** Customize the AI chatbot's behavior and personality by modifying its system prompt directly from the settings page.

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, JavaScript (ES6+)
* **Styling:** Tailwind CSS & a custom stylesheet.
* **Icons:** Font Awesome
* **AI:** Google Gemini API
* **Data Storage:** LocalStorage (for client-side data persistence)

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You need a modern web browser and a text editor. No complex build steps are required.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/your-repository-name.git](https://github.com/your-username/your-repository-name.git)
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd S5\ struture
    ```
3.  **Configure the API Key:**
    This is the most important step for the AI features to work.
    * Open `js/app.js` and `js/admin.js`.
    * Find the line: `const API_KEY = 'PASTE_YOUR_GEMINI_API_KEY_HERE';`
    * Replace `'PASTE_YOUR_GEMINI_API_KEY_HERE'` with your actual Google Gemini API key.

    > **Warning:** This method of including an API key is not secure for a public website as it exposes your key to anyone who inspects the code. It is intended for local development or educational purposes.

4.  **Launch the Application:**
    * Open `index.html` in your web browser to view the user portal.
    * Open `admin.html` in your web browser to view the admin login page.
    * The default admin password is `password123`, which can be changed in the `js/admin.js` file.

## 📂 File Structure

```
.
├── css/
│   ├── admin.css       # Styles for the admin panel
│   └── style.css       # Styles for the main user portal
├── js/
│   ├── admin.js        # Logic for the admin panel & AI Fetcher
│   └── app.js          # Logic for the user portal & AI features
├── admin.html          # Admin panel page
└── index.html          # Main user portal page
```

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request


