document.addEventListener('DOMContentLoaded', async () => {
    const contentDiv = document.getElementById('content');
    
    // Array of loading messages
    const loadingMessages = [
        "Analyzing privacy policy",
        "Decoding the privacy fine print — one vague sentence at a time.",
        "Braving the buzzwords… 'data', 'consent', 'third party'…",
        "Reading the stuff nobody else reads — for you.",
        "Sniffing out data leeches…",
        "Checking what your extension knows about you… and your cat.",
        "Give us 8 seconds. It took them 8 lawyers to write it.",
        "Running background checks on background trackers…",
        "Finding out what they really mean by 'enhancing your experience'…",
        "Looking for skeletons in the privacy clause closet…",
        "Deep diving into the ocean of 'we do not sell your data'™."
    ];
    
    let messageIndex = 0;
    let messageInterval;
    
    // Function to update loading message
    function updateLoadingMessage() {
        const loadingTextElement = document.querySelector('.loading-text');
        if (loadingTextElement) {
            loadingTextElement.textContent = loadingMessages[messageIndex];
            messageIndex = (messageIndex + 1) % loadingMessages.length;
        }
    }
    
    // Start rotating messages every 2 seconds
    function startLoadingRotation() {
        updateLoadingMessage(); // Set initial message
        messageInterval = setInterval(updateLoadingMessage, 2000);
    }
    
    // Stop rotating messages
    function stopLoadingRotation() {
        if (messageInterval) {
            clearInterval(messageInterval);
            messageInterval = null;
        }
    }
    
    try {
        // Start the loading message rotation
        startLoadingRotation();
        
        // Get the current tab URL
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentUrl = tab.url;
        
        // Check if we're on a Microsoft Edge addon page
        if (!currentUrl.includes('microsoftedge.microsoft.com/addons/detail/')) {
            stopLoadingRotation();
            contentDiv.innerHTML = `
                <div class="error">
                    Please navigate to a Microsoft Edge addon page to analyze its privacy policy.
                </div>
            `;
            return;
        }

        // Step 1: Get the privacy policy URL
        const privacyUrlResponse = await fetch('https://getprivacypolicyurl-ga2n4lzjoq-uc.a.run.app', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                extensionUrl: currentUrl
            })
        });

        if (!privacyUrlResponse.ok) {
            stopLoadingRotation();
            let errorMessage;
            try {
                const errorData = await privacyUrlResponse.json();
                errorMessage = errorData.error || 'Failed to find privacy policy URL';
            } catch {
                errorMessage = await privacyUrlResponse.text();
            }
            throw new Error(errorMessage);
        }

        const privacyUrlData = await privacyUrlResponse.json();
        const privacyPolicyUrl = privacyUrlData.privacyPolicyUrl;

        console.log('Privacy Policy URL found:', privacyPolicyUrl);

        // Step 2: Analyze the privacy policy
        const analysisResponse = await fetch('https://analyzepolicyfromurl-ga2n4lzjoq-uc.a.run.app', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                privacyPolicyUrl: privacyPolicyUrl
            })
        });

        console.log('Analysis response status:', analysisResponse.status);

        if (!analysisResponse.ok) {
            stopLoadingRotation();
            let errorMessage;
            try {
                const errorData = await analysisResponse.json();
                errorMessage = errorData.error || errorData.message || 'Failed to analyze privacy policy';
            } catch {
                // If JSON parsing fails, get the raw text response
                errorMessage = await analysisResponse.text();
            }
            throw new Error(`Analysis failed: ${errorMessage}`);
        }

        let analysisData;
        try {
            analysisData = await analysisResponse.json();
        } catch (parseError) {
            stopLoadingRotation();
            const responseText = await analysisResponse.text();
            console.error('Failed to parse JSON response:', responseText);
            throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`);
        }
        
        // Stop loading rotation and display results
        stopLoadingRotation();
        displayAnalysis(analysisData, privacyPolicyUrl);
        
    } catch (error) {
        stopLoadingRotation();
        console.error('Error:', error);
        contentDiv.innerHTML = `
            <div class="error">
                <strong>Error:</strong> ${error.message}
            </div>
        `;
    }
});

function displayAnalysis(data, privacyPolicyUrl) {
    const contentDiv = document.getElementById('content');
    
    contentDiv.innerHTML = `
        <div style="padding: 16px; font-family: 'Segoe UI', system-ui, sans-serif; background: #f8f9fa;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #1a1a1a; font-size: 18px; margin: 0; font-weight: 600;">Privacy Analysis</h2>
                <p style="color: #666; font-size: 11px; margin: 4px 0 0 0;">${data.hostname || 'Extension'}</p>
            </div>
            
            <!-- Risk Level Card -->
            <div style="background: white; border-radius: 8px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid ${
                data.privacyRiskRating === 'High' ? '#e63946' : 
                data.privacyRiskRating === 'Medium' ? '#ff9f1c' : 
                '#2a9d8f'
            };">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="color: #1a1a1a; font-size: 14px; margin: 0; font-weight: 600; display: flex; align-items: center;">
                        <span style="margin-right: 8px;">⚠️</span>
                        Risk Level
                    </h3>
                    <span style="
                        background: ${
                            data.privacyRiskRating === 'High' ? '#ffe6e6' : 
                            data.privacyRiskRating === 'Medium' ? '#fff4e6' : 
                            '#e6f7f5'
                        }; 
                        color: ${
                            data.privacyRiskRating === 'High' ? '#e63946' : 
                            data.privacyRiskRating === 'Medium' ? '#ff9f1c' : 
                            '#2a9d8f'
                        }; 
                        padding: 6px 12px; 
                        border-radius: 12px; 
                        font-size: 12px; 
                        font-weight: 600;
                    ">${data.privacyRiskRating}</span>
                </div>
            </div>

            <!-- Data Collection Card -->
            <div style="background: white; border-radius: 8px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="color: #1a1a1a; font-size: 14px; margin: 0 0 12px 0; font-weight: 600; display: flex; align-items: center;">
                    <span style="margin-right: 8px;">📊</span>
                    Data Collection
                </h3>
                <div style="display: grid; gap: 8px;">
                    ${Object.entries(data.dataCollection).map(([key, value]) => `
                        <div style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                            <div style="color: #333; font-size: 11px; font-weight: 500; margin-bottom: 4px;">${formatLabel(key)}</div>
                            <div style="color: ${value === 'none' ? '#2a9d8f' : value.includes('unclear') ? '#ff9f1c' : '#666'}; font-size: 10px; line-height: 1.4;">${value}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Data Storage Card -->
            <div style="background: white; border-radius: 8px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="color: #1a1a1a; font-size: 14px; margin: 0 0 12px 0; font-weight: 600; display: flex; align-items: center;">
                    <span style="margin-right: 8px;">💾</span>
                    Data Storage
                </h3>
                <div style="display: grid; gap: 8px;">
                    <div style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                        <div style="color: #333; font-size: 11px; font-weight: 500; margin-bottom: 4px;">Duration</div>
                        <div style="color: #666; font-size: 10px; line-height: 1.4;">${data.dataStorage.duration}</div>
                    </div>
                    <div style="padding: 8px 0;">
                        <div style="color: #333; font-size: 11px; font-weight: 500; margin-bottom: 4px;">Location</div>
                        <div style="color: #666; font-size: 10px; line-height: 1.4;">${data.dataStorage.location}</div>
                    </div>
                </div>
            </div>

            <!-- Data Sharing Card -->
            <div style="background: white; border-radius: 8px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="color: #1a1a1a; font-size: 14px; margin: 0 0 12px 0; font-weight: 600; display: flex; align-items: center;">
                    <span style="margin-right: 8px;">🔗</span>
                    Data Sharing
                </h3>
                <div style="margin-bottom: 12px;">
                    <div style="color: #333; font-weight: 500; margin: 0 0 6px 0; font-size: 11px;">Recipients:</div>
                    <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; min-height: 20px;">
                        ${data.dataSharing.recipients.length > 0 ? 
                            data.dataSharing.recipients.map(recipient => `
                                <span style="display: inline-block; background: #e9ecef; color: #495057; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin: 2px;">${recipient}</span>
                            `).join('') :
                            '<span style="color: #666; font-size: 10px; font-style: italic;">None specified</span>'
                        }
                    </div>
                </div>
                <div>
                    <div style="color: #333; font-weight: 500; margin: 0 0 6px 0; font-size: 11px;">Purposes:</div>
                    <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; min-height: 20px;">
                        ${data.dataSharing.purposes.length > 0 ? 
                            data.dataSharing.purposes.map(purpose => `
                                <span style="display: inline-block; background: #e9ecef; color: #495057; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin: 2px;">${purpose}</span>
                            `).join('') :
                            '<span style="color: #666; font-size: 10px; font-style: italic;">None specified</span>'
                        }
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 16px; padding-top: 12px; border-top: 1px solid #e9ecef;">
                <a href="${privacyPolicyUrl}" target="_blank" style="
                    color: #1976d2; 
                    text-decoration: none; 
                    font-size: 11px; 
                    padding: 6px 12px; 
                    border: 1px solid #1976d2; 
                    border-radius: 4px; 
                    display: inline-block;
                    transition: all 0.2s;
                " onmouseover="this.style.background='#1976d2'; this.style.color='white';" onmouseout="this.style.background='transparent'; this.style.color='#1976d2';">
                    📄 View Full Policy
                </a>
            </div>
        </div>
    `;
}

function formatLabel(key) {
    const labelMap = {
        'personallyIdentifiableInfo': 'Personal Info',
        'healthInfo': 'Health Data',
        'financialInfo': 'Financial Data',
        'authenticationInfo': 'Auth Data',
        'personalCommunications': 'Communications',
        'locationInfo': 'Location Data',
        'webHistory': 'Web History',
        'userActivity': 'User Activity',
        'websiteContent': 'Website Content'
    };
    return labelMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
} 