// ===== NEXKITTOOL AUTH SYSTEM v4 =====
// Google Sign-In + Email/Password + Real email verification & password reset

// ========== CONFIG ==========
const GOOGLE_CLIENT_ID = '547151454373-6i20i1a6ustdongksoaq2uc2aca2tnp1.apps.googleusercontent.com'; // 🔴 REPLACE THIS

// ========== AUTH OBJECT ==========
const Auth = {
  SESSION_KEY: 'nkt_session',

  getCurrentUser() {
    try { const s = localStorage.getItem(this.SESSION_KEY); return s ? JSON.parse(s) : null; } catch(e) { return null; }
  },
  setSession(user) {
    try { localStorage.setItem(this.SESSION_KEY, JSON.stringify(user)); } catch(e) {}
  },
  logout() {
    try { localStorage.removeItem(this.SESSION_KEY); } catch(e) {}
  },
  isPro() { const u = this.getCurrentUser(); return u && u.plan === 'pro'; },

  // ---- API helpers ----
  async apiSignup(name, email, password) {
    const r = await fetch('/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    return r.json();
  },
  async apiLogin(email, password) {
    const r = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return r.json();
  },
  async apiGoogle(credential) {
    const r = await fetch('/api/auth/google', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });
    return r.json();
  },
  async apiForgotPassword(email) {
    const r = await fetch('/api/auth/forgot-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return r.json();
  }
};

// PRO_TOOLS defined in tools-data.js

// ========== GOOGLE SIGN-IN CALLBACK ==========
// Called automatically by Google's GSI library after user picks account
async function handleGoogleCredential(response) {
  try {
    setBtnLoading('nkt_googleBtn', true, '⏳ Signing in...');
    const data = await Auth.apiGoogle(response.credential);
    if (data.ok) {
      const user = { ...data.user, avatar: data.user.name.charAt(0).toUpperCase() };
      Auth.setSession(user);
      closeAuthModal();
      updateNavUser();
      showToast('Welcome' + (data.user.name ? ', ' + data.user.name.split(' ')[0] : '') + '! 🎉', 'success');
    } else {
      showAuthError(data.error || 'Google sign-in failed. Please try again.');
      setBtnLoading('nkt_googleBtn', false, '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:18px;height:18px;vertical-align:middle;margin-right:8px">Continue with Google');
    }
  } catch(e) {
    showAuthError('Network error. Please check your connection and try again.');
    setBtnLoading('nkt_googleBtn', false, '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:18px;height:18px;vertical-align:middle;margin-right:8px">Continue with Google');
  }
}

// ========== AUTH MODAL ==========
function openAuthModal(tab) {
  tab = tab || 'login';
  const old = document.getElementById('authOverlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'authOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)';

  overlay.innerHTML = `
  <div style="background:#fff;border-radius:24px;width:100%;max-width:420px;padding:36px;position:relative;box-shadow:0 24px 80px rgba(0,0,0,0.2);max-height:90vh;overflow-y:auto">
    <button onclick="closeAuthModal()" style="position:absolute;top:16px;right:16px;background:#f3f4f6;border:none;width:32px;height:32px;border-radius:50%;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:1.8rem;font-weight:900;background:linear-gradient(135deg,#6c47ff,#ff6b47);-webkit-background-clip:text;-webkit-text-fill-color:transparent">⚡ Nexkittool</div>
      <p style="color:#6b7280;font-size:.88rem;margin-top:4px">Free tools for everyone</p>
    </div>

    <!-- TABS -->
    <div style="display:flex;background:#f3f4f6;border-radius:10px;padding:4px;margin-bottom:20px;gap:4px">
      <button id="nkt_tabLogin" onclick="switchTab('login')" style="flex:1;padding:10px;border-radius:8px;border:none;font-weight:700;font-size:.9rem;cursor:pointer;transition:all .2s;background:#fff;color:#6c47ff;box-shadow:0 2px 8px rgba(0,0,0,0.08)">Log In</button>
      <button id="nkt_tabSignup" onclick="switchTab('signup')" style="flex:1;padding:10px;border-radius:8px;border:none;font-weight:700;font-size:.9rem;cursor:pointer;transition:all .2s;background:transparent;color:#6b7280">Sign Up</button>
    </div>

    <!-- MESSAGES -->
    <div id="nkt_error" style="display:none;background:#fee2e2;color:#dc2626;padding:10px 14px;border-radius:8px;font-size:.85rem;margin-bottom:14px;border:1px solid #fca5a5"></div>
    <div id="nkt_success" style="display:none;background:#d1fae5;color:#059669;padding:10px 14px;border-radius:8px;font-size:.85rem;margin-bottom:14px;border:1px solid #6ee7b7"></div>

    <!-- GOOGLE BUTTON CONTAINER -->
    <div id="nkt_googleBtnContainer" style="width:100%;margin-bottom:16px;display:flex;justify-content:center;box-sizing:border-box"></div>

    <!-- DIVIDER -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
      <div style="flex:1;height:1px;background:#e5e7eb"></div>
      <span style="color:#9ca3af;font-size:.82rem;font-weight:500">or</span>
      <div style="flex:1;height:1px;background:#e5e7eb"></div>
    </div>

    <!-- LOGIN FORM -->
    <form id="nkt_loginForm" onsubmit="doLogin(event)">
      <div style="margin-bottom:14px">
        <label style="display:block;font-size:.85rem;font-weight:600;margin-bottom:6px;color:#374151">Email Address</label>
        <input type="email" id="nkt_loginEmail" placeholder="you@example.com" required autocomplete="email"
          style="width:100%;padding:12px 16px;border:2px solid #e5e7eb;border-radius:10px;font-size:.95rem;outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .2s"
          onfocus="this.style.borderColor='#6c47ff'" onblur="this.style.borderColor='#e5e7eb'">
      </div>
      <div style="margin-bottom:8px">
        <label style="display:block;font-size:.85rem;font-weight:600;margin-bottom:6px;color:#374151">Password</label>
        <input type="password" id="nkt_loginPass" placeholder="Your password" required autocomplete="current-password"
          style="width:100%;padding:12px 16px;border:2px solid #e5e7eb;border-radius:10px;font-size:.95rem;outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .2s"
          onfocus="this.style.borderColor='#6c47ff'" onblur="this.style.borderColor='#e5e7eb'">
      </div>
      <div style="text-align:right;margin-bottom:20px">
        <a onclick="showForgot()" style="color:#6c47ff;font-size:.82rem;font-weight:500;cursor:pointer;text-decoration:none">Forgot password?</a>
      </div>
      <button type="submit" id="nkt_loginBtn" style="width:100%;padding:14px;background:linear-gradient(135deg,#6c47ff,#ff6b47);color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer;transition:opacity .2s;font-family:inherit" onmouseover="this.style.opacity='.9'" onmouseout="this.style.opacity='1'">Log In to Nexkittool →</button>
      <div style="text-align:center;margin-top:18px;font-size:.9rem;color:#6b7280">
        Don't have an account? <a onclick="switchTab('signup')" style="color:#6c47ff;font-weight:700;cursor:pointer">Sign up free</a>
      </div>
    </form>

    <!-- SIGNUP FORM -->
    <form id="nkt_signupForm" style="display:none" onsubmit="doSignup(event)">
      <div style="margin-bottom:14px">
        <label style="display:block;font-size:.85rem;font-weight:600;margin-bottom:6px;color:#374151">Full Name</label>
        <input type="text" id="nkt_signupName" placeholder="Your full name" required autocomplete="name"
          style="width:100%;padding:12px 16px;border:2px solid #e5e7eb;border-radius:10px;font-size:.95rem;outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .2s"
          onfocus="this.style.borderColor='#6c47ff'" onblur="this.style.borderColor='#e5e7eb'">
      </div>
      <div style="margin-bottom:14px">
        <label style="display:block;font-size:.85rem;font-weight:600;margin-bottom:6px;color:#374151">Email Address</label>
        <input type="email" id="nkt_signupEmail" placeholder="you@example.com" required autocomplete="email"
          style="width:100%;padding:12px 16px;border:2px solid #e5e7eb;border-radius:10px;font-size:.95rem;outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .2s"
          onfocus="this.style.borderColor='#6c47ff'" onblur="this.style.borderColor='#e5e7eb'">
      </div>
      <div style="margin-bottom:20px">
        <label style="display:block;font-size:.85rem;font-weight:600;margin-bottom:6px;color:#374151">Password</label>
        <input type="password" id="nkt_signupPass" placeholder="Minimum 6 characters" required autocomplete="new-password"
          style="width:100%;padding:12px 16px;border:2px solid #e5e7eb;border-radius:10px;font-size:.95rem;outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .2s"
          onfocus="this.style.borderColor='#6c47ff'" onblur="this.style.borderColor='#e5e7eb'"
          oninput="checkStr(this.value)">
        <div style="margin-top:6px;height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden">
          <div id="nkt_passBar" style="height:100%;width:0;border-radius:2px;transition:all .3s"></div>
        </div>
        <div id="nkt_passHint" style="font-size:.75rem;color:#9ca3af;margin-top:4px"></div>
      </div>
      <button type="submit" id="nkt_signupBtn" style="width:100%;padding:14px;background:linear-gradient(135deg,#6c47ff,#ff6b47);color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer;font-family:inherit">Create Free Account 🚀</button>
      <p style="font-size:.78rem;color:#9ca3af;text-align:center;margin-top:12px">
        By signing up, you agree to our <a href="pages/terms.html" style="color:#6c47ff">Terms of Service</a> and <a href="pages/privacy.html" style="color:#6c47ff">Privacy Policy</a>
      </p>
      <div style="text-align:center;margin-top:14px;font-size:.9rem;color:#6b7280">
        Already have an account? <a onclick="switchTab('login')" style="color:#6c47ff;font-weight:700;cursor:pointer">Log in</a>
      </div>
    </form>

    <!-- FORGOT PASSWORD FORM -->
    <form id="nkt_forgotForm" style="display:none" onsubmit="doForgot(event)">
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:2.5rem;margin-bottom:8px">🔑</div>
        <h3 style="color:#111;margin-bottom:6px">Forgot Password?</h3>
        <p style="color:#6b7280;font-size:.88rem">Enter your email and we'll send you a reset link.</p>
      </div>
      <div style="margin-bottom:20px">
        <label style="display:block;font-size:.85rem;font-weight:600;margin-bottom:6px;color:#374151">Email Address</label>
        <input type="email" id="nkt_forgotEmail" placeholder="you@example.com" required
          style="width:100%;padding:12px 16px;border:2px solid #e5e7eb;border-radius:10px;font-size:.95rem;outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .2s"
          onfocus="this.style.borderColor='#6c47ff'" onblur="this.style.borderColor='#e5e7eb'">
      </div>
      <button type="submit" id="nkt_forgotBtn" style="width:100%;padding:14px;background:linear-gradient(135deg,#6c47ff,#ff6b47);color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer;font-family:inherit">Send Reset Link 📧</button>
      <div style="text-align:center;margin-top:16px">
        <a onclick="switchTab('login')" style="color:#6c47ff;font-size:.88rem;font-weight:500;cursor:pointer">← Back to Login</a>
      </div>
    </form>
  </div>`;

  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeAuthModal(); });
  switchTab(tab);

  // Initialize Google Sign-In button after modal renders
  setTimeout(() => initGoogleSignIn(), 100);
}

