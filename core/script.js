// --- STATE MANAGEMENT ---
// Cek apakah ada data tersimpan di Local Storage? Jika ada, ambil. Jika tidak, buat array kosong.
let blockchain = JSON.parse(localStorage.getItem('sim_blockchain')) || [];
let registeredHashes = JSON.parse(localStorage.getItem('sim_hashes')) || {}; 

let currentFileHash = "";
let userWalletAddress = null;

// --- DOM ELEMENTS ---
const fileInput = document.getElementById('fileInput');
const hashDisplay = document.getElementById('hashResult');
const btnRegister = document.getElementById('btnRegister');
const btnConnect = document.getElementById('btnConnect');
const walletDisplay = document.getElementById('walletAddress');
const statusMsg = document.getElementById('statusMsg');

// --- INITIALIZATION (PENTING!) ---
window.onload = function() {
    if(blockchain.length > 0) {
        // Render ulang semua blok dari memori
        blockchain.forEach(block => {
            addBlockToUI(block);
        });
    }
}

// --- 1. FUNGSI CONNECT METAMASK ---
btnConnect.addEventListener('click', async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userWalletAddress = accounts[0];
            
            // Update UI
            walletDisplay.innerText = userWalletAddress;
            btnConnect.innerText = "Terhubung ✅";
            btnConnect.style.background = "#064e3b";
            fileInput.disabled = false;
        } catch (error) {
            console.error(error);
            alert("Koneksi ditolak.");
        }
    } else {
        alert("MetaMask belum terinstall!");
    }
});

// --- 2. SAAT USER PILIH FILE ---
fileInput.addEventListener('change', async function() {
    if(this.files.length === 0) return;
    const file = this.files[0];
    
    // Preview Gambar
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('previewArea').innerHTML = `<img src="${e.target.result}">`;
    };
    reader.readAsDataURL(file);

    // Hashing
    hashDisplay.style.display = 'block';
    hashDisplay.innerText = "Generating SHA-256 Hash...";
    currentFileHash = await calculateHash(file);
    hashDisplay.innerHTML = `<strong>Digital Fingerprint (SHA-256):</strong><br>${currentFileHash}`;
    btnRegister.style.display = 'block';
    resetStatus();
});

// --- 3. LOGIKA SMART CONTRACT & MINING ---
btnRegister.addEventListener('click', () => {
    if(!userWalletAddress) {
        alert("Harap hubungkan MetaMask terlebih dahulu!");
        return;
    }

    // CEK VALIDASI (Smart Contract Simulation)
    if (registeredHashes[currentFileHash]) {
        showStatus(`GAGAL: Logo ini SUDAH PERNAH didaftarkan oleh: ${registeredHashes[currentFileHash]}!`, false);
        return;
    }

    const btnVerify = document.getElementById('btnVerify');

    // Munculkan tombol verify saat file dipilih
    fileInput.addEventListener('change', async function() {
        btnVerify.style.display = 'block'; 
    });

    // Logika Tombol Verify
    btnVerify.addEventListener('click', () => {
        if (registeredHashes[currentFileHash]) {
            // Jika ditemukan
            alert(`✅ LOGO TERDAFTAR!\n\nPemilik: ${registeredHashes[currentFileHash]}\nStatus: Asli & Terverifikasi.`);
        } else {
            // Jika tidak ditemukan
            alert("❌ LOGO BELUM TERDAFTAR.\n\nGambar ini belum ada di database blockchain kami. Aman untuk didaftarkan.");
        }
    });

    // Buat Blok Baru
    const newBlock = {
        id: blockchain.length + 1,
        timestamp: new Date().toLocaleString(),
        owner: userWalletAddress,
        hash: currentFileHash,
        prevHash: blockchain.length > 0 ? blockchain[blockchain.length - 1].hash : "0000Genesis",
        imageData: document.querySelector('#previewArea img').src
      };

    // Update State
    blockchain.push(newBlock);
    registeredHashes[currentFileHash] = userWalletAddress;

    // --- FITUR BARU: SIMPAN KE STORAGE BROWSER ---
    saveDataToStorage();

    // Update UI
    addBlockToUI(newBlock);
    showStatus("SUKSES: Data tersimpan permanen di Blockchain.", true);
});

// --- HELPER FUNCTIONS ---
function saveDataToStorage() {
    localStorage.setItem('sim_blockchain', JSON.stringify(blockchain));
    localStorage.setItem('sim_hashes', JSON.stringify(registeredHashes));
}

async function calculateHash(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function addBlockToUI(block) {
    const container = document.getElementById('blockchainDisplay');
    const shortOwner = block.owner.substring(0, 6) + "..." + block.owner.substring(38);
    const blockHtml = `
        <div class="block" style="display: flex; align-items: center; gap: 15px;">
            <div style="flex-shrink:0;">
                <img src="${block.imageData}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #475569;">
            </div>
            
            <div style="flex-grow:1;">
                <p style="margin:0;"><strong>BLOCK #${block.id}</strong> <span style="float:right; color:#94a3b8; font-size:0.7em">${block.timestamp}</span></p>
                <p style="margin:2px 0;"><strong>Owner:</strong> <span style="color:#bef264">${shortOwner}</span></p>
                <p style="margin:0; font-size:0.75em; color:#94a3b8;">Hash: ${block.hash.substring(0, 15)}...</p>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('afterbegin', blockHtml);
}
   
    const blockHtml = `
        <div class="block">
            <p><strong>BLOCK #${block.id}</strong> <span style="float:right; color:#94a3b8; font-size:0.7em">${block.timestamp}</span></p>
            <p><strong>Owner:</strong> <span style="color:#bef264">${shortOwner}</span></p>
            <p><strong>Logo Hash:</strong> ${block.hash.substring(0, 20)}...</p>
            <p style="color:#64748b; font-size:0.8em">Prev Hash: ${block.prevHash ? block.prevHash.substring(0, 20)+'...' : '0'}</p>
        </div>
    `;
    
    // Cek apakah blok ini sudah ada di UI (untuk mencegah duplikasi tampilan saat refresh + add baru)
    container.insertAdjacentHTML('afterbegin', blockHtml);


function showStatus(msg, isSuccess) {
    statusMsg.innerText = msg;
    statusMsg.style.display = 'block';
    statusMsg.className = isSuccess ? 'status success' : 'status error';
}

function resetStatus() { statusMsg.style.display = 'none'; }