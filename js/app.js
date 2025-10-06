document.addEventListener('DOMContentLoaded', () => {
    // --- DATA KEYS & API CONFIG ---
    const SCHEMES_KEY = 'allSchemesData';
    const NEWS_KEY = 'allNewsData';
    const POPULARITY_KEY = 'schemePopularity';
    const SETTINGS_KEY = 'portalSettings';
    
    // ⚠️ WARNING: For this project to work, you must insert your API key below.
    // This method is NOT secure for a public website, as your key will be exposed.
    // It is intended for local development or for others to use their own key.
    const API_KEY = 'PASTE_YOUR_GEMINI_API_KEY_HERE'; // <--- REPLACE WITH YOUR KEY
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;

    // --- STATE MANAGEMENT ---
    let allSchemes = [];
    let allNews = [];
    let portalSettings = {};
    let state = {
        currentPage: 'explore',
        filters: { search: '', sector: 'all', ministry: 'all', state: 'all' },
        browseTab: 'all',
        comparisonList: [],
        savedSchemeIds: [],
        chatHistory: [],
    };
    
    // --- DOM ELEMENTS ---
    const mainContent = document.querySelector('.main-content');
    const pages = {
        explore: document.getElementById('page-explore'),
        schemeDetail: document.getElementById('page-scheme-detail'),
        'my-schemes': document.getElementById('page-my-schemes'),
        'ai-advisor': document.getElementById('page-ai-advisor'),
        compare: document.getElementById('page-compare'),
        news: document.getElementById('page-news'),
    };
    const schemesContainer = document.getElementById('schemes-container');
    const searchInput = document.getElementById('search-input');
    const filterSector = document.getElementById('filter-sector');
    const filterMinistry = document.getElementById('filter-ministry');
    const filterState = document.getElementById('filter-state');
    
    // --- ROUTING ---
    function navigateTo(page) {
        state.currentPage = page;
        Object.values(pages).forEach(p => p.classList.remove('active'));
        if (pages[page]) pages[page].classList.add('active');

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${page}`);
        });

        switch(page) {
            case 'explore': renderFilteredSchemes(); break;
            case 'my-schemes': renderMySchemes(); break;
            case 'compare': renderComparison(); break;
            case 'news': renderNews(); break;
        }
        window.scrollTo(0, 0);
    }

    // --- RENDER FUNCTIONS ---
    function renderSchemeCard(scheme, container = 'explore') {
        const isSaved = state.savedSchemeIds.includes(scheme.id);
        const inCompare = state.comparisonList.includes(scheme.id);
        const benefitsList = (scheme.benefits || []).slice(0, 2).map(b => `<li class="text-sm text-gray-600 truncate">${b}</li>`).join('');

        return `
            <div class="scheme-card bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 flex flex-col">
                <div class="p-6 flex-grow">
                    <div class="flex justify-between items-start">
                         <h3 class="text-lg font-bold text-gray-800 mb-2">${scheme.name}</h3>
                         <button class="save-scheme-btn text-xl ${isSaved ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}" data-id="${scheme.id}"><i class="fas fa-heart"></i></button>
                    </div>
                    <div class="flex flex-wrap gap-2 mb-4 text-xs">
                        <span class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">${scheme.sector}</span>
                        <span class="bg-teal-100 text-teal-800 px-2 py-1 rounded-full">${scheme.state}</span>
                    </div>
                    <p class="text-sm text-gray-600 mb-4 h-20 overflow-hidden">${(scheme.description || '').substring(0, 120)}...</p>
                    ${benefitsList ? `<h4 class="font-semibold text-sm mb-1">Key Benefits:</h4><ul class="list-disc list-inside space-y-1">${benefitsList}</ul>` : ''}
                </div>
                <div class="p-4 bg-gray-50 border-t flex flex-col sm:flex-row justify-between items-center gap-2">
                    <button class="view-detail-btn w-full sm:w-auto text-sm text-indigo-600 font-semibold hover:underline" data-id="${scheme.id}">View Details</button>
                    ${container === 'explore' ? `<label class="flex items-center space-x-2 text-sm cursor-pointer select-none"><input type="checkbox" class="compare-checkbox rounded" data-id="${scheme.id}" ${inCompare ? 'checked' : ''}><span>Compare</span></label>` : ''}
                </div>
            </div>
        `;
    }
    
    function renderSchemeList(schemesToRender) {
        if (schemesToRender.length === 0) {
            schemesContainer.innerHTML = `<div class="text-center py-12"><p class="text-gray-500">No schemes found matching your criteria.</p></div>`;
            return;
        }
        schemesContainer.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${schemesToRender.map(s => renderSchemeCard(s)).join('')}</div>`;
    }
    
    function renderCategorizedSchemes() {
        const groupKey = state.browseTab;
        if (groupKey === 'all') { renderSchemeList(getFilteredSchemes()); return; }

        const grouped = allSchemes.reduce((acc, scheme) => {
            const key = scheme[groupKey] || 'Uncategorized';
            if (!acc[key]) acc[key] = [];
            acc[key].push(scheme);
            return acc;
        }, {});

        let html = '';
        Object.keys(grouped).sort().forEach(key => {
             html += `<div class="mb-8"><h2 class="text-xl font-bold mb-4 border-b pb-2">${key}</h2><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${grouped[key].map(s => renderSchemeCard(s)).join('')}</div></div>`;
        });
        schemesContainer.innerHTML = html;
    }
    
    function renderFilteredSchemes() {
        if (state.browseTab === 'all') { renderSchemeList(getFilteredSchemes()); } 
        else { renderCategorizedSchemes(); }
    }
    
    function getFilteredSchemes() {
        const { search, sector, ministry, state: stateFilter } = state.filters;
        const searchLower = search.toLowerCase();
        return allSchemes.filter(s => ((s.name.toLowerCase().includes(searchLower) || (s.description || '').toLowerCase().includes(searchLower)) && (sector === 'all' || s.sector === sector) && (ministry === 'all' || s.ministry === ministry) && (stateFilter === 'all' || s.state === stateFilter || s.state === 'All')));
    }
    
    function renderSchemeDetail(schemeId) {
        const scheme = allSchemes.find(s => s.id == schemeId);
        if (!scheme) { pages.schemeDetail.innerHTML = `<p>Scheme not found.</p>`; navigateTo('explore'); return; }

        const benefitsList = (scheme.benefits || []).map(b => `<li class="flex items-start"><span class="text-green-500 mr-2 mt-1"><i class="fas fa-check-circle"></i></span>${b}</li>`).join('');
        const documentsList = (scheme.documents || []).map(d => `<li class="flex items-start"><span class="text-indigo-500 mr-2 mt-1"><i class="fas fa-file-alt"></i></span>${d}</li>`).join('');
        
         const eligibility = {
            'Gender': scheme.gender, 'Caste': scheme.caste, 'Residence': scheme.residence, 'Occupation': scheme.occupation,
            'Minimum Age': scheme.age_min, 'Maximum Age': scheme.age_max,
            'For Minority': scheme.is_minority, 'For Differently Abled': scheme.is_differently_abled, 'For BPL': scheme.is_bpl, 'For Students': scheme.is_student,
        };

        const eligibilityCriteria = Object.entries(eligibility).filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== 'Any' && value !== false)
            .map(([key, value]) => `<div class="flex justify-between py-2 border-b"><dt class="text-gray-600">${key}</dt><dd class="font-medium text-gray-900">${typeof value === 'boolean' ? 'Yes' : value}</dd></div>`).join('');
        
        pages.schemeDetail.innerHTML = `
            <div class="bg-white p-8 rounded-lg shadow-lg">
                <button id="back-to-explore" class="mb-6 text-sm text-indigo-600 font-semibold hover:underline"><i class="fas fa-arrow-left mr-2"></i>Back to Schemes</button>
                <h1 class="text-3xl font-bold mb-2">${scheme.name}</h1>
                <div class="flex flex-wrap gap-2 mb-6 text-sm">
                    <span class="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">${scheme.sector}</span>
                    <span class="bg-teal-100 text-teal-800 px-3 py-1 rounded-full">${scheme.state}</span>
                    ${scheme.ministry ? `<span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">${scheme.ministry}</span>` : ''}
                </div>
                <div class="mb-6"><h2 class="text-xl font-semibold mb-2">Description</h2><p class="text-gray-700 leading-relaxed">${scheme.description}</p>
                    <div class="flex items-center gap-2 mt-4">
                       <button id="summarize-btn" data-id="${scheme.id}" class="text-sm btn-primary py-2 px-4 rounded-md flex items-center"><i class="fas fa-robot mr-2"></i> Summarize</button>
                       <button id="elaborate-btn" data-id="${scheme.id}" class="text-sm bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md flex items-center">✨ Elaborate</button>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div><h2 class="text-xl font-semibold mb-2">Eligibility</h2>${eligibilityCriteria ? `<dl>${eligibilityCriteria}</dl>` : '<p class="text-gray-500">No specific criteria listed.</p>'}<button id="eligibility-check-btn" data-id="${scheme.id}" class="mt-4 w-full text-sm bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md">Check My Eligibility</button></div>
                    <div><h2 class="text-xl font-semibold mb-2">Benefits</h2>${benefitsList ? `<ul class="space-y-2">${benefitsList}</ul>` : '<p class="text-gray-500">No benefits listed.</p>'}</div>
                    <div><h2 class="text-xl font-semibold mb-2">Documents</h2>${documentsList ? `<ul class="space-y-2">${documentsList}</ul>` : '<p class="text-gray-500">No documents listed.</p>'}</div>
                    ${scheme.application_process ? `<div><h2 class="text-xl font-semibold mb-2">Application Process</h2><p class="text-gray-700 whitespace-pre-line">${scheme.application_process}</p></div>` : ''}
                </div>
                 <div class="mt-8 text-center"><a href="${scheme.link || '#'}" target="_blank" class="inline-block btn-primary font-bold py-3 px-8 rounded-md text-lg">Official Page <i class="fas fa-external-link-alt ml-2"></i></a></div>
            </div>`;
        navigateTo('schemeDetail');
    }
    
    function renderMySchemes() {
        const container = document.getElementById('my-schemes-container');
        const savedSchemes = allSchemes.filter(s => state.savedSchemeIds.includes(s.id));
        if (savedSchemes.length === 0) {
            container.innerHTML = `<div class="text-center py-12 col-span-full"><p class="text-gray-500">You haven't saved any schemes yet. Click the <i class="fas fa-heart text-red-400"></i> on a scheme to save it.</p></div>`;
        } else {
            container.innerHTML = savedSchemes.map(s => renderSchemeCard(s, 'my-schemes')).join('');
        }
    }
    
    function renderComparison() {
        const container = document.getElementById('comparison-container');
        const instructions = document.getElementById('compare-instructions');
        const schemesToCompare = allSchemes.filter(s => state.comparisonList.includes(s.id));
        const aiCompareSection = document.getElementById('ai-compare-section');

        if (schemesToCompare.length < 2) {
            instructions.textContent = 'Select 2 to 4 schemes from the \'Explore\' page to compare.';
            container.innerHTML = '';
            aiCompareSection.classList.add('hidden');
            return;
        }
        aiCompareSection.classList.remove('hidden');
        instructions.textContent = `Comparing ${schemesToCompare.length} schemes.`;
        const headers = schemesToCompare.map(s => `<th class="p-3 font-bold bg-gray-100 text-left sticky top-0">${s.name}</th>`).join('');
        
        const features = ['sector', 'state', 'ministry', 'benefits', 'documents'];
        const featureLabels = {
            'sector': 'Sector', 'state': 'State/UT', 'ministry': 'Ministry', 
            'benefits': 'Benefits', 'documents': 'Documents'
        };

        const bodyRows = features.map(feature => {
            const cells = schemesToCompare.map(s => {
                const value = s[feature];
                const displayValue = Array.isArray(value) ? `<ul class='list-disc list-inside'>${value.map(i => `<li>${i}</li>`).join('')}</ul>` : (value || 'N/A');
                return `<td class="p-3 align-top border">${displayValue}</td>`;
            }).join('');
            return `<tr><td class="p-3 font-semibold border sticky left-0 bg-white">${featureLabels[feature]}</td>${cells}</tr>`;
        }).join('');

        container.innerHTML = `<table class="w-full border-collapse comparison-table"><thead><tr><th class="p-3 font-bold bg-gray-200 text-left sticky top-0 left-0 z-10">Feature</th>${headers}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    }


    function renderNews() {
        const container = document.getElementById('news-container');
        if(allNews.length === 0) {
             container.innerHTML = `<p class="text-gray-500 text-center">No news or updates at the moment.</p>`;
             return;
        }
        container.innerHTML = [...allNews].sort((a,b) => new Date(b.date) - new Date(a.date)).map(item => `
            <div class="bg-white p-6 rounded-lg shadow-sm border">
                <p class="text-sm text-gray-500 mb-2">${new Date(item.date).toDateString()}</p>
                <h2 class="text-xl font-bold mb-2">${item.title}</h2>
                <p class="text-gray-700">${item.content}</p>
            </div>
        `).join('');
    }

    // --- FILTERING AND UI SETUP ---
    function populateFilters() {
        const sectors = ['all', ...new Set(allSchemes.map(s => s.sector).filter(Boolean).sort())];
        const ministries = ['all', ...new Set(allSchemes.map(s => s.ministry).filter(Boolean).sort())];
        const states = ['all', ...new Set(allSchemes.map(s => s.state).filter(Boolean).sort())];

        const populateSelect = (selectEl, options, label) => {
            selectEl.innerHTML = options.map(o => `<option value="${o}">${o === 'all' ? `All ${label}` : o}</option>`).join('');
        };

        populateSelect(filterSector, sectors, 'Sectors');
        populateSelect(filterMinistry, ministries, 'Ministries');
        populateSelect(filterState, states, 'States');
        populateSelect(document.getElementById('ai-sector'), sectors.filter(s => s !== 'all'), 'Sectors');
        populateSelect(document.getElementById('ai-state'), states.filter(s => s !== 'all'), 'States');
    }

    function updateCompareCount() {
        const count = state.comparisonList.length;
        document.getElementById('compare-count').textContent = count;
        document.getElementById('mobile-compare-count').textContent = count;
    }

    // --- EVENT HANDLERS ---
    function handleFilterChange(e) {
        const { id, value } = e.target;
        if (id === 'search-input') state.filters.search = value;
        else if (id === 'filter-sector') state.filters.sector = value;
        else if (id === 'filter-ministry') state.filters.ministry = value;
        else if (id === 'filter-state') state.filters.state = value;
        renderFilteredSchemes();
    }
    
    function handleSchemeActions(e) {
        const target = e.target.closest('button, input');
        if (!target) return;

        if (target.matches('#back-to-explore')) {
            navigateTo('explore');
            return; 
        }

        const id = parseFloat(target.dataset.id);
        if (isNaN(id)) return;

        if (target.matches('.view-detail-btn')) renderSchemeDetail(id);
        if (target.matches('.save-scheme-btn')) toggleSaveScheme(id, target);
        if (target.matches('#summarize-btn')) handleSummarize(id);
        if (target.matches('#elaborate-btn')) handleElaborate(id);
        if (target.matches('#eligibility-check-btn')) openEligibilityModal(id);
        if (target.matches('.compare-checkbox')) toggleCompareScheme(id, target.checked);
    }
    
    function toggleSaveScheme(schemeId, buttonElement) {
        const index = state.savedSchemeIds.indexOf(schemeId);
        const popularity = JSON.parse(localStorage.getItem(POPULARITY_KEY) || '{}');
        let isSaving = false;

        if (index > -1) {
            state.savedSchemeIds.splice(index, 1);
            isSaving = false;
        } else {
            state.savedSchemeIds.push(schemeId);
            popularity[schemeId] = (popularity[schemeId] || 0) + 1;
            localStorage.setItem(POPULARITY_KEY, JSON.stringify(popularity));
            isSaving = true;
        }
        
        localStorage.setItem('savedSchemes', JSON.stringify(state.savedSchemeIds));
        
        if(buttonElement) {
            buttonElement.classList.toggle('text-red-500', isSaving);
            buttonElement.classList.toggle('text-gray-400', !isSaving);
        }

        if (state.currentPage === 'my-schemes') {
            renderMySchemes();
        } else if (state.currentPage === 'explore') {
            // To update other cards on the explore page that might be the same scheme
            const allSaveButtons = document.querySelectorAll(`.save-scheme-btn[data-id="${schemeId}"]`);
            allSaveButtons.forEach(btn => {
                btn.classList.toggle('text-red-500', isSaving);
                btn.classList.toggle('text-gray-400', !isSaving);
            });
        }
    }

    function toggleCompareScheme(schemeId, isChecked) {
        if (isChecked) {
            if(state.comparisonList.length < 4) { 
                if (!state.comparisonList.includes(schemeId)) state.comparisonList.push(schemeId); 
            } else { 
                alert('You can only compare up to 4 schemes.'); 
                const checkbox = document.querySelector(`.compare-checkbox[data-id="${schemeId}"]`); 
                if(checkbox) checkbox.checked = false; 
            }
        } else { 
            state.comparisonList = state.comparisonList.filter(id => id !== schemeId); 
        }
        updateCompareCount();
        if(state.currentPage === 'compare') renderComparison();
    }

    // --- AI FEATURES ---
    async function callGemini(payload) {
         try {
            if (API_KEY === 'PASTE_YOUR_GEMINI_API_KEY_HERE') {
                return "API Key not provided. Please add your API key in the public/js/app.js file.";
            }
            const response = await fetch(API_URL, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(payload) 
            });
            if (!response.ok) throw new Error(`API call failed: ${response.status} ${response.statusText}`);
            const result = await response.json();
            if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error("Invalid response structure from API.");
            }
            return result.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error("Gemini API Error:", error);
            return `An error occurred with the AI assistant: ${error.message}.`;
        }
    }
    
    const openAiModal = (title) => {
        const modal = document.getElementById('ai-modal');
        modal.querySelector('#ai-modal-title').textContent = title;
        modal.querySelector('#ai-modal-content').innerHTML = '<div class="flex justify-center"><div class="loader"></div></div>';
        modal.style.display = 'flex';
    };

    const setAiModalContent = (htmlContent) => {
        document.getElementById('ai-modal-content').innerHTML = htmlContent;
    };
    
    async function handleSummarize(schemeId) {
        const scheme = allSchemes.find(s => s.id == schemeId);
        openAiModal('AI Generated Summary');
        const prompt = `Provide a concise, one-paragraph summary of the following government scheme, highlighting its main purpose and key benefits:\n\n---\n\nScheme Name: ${scheme.name}\nDescription: ${scheme.description}`;
        const summary = await callGemini({ contents: [{ parts: [{ text: prompt }] }] });
        setAiModalContent(summary.replace(/\n/g, '<br>'));
    }

    async function handleElaborate(schemeId) {
        const scheme = allSchemes.find(s => s.id == schemeId);
        openAiModal('✨ AI Generated Elaboration');
        const schemeDetails = JSON.stringify({ name: scheme.name, description: scheme.description, benefits: scheme.benefits });
        const prompt = `Elaborate on this scheme: ${schemeDetails}. Discuss potential benefits, common challenges, and who it's best for. Format with headings.`;
        const elaboration = await callGemini({ contents: [{ parts: [{ text: prompt }] }] });
        setAiModalContent(elaboration.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<h4 class="font-bold mt-2">$1</h4>'));
    }
    
    async function handleAiComparison() {
        const userPersona = document.getElementById('user-persona').value;
        if (!userPersona.trim()) {
            alert('Please describe your situation first.');
            return;
        }
        const resultDiv = document.getElementById('ai-comparison-result');
        resultDiv.classList.remove('hidden');
        resultDiv.innerHTML = '<div class="flex justify-center"><div class="loader"></div></div>';

        const schemesToCompare = allSchemes.filter(s => state.comparisonList.includes(s.id));
        const schemeDataForAI = JSON.stringify(schemesToCompare.map(s => ({ name: s.name, description: s.description, benefits: s.benefits, eligibility: { gender: s.gender, caste: s.caste, residence: s.residence, age_min: s.age_min, age_max: s.age_max } })));
        const prompt = `A user is comparing government schemes. User's situation: "${userPersona}". Schemes: ${schemeDataForAI}. Analyze and recommend the best scheme with an explanation.`;
        const analysis = await callGemini({ contents: [{ parts: [{ text: prompt }] }] });
        resultDiv.innerHTML = analysis.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    }

    document.getElementById('ai-advisor-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const resultDiv = document.getElementById('ai-recommendations-result');
        resultDiv.innerHTML = '<div class="flex justify-center"><div class="loader"></div></div>';
        const userProfile = { 
            situation: document.getElementById('ai-situation').value, 
            sector: document.getElementById('ai-sector').value, 
            state: document.getElementById('ai-state').value, 
            age: document.getElementById('ai-age').value
        };
        const schemeDataForAI = JSON.stringify(allSchemes.map(s => ({ id: s.id, name: s.name, description: s.description, sector: s.sector, state: s.state })));
        const prompt = `User profile: ${JSON.stringify(userProfile)}. Available schemes: ${schemeDataForAI}. Recommend the top 3 schemes with a brief explanation for each.`;
        const recommendations = await callGemini({ contents: [{ parts: [{ text: prompt }] }] });
        resultDiv.innerHTML = recommendations.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<h4 class="font-bold mt-2">$1</h4>');
    });

    // --- CHATBOT ---
    function handleChatbot() {
        const openBtn = document.getElementById('open-chatbot');
        const closeBtn = document.getElementById('close-chatbot');
        const widget = document.getElementById('chatbot-widget');
        const form = document.getElementById('chatbot-form');
        const input = document.getElementById('chatbot-input');
        const messagesDiv = document.getElementById('chatbot-messages');

        openBtn.addEventListener('click', () => { widget.classList.remove('hidden'); openBtn.classList.add('hidden'); });
        closeBtn.addEventListener('click', () => { widget.classList.add('hidden'); openBtn.classList.remove('hidden'); });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userMessage = input.value.trim();
            if (!userMessage) return;
            addChatMessage(userMessage, 'user');
            input.value = '';
            state.chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
            
            const schemeDataForChat = JSON.stringify(allSchemes.map(s => ({ name: s.name, description: s.description, benefits: s.benefits })));
            const systemPrompt = portalSettings.chatbotPrompt || 'You are a helpful assistant for Indian government schemes. Answer based ONLY on the provided scheme data.';
            const payload = { contents: state.chatHistory, systemInstruction: { parts: [{ text: `${systemPrompt} Scheme Data: ${schemeDataForChat}` }] } };

            addChatMessage('...', 'model'); // Typing indicator
            const aiResponse = await callGemini(payload);
            messagesDiv.removeChild(messagesDiv.lastChild);
            addChatMessage(aiResponse, 'model');
            state.chatHistory.push({ role: "model", parts: [{ text: aiResponse }] });
        });

        function addChatMessage(text, sender) {
            const messageEl = document.createElement('div');
            messageEl.className = `p-2 rounded-lg mb-2 max-w-xs text-sm break-words ${sender === 'user' ? 'bg-indigo-500 text-white self-end ml-auto' : 'bg-gray-200 text-gray-800 self-start mr-auto'}`;
            messageEl.textContent = text;
            messagesDiv.appendChild(messageEl);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    }
    
    // --- ELIGIBILITY CALCULATOR ---
    function openEligibilityModal(schemeId) {
        const scheme = allSchemes.find(s => s.id == schemeId);
        const modal = document.getElementById('eligibility-modal');
        const formContainer = document.getElementById('eligibility-form-container');
        const resultDiv = document.getElementById('eligibility-result');
        resultDiv.classList.add('hidden');
        
        const keys = ['age_min', 'gender', 'caste', 'residence'];
        const inputs = keys.filter(k => scheme[k] && scheme[k] !== 'Any').map(key => `<div><label class="block text-sm">${key.replace('_',' ')}:</label><input type="text" name="${key}" class="mt-1 w-full p-2 border rounded-md" required></div>`).join('');

        if (!inputs) { formContainer.innerHTML = `<p>This scheme has general eligibility.</p>`; } 
        else { formContainer.innerHTML = `<form id="eligibility-form" class="space-y-3" data-id="${schemeId}">${inputs}<button type="submit" class="w-full btn-primary py-2 px-4 rounded-md">Check</button></form>`; }
        modal.style.display = 'flex';
    }
    
    document.body.addEventListener('submit', (e) => {
        if (e.target.id === 'eligibility-form') {
            e.preventDefault();
            const resultDiv = document.getElementById('eligibility-result');
            resultDiv.classList.remove('hidden');
            resultDiv.className = 'mt-4 p-4 rounded-md bg-green-100 text-green-800';
            resultDiv.innerHTML = '<h4 class="font-bold">Recommendation</h4><p>Based on your inputs, you may be eligible. Please review the detailed criteria on the official page to confirm.</p>';
        }
    });
    
    // --- INITIALIZATION ---
    function initApp() {
        allSchemes = JSON.parse(localStorage.getItem(SCHEMES_KEY) || '[]');
        allNews = JSON.parse(localStorage.getItem(NEWS_KEY) || '[]');
        portalSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
        state.savedSchemeIds = JSON.parse(localStorage.getItem('savedSchemes') || '[]').map(id => parseFloat(id));
        
        if (allSchemes.length === 0) {
             const defaultSchemes = [{ id: 1, name: "PM Kisan Samman Nidhi", sector: "Agriculture", ministry: "Agriculture & Farmers Welfare", state: "All", description: "A central sector scheme with 100% funding from Government of India. It has become operational from 1.12.2018. Under the scheme an income support of 6,000/- per year in three equal installments will be provided to small and marginal farmer families having combined land holding/ownership of up to 2 hectares.", gender: "Any", caste: "Any", residence: "Any", age_min: 18, benefits: ["Rs. 6000 per year"], documents: ["Aadhaar Card", "Landholding papers"], link: "https://pmkisan.gov.in/" }];
             localStorage.setItem(SCHEMES_KEY, JSON.stringify(defaultSchemes));
             allSchemes = defaultSchemes;
        }
         if (allNews.length === 0) {
            const defaultNews = [{ id: 1, date: '2025-09-01', title: 'Welcome to the Scheme Portal', content: 'Explore various schemes and find the one that fits you. Use the AI Advisor for personalized recommendations.' }];
            localStorage.setItem(NEWS_KEY, JSON.stringify(defaultNews));
            allNews = defaultNews;
        }
        
        populateFilters();
        handleChatbot();

        // Event Listeners
        searchInput.addEventListener('input', handleFilterChange);
        filterSector.addEventListener('change', handleFilterChange);
        filterMinistry.addEventListener('change', handleFilterChange);
        filterState.addEventListener('change', handleFilterChange);
        mainContent.addEventListener('click', handleSchemeActions);
        document.getElementById('get-ai-comparison').addEventListener('click', handleAiComparison);

        document.querySelectorAll('.nav-link').forEach(link => {
            if(link.href.includes('admin.html')) return;
            link.addEventListener('click', (e) => { e.preventDefault(); navigateTo(new URL(link.href).hash.substring(1)); });
        });
        document.querySelectorAll('.browse-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.browse-tab').forEach(t => t.classList.remove('border-indigo-500', 'text-indigo-600'));
                e.target.classList.add('border-indigo-500', 'text-indigo-600');
                state.browseTab = e.target.dataset.tab;
                renderFilteredSchemes();
            });
        });

        ['close-ai-modal', 'close-eligibility-modal'].forEach(id => {
            document.getElementById(id).addEventListener('click', (e) => {
                e.target.closest('.fixed').style.display = 'none';
            });
        });

        document.getElementById('reset-filters').addEventListener('click', () => {
            state.filters = { search: '', sector: 'all', ministry: 'all', state: 'all' };
            searchInput.value = ''; filterSector.value = 'all'; filterMinistry.value = 'all'; filterState.value = 'all';
            renderFilteredSchemes();
        });
        document.getElementById('mobile-menu-button').addEventListener('click', () => document.getElementById('mobile-menu').classList.toggle('hidden'));

        navigateTo(window.location.hash.substring(1) || 'explore');
    }

    initApp();
});