function closeAuthModal() {
  const o = document.getElementById('authOverlay');
  if (o) o.remove();
}

function switchTab(tab) {
  const lf = document.getElementById('nkt_loginForm');
  const sf = document.getElementById('nkt_signupForm');
  const ff = document.getElementById('nkt_forgotForm');
  const gb = document.getElementById('nkt_googleBtnContainer');
  const div = gb ? gb.nextElementSibling : null; // divider
  const tl = document.getElementById('nkt_tabLogin');
  const ts = document.getElementById('nkt_tabSignup');
  if (!lf) return;

  // Hide all forms
  lf.style.display = 'none'; sf.style.display = 'none'; ff.style.display = 'none';

  const showGoogleSection = (tab !== 'forgot');
  if (gb) gb.style.display = showGoogleSection ? 'flex' : 'none';
  if (div) div.style.display = showGoogleSection ? 'flex' : 'none';

  if (tab === 'login') {
    lf.style.display = 'block';
    tl.style.cssText += ';background:#fff;color:#6c47ff;box-shadow:0 2px 8px rgba(0,0,0,0.08)';
    ts.style.cssText += ';background:transparent;color:#6b7280;box-shadow:none';
  } else if (tab === 'signup') {
    sf.style.display = 'block';
    ts.style.cssText += ';background:#fff;color:#6c47ff;box-shadow:0 2px 8px rgba(0,0,0,0.08)';
    tl.style.cssText += ';background:transparent;color:#6b7280;box-shadow:none';
  } else if (tab === 'forgot') {
    ff.style.display = 'block';
  }
  clearAuthMsg();
}

