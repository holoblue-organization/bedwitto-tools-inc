// shopkeeper-gen.js - Main functionality for the Shopkeeper Skin Generator
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const usernameInput = document.getElementById('username-input');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const loadingElement = document.getElementById('loading');
    const skinPreview = document.getElementById('skin-preview');
    const villagerPreview = document.getElementById('villager-preview');
    
    // Configuration
    const config = {
        defaultSkin: 'https://visage.surgeplay.com/bust/128/Steve',
        defaultVillager: 'https://www.minecraft.net/content/dam/games/minecraft/key-art/Villager_Key_Art_600x300.jpg',
        apiBaseUrl: 'https://api.mojang.com/users/profiles/minecraft/',
        skinRenderBaseUrl: 'https://visage.surgeplay.com/full/512/'
    };
    
    // Initialize previews
    skinPreview.src = config.defaultSkin;
    villagerPreview.src = config.defaultVillager;
    
    // Event Listeners
    generateBtn.addEventListener('click', handleGenerateClick);
    downloadBtn.addEventListener('click', handleDownloadClick);
    
    // Main Functions
    async function handleGenerateClick() {
        const username = usernameInput.value.trim();
        if (!username) {
            showError('Please enter a username!');
            return;
        }
        
        showLoading();
        downloadBtn.style.display = 'none';
        
        try {
            // 1. Get UUID from username
            const uuid = await fetchUUID(username);
            
            // 2. Get and display skin
            const skinUrl = `${config.skinRenderBaseUrl}${uuid}?t=${Date.now()}`;
            skinPreview.src = skinUrl;
            
            // 3. Process and display villager texture
            const villagerTexture = await createVillagerTexture(skinUrl);
            villagerPreview.src = villagerTexture;
            
            // 4. Prepare download
            downloadBtn.dataset.uuid = uuid;
            downloadBtn.dataset.username = username;
            downloadBtn.style.display = 'block';
            
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoading();
        }
    }
    
    async function handleDownloadClick() {
        const uuid = downloadBtn.dataset.uuid;
        const username = downloadBtn.dataset.username;
        
        if (!uuid || !username) {
            showError('Please generate a skin first!');
            return;
        }
        
        showLoading('Creating your resource pack...');
        
        try {
            await downloadResourcePack(uuid, username);
        } catch (error) {
            showError('Failed to create resource pack: ' + error.message);
        } finally {
            hideLoading();
        }
    }
    
    // API Functions
    async function fetchUUID(username) {
        const response = await fetch(`${config.apiBaseUrl}${username}`);
        
        if (!response.ok) {
            throw new Error('Player not found! Try a different name.');
        }
        
        const data = await response.json();
        return data.id;
    }
    
    // Texture Processing
    async function createVillagerTexture(skinUrl) {
        return new Promise(async (resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 64;
            canvas.height = 64;
            
            // Load skin image
            const skinImg = await loadImage(skinUrl);
            
            // Create villager texture (simplified version)
            // Front face
            ctx.drawImage(skinImg, 8, 8, 8, 8, 16, 16, 16, 16); // Head
            ctx.drawImage(skinImg, 20, 20, 8, 12, 20, 32, 8, 12); // Nose
            
            // Add villager details
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(16, 16, 16, 8); // Hat brim
            
            // Add outline
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(16, 16, 16, 16); // Head outline
            
            resolve(canvas.toDataURL());
        });
    }
    
    // Resource Pack Generation
    async function downloadResourcePack(uuid, username) {
        return new Promise(async (resolve) => {
            // Create pack metadata
            const packMeta = {
                pack: {
                    pack_format: 8,
                    description: `${username} as a shopkeeper | Made with Bedwitto Tools Inc.`
                }
            };
            
            // Get villager texture
            const villagerTexture = await createVillagerTexture(`${config.skinRenderBaseUrl}${uuid}`);
            
            // Create ZIP structure
            const zip = new JSZip();
            zip.file("pack.mcmeta", JSON.stringify(packMeta, null, 2));
            
            const assets = zip.folder("assets/minecraft/textures/entity/villager");
            
            // Convert data URL to blob
            const villagerBlob = await fetch(villagerTexture).then(res => res.blob());
            assets.file("villager.png", villagerBlob);
            
            // Generate and download ZIP
            const content = await zip.generateAsync({type: "blob"});
            const url = URL.createObjectURL(content);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `BedwittoShopkeeper_${username}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            resolve();
        });
    }
    
    // Helper Functions
    function loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Could not load skin image'));
            img.src = url;
        });
    }
    
    function showLoading(message = 'Working our magic...') {
        loadingElement.style.display = 'block';
        if (message) {
            loadingElement.querySelector('p').textContent = message;
        }
        generateBtn.disabled = true;
    }
    
    function hideLoading() {
        loadingElement.style.display = 'none';
        generateBtn.disabled = false;
    }
    
    function showError(message) {
        hideLoading();
        alert(`Oops! ${message}`);
    }
    
    // Add Easter egg for developer testing
    usernameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            generateBtn.click();
        }
        
        // Easter egg - try username "bedwitto"
        if (usernameInput.value.toLowerCase() === 'bedwitto' && e.key === ' ') {
            usernameInput.value = 'TheRealBedwitto';
            generateBtn.click();
        }
    });
});
