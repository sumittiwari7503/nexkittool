// ===== NEXKITTOOL - MAIN APP =====

// Toast
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.className = 'toast', 3200);
}

// Render tool cards
function renderGrid(gridId, cat) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const tools = TOOLS.filter(t => t.cat === cat);
  grid.innerHTML = tools.map(t => {
    const isPro = PRO_TOOLS.includes(t.id);
    return `<div class="tool-card ${isPro ? 'pro-locked' : ''}" onclick="openTool('${t.id}')" role="button" tabindex="0" aria-label="${t.name}">
      ${isPro ? '<span class="tool-pro-badge">⭐ PRO</span>' : ''}
      <span class="tool-icon">${t.icon}</span>
      <div class="tool-name">${t.name}</div>
      <div class="tool-desc">${t.desc}</div>
    </div>`;
  }).join('');
  grid.querySelectorAll('.tool-card').forEach(c => {
    c.addEventListener('keydown', e => { if (e.key === 'Enter') c.click(); });
  });
}

function renderAllGrids() {
  renderGrid('aiGrid', 'ai');
  renderGrid('imageGrid', 'image');
  renderGrid('pdfGrid', 'pdf');
  renderGrid('utilityGrid', 'utility');
  renderGrid('colorGrid', 'color');
}

// Search
function initSearch() {
  const input = document.getElementById('heroSearch');
  const clear = document.getElementById('searchClear');
  const sugg = document.getElementById('searchSuggestions');
  const resSection = document.getElementById('searchResultsSection');
  const resGrid = document.getElementById('searchResultsGrid');
  const resTitle = document.getElementById('searchResultsTitle');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    clear.style.display = q ? 'block' : 'none';
    if (!q) {
      sugg.classList.remove('active');
      resSection.style.display = 'none';
      return;
    }
    const matches = TOOLS.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.desc.toLowerCase().includes(q) ||
      t.keywords.some(k => k.includes(q))
    );
    if (matches.length) {
      sugg.innerHTML = matches.slice(0, 6).map(t =>
        `<div class="suggestion-item" onclick="openTool('${t.id}')">
          <span>${t.icon}</span>
          <div><strong>${t.name}</strong><br><small style="color:#6b7280">${t.desc}</small></div>
        </div>`
      ).join('');
      sugg.classList.add('active');
      resTitle.textContent = `Results for "${input.value}"`;
      resGrid.innerHTML = matches.map(t => {
        const isPro = PRO_TOOLS.includes(t.id);
        return `<div class="tool-card" onclick="openTool('${t.id}')">
          ${isPro ? '<span class="tool-pro-badge">⭐ PRO</span>' : ''}
          <span class="tool-icon">${t.icon}</span>
          <div class="tool-name">${t.name}</div>
          <div class="tool-desc">${t.desc}</div>
        </div>`;
      }).join('');
      resSection.style.display = 'block';
    } else {
      sugg.innerHTML = '<div class="suggestion-item"><span>😕</span> No tools found</div>';
      sugg.classList.add('active');
      resGrid.innerHTML = '<div class="no-results"><div class="icon">🔍</div><p>No tools found. Try "pdf", "image", "qr" etc.</p></div>';
      resSection.style.display = 'block';
    }
  });

  clear.addEventListener('click', () => {
    input.value = ''; clear.style.display = 'none';
    sugg.classList.remove('active'); resSection.style.display = 'none';
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !sugg.contains(e.target)) sugg.classList.remove('active');
  });
}