function showForgot() { switchTab('forgot'); }

// ========== GOOGLE SIGN-IN INIT ==========
function initGoogleSignIn() {
  if (typeof google === 'undefined' || !google.accounts) return;
  try {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true
    });
    
    const container = document.getElementById('nkt_googleBtnContainer');
    if (container) {
      google.accounts.id.renderButton(
        container,
        { 
          theme: 'outline', 
          size: 'large', 
          width: 320, 
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left'
        }
      );
    }
  } catch(e) { console.warn('Google Sign-In init failed:', e); }
}

function triggerGoogleSignIn() {}

// ========== HELPERS ==========
function setBtnLoading(id, loading, html) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = html;
}

function showAuthError(msg) {
  const e = document.getElementById('nkt_error'), s = document.getElementById('nkt_success');
  if (e) { e.textContent = msg; e.style.display = 'block'; }
  if (s) s.style.display = 'none';
}
function showAuthSuccess(msg) {
  const e = document.getElementById('nkt_error'), s = document.getElementById('nkt_success');
  if (s) { s.innerHTML = msg; s.style.display = 'block'; }
  if (e) e.style.display = 'none';
}
function clearAuthMsg() {
  const e = document.getElementById('nkt_error'), s = document.getElementById('nkt_success');
  if (e) e.style.display = 'none';
  if (s) s.style.display = 'none';
}

