document.addEventListener('DOMContentLoaded', () => {
    const KEYS = { SCHEMES: 'allSchemesData', NEWS: 'allNewsData', POPULARITY: 'schemePopularity', SETTINGS: 'portalSettings' };
    const ADMIN_PASSWORD = 'password123';
    
    // ⚠️ WARNING: For this project to work, you must insert your API key below.
    // This method is NOT secure for a public website, as your key will be exposed.
    // It is intended for local development or for others to use their own key.
    const API_KEY = 'PASTE_YOUR_GEMINI_API_KEY_HERE'; // <--- REPLACE WITH YOUR KEY
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;

    let allSchemes = [], allNews = [], portalSettings = {};
    
    const getData = (key, initial = []) => JSON.parse(localStorage.getItem(key)) || initial;
    const saveData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    const authSection = document.getElementById('admin-auth'), contentSection = document.getElementById('admin-content');
    const checkAuth = () => {
        if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
            authSection.style.display = 'none'; contentSection.style.display = 'block'; initializeApp();
        } else { authSection.style.display = 'flex'; contentSection.style.display = 'none'; }
    };
    document.getElementById('admin-login-btn').addEventListener('click', () => {
        if (document.getElementById('admin-password').value === ADMIN_PASSWORD) { sessionStorage.setItem('isAdminAuthenticated', 'true'); checkAuth(); } 
        else { document.getElementById('admin-auth-msg').textContent = 'Incorrect password.'; }
    });
    document.getElementById('admin-logout-btn').addEventListener('click', () => { sessionStorage.removeItem('isAdminAuthenticated'); checkAuth(); });
    
    const navigate = () => {
        const hash = window.location.hash || '#dashboard';
        document.querySelectorAll('.admin-page').forEach(p => p.classList.toggle('active', `#${p.id.split('-')[1]}` === hash));
        document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.toggle('active', l.getAttribute('href') === hash));
    };
    window.addEventListener('hashchange', navigate);

    const renderDashboard = () => {
        document.getElementById('stats-total-schemes').textContent = allSchemes.length;
        document.getElementById('stats-total-news').textContent = allNews.length;
         const popularity = getData(KEYS.POPULARITY, {});
        const popularSchemesContainer = document.getElementById('stats-popular-schemes');
        popularSchemesContainer.innerHTML = Object.entries(popularity)
            .sort(([,a],[,b]) => b - a)
            .slice(0, 3)
            .map(([id, count]) => {
                const scheme = allSchemes.find(s => s.id == id);
                return scheme ? `<div class="text-sm">${scheme.name} (${count} saves)</div>` : '';
            })
            .join('') || '<p class="text-sm text-gray-500">No data yet.</p>';
    };

    const schemeForm = document.getElementById('admin-scheme-form'), schemeIdInput = document.getElementById('admin-scheme-id');
    const schemeTableBody = document.querySelector('#admin-schemes-table tbody');
    const renderSchemesTable = () => {
        schemeTableBody.innerHTML = allSchemes.map(s => `<tr><td class="p-3">${s.name}</td><td class="p-3">${s.sector}</td><td class="p-3">${s.state}</td><td class="p-3 whitespace-nowrap"><button class="edit-btn text-indigo-600 hover:text-indigo-800 mr-4" data-id="${s.id}"><i class="fas fa-edit"></i></button><button class="delete-btn text-red-600 hover:text-red-800" data-id="${s.id}"><i class="fas fa-trash"></i></button></td></tr>`).join('') || `<tr><td colspan="4" class="p-4 text-center">No schemes found.</td></tr>`;
    };
    schemeForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const id = schemeIdInput.value;
        const data = {
            name: document.getElementById('admin-scheme-name').value,
            sector: document.getElementById('admin-scheme-sector').value,
            ministry: document.getElementById('admin-scheme-ministry').value,
            state: document.getElementById('admin-scheme-state').value,
            gender: document.getElementById('admin-scheme-gender').value,
            caste: document.getElementById('admin-scheme-caste').value,
            residence: document.getElementById('admin-scheme-residence').value,
            occupation: document.getElementById('admin-scheme-occupation').value,
            age_min: document.getElementById('admin-scheme-age-min').value,
            age_max: document.getElementById('admin-scheme-age-max').value,
            link: document.getElementById('admin-scheme-link').value,
            is_minority: document.getElementById('admin-scheme-is-minority').checked,
            is_differently_abled: document.getElementById('admin-scheme-is-differently-abled').checked,
            is_bpl: document.getElementById('admin-scheme-is-bpl').checked,
            is_student: document.getElementById('admin-scheme-is-student').checked,
            description: document.getElementById('admin-scheme-description').value,
            benefits: document.getElementById('admin-scheme-benefits').value.split(',').map(s=>s.trim()).filter(Boolean),
            application_process: document.getElementById('admin-scheme-application-process').value,
            documents: document.getElementById('admin-scheme-documents').value.split(',').map(s=>s.trim()).filter(Boolean),
        };
        if (id) { 
            const index = allSchemes.findIndex(s => s.id == id);
            allSchemes[index] = { ...allSchemes[index], ...data }; 
        } else { 
            allSchemes.push({ ...data, id: Date.now() }); 
        }
        saveData(KEYS.SCHEMES, allSchemes); 
        renderSchemesTable(); 
        renderDashboard(); 
        schemeForm.reset();
        schemeIdInput.value = '';
        document.getElementById('form-title').textContent = 'Add New Scheme';
        document.getElementById('admin-cancel-edit').style.display = 'none';
    });
    schemeTableBody.addEventListener('click', e => {
        const btn = e.target.closest('button'); if (!btn) return;
        const id = btn.dataset.id;
        if (btn.classList.contains('edit-btn')) {
            const s = allSchemes.find(s => s.id == id);
            document.getElementById('form-title').textContent = `Editing: ${s.name}`;
            schemeIdInput.value = s.id; 
            Object.keys(s).forEach(key => {
                const elKey = `admin-scheme-${key.replace(/_/g, '-')}`;
                const el = document.getElementById(elKey);
                if (el) {
                    if (el.type === 'checkbox') el.checked = s[key];
                    else el.value = Array.isArray(s[key]) ? s[key].join(', ') : s[key];
                }
            });
            document.getElementById('admin-cancel-edit').style.display = 'inline-block';
            window.scrollTo(0, 0);
        }
        if (btn.classList.contains('delete-btn')) {
            if (confirm(`Are you sure you want to delete this scheme?`)) {
                allSchemes = allSchemes.filter(s => s.id != id); 
                saveData(KEYS.SCHEMES, allSchemes); 
                renderSchemesTable(); 
                renderDashboard();
            }
        }
    });
    document.getElementById('admin-cancel-edit').addEventListener('click', () => {
        schemeForm.reset();
        schemeIdInput.value = '';
        document.getElementById('form-title').textContent = 'Add New Scheme';
        document.getElementById('admin-cancel-edit').style.display = 'none';
    });
    
    // --- DATA IMPORT / EXPORT ---
    const importBtn = document.getElementById('import-btn');
    const exportBtn = document.getElementById('export-btn');
    const importFileEl = document.getElementById('import-file');
    const importStatusEl = document.getElementById('import-status');

    importBtn.addEventListener('click', () => {
        const file = importFileEl.files[0];
        if (!file) {
            importStatusEl.innerHTML = `<span class="text-red-500 font-medium">Please select a file to import.</span>`;
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const importedData = JSON.parse(event.target.result);

                if (!Array.isArray(importedData)) {
                    throw new Error("JSON file must contain an array of scheme objects.");
                }
                if (importedData.length > 0 && (!importedData[0].name || !importedData[0].sector)) {
                     throw new Error("JSON data doesn't seem to match the required scheme format.");
                }
                
                const newSchemes = importedData.map(scheme => ({...scheme, id: Date.now() + Math.random() * 1000}));

                allSchemes = newSchemes;
                saveData(KEYS.SCHEMES, allSchemes);
                
                renderSchemesTable();
                renderDashboard();
                
                importStatusEl.innerHTML = `<span class="text-green-600 font-medium">✅ Success! ${importedData.length} schemes imported, replacing all previous data.</span>`;
                importFileEl.value = '';

            } catch (error) {
                console.error("Import Error:", error);
                importStatusEl.innerHTML = `<span class="text-red-500 font-medium">Error: ${error.message}</span>`;
            }
        };
        reader.readAsText(file);
    });

    exportBtn.addEventListener('click', () => {
        try {
            const dataToExport = allSchemes.map(({ id, ...rest }) => rest);
            const dataStr = JSON.stringify(dataToExport, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'schemes_export.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            importStatusEl.innerHTML = `<span class="text-green-600 font-medium">✅ Data exported successfully.</span>`;
        } catch(error) {
            console.error("Export Error:", error);
            importStatusEl.innerHTML = `<span class="text-red-500 font-medium">Error exporting data.</span>`;
        }
    });


    // --- AI SCHEME FETCHER ---
    const fetchAiDetailsBtn = document.getElementById('fetch-ai-details-btn');
    const aiSchemeNameInput = document.getElementById('ai-scheme-name-input');
    const aiFetchStatus = document.getElementById('ai-fetch-status');

    async function callGeminiWithSearch(payload, retries = 4, delay = 2000) {
        try {
            if (API_KEY === 'PASTE_YOUR_GEMINI_API_KEY_HERE') {
                aiFetchStatus.innerHTML = `<span class="text-red-500 font-medium">Please add your API key in public/js/admin.js to use this feature.</span>`;
                return null;
            }
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.status === 429 && retries > 0) {
                console.warn(`API rate limit hit. Retrying in ${delay / 1000}s... (${retries} retries left)`);
                aiFetchStatus.innerHTML = `<div class="flex items-center"><div class="loader mr-2"></div><span>Server busy. Retrying in ${delay/1000}s...</span></div>`;
                await new Promise(res => setTimeout(res, delay));
                return callGeminiWithSearch(payload, retries - 1, delay * 2); // Exponential backoff
            }

            if (!response.ok) {
                throw new Error(`API call failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            if (!result.candidates || !result.candidates[0].content.parts[0].text) {
                throw new Error("Invalid response structure from API.");
            }
            return result.candidates[0].content.parts[0].text;

        } catch (error) {
             console.error("Gemini API Error after retries:", error);
             aiFetchStatus.innerHTML = `<span class="text-red-500 font-medium">Error: ${error.message}. Please try again later.</span>`;
             return null;
        }
    }

    function populateFormWithAIData(data) {
        document.getElementById('admin-scheme-name').value = data.name || '';
        document.getElementById('admin-scheme-description').value = data.description || '';
        document.getElementById('admin-scheme-sector').value = data.sector || '';
        document.getElementById('admin-scheme-ministry').value = data.ministry || '';
        document.getElementById('admin-scheme-state').value = data.state || 'All';
        document.getElementById('admin-scheme-benefits').value = (data.benefits || []).join(', ');
        document.getElementById('admin-scheme-documents').value = (data.documents || []).join(', ');
        document.getElementById('admin-scheme-link').value = data.link || '';
        
        if (data.eligibility) {
            const el = data.eligibility;
            document.getElementById('admin-scheme-gender').value = el.gender || 'Any';
            document.getElementById('admin-scheme-caste').value = el.caste || 'Any';
            document.getElementById('admin-scheme-residence').value = el.residence || 'Any';
            document.getElementById('admin-scheme-occupation').value = el.occupation || '';
            document.getElementById('admin-scheme-age-min').value = el.age_min || '';
            document.getElementById('admin-scheme-age-max').value = el.age_max || '';
            document.getElementById('admin-scheme-is-minority').checked = el.is_minority || false;
            document.getElementById('admin-scheme-is-differently-abled').checked = el.is_differently_abled || false;
            document.getElementById('admin-scheme-is-bpl').checked = el.is_bpl || false;
            document.getElementById('admin-scheme-is-student').checked = el.is_student || false;
        }
    }

    fetchAiDetailsBtn.addEventListener('click', async () => {
        const schemeName = aiSchemeNameInput.value.trim();
        if (!schemeName) {
            aiFetchStatus.innerHTML = `<span class="text-red-500 font-medium">Please enter a scheme name first.</span>`;
            return;
        }
        
        fetchAiDetailsBtn.disabled = true;
        aiFetchStatus.innerHTML = '<div class="flex items-center"><div class="loader mr-2"></div><span>Fetching data with AI... This may take a moment.</span></div>';
        schemeForm.reset();

        try {
            const prompt = `Act as an expert researcher on Indian government schemes. Find up-to-date information online for the scheme named: "${schemeName}".
            Return the information as a single, minified JSON object. Do not include any text, markdown, or explanation before or after the JSON. 
            The JSON object must strictly follow this structure:
            {
              "name": "string",
              "description": "string (detailed paragraph)",
              "sector": "string",
              "ministry": "string",
              "state": "string (e.g., 'All', 'Maharashtra')",
              "benefits": ["string", "string"],
              "documents": ["string", "string"],
              "link": "string (official URL)",
              "eligibility": { "gender": "string (Any/Male/Female)", "caste": "string (Any/General/SC/ST/OBC)", "residence": "string (Any/Rural/Urban)", "occupation": "string", "age_min": "number", "age_max": "number", "is_minority": "boolean", "is_differently_abled": "boolean", "is_bpl": "boolean", "is_student": "boolean" }
            }
            If a specific piece of information cannot be found, use null or an empty array as the value.`;

            const payload = {
                contents: [{ parts: [{ text: prompt }] }],
                tools: [{ "google_search": {} }],
            };
            
            const aiResponse = await callGeminiWithSearch(payload);

            if (aiResponse) {
                try {
                    // Clean the response to ensure it's valid JSON
                    const cleanedResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                    const jsonData = JSON.parse(cleanedResponse);
                    populateFormWithAIData(jsonData);
                    aiFetchStatus.innerHTML = `<span class="text-green-600 font-medium">✅ Success! Data populated. Please review and save.</span>`;
                } catch (e) {
                     aiFetchStatus.innerHTML = `<span class="text-red-500 font-medium">Error: AI returned invalid data. Please try again.</span>`;
                     console.error("Failed to parse AI response:", e, "Response was:", aiResponse);
                }
            }
        } finally {
            fetchAiDetailsBtn.disabled = false;
        }
    });


    // --- NEWS FORM ---
    const newsForm = document.getElementById('admin-news-form'), newsIdInput = document.getElementById('admin-news-id');
    const newsTableBody = document.querySelector('#admin-news-table tbody');
    const renderNewsTable = () => {
        newsTableBody.innerHTML = allNews.map(n => `<tr><td class="p-3">${n.date}</td><td class="p-3">${n.title}</td><td class="p-3"><button class="delete-btn text-red-600" data-id="${n.id}"><i class="fas fa-trash"></i></button></td></tr>`).join('') || `<tr><td colspan="3" class="p-4 text-center">No news.</td></tr>`;
    };
    newsForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const id = newsIdInput.value;
        const data = { date: document.getElementById('admin-news-date').value, title: document.getElementById('admin-news-title').value, content: document.getElementById('admin-news-content').value };
        if(id){ 
            const index = allNews.findIndex(n=>n.id==id);
            allNews[index] = {...allNews[index], ...data}; 
        } else { 
            allNews.push({...data, id: Date.now()}); 
        }
        saveData(KEYS.NEWS, allNews); 
        renderNewsTable(); 
        newsForm.reset();
        newsIdInput.value = '';
    });
    newsTableBody.addEventListener('click', e => {
        const btn = e.target.closest('button'); if (!btn) return;
        if (confirm('Are you sure you want to delete this news article?')) {
            allNews = allNews.filter(n => n.id != btn.dataset.id); 
            saveData(KEYS.NEWS, allNews); 
            renderNewsTable();
        }
    });

    // --- SETTINGS FORM ---
    document.getElementById('settings-form').addEventListener('submit', e => {
        e.preventDefault(); 
        portalSettings.chatbotPrompt = document.getElementById('chatbot-prompt').value;
        saveData(KEYS.SETTINGS, portalSettings); 
        alert('Settings saved!');
    });

    // --- INITIALIZATION ---
    const initializeApp = () => {
        allSchemes = getData(KEYS.SCHEMES); 
        allNews = getData(KEYS.NEWS);
        portalSettings = getData(KEYS.SETTINGS, { chatbotPrompt: `You are a helpful assistant for Indian government schemes. Answer user questions based ONLY on the provided scheme data. Keep answers concise and directly related to the schemes. If you dont know, say you dont have information on that.` });
        document.getElementById('chatbot-prompt').value = portalSettings.chatbotPrompt;
        renderDashboard(); 
        renderSchemesTable();
        renderNewsTable(); 
        navigate();
    };
    checkAuth();
});