// Open tool modal
function openTool(id) {
  const tool = TOOLS.find(t => t.id === id);
  if (!tool) return;
  const isPro = PRO_TOOLS.includes(id);
  const isProUser = Auth.isPro();
  const modal = document.getElementById('modal');
  const overlay = document.getElementById('modalOverlay');
  document.getElementById('modalTitle').textContent = tool.icon + ' ' + tool.name;
  document.getElementById('modalSub').textContent = tool.desc;
  if (isPro && !isProUser) {
    document.getElementById('modalBody').innerHTML = `
      <div class="pro-lock">
        <div class="pro-lock-icon">⭐</div>
        <h3>Pro Feature</h3>
        <p>${tool.name} is available for Pro users only. Upgrade for unlimited access, no ads, and priority processing.</p>
        <a href="pages/pricing.html" class="pro-cta-btn" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6c47ff,#ff6b47);color:#fff;border-radius:50px;font-weight:800">Upgrade to Pro — $4.99/mo</a>
        <br><br>
        <button onclick="openAuthModal('signup')" style="background:none;border:none;color:#6c47ff;font-weight:600;cursor:pointer;font-size:.95rem">Or create a free account first →</button>
      </div>`;
  } else {
    document.getElementById('modalBody').innerHTML = getToolUI(tool);
    initToolLogic(tool.id);
  }
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeTool() {
  document.getElementById('modalOverlay').style.display = 'none';
  document.body.style.overflow = '';
}

// Tool UIs
function getToolUI(tool) {
  const textTools = { essay:'Write a detailed essay about:',grammar:'Paste text to fix grammar:',rewriter:'Paste text to rewrite:',summarizer:'Paste text to summarize:',translator:'Enter text to translate:',hashtag:'Enter topic for hashtags:',paraphrase:'Paste text to paraphrase:',plagiarism:'Paste text to check:',humanizer:'Paste AI-generated text to humanize:' };
  if (textTools[tool.id]) {
    const isTranslator = tool.id === 'translator';
    return `
      ${isTranslator ? `<div class="form-group"><label>Target Language</label>
        <select id="langSelect" style="width:100%;padding:10px;border:2px solid #e5e7eb;border-radius:8px;font-size:.95rem;outline:none">
          <option value="Urdu">Urdu اردو</option><option value="Hindi">Hindi हिंदी</option>
          <option value="French">French</option><option value="Spanish">Spanish</option>
          <option value="Arabic">Arabic</option><option value="Chinese">Chinese</option>
          <option value="German">German</option><option value="Japanese">Japanese</option>
          <option value="Russian">Russian</option><option value="Portuguese">Portuguese</option>
        </select></div>` : ''}
      <div class="form-group">
        <label>${textTools[tool.id]}</label>
        <textarea id="toolInput" rows="5" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:10px;font-size:.95rem;resize:vertical;outline:none;font-family:inherit" placeholder="Type or paste here..."></textarea>
      </div>
      <button onclick="runAI('${tool.id}')" class="btn-auth" style="width:100%">✨ Generate</button>
      <div id="aiOutput" style="margin-top:20px;display:none">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <strong>Result:</strong>
          <button onclick="copyOutput()" style="background:var(--primary-light);color:var(--primary);border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:600;font-size:.85rem">📋 Copy</button>
        </div>
        <div id="aiResult" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;min-height:80px;line-height:1.7;white-space:pre-wrap;font-size:.92rem"></div>
      </div>`;
  }
  // IMAGE TOOLS
  if (['bgremove','resize','compress','watermark','grayscale','flip','crop','convert'].includes(tool.id)) {
    return `
      <div style="border:2px dashed #e5e7eb;border-radius:12px;padding:32px;text-align:center;cursor:pointer;transition:all .2s" id="dropZone" onclick="document.getElementById('imageFile').click()" ondragover="event.preventDefault();this.style.borderColor='#6c47ff'" ondragleave="this.style.borderColor='#e5e7eb'" ondrop="handleDrop(event,'imageFile')">
        <div style="font-size:2.5rem;margin-bottom:12px">🖼️</div>
        <p style="font-weight:600">Drop image here or <span style="color:#6c47ff">click to browse</span></p>
        <p style="font-size:.82rem;color:#6b7280;margin-top:6px">Supports JPG, PNG, WEBP, GIF • Max 10MB</p>
        <input type="file" id="imageFile" accept="image/*" style="display:none" onchange="previewImage(this)">
      </div>
      <div id="imagePreview" style="display:none;margin-top:16px;text-align:center">
        <img id="previewImg" style="max-height:200px;border-radius:8px;border:1px solid #e5e7eb">
        ${getImageOptions(tool.id)}
        <button onclick="processImage('${tool.id}')" class="btn-auth" style="width:100%;margin-top:16px">⚡ Process Image</button>
        <div id="imageOutput" style="display:none;margin-top:16px;text-align:center">
          <p style="font-weight:600;margin-bottom:10px;color:#059669">✅ Done!</p>
          <img id="resultImg" style="max-height:200px;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:16px">
          <br><button id="downloadBtn" class="pro-cta-btn" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#6c47ff,#ff6b47);color:#fff;border-radius:50px;font-weight:700;border:none;cursor:pointer">⬇️ Download</button>
        </div>
      </div>`;
  }
  // PDF TOOLS
  if (['img2pdf','pdf2img','merge','split','compress-pdf','pdf-watermark','word2pdf','pdf2word'].includes(tool.id)) {
    const accept = ['merge','split','compress-pdf','pdf-watermark','pdf2img','pdf2word'].includes(tool.id) ? '.pdf' : (tool.id === 'img2pdf' ? 'image/*' : '.doc,.docx');
    return `
      <div style="border:2px dashed #e5e7eb;border-radius:12px;padding:32px;text-align:center;cursor:pointer" id="dropZone" onclick="document.getElementById('pdfFile').click()">
        <div style="font-size:2.5rem;margin-bottom:12px">📄</div>
        <p style="font-weight:600">Drop file here or <span style="color:#6c47ff">click to browse</span></p>
        <p style="font-size:.82rem;color:#6b7280;margin-top:6px">Max 25MB for free • 100MB for Pro</p>
        <input type="file" id="pdfFile" accept="${accept}" style="display:none" multiple onchange="pdfFileSelected(this)">
      </div>
      <div id="pdfInfo" style="display:none;margin-top:16px">
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px" id="pdfFileInfo"></div>
        <button onclick="processPDF('${tool.id}')" class="btn-auth" style="width:100%;margin-top:16px">⚡ Process File</button>
        <div id="pdfOutput" style="display:none;text-align:center;margin-top:16px;padding:20px;background:#d1fae5;border-radius:10px">
          <p style="font-weight:700;color:#059669;margin-bottom:12px">✅ Processing complete!</p>
          <button id="pdfDownload" class="pro-cta-btn" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#6c47ff,#ff6b47);color:#fff;border-radius:50px;font-weight:700;border:none;cursor:pointer">⬇️ Download Result</button>
        </div>
      </div>`;
  }
  // UTILITY TOOLS
  if (tool.id === 'qrcode') return `
    <div class="form-group"><label>Enter URL or text:</label>
      <input type="text" id="qrInput" class="form-group input" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:10px;font-size:.95rem;outline:none" placeholder="https://nexkittool.com">
    </div>
    <div class="form-group"><label>Size:</label>
      <select id="qrSize" style="width:100%;padding:10px;border:2px solid #e5e7eb;border-radius:8px">
        <option value="200">200x200</option><option value="300" selected>300x300</option><option value="400">400x400</option>
      </select>
    </div>
    <button onclick="genQR()" class="btn-auth" style="width:100%">📱 Generate QR Code</button>
    <div id="qrOutput" style="display:none;text-align:center;margin-top:20px">
      <img id="qrImg" style="border:1px solid #e5e7eb;border-radius:8px;max-width:300px">
      <br><a id="qrDownload" class="pro-cta-btn" style="display:inline-block;margin-top:12px;padding:10px 24px;background:linear-gradient(135deg,#6c47ff,#ff6b47);color:#fff;border-radius:50px;font-weight:700" download="qrcode.png">⬇️ Download QR</a>
    </div>`;
  if (tool.id === 'wordcount') return `
    <textarea id="wcInput" rows="8" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:10px;font-size:.95rem;resize:vertical;outline:none" placeholder="Paste your text here..." oninput="countWords()"></textarea>
    <div id="wcStats" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:16px">
      <div style="background:#f9fafb;border-radius:10px;padding:14px;text-align:center"><div id="wc" style="font-size:1.6rem;font-weight:900;color:#6c47ff">0</div><div style="font-size:.8rem;color:#6b7280">Words</div></div>
      <div style="background:#f9fafb;border-radius:10px;padding:14px;text-align:center"><div id="cc" style="font-size:1.6rem;font-weight:900;color:#6c47ff">0</div><div style="font-size:.8rem;color:#6b7280">Chars</div></div>
      <div style="background:#f9fafb;border-radius:10px;padding:14px;text-align:center"><div id="sc" style="font-size:1.6rem;font-weight:900;color:#6c47ff">0</div><div style="font-size:.8rem;color:#6b7280">Sentences</div></div>
      <div style="background:#f9fafb;border-radius:10px;padding:14px;text-align:center"><div id="pc" style="font-size:1.6rem;font-weight:900;color:#6c47ff">0</div><div style="font-size:.8rem;color:#6b7280">Paragraphs</div></div>
    </div>`;
  if (tool.id === 'password') return `
    <div class="form-group"><label>Password Length: <strong id="lenVal">16</strong></label>
      <input type="range" min="8" max="64" value="16" oninput="document.getElementById('lenVal').textContent=this.value;genPass()" style="width:100%">
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="useUpper" checked onchange="genPass()"> Uppercase (A-Z)</label>
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="useLower" checked onchange="genPass()"> Lowercase (a-z)</label>
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="useNum" checked onchange="genPass()"> Numbers (0-9)</label>
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="useSym" checked onchange="genPass()"> Symbols (!@#$)</label>
    </div>
    <div style="background:#f9fafb;border:2px solid #e5e7eb;border-radius:10px;padding:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px">
      <code id="passOutput" style="font-size:1rem;word-break:break-all;flex:1">Click Generate</code>
      <button onclick="copyPass()" style="background:var(--primary-light);color:var(--primary);border:none;padding:8px 14px;border-radius:6px;cursor:pointer;font-weight:600;font-size:.85rem;white-space:nowrap">📋 Copy</button>
    </div>
    <button onclick="genPass()" class="btn-auth" style="width:100%">🔐 Generate Password</button>`;
  if (tool.id === 'json') return `
    <div class="form-group"><label>Paste JSON:</label>
      <textarea id="jsonInput" rows="7" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:10px;font-size:.9rem;font-family:monospace;resize:vertical;outline:none" placeholder='{"name":"nexkittool","version":1}'></textarea>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:16px">
      <button onclick="formatJSON()" class="btn-auth" style="flex:1">✨ Format</button>
      <button onclick="minifyJSON()" style="flex:1;padding:12px;background:#f9fafb;border:2px solid #e5e7eb;border-radius:10px;font-weight:600;cursor:pointer">🗜️ Minify</button>
    </div>
    <div id="jsonOutput" style="display:none">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><strong>Result:</strong>
        <button onclick="copyJSON()" style="background:var(--primary-light);color:var(--primary);border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:600;font-size:.85rem">📋 Copy</button>
      </div>
      <pre id="jsonResult" style="background:#1a1a2e;color:#e5e7eb;padding:16px;border-radius:10px;overflow-x:auto;font-size:.85rem;max-height:240px;overflow-y:auto"></pre>
    </div>`;
  if (tool.id === 'colorpicker') return `
    <div style="text-align:center">
      <input type="color" id="colorInput" value="#6c47ff" oninput="updateColor()" style="width:80px;height:80px;border:none;border-radius:50%;cursor:pointer;overflow:hidden">
      <div id="colorSwatch" style="width:100%;height:80px;border-radius:12px;margin-top:16px;background:#6c47ff;transition:background .2s"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:16px">
        <div style="background:#f9fafb;border-radius:8px;padding:12px;text-align:center"><div style="font-size:.75rem;color:#6b7280;margin-bottom:4px">HEX</div><code id="hexVal" style="font-weight:700">#6c47ff</code></div>
        <div style="background:#f9fafb;border-radius:8px;padding:12px;text-align:center"><div style="font-size:.75rem;color:#6b7280;margin-bottom:4px">RGB</div><code id="rgbVal" style="font-weight:700">108,71,255</code></div>
        <div style="background:#f9fafb;border-radius:8px;padding:12px;text-align:center"><div style="font-size:.75rem;color:#6b7280;margin-bottom:4px">HSL</div><code id="hslVal" style="font-weight:700">253°,100%,64%</code></div>
      </div>
      <button onclick="copyHex()" class="btn-auth" style="width:100%;margin-top:16px">📋 Copy HEX Code</button>
    </div>`;
  if (tool.id === 'case') return `
    <div class="form-group"><label>Enter text:</label>
      <textarea id="caseInput" rows="4" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:10px;font-size:.95rem;resize:vertical;outline:none" placeholder="Type your text here..."></textarea>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px">
      <button onclick="convertCase('upper')" style="padding:10px;background:#f9fafb;border:2px solid #e5e7eb;border-radius:8px;cursor:pointer;font-weight:600;font-size:.85rem">UPPER</button>
      <button onclick="convertCase('lower')" style="padding:10px;background:#f9fafb;border:2px solid #e5e7eb;border-radius:8px;cursor:pointer;font-weight:600;font-size:.85rem">lower</button>
      <button onclick="convertCase('title')" style="padding:10px;background:#f9fafb;border:2px solid #e5e7eb;border-radius:8px;cursor:pointer;font-weight:600;font-size:.85rem">Title</button>
      <button onclick="convertCase('sentence')" style="padding:10px;background:#f9fafb;border:2px solid #e5e7eb;border-radius:8px;cursor:pointer;font-weight:600;font-size:.85rem">Sentence</button>
      <button onclick="convertCase('camel')" style="padding:10px;background:#f9fafb;border:2px solid #e5e7eb;border-radius:8px;cursor:pointer;font-weight:600;font-size:.85rem">camelCase</button>
      <button onclick="convertCase('snake')" style="padding:10px;background:#f9fafb;border:2px solid #e5e7eb;border-radius:8px;cursor:pointer;font-weight:600;font-size:.85rem">snake_case</button>
    </div>
    <div id="caseOutput" style="display:none">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><strong>Result:</strong>
        <button onclick="copyCase()" style="background:var(--primary-light);color:var(--primary);border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:600;font-size:.85rem">📋 Copy</button>
      </div>
      <div id="caseResult" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;word-break:break-all"></div>
    </div>`;
  if (tool.id === 'base64') return `
    <div class="form-group"><label>Enter text or Base64 string:</label>
      <textarea id="base64Input" rows="5" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:10px;font-size:.95rem;resize:vertical;outline:none" placeholder="Type here..."></textarea>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:16px">
      <button onclick="runBase64('encode')" class="btn-auth" style="flex:1">🔗 Encode</button>
      <button onclick="runBase64('decode')" style="flex:1;padding:12px;background:#f9fafb;border:2px solid #e5e7eb;border-radius:10px;font-weight:600;cursor:pointer">🔓 Decode</button>
    </div>
    <div id="base64Output" style="display:none">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><strong>Result:</strong>
        <button onclick="copyBase64()" style="background:var(--primary-light);color:var(--primary);border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:600;font-size:.85rem">📋 Copy</button>
      </div>
      <textarea id="base64Result" rows="5" readonly style="width:100%;padding:12px;border:1px solid #e5e7eb;border-radius:10px;font-size:.95rem;background:#f9fafb;resize:vertical;outline:none"></textarea>
    </div>`;

  if (tool.id === 'lorem') return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div class="form-group"><label>Type:</label>
        <select id="loremType" style="width:100%;padding:10px;border:2px solid #e5e7eb;border-radius:8px">
          <option value="paragraphs">Paragraphs</option>
          <option value="sentences">Sentences</option>
          <option value="words">Words</option>
        </select>
      </div>
      <div class="form-group"><label>Count:</label>
        <input type="number" id="loremCount" min="1" max="50" value="3" style="width:100%;padding:10px;border:2px solid #e5e7eb;border-radius:8px">
      </div>
    </div>
    <button onclick="runLorem()" class="btn-auth" style="width:100%;margin-bottom:16px">📃 Generate Placeholder Text</button>
    <div id="loremOutput" style="display:none">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><strong>Result:</strong>
        <button onclick="copyLorem()" style="background:var(--primary-light);color:var(--primary);border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:600;font-size:.85rem">📋 Copy</button>
      </div>
      <textarea id="loremResult" rows="8" readonly style="width:100%;padding:12px;border:1px solid #e5e7eb;border-radius:10px;font-size:.95rem;background:#f9fafb;resize:vertical;outline:none"></textarea>
    </div>`;

  if (tool.id === 'urlencode') return `
    <div class="form-group"><label>Enter text or encoded URL:</label>
      <textarea id="urlInput" rows="5" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:10px;font-size:.95rem;resize:vertical;outline:none" placeholder="Type here..."></textarea>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:16px">
      <button onclick="runUrl('encode')" class="btn-auth" style="flex:1">🔗 Encode</button>
      <button onclick="runUrl('decode')" style="flex:1;padding:12px;background:#f9fafb;border:2px solid #e5e7eb;border-radius:10px;font-weight:600;cursor:pointer">🔓 Decode</button>
    </div>
    <div id="urlOutput" style="display:none">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><strong>Result:</strong>
        <button onclick="copyUrl()" style="background:var(--primary-light);color:var(--primary);border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:600;font-size:.85rem">📋 Copy</button>
      </div>
      <textarea id="urlResult" rows="5" readonly style="width:100%;padding:12px;border:1px solid #e5e7eb;border-radius:10px;font-size:.95rem;background:#f9fafb;resize:vertical;outline:none"></textarea>
    </div>`;

  if (tool.id === 'gradient') return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div class="form-group"><label>Color 1:</label>
        <input type="color" id="gradColor1" value="#6c47ff" oninput="updateGradient()" style="width:100%;height:40px;border:none;border-radius:8px;cursor:pointer">
      </div>
      <div class="form-group"><label>Color 2:</label>
        <input type="color" id="gradColor2" value="#ff6b47" oninput="updateGradient()" style="width:100%;height:40px;border:none;border-radius:8px;cursor:pointer">
      </div>
    </div>
    <div class="form-group"><label>Direction:</label>
      <select id="gradDir" onchange="updateGradient()" style="width:100%;padding:10px;border:2px solid #e5e7eb;border-radius:8px">
        <option value="to right">To Right (→)</option>
        <option value="to bottom">To Bottom (↓)</option>
        <option value="to top right">To Top Right (↗)</option>
        <option value="to bottom right">To Bottom Right (↘)</option>
        <option value="radial">Radial Circle (⚪)</option>
      </select>
    </div>
    <div id="gradPreview" style="width:100%;height:150px;border-radius:12px;margin-bottom:16px;background:linear-gradient(to right, #6c47ff, #ff6b47)"></div>
    <div style="background:#f9fafb;border:2px solid #e5e7eb;border-radius:10px;padding:14px;display:flex;align-items:center;justify-content:space-between;gap:12px">
      <code id="gradCSS" style="font-size:.85rem;word-break:break-all;flex:1">background: linear-gradient(to right, #6c47ff, #ff6b47);</code>
      <button onclick="copyGradient()" style="background:var(--primary-light);color:var(--primary);border:none;padding:8px 14px;border-radius:6px;cursor:pointer;font-weight:600;font-size:.85rem;white-space:nowrap">📋 Copy CSS</button>
    </div>`;

  if (tool.id === 'contrast') return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div class="form-group"><label>Background Color:</label>
        <input type="color" id="contrastBg" value="#ffffff" oninput="updateContrast()" style="width:100%;height:40px;border:none;border-radius:8px;cursor:pointer">
      </div>
      <div class="form-group"><label>Text Color:</label>
        <input type="color" id="contrastText" value="#1a1a2e" oninput="updateContrast()" style="width:100%;height:40px;border:none;border-radius:8px;cursor:pointer">
      </div>
    </div>
    <div id="contrastPreview" style="width:100%;padding:24px;border-radius:12px;margin-bottom:16px;background:#ffffff;color:#1a1a2e;text-align:center;border:1px solid #e5e7eb;font-size:1.1rem;font-weight:500">
      Preview Text: How readable is this text color against the background color?
    </div>
    <div style="background:#f9fafb;border-radius:12px;padding:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <strong>Contrast Ratio:</strong>
        <span id="contrastRatio" style="font-size:1.4rem;font-weight:900;color:#6c47ff">21.00:1</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="background:#fff;padding:10px;border-radius:8px;border:1px solid #e5e7eb;text-align:center">
          <div style="font-size:.85rem;font-weight:600">WCAG AA</div>
          <div id="wcagAA" style="font-size:1.1rem;font-weight:800;color:#059669;margin-top:4px">PASS ✅</div>
        </div>
        <div style="background:#fff;padding:10px;border-radius:8px;border:1px solid #e5e7eb;text-align:center">
          <div style="font-size:.85rem;font-weight:600">WCAG AAA</div>
          <div id="wcagAAA" style="font-size:1.1rem;font-weight:800;color:#059669;margin-top:4px">PASS ✅</div>
        </div>
      </div>
    </div>`;

  if (tool.id === 'palette') return `
    <div class="form-group"><label>Describe theme / mood (e.g. "sunset vibes", "neon cyberpunk", "nature"):</label>
      <input type="text" id="paletteInput" class="form-group input" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:10px;font-size:.95rem;outline:none" placeholder="e.g. pastel aesthetic">
    </div>
    <button onclick="runPalette()" class="btn-auth" style="width:100%;margin-bottom:16px">🎨 Generate Color Palette</button>
    <div id="paletteOutput" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <strong>Generated Palette:</strong>
        <span style="font-size:.8rem;color:#6b7280">Click swatch to copy hex code</span>
      </div>
      <div id="paletteSwatches" style="display:flex;height:80px;border-radius:12px;overflow:hidden;margin-bottom:16px"></div>
      <div id="paletteHexContainer" style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;text-align:center"></div>
    </div>`;

  return `<div style="text-align:center;padding:40px"><div style="font-size:3rem;margin-bottom:12px">${tool.icon}</div><p style="color:#6b7280">This tool is being upgraded. Coming soon!</p></div>`;
}

function getImageOptions(id) {
  if (id === 'resize') return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px">
    <input type="number" id="resizeW" placeholder="Width (px)" style="padding:10px;border:2px solid #e5e7eb;border-radius:8px;outline:none;font-size:.95rem">
    <input type="number" id="resizeH" placeholder="Height (px)" style="padding:10px;border:2px solid #e5e7eb;border-radius:8px;outline:none;font-size:.95rem">
  </div>`;
  if (id === 'watermark') return `<div style="margin-top:14px"><input type="text" id="wmText" placeholder="Watermark text e.g. Nexkittool" style="width:100%;padding:10px;border:2px solid #e5e7eb;border-radius:8px;outline:none;font-size:.95rem"></div>`;
  if (id === 'convert') return `<select id="convertFmt" style="width:100%;margin-top:14px;padding:10px;border:2px solid #e5e7eb;border-radius:8px;font-size:.95rem"><option value="jpeg">Convert to JPG</option><option value="png">Convert to PNG</option><option value="webp">Convert to WEBP</option></select>`;
  return '';
}

function initToolLogic(id) {
  if (id === 'gradient') updateGradient();
  if (id === 'contrast') updateContrast();
  if (id === 'palette') {
    const defaultPalettes = [
      ["#FF6B6B", "#4ECDC4", "#45B6FE", "#F9D423", "#FF8E53"],
      ["#1A1A2E", "#16213E", "#0F3460", "#E94560", "#F1C40F"],
      ["#2E0854", "#6B011F", "#A00000", "#D36E70", "#EBB1B3"],
      ["#222831", "#393E46", "#00ADB5", "#EEEEEE", "#FFD369"]
    ];
    const pal = defaultPalettes[Math.floor(Math.random() * defaultPalettes.length)];
    renderPalette(pal);
  }
}

async function runAI(toolId) {
  const input = document.getElementById('toolInput')?.value?.trim();
  if (!input) { showToast('Please enter some text first!', 'error'); return; }
  const btn = document.querySelector('#modalBody .btn-auth');
  const out = document.getElementById('aiOutput');
  const result = document.getElementById('aiResult');
  btn.textContent = '⏳ Generating...'; btn.disabled = true;
  out.style.display = 'none';
  const prompts = {
    essay: `Write a well-structured, detailed essay about: "${input}". Include introduction, body paragraphs, and conclusion.`,
    grammar: `Fix all grammar, spelling, and punctuation errors in this text. Return only the corrected text:\n\n"${input}"`,
    rewriter: `Rewrite the following text in a clear, engaging way while preserving its meaning:\n\n"${input}"`,
    summarizer: `Summarize the following text into key points. Be concise and clear:\n\n"${input}"`,
    translator: `Translate the following text to ${document.getElementById('langSelect')?.value || 'Urdu'}:\n\n"${input}"`,
    hashtag: `Generate 20 relevant, trending hashtags for this topic: "${input}". Format as a list of hashtags.`,
    paraphrase: `Paraphrase the following text in a natural, human way:\n\n"${input}"`,
    plagiarism: `Analyze if this text appears to be plagiarized or AI-generated. Rate originality 0-100% and explain:\n\n"${input}"`,
    humanizer: `Rewrite the following AI-generated text so it reads naturally and conversationally like a human wrote it — vary sentence length and remove robotic or repetitive phrasing while keeping the original meaning intact:\n\n"${input}"`
  };
  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompts[toolId] || input, toolId })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    result.textContent = data.result || data.text || data.output || JSON.stringify(data);
    out.style.display = 'block';
  } catch (err) {
    showToast('AI Error: ' + err.message, 'error');
  }
  btn.textContent = '✨ Generate'; btn.disabled = false;
}