// ========== FORM HANDLERS ==========
async function doLogin(e) {
  e.preventDefault();
  const email = document.getElementById('nkt_loginEmail').value.trim();
  const pass = document.getElementById('nkt_loginPass').value;
  if (!email || !pass) { showAuthError('Please enter your email and password.'); return; }

  setBtnLoading('nkt_loginBtn', true, '⏳ Logging in...');
  try {
    const data = await Auth.apiLogin(email, pass);
    if (data.ok) {
      const user = { ...data.user, avatar: data.user.name.charAt(0).toUpperCase() };
      Auth.setSession(user);
      closeAuthModal();
      updateNavUser();
      showToast('Welcome back, ' + data.user.name.split(' ')[0] + '! 🎉', 'success');
    } else {
      showAuthError(data.error || 'Invalid email or password.');
      setBtnLoading('nkt_loginBtn', false, 'Log In to Nexkittool →');
    }
  } catch(err) {
    showAuthError('Network error. Please try again.');
    setBtnLoading('nkt_loginBtn', false, 'Log In to Nexkittool →');
  }
}

async function doSignup(e) {
  e.preventDefault();
  const name = document.getElementById('nkt_signupName').value.trim();
  const email = document.getElementById('nkt_signupEmail').value.trim();
  const pass = document.getElementById('nkt_signupPass').value;
  if (!name || !email || !pass) { showAuthError('Please fill in all fields.'); return; }
  if (pass.length < 6) { showAuthError('Password must be at least 6 characters.'); return; }

  setBtnLoading('nkt_signupBtn', true, '⏳ Creating account...');
  try {
    const data = await Auth.apiSignup(name, email, pass);
    if (data.ok) {
      const user = { ...data.user, avatar: data.user.name.charAt(0).toUpperCase() };
      Auth.setSession(user);
      closeAuthModal();
      updateNavUser();
      if (data.emailSent) {
        showToast('Account created! 🚀 Check your email to verify your account.', 'success');
      } else {
        showToast('Account created! Welcome to Nexkittool 🚀', 'success');
      }
    } else {
      showAuthError(data.error || 'Signup failed. Please try again.');
      setBtnLoading('nkt_signupBtn', false, 'Create Free Account 🚀');
    }
  } catch(err) {
    showAuthError('Network error. Please try again.');
    setBtnLoading('nkt_signupBtn', false, 'Create Free Account 🚀');
  }
}

async function doForgot(e) {
  e.preventDefault();
  const email = document.getElementById('nkt_forgotEmail').value.trim();
  if (!email) { showAuthError('Please enter your email address.'); return; }

  setBtnLoading('nkt_forgotBtn', true, '⏳ Sending...');
  try {
    const data = await Auth.apiForgotPassword(email);
    showAuthSuccess('✅ If that email is registered, a reset link has been sent.<br><span style="font-size:.82rem;color:#6b7280">Check your inbox (and spam folder).</span>');
    setBtnLoading('nkt_forgotBtn', false, 'Send Reset Link 📧');
  } catch(err) {
    showAuthError('Network error. Please try again.');
    setBtnLoading('nkt_forgotBtn', false, 'Send Reset Link 📧');
  }
}

function checkStr(val) {
  const bar = document.getElementById('nkt_passBar'), hint = document.getElementById('nkt_passHint');
  if (!bar) return;
  let s = 0;
  if (val.length >= 6) s++; if (val.length >= 10) s++;
  if (/[A-Z]/.test(val)) s++; if (/[0-9]/.test(val)) s++; if (/[^A-Za-z0-9]/.test(val)) s++;
  const colors = ['#ef4444','#f97316','#eab308','#22c55e','#16a34a'];
  const labels = ['Very weak','Weak','Fair','Strong','Very strong'];
  bar.style.width = (s*20)+'%'; bar.style.background = colors[s-1]||'#e5e7eb';
  if (hint && val) hint.textContent = labels[s-1]||'';
}

// ========== NAV / SESSION ==========
function doLogout() {
  Auth.logout(); updateNavUser();
  const dd = document.getElementById('userDropdownMenu');
  if (dd) dd.classList.remove('open');
  showToast('You have been logged out successfully.', 'info');
}

function toggleUserDropdown() {
  const menu = document.getElementById('userDropdownMenu');
  if (menu) menu.classList.toggle('open');
}

function updateNavUser() {
  const user = Auth.getCurrentUser();
  const authBtns = document.getElementById('navAuthBtns');
  const userArea = document.getElementById('navUserArea');
  if (!authBtns || !userArea) return;
  if (user) {
    authBtns.style.display = 'none'; userArea.style.display = 'flex';
    const av = document.getElementById('navAvatarText');
    const nm = document.getElementById('navUserName');
    const pl = document.getElementById('navUserPlan');
    if (av) av.textContent = user.avatar || user.name.charAt(0).toUpperCase();
    if (nm) nm.textContent = user.name;
    if (pl) { pl.textContent = user.plan === 'pro' ? '⭐ Pro' : 'Free Plan'; pl.style.color = user.plan === 'pro' ? '#f59e0b' : '#6c47ff'; }
  } else {
    authBtns.style.display = 'flex'; userArea.style.display = 'none';
  }
}

document.addEventListener('click', function(e) {
  const dd = document.getElementById('navUserDropdown');
  const menu = document.getElementById('userDropdownMenu');
  if (dd && menu && !dd.contains(e.target)) menu.classList.remove('open');
});

document.addEventListener('DOMContentLoaded', function() {
  updateNavUser();
  // Load Google GSI script
  if (!document.querySelector('script[src*="accounts.google.com/gsi"]')) {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true;
    s.onload = () => initGoogleSignIn();
    document.head.appendChild(s);
  }
});