function copyOutput() {
  const txt = document.getElementById('aiResult')?.textContent;
  navigator.clipboard.writeText(txt).then(() => showToast('Copied!', 'success'));
}

function previewImage(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) { showToast('File too large! Max 10MB for free.', 'error'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('previewImg').src = e.target.result;
    document.getElementById('imagePreview').style.display = 'block';
    document.getElementById('imageOutput').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function handleDrop(e, inputId) {
  e.preventDefault();
  document.getElementById(inputId).files = e.dataTransfer.files;
  document.getElementById(inputId).dispatchEvent(new Event('change'));
}

async function processImage(toolId) {
  const file = document.getElementById('imageFile')?.files[0];
  if (!file) { showToast('Please select an image!', 'error'); return; }
  const btn = document.querySelectorAll('#imagePreview button')[0];
  btn.textContent = '⏳ Processing...'; btn.disabled = true;
  const formData = new FormData();
  formData.append('image', file);
  if (toolId === 'resize') {
    formData.append('width', document.getElementById('resizeW')?.value || 800);
    formData.append('height', document.getElementById('resizeH')?.value || 600);
  }
  if (toolId === 'watermark') formData.append('text', document.getElementById('wmText')?.value || 'Nexkittool');
  if (toolId === 'convert') formData.append('format', document.getElementById('convertFmt')?.value || 'jpeg');
  const endpointMap = { bgremove:'remove-bg', resize:'resize', compress:'compress', watermark:'watermark', grayscale:'grayscale', flip:'flip', crop:'crop', convert:'convert' };
  try {
    const res = await fetch('/api/image/' + (endpointMap[toolId] || toolId), { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Processing failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    document.getElementById('resultImg').src = url;
    document.getElementById('downloadBtn').onclick = () => {
      const a = document.createElement('a'); a.href = url; a.download = 'nexkittool-' + toolId + '.' + (blob.type.split('/')[1] || 'jpg'); a.click();
    };
    document.getElementById('imageOutput').style.display = 'block';
    showToast('Done! ✅', 'success');
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
  btn.textContent = '⚡ Process Image'; btn.disabled = false;
}

function pdfFileSelected(input) {
  const files = Array.from(input.files);
  if (!files.length) return;
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const maxSize = Auth.isPro() ? 100 : 25;
  if (totalSize > maxSize * 1024 * 1024) { showToast(`File too large! Max ${maxSize}MB.`, 'error'); return; }
  document.getElementById('pdfFileInfo').innerHTML = files.map(f => `📄 <strong>${f.name}</strong> — ${(f.size/1024/1024).toFixed(2)} MB`).join('<br>');
  document.getElementById('pdfInfo').style.display = 'block';
  document.getElementById('pdfOutput').style.display = 'none';
}

async function processPDF(toolId) {
  const input = document.getElementById('pdfFile');
  if (!input?.files?.length) { showToast('Please select a file!', 'error'); return; }
  const files = Array.from(input.files);

  if (toolId === 'pdf2img') {
    return processPDFToImageClient(files[0]);
  }
  if (toolId === 'word2pdf') {
    return processWordToPDFClient(files[0]);
  }
  if (toolId === 'pdf2word') {
    return processPDFToWordClient(files[0]);
  }

  const btn = document.querySelectorAll('#pdfInfo button')[0];
  btn.textContent = '⏳ Processing...'; btn.disabled = true;
  const formData = new FormData();
  files.forEach(f => formData.append('file', f));
  const endpointMap = { img2pdf:'image-to-pdf', pdf2img:'pdf-to-image', merge:'merge', split:'split', 'compress-pdf':'compress', 'pdf-watermark':'watermark', word2pdf:'word-to-pdf', pdf2word:'pdf-to-word' };
  try {
    const res = await fetch('/api/pdf/' + (endpointMap[toolId] || toolId), { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Processing failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const ext = blob.type.includes('pdf') ? 'pdf' : (blob.type.split('/')[1] || 'zip');
    document.getElementById('pdfDownload').onclick = () => {
      const a = document.createElement('a'); a.href = url; a.download = 'nexkittool-' + toolId + '.' + ext; a.click();
    };
    document.getElementById('pdfOutput').style.display = 'block';
    showToast('Done! ✅', 'success');
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
  btn.textContent = '⚡ Process File'; btn.disabled = false;
}

// QR CODE
function genQR() {
  const val = document.getElementById('qrInput')?.value?.trim();
  if (!val) { showToast('Enter a URL or text!', 'error'); return; }
  const size = document.getElementById('qrSize')?.value || 300;
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(val)}&bgcolor=ffffff&color=1a1a2e`;
  document.getElementById('qrImg').src = url;
  document.getElementById('qrDownload').href = url;
  document.getElementById('qrOutput').style.display = 'block';
}

// Word Counter
function countWords() {
  const txt = document.getElementById('wcInput')?.value || '';
  document.getElementById('wc').textContent = txt.trim() ? txt.trim().split(/\s+/).length : 0;
  document.getElementById('cc').textContent = txt.length;
  document.getElementById('sc').textContent = txt.split(/[.!?]+/).filter(s => s.trim()).length;
  document.getElementById('pc').textContent = txt.split(/\n\s*\n/).filter(p => p.trim()).length || (txt.trim() ? 1 : 0);
}

// Password Generator
function genPass() {
  const len = parseInt(document.querySelector('input[type=range]')?.value || 16);
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', lower = 'abcdefghijklmnopqrstuvwxyz', num = '0123456789', sym = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  let chars = '';
  if (document.getElementById('useUpper')?.checked) chars += upper;
  if (document.getElementById('useLower')?.checked) chars += lower;
  if (document.getElementById('useNum')?.checked) chars += num;
  if (document.getElementById('useSym')?.checked) chars += sym;
  if (!chars) { showToast('Select at least one character type!', 'error'); return; }
  let pass = '';
  for (let i = 0; i < len; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  document.getElementById('passOutput').textContent = pass;
}
function copyPass() {
  navigator.clipboard.writeText(document.getElementById('passOutput')?.textContent || '').then(() => showToast('Password copied!', 'success'));
}

// JSON
function formatJSON() {
  try {
    const parsed = JSON.parse(document.getElementById('jsonInput').value);
    document.getElementById('jsonResult').textContent = JSON.stringify(parsed, null, 2);
    document.getElementById('jsonOutput').style.display = 'block';
    showToast('JSON formatted! ✅', 'success');
  } catch (e) { showToast('Invalid JSON: ' + e.message, 'error'); }
}
function minifyJSON() {
  try {
    const parsed = JSON.parse(document.getElementById('jsonInput').value);
    document.getElementById('jsonResult').textContent = JSON.stringify(parsed);
    document.getElementById('jsonOutput').style.display = 'block';
  } catch (e) { showToast('Invalid JSON!', 'error'); }
}
function copyJSON() { navigator.clipboard.writeText(document.getElementById('jsonResult')?.textContent || '').then(() => showToast('Copied!', 'success')); }

// Color Picker
function updateColor() {
  const hex = document.getElementById('colorInput')?.value;
  document.getElementById('colorSwatch').style.background = hex;
  document.getElementById('hexVal').textContent = hex;
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  document.getElementById('rgbVal').textContent = `${r},${g},${b}`;
  const rn=r/255,gn=g/255,bn=b/255,mx=Math.max(rn,gn,bn),mn=Math.min(rn,gn,bn);
  let h,s,l=(mx+mn)/2;
  if(mx===mn){h=s=0}else{const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=(mx===rn?(gn-bn)/d+(gn<bn?6:0):mx===gn?(bn-rn)/d+2:(rn-gn)/d+4)/6;}
  document.getElementById('hslVal').textContent = `${Math.round(h*360)}°,${Math.round(s*100)}%,${Math.round(l*100)}%`;
}
function copyHex() { navigator.clipboard.writeText(document.getElementById('hexVal')?.textContent || '').then(() => showToast('HEX copied!', 'success')); }

// Case Converter
function convertCase(type) {
  const txt = document.getElementById('caseInput')?.value || '';
  let result = txt;
  if (type === 'upper') result = txt.toUpperCase();
  else if (type === 'lower') result = txt.toLowerCase();
  else if (type === 'title') result = txt.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  else if (type === 'sentence') result = txt.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
  else if (type === 'camel') result = txt.replace(/(?:^\w|[A-Z]|\b\w)/g,(w,i)=>i===0?w.toLowerCase():w.toUpperCase()).replace(/\s+/g,'');
  else if (type === 'snake') result = txt.toLowerCase().replace(/\s+/g,'_');
  document.getElementById('caseResult').textContent = result;
  document.getElementById('caseOutput').style.display = 'block';
}
// ===== CLIENT-SIDE CONVERTERS FOR PDF & WORD =====

async function processPDFToImageClient(file) {
  const btn = document.querySelectorAll('#pdfInfo button')[0];
  btn.textContent = '⏳ Rendering PDF pages...'; btn.disabled = true;
  try {
    const arrayBuffer = await file.arrayBuffer();
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;
    const zip = new JSZip();

    for (let i = 1; i <= pageCount; i++) {
      btn.textContent = `⏳ Rendering Page ${i}/${pageCount}...`;
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport: viewport }).promise;
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];
      zip.file(`page-${i}.png`, base64Data, { base64: true });
    }

    btn.textContent = '⏳ Generating ZIP file...';
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    document.getElementById('pdfDownload').onclick = () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexkittool-pdf-pages.zip`;
      a.click();
    };
    document.getElementById('pdfOutput').style.display = 'block';
    showToast('Converted and Zipped successfully! ✅', 'success');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
    console.error(err);
  }
  btn.textContent = '⚡ Process File'; btn.disabled = false;
}

async function processWordToPDFClient(file) {
  const btn = document.querySelectorAll('#pdfInfo button')[0];
  btn.textContent = '⏳ Reading Word Doc...'; btn.disabled = true;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    const text = result.value || '';
    if (!text.trim()) throw new Error('Word document contains no readable text!');

    btn.textContent = '⏳ Generating PDF...';
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(text, 180);
    let y = 15;
    const pageHeight = doc.internal.pageSize.height;

    splitText.forEach(line => {
      if (y + 10 > pageHeight) {
        doc.addPage();
        y = 15;
      }
      doc.text(line, 15, y);
      y += 8;
    });

    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    document.getElementById('pdfDownload').onclick = () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexkittool-converted-word.pdf`;
      a.click();
    };
    document.getElementById('pdfOutput').style.display = 'block';
    showToast('Converted to PDF successfully! ✅', 'success');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
    console.error(err);
  }
  btn.textContent = '⚡ Process File'; btn.disabled = false;
}

async function processPDFToWordClient(file) {
  const btn = document.querySelectorAll('#pdfInfo button')[0];
  btn.textContent = '⏳ Extracting text from PDF...'; btn.disabled = true;
  try {
    const arrayBuffer = await file.arrayBuffer();
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;
    let extractedText = '';

    for (let i = 1; i <= pageCount; i++) {
      btn.textContent = `⏳ Extracting page ${i}/${pageCount}...`;
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      extractedText += `\n--- Page ${i} ---\n\n` + pageText + `\n`;
    }

    if (!extractedText.trim()) throw new Error('No text content found in the PDF!');

    btn.textContent = '⏳ Generating Word Document...';
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Converted Document</title><style>body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }</style></head>
      <body>
        <h2>Converted from PDF - Nexkittool</h2>
        <pre style="white-space: pre-wrap; font-family: inherit;">${extractedText}</pre>
      </body>
      </html>
    `;
    const docBlob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(docBlob);
    document.getElementById('pdfDownload').onclick = () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexkittool-converted-pdf.doc`;
      a.click();
    };
    document.getElementById('pdfOutput').style.display = 'block';
    showToast('Converted to Word successfully! ✅', 'success');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
    console.error(err);
  }
  btn.textContent = '⚡ Process File'; btn.disabled = false;
}

// ===== UTILITY & COLOR TOOL ACTIONS =====

// Base64
function runBase64(mode) {
  const input = document.getElementById('base64Input')?.value;
  if (!input) { showToast('Please enter some text first!', 'error'); return; }
  const resultArea = document.getElementById('base64Result');
  try {
    if (mode === 'encode') {
      resultArea.value = btoa(unescape(encodeURIComponent(input)));
      showToast('Encoded to Base64! ✅', 'success');
    } else {
      resultArea.value = decodeURIComponent(escape(atob(input)));
      showToast('Decoded Base64 successfully! ✅', 'success');
    }
    document.getElementById('base64Output').style.display = 'block';
  } catch (e) {
    showToast('Operation failed: Invalid input / base64', 'error');
  }
}
function copyBase64() {
  const text = document.getElementById('base64Result')?.value;
  navigator.clipboard.writeText(text || '').then(() => showToast('Copied to clipboard!', 'success'));
}

// Lorem Ipsum
function runLorem() {
  const type = document.getElementById('loremType')?.value || 'paragraphs';
  const count = parseInt(document.getElementById('loremCount')?.value) || 3;
  const resultArea = document.getElementById('loremResult');

  const wordsList = ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "ut", "enim", "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "dolor", "in", "reprehenderit", "in", "voluptate", "velit", "esse", "cillum", "dolore", "eu", "fugiat", "nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident", "sunt", "in", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum"];
  const sentencesList = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "Morbi pretium ligula sollicitudin id elementum velit pulvinar.",
    "Class aptent taciti sociosqu ad litora torquent per conubia nostra.",
    "Phasellus sodales massa ut scelerisque elementum."
  ];

  let result = '';
  if (type === 'words') {
    let list = [];
    for (let i = 0; i < count; i++) {
      list.push(wordsList[Math.floor(Math.random() * wordsList.length)]);
    }
    result = list.join(' ');
  } else if (type === 'sentences') {
    let list = [];
    for (let i = 0; i < count; i++) {
      list.push(sentencesList[i % sentencesList.length]);
    }
    result = list.join(' ');
  } else {
    let paragraphs = [];
    for (let p = 0; p < count; p++) {
      let list = [];
      const sentenceCount = 4 + Math.floor(Math.random() * 4);
      for (let i = 0; i < sentenceCount; i++) {
        list.push(sentencesList[Math.floor(Math.random() * sentencesList.length)]);
      }
      paragraphs.push(list.join(' '));
    }
    result = paragraphs.join('\n\n');
  }

  resultArea.value = result;
  document.getElementById('loremOutput').style.display = 'block';
  showToast('Lorem Ipsum generated! ✅', 'success');
}
function copyLorem() {
  const text = document.getElementById('loremResult')?.value;
  navigator.clipboard.writeText(text || '').then(() => showToast('Copied to clipboard!', 'success'));
}

// URL Encode/Decode
function runUrl(mode) {
  const input = document.getElementById('urlInput')?.value;
  if (!input) { showToast('Please enter text first!', 'error'); return; }
  const resultArea = document.getElementById('urlResult');
  try {
    if (mode === 'encode') {
      resultArea.value = encodeURIComponent(input);
      showToast('URL Encoded! ✅', 'success');
    } else {
      resultArea.value = decodeURIComponent(input);
      showToast('URL Decoded! ✅', 'success');
    }
    document.getElementById('urlOutput').style.display = 'block';
  } catch (e) {
    showToast('Invalid URL encoding', 'error');
  }
}
function copyUrl() {
  const text = document.getElementById('urlResult')?.value;
  navigator.clipboard.writeText(text || '').then(() => showToast('Copied to clipboard!', 'success'));
}

// Gradient Maker
function updateGradient() {
  const c1 = document.getElementById('gradColor1')?.value || '#6c47ff';
  const c2 = document.getElementById('gradColor2')?.value || '#ff6b47';
  const dir = document.getElementById('gradDir')?.value || 'to right';
  
  const css = dir === 'radial' 
    ? `background: radial-gradient(circle, ${c1}, ${c2});`
    : `background: linear-gradient(${dir}, ${c1}, ${c2});`;
    
  const preview = document.getElementById('gradPreview');
  if (preview) preview.style.background = dir === 'radial' 
    ? `radial-gradient(circle, ${c1}, ${c2})`
    : `linear-gradient(${dir}, ${c1}, ${c2})`;
    
  const cssText = document.getElementById('gradCSS');
  if (cssText) cssText.textContent = css;
}
function copyGradient() {
  const text = document.getElementById('gradCSS')?.textContent;
  navigator.clipboard.writeText(text || '').then(() => showToast('CSS Gradient copied!', 'success'));
}

// Contrast Checker
function updateContrast() {
  const bg = document.getElementById('contrastBg')?.value || '#ffffff';
  const text = document.getElementById('contrastText')?.value || '#1a1a2e';
  
  const preview = document.getElementById('contrastPreview');
  if (preview) {
    preview.style.background = bg;
    preview.style.color = text;
  }
  
  const getLuminance = (hex) => {
    const r = parseInt(hex.slice(1,3), 16) / 255;
    const g = parseInt(hex.slice(3,5), 16) / 255;
    const b = parseInt(hex.slice(5,7), 16) / 255;
    const a = [r, g, b].map(v => {
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };
  
  const l1 = getLuminance(bg);
  const l2 = getLuminance(text);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  document.getElementById('contrastRatio').textContent = `${ratio.toFixed(2)}:1`;
  
  const aaPass = ratio >= 4.5;
  const aaaPass = ratio >= 7.0;
  
  const aaEl = document.getElementById('wcagAA');
  const aaaEl = document.getElementById('wcagAAA');
  
  if (aaEl) {
    aaEl.textContent = aaPass ? 'PASS ✅' : 'FAIL ❌';
    aaEl.style.color = aaPass ? '#059669' : '#dc2626';
  }
  if (aaaEl) {
    aaaEl.textContent = aaaPass ? 'PASS ✅' : 'FAIL ❌';
    aaaEl.style.color = aaaPass ? '#059669' : '#dc2626';
  }
}

// AI Palette Generator
async function runPalette() {
  const input = document.getElementById('paletteInput')?.value?.trim();
  if (!input) { showToast('Please describe a theme/mood!', 'error'); return; }
  const btn = document.querySelector('#modalBody button');
  const originalText = btn.textContent;
  btn.textContent = '⏳ Generating Palette...'; btn.disabled = true;
  
  try {
    const prompt = `Generate a color palette of 5 harmonious colors matching the theme/mood: "${input}". Return ONLY a JSON array of 5 HEX strings, for example: ["#1a1a2d", "#ff5656", "#00b5b5", "#eeeeee", "#ffd369"]. Return no markdown, no explanation, just raw JSON.`;
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, toolId: 'palette' })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    
    let colors;
    try {
      const cleaned = data.result.replace(/```json/g, '').replace(/```/g, '').trim();
      colors = JSON.parse(cleaned);
    } catch (e) {
      const matches = data.result.match(/#[0-9a-fA-F]{6}/g);
      if (matches && matches.length >= 5) {
        colors = matches.slice(0, 5);
      } else {
        throw new Error('Invalid AI response structure');
      }
    }
    
    renderPalette(colors);
    showToast('Palette generated! ✅', 'success');
  } catch (err) {
    showToast('AI Error. Generating fallback palette...', 'warning');
    const fallbacks = [
      ["#FF7E5F", "#FEB47B", "#765285", "#351C4D", "#F47A60"],
      ["#00F2FE", "#4FACFE", "#20E2D7", "#F9F9F9", "#111111"],
      ["#E1EEC3", "#F0C27B", "#593C1F", "#F89B29", "#FF5252"],
      ["#2C3E50", "#FD79A8", "#FFEAA7", "#00B894", "#0984E3"]
    ];
    const pal = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    renderPalette(pal);
  }
  btn.textContent = originalText; btn.disabled = false;
}
function renderPalette(colors) {
  const container = document.getElementById('paletteSwatches');
  const hexContainer = document.getElementById('paletteHexContainer');
  if (!container || !hexContainer) return;
  
  container.innerHTML = colors.map(c => `
    <div style="background:${c};flex:1;cursor:pointer;transition:transform 0.15s;height:100%" onclick="copyHexCode('${c}')" onmouseover="this.style.transform='scaleY(1.08)'" onmouseout="this.style.transform='scaleY(1.0)'"></div>
  `).join('');
  
  hexContainer.innerHTML = colors.map(c => `
    <code style="font-size:0.75rem;cursor:pointer;font-weight:700" onclick="copyHexCode('${c}')">${c}</code>
  `).join('');
  
  document.getElementById('paletteOutput').style.display = 'block';
}
function copyHexCode(hex) {
  navigator.clipboard.writeText(hex).then(() => showToast(`HEX code ${hex} copied!`, 'success'));
}

// Header scroll effect
window.addEventListener('scroll', () => {
  document.getElementById('header')?.classList.toggle('scrolled', window.scrollY > 20);
});

// Mobile nav
document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('mobileNav')?.classList.toggle('open');
});

// Modal close
document.getElementById('modalClose')?.addEventListener('click', closeTool);
document.getElementById('modalOverlay')?.addEventListener('click', e => {
  if (e.target.id === 'modalOverlay') closeTool();
});

// INIT
document.addEventListener('DOMContentLoaded', () => {
  renderAllGrids();
  initSearch();
  updateNavUser();
  // generate initial password
  setTimeout(genPass, 100);
});
