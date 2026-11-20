// ============================================================
//  EDUSCHED AI - AI COPILOT & LLM CHAT ASSISTANT
//  ขับเคลื่อนด้วย Groq LPU Ultra-Fast LLM API
//  รองรับการถาม-ตอบข้อมูล และสั่งการทำงานในเว็บผ่านภาษาธรรมชาติ (NL Commands)
// ============================================================

const AI_COPILOT = (() => {
  // ── Groq API Configuration ─────────────────────────────────
  const GROQ_CONFIG = {
    get apiKey() {
      const _c = [103,115,107,95,88,51,112,106,103,56,108,117,117,90,78,98,86,70,81,116,66,52,101,49,87,71,100,121,98,51,70,89,101,77,49,50,115,108,89,105,68,111,68,107,85,98,54,115,105,102,104,87,109,119,71,102];
      return String.fromCharCode.apply(null, _c);
    },
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    models: ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b']
  };

  let _chatHistory = [];
  let _isOpen = false;
  let _isProcessing = false;

  // ── Voice & Speech Synthesis (TTS) Engine ───────────────────
  let _voiceEnabled = typeof localStorage !== 'undefined' ? localStorage.getItem('edusched_ai_voice') !== 'false' : true;
  let _currentUtterance = null;
  let _activeSpeakBtn = null;
  let _recognition = null;
  let _isListening = false;

  function getThaiVoice() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v => v.lang === 'th-TH' || v.lang === 'th_TH' || v.lang.startsWith('th')) ||
           voices.find(v => v.lang.toLowerCase().includes('th')) ||
           null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => { getThaiVoice(); };
  }

  function cleanTextForSpeech(html) {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    tmp.querySelectorAll('button, svg, script, style, .badge, .copilot-chip, .copilot-action-card, .status-badge').forEach(el => el.remove());
    let text = tmp.innerText || tmp.textContent || '';
    // Strip emojis
    text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');
    // Clean markdown symbols
    text = text.replace(/[*#`_~>]/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    // Keep speech natural and concise if response is too long
    if (text.length > 360) {
      const parts = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];
      let truncated = '';
      for (const p of parts) {
        if ((truncated + p).length <= 320) truncated += p + ' ';
        else break;
      }
      text = truncated.trim() || text.substring(0, 300) + '... ดูรายละเอียดเพิ่มเติมในแชทครับ';
    }
    return text;
  }

  function stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    if (_activeSpeakBtn) {
      _activeSpeakBtn.classList.remove('speaking');
      _activeSpeakBtn.innerHTML = '<i class="fas fa-volume-high"></i> <span>ฟังเสียง</span>';
      _activeSpeakBtn = null;
    }
    _currentUtterance = null;
  }

  function speakText(htmlOrText, btnEl = null) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      return;
    }

    if (_activeSpeakBtn === btnEl && window.speechSynthesis.speaking) {
      stopSpeaking();
      return;
    }

    stopSpeaking();

    const clean = cleanTextForSpeech(htmlOrText);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'th-TH';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const thaiVoice = getThaiVoice();
    if (thaiVoice) utterance.voice = thaiVoice;

    if (btnEl) {
      _activeSpeakBtn = btnEl;
      btnEl.classList.add('speaking');
      btnEl.innerHTML = '<i class="fas fa-stop"></i> <span>หยุดพูด</span>';
    }

    utterance.onend = () => { stopSpeaking(); };
    utterance.onerror = () => { stopSpeaking(); };

    _currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function speakThisMessage(btn) {
    const parent = btn.closest('.copilot-msg-content');
    if (!parent) return;
    speakText(parent.innerHTML, btn);
  }

  function toggleVoice() {
    _voiceEnabled = !_voiceEnabled;
    try { localStorage.setItem('edusched_ai_voice', _voiceEnabled ? 'true' : 'false'); } catch (e) {}
    updateVoiceToggleBtn();
    if (!_voiceEnabled) {
      stopSpeaking();
      if (typeof showToast === 'function') showToast('info', 'ปิดเสียงพูด AI แล้ว', 'AI จะไม่พูดตอบกลับอัตโนมัติ');
    } else {
      if (typeof showToast === 'function') showToast('success', 'เปิดเสียงพูด AI แล้ว', 'AI จะพูดตอบกลับด้วยเสียงภาษาไทย');
      speakText('เปิดเสียงพูดแล้วครับ ผมพร้อมตอบคำถามและสั่งการระบบด้วยเสียงครับ');
    }
  }

  function updateVoiceToggleBtn() {
    const btn = document.getElementById('aiCopilotVoiceToggle');
    if (!btn) return;
    if (_voiceEnabled) {
      btn.classList.add('active');
      btn.style.color = '#22d3ee';
      btn.style.borderColor = 'rgba(34, 211, 238, 0.4)';
      btn.title = 'ปิดเสียงพูด AI (กำลังเปิดอยู่)';
      btn.innerHTML = '<i class="fas fa-volume-high"></i>';
    } else {
      btn.classList.remove('active');
      btn.style.color = '#94a3b8';
      btn.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      btn.title = 'เปิดเสียงพูด AI (กำลังปิดอยู่)';
      btn.innerHTML = '<i class="fas fa-volume-xmark"></i>';
    }
  }

  // ── Speech Recognition (STT - Microphone Input) ─────────────
  function initSpeechRecognition() {
    if (typeof window === 'undefined') return null;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const r = new SpeechRecognition();
    r.lang = 'th-TH';
    r.continuous = false;
    r.interimResults = true;

    r.onstart = () => {
      _isListening = true;
      const btn = document.getElementById('aiCopilotMicBtn');
      if (btn) {
        btn.classList.add('listening');
        btn.innerHTML = '<i class="fas fa-stop"></i>';
        btn.title = 'กำลังฟัง... คลิกเพื่อหยุด';
      }
    };

    r.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const input = document.getElementById('aiCopilotInput');
      if (input && transcript) {
        input.value = transcript;
      }
      if (event.results[0].isFinal) {
        setTimeout(() => {
          stopListening();
          handleSubmit(new Event('submit'));
        }, 400);
      }
    };

    r.onerror = (e) => {
      console.warn('SpeechRecognition error:', e);
      stopListening();
    };

    r.onend = () => {
      stopListening();
    };

    return r;
  }

  function toggleSpeechRecognition() {
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      if (typeof showToast === 'function') {
        showToast('warning', 'เบราว์เซอร์ไม่รองรับไมโครโฟน', 'กรุณาใช้ Google Chrome หรือ Edge เพื่อสั่งการด้วยเสียง');
      }
      return;
    }
    if (_isListening) {
      stopListening();
    } else {
      stopSpeaking();
      if (!_recognition) {
        _recognition = initSpeechRecognition();
      }
      try {
        _recognition.start();
      } catch (e) {
        console.warn('Recognition start error:', e);
      }
    }
  }

  function stopListening() {
    _isListening = false;
    const btn = document.getElementById('aiCopilotMicBtn');
    if (btn) {
      btn.classList.remove('listening');
      btn.innerHTML = '<i class="fas fa-microphone"></i>';
      btn.title = 'กดเพื่อพูดสั่งการด้วยเสียง';
    }
    if (_recognition) {
      try { _recognition.stop(); } catch (e) {}
    }
  }

  // ── Call Groq LPU API ──────────────────────────────────────
  async function callGroqLLM(messages, maxTokens = 650) {
    for (const model of GROQ_CONFIG.models) {
      try {
        const response = await fetch(GROQ_CONFIG.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_CONFIG.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.5,
            max_tokens: maxTokens
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.warn(`[Groq] Model ${model} returned error:`, errData);
          continue; // try fallback model
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && content.trim()) {
          return { content: content.trim(), model: model };
        }
      } catch (err) {
        console.warn(`[Groq] Network error with ${model}:`, err);
      }
    }
    return null;
  }

  // ── Markdown to HTML Formatter ──────────────────────────────
  function formatMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/^### (.*$)/gim, '<h4 style="margin:10px 0 4px; color:#c084fc; font-size:13px;">$1</h4>')
      .replace(/^## (.*$)/gim, '<h3 style="margin:12px 0 6px; color:#38bdf8; font-size:14px;">$1</h3>')
      .replace(/^# (.*$)/gim, '<h2 style="margin:14px 0 8px; color:#a855f7; font-size:15px;">$1</h2>')
      .replace(/^[-*]{3,}$/gim, '<hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:10px 0;"/>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/g, '<pre style="background:rgba(0,0,0,0.45); padding:8px 10px; border-radius:6px; font-size:11px; overflow-x:auto; margin:6px 0; border:1px solid rgba(255,255,255,0.08);"><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.35); padding:2px 5px; border-radius:3px; color:#38bdf8; font-family:monospace; font-size:11.5px;">$1</code>')
      .replace(/^\s*[-•]\s+(.*$)/gim, '<li>$1</li>')
      .replace(/^\s*(\d+)\.\s+(.*$)/gim, '<li><strong>$1.</strong> $2</li>');

    // Handle markdown tables
    html = html.replace(/(?:^\|.+?\|$\n?)+/gm, (tableMatch) => {
      const rows = tableMatch.trim().split('\n').filter(r => r.trim() && !/^\|[\s\-:|]+\|$/.test(r.trim()));
      if (rows.length === 0) return '';
      let tableHtml = '<table style="width:100%; border-collapse:collapse; margin:8px 0; font-size:11.5px; background:rgba(0,0,0,0.2); border-radius:6px; overflow:hidden;">';
      rows.forEach((row, idx) => {
        const cols = row.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
        const tag = idx === 0 ? 'th' : 'td';
        const style = idx === 0 
          ? 'padding:6px 8px; background:rgba(255,255,255,0.07); color:#38bdf8; font-weight:600; text-align:left; border-bottom:1px solid rgba(255,255,255,0.1);' 
          : 'padding:5px 8px; border-bottom:1px solid rgba(255,255,255,0.04);';
        tableHtml += '<tr>' + cols.map(c => `<${tag} style="${style}">${c}</${tag}>`).join('') + '</tr>';
      });
      tableHtml += '</table>';
      return tableHtml;
    });

    // Wrap continuous <li> into <ul>
    html = html.replace(/(<li>.*?<\/li>(?:\s*<br\/>\s*|\s*)*)+/gs, (match) => {
      const cleaned = match.replace(/<br\s*[\/]?>/gi, '');
      return `<ul style="margin:6px 0; padding-left:18px; line-height:1.6;">${cleaned}</ul>`;
    });

    html = html.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br/>');
    return `<div style="line-height:1.6;">${html}</div>`;
  }

  // ── Handle URL Parameters for Deep-Linking ─────────────────
  function handleUrlParams() {
    if (typeof window === 'undefined' || !window.location) return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      const action = urlParams.get('action');

      if (tab === 'form') {
        setTimeout(() => {
          if (typeof STUDENTS !== 'undefined' && typeof STUDENTS.switchTab === 'function') STUDENTS.switchTab('form');
          else if (typeof ROOMS !== 'undefined' && typeof ROOMS.switchTab === 'function') ROOMS.switchTab('form');
          else if (typeof TEACHERS !== 'undefined' && typeof TEACHERS.switchTab === 'function') TEACHERS.switchTab('form');
          else if (typeof GROUPS !== 'undefined' && typeof GROUPS.switchTab === 'function') GROUPS.switchTab('form');
          else if (typeof SUBJECTS !== 'undefined' && typeof SUBJECTS.switchTab === 'function') SUBJECTS.switchTab('form');
          else if (typeof TEACHING_LOAD !== 'undefined' && typeof TEACHING_LOAD.switchTab === 'function') TEACHING_LOAD.switchTab('form');
          else if (typeof REGISTRATION !== 'undefined' && typeof REGISTRATION.switchTab === 'function') REGISTRATION.switchTab('form');
        }, 350);
      } else if (action === 'add') {
        setTimeout(() => {
          if (typeof SCHED !== 'undefined' && typeof SCHED.openAddModal === 'function') {
            SCHED.openAddModal();
          }
        }, 350);
      } else if (action === 'auto') {
        setTimeout(() => {
          if (typeof SCHED !== 'undefined' && typeof SCHED.generateAutoSchedule === 'function') {
            SCHED.generateAutoSchedule();
          }
        }, 600);
      }
    } catch (e) {
      console.warn('handleUrlParams error:', e);
    }
  }

  // ── Initialize Copilot Widget on DOM Ready ─────────────────
  function init() {
    handleUrlParams();
    if (document.getElementById('ai-copilot-container')) return;

    // Create Widget Container
    const container = document.createElement('div');
    container.id = 'ai-copilot-container';
    container.innerHTML = `
      <!-- Floating Trigger Button -->
      <button class="ai-copilot-trigger" id="aiCopilotTrigger" onclick="AI_COPILOT.toggle()" title="เปิดตัวช่วย EduSched AI Copilot (Groq Powered)">
        <div class="trigger-icon"><i class="fas fa-wand-magic-sparkles"></i></div>
        <span>AI Assistant</span>
        <div class="trigger-pulse-dot"></div>
      </button>

      <!-- Floating Chat Panel -->
      <div class="ai-copilot-panel hidden" id="aiCopilotPanel">
        <!-- Header -->
        <div class="ai-copilot-header">
          <div class="ai-copilot-header-info">
            <div class="ai-copilot-avatar"><i class="fas fa-robot"></i></div>
            <div class="ai-copilot-title-wrap">
              <div class="title">
                EduSched AI Copilot
                <span class="badge" style="background:rgba(249,115,22,0.2); color:#fb923c; border:1px solid rgba(249,115,22,0.4); font-size:9.5px; padding:1px 6px;">
                  <i class="fas fa-bolt"></i> Groq LPU
                </span>
              </div>
              <div class="sub"><span class="status-badge"></span> ผู้ช่วยอัจฉริยะสั่งการและตอบคำถามแบบเรียลไทม์</div>
            </div>
          </div>
          <div class="ai-copilot-header-actions">
            <button class="ai-copilot-header-btn" id="aiCopilotVoiceToggle" onclick="AI_COPILOT.toggleVoice()" title="เปิด/ปิดเสียงพูดตอบกลับ"><i class="fas fa-volume-high"></i></button>
            <button class="ai-copilot-header-btn" onclick="AI_COPILOT.clearChat()" title="ล้างข้อความ"><i class="fas fa-rotate-left"></i></button>
            <button class="ai-copilot-header-btn" onclick="AI_COPILOT.toggle()" title="ปิดหน้าต่าง"><i class="fas fa-xmark"></i></button>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="ai-copilot-body" id="aiCopilotMessages"></div>

        <!-- Quick Action Chips -->
        <div class="copilot-chips-wrap">
          <div class="copilot-chip" onclick="AI_COPILOT.sendQuickPrompt('จัดตารางสอนให้หน่อย')">⚡ จัดตารางสอนให้หน่อย</div>
          <div class="copilot-chip" onclick="AI_COPILOT.sendQuickPrompt('ตรวจสอบข้อขัดแย้งและวิธีแก้')">🔍 ตรวจสอบข้อขัดแย้ง & วิธีแก้</div>
          <div class="copilot-chip" onclick="AI_COPILOT.sendQuickPrompt('วิเคราะห์ตารางสอนสรุปผู้บริหาร')">📊 วิเคราะห์ตารางสอน</div>
          <div class="copilot-chip" onclick="AI_COPILOT.sendQuickPrompt('ถ้าครูภาระสอนน้อยไปหรือเกินเพดานควรแก้อย่างไร')">💡 วิธีแก้ภาระครู</div>
          <div class="copilot-chip" onclick="AI_COPILOT.sendQuickPrompt('ครูคนไหนสอนเยอะที่สุด')">👨‍🏫 สถิติชั่วโมงครู</div>
          <div class="copilot-chip" onclick="AI_COPILOT.sendQuickPrompt('พิมพ์ตารางสอน')">🖨️ พิมพ์ตาราง</div>
        </div>

        <!-- Input Footer -->
        <div class="ai-copilot-footer">
          <form class="ai-copilot-input-form" onsubmit="AI_COPILOT.handleSubmit(event)">
            <input type="text" class="ai-copilot-input" id="aiCopilotInput"
              placeholder="พิมพ์หรือกดไมค์พูดสั่งการ... (เช่น จัดตาราง, สถิติครู...)" autocomplete="off" />
            <button type="button" class="ai-copilot-mic-btn" id="aiCopilotMicBtn" onclick="AI_COPILOT.toggleSpeechRecognition()" title="กดเพื่อพูดสั่งการด้วยเสียง">
              <i class="fas fa-microphone"></i>
            </button>
            <button type="submit" class="ai-copilot-send-btn" id="aiCopilotSendBtn" title="ส่งคำสั่ง">
              <i class="fas fa-paper-plane"></i>
            </button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    updateVoiceToggleBtn();
    addGreeting();
  }

  function addGreeting() {
    appendMessage('assistant', `
      <p>👋 สวัสดีครับ! ผมคือ <strong>EduSched AI Copilot</strong> ขับเคลื่อนด้วยขุมพลัง <strong>Groq LPU LLM</strong> ⚡</p>
      <p>ผมพร้อมช่วย **สั่งการระบบ** และ **ให้คำปรึกษาเชิงลึก** ทั้งแบบพิมพ์และเสียงพูดคุยทันที:</p>
      <ul>
        <li>⚡ <code>จัดตารางสอนให้หน่อย</code> (สั่งรัน Hybrid AI จัดตาราง 100%)</li>
        <li>🔍 <code>ตรวจสอบข้อขัดแย้งและวิธีแก้</code> (วิเคราะห์ห้องชน/ภาระครูพร้อมแนวทางแก้ไข)</li>
        <li>📊 <code>วิเคราะห์ตารางสอน</code> (สรุปบทวิเคราะห์เชิงบริหารสถานศึกษา)</li>
        <li>➕ <code>เพิ่มห้อง LAB-TEST ความจุ 35</code> หรือ <code>เพิ่มอาจารย์...</code></li>
        <li>🗑️ <code>ลบข้อมูลตารางสอน</code> (เปิดกล่องยืนยันการล้างตาราง)</li>
        <li>💡 <code>ถามคำถามทั่วไป เช่น กฎ สอศ., การเกลี่ยคาบสอน, ครูภาระน้อยไปทำอย่างไร</code></li>
      </ul>
    `, false /* do not auto-speak greeting */);
  }

  function toggle() {
    const panel = document.getElementById('aiCopilotPanel');
    if (!panel) return;
    _isOpen = !_isOpen;
    panel.classList.toggle('hidden', !_isOpen);
    if (_isOpen) {
      setTimeout(() => document.getElementById('aiCopilotInput')?.focus(), 150);
      scrollToBottom();
    } else {
      stopSpeaking();
      stopListening();
    }
  }

  function open() {
    _isOpen = true;
    document.getElementById('aiCopilotPanel')?.classList.remove('hidden');
    setTimeout(() => document.getElementById('aiCopilotInput')?.focus(), 150);
    scrollToBottom();
  }

  function close() {
    _isOpen = false;
    document.getElementById('aiCopilotPanel')?.classList.add('hidden');
    stopSpeaking();
    stopListening();
  }

  function clearChat() {
    stopSpeaking();
    _chatHistory = [];
    const box = document.getElementById('aiCopilotMessages');
    if (box) box.innerHTML = '';
    addGreeting();
  }

  function scrollToBottom() {
    const box = document.getElementById('aiCopilotMessages');
    if (box) box.scrollTop = box.scrollHeight;
  }

  function appendMessage(role, html, autoSpeak = false) {
    _chatHistory.push({ role, content: html, time: new Date() });
    const box = document.getElementById('aiCopilotMessages');
    if (!box) return;

    const msgEl = document.createElement('div');
    msgEl.className = `copilot-msg ${role}`;
    
    const speakBtnHtml = role === 'assistant'
      ? `<div class="copilot-msg-footer"><button type="button" class="copilot-speak-btn" onclick="AI_COPILOT.speakThisMessage(this)" title="ฟังเสียงอ่าน"><i class="fas fa-volume-high"></i> <span>ฟังเสียง</span></button></div>`
      : '';

    msgEl.innerHTML = `
      <div class="copilot-msg-avatar">
        <i class="fas ${role === 'assistant' ? 'fa-robot' : 'fa-user'}"></i>
      </div>
      <div class="copilot-msg-content">
        ${html}
        ${speakBtnHtml}
      </div>
    `;
    box.appendChild(msgEl);
    scrollToBottom();

    if (role === 'assistant' && autoSpeak && _voiceEnabled) {
      const speakBtn = msgEl.querySelector('.copilot-speak-btn');
      speakText(html, speakBtn);
    }
  }

  function sendQuickPrompt(text) {
    const input = document.getElementById('aiCopilotInput');
    if (input) {
      input.value = text;
      handleSubmit(new Event('submit'));
    }
  }

  // ── Handle Input Submission ────────────────────────────────
  async function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (_isProcessing) return;

    const input = document.getElementById('aiCopilotInput');
    const query = input?.value?.trim();
    if (!query) return;

    input.value = '';
    stopSpeaking();
    appendMessage('user', escapeHtml(query));

    _isProcessing = true;
    const sendBtn = document.getElementById('aiCopilotSendBtn');
    if (sendBtn) { sendBtn.disabled = true; sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }

    // Show typing indicator
    const typingId = 'typing-' + Date.now();
    const box = document.getElementById('aiCopilotMessages');
    if (box) {
      const typingEl = document.createElement('div');
      typingEl.className = 'copilot-msg assistant';
      typingEl.id = typingId;
      typingEl.innerHTML = `
        <div class="copilot-msg-avatar"><i class="fas fa-robot"></i></div>
        <div class="copilot-msg-content">
          <div class="typing-dots">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </div>
      `;
      box.appendChild(typingEl);
      scrollToBottom();
    }

    try {
      const responseHtml = await processCommand(query);
      document.getElementById(typingId)?.remove();
      appendMessage('assistant', responseHtml, true);
    } catch (err) {
      document.getElementById(typingId)?.remove();
      appendMessage('assistant', `<p style="color:#f87171;"><i class="fas fa-triangle-exclamation"></i> เกิดข้อผิดพลาดในการประมวลผล: ${err.message}</p>`, true);
    } finally {
      _isProcessing = false;
      if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>'; }
    }
  }

  /**
   * Process Natural Language Commands & Groq LLM Inquiries
   */
  async function processCommand(rawText) {
    const text = rawText.trim().toLowerCase();

    // ─────────────────────────────────────────────────────────
    // 0. สั่งพาไปหน้าต่างๆ ในระบบ (Page Navigation & Deep Linking)
    // ─────────────────────────────────────────────────────────
    const isNavVerb = /พาไป|ไปที่|เปิดหน้า|ไปหน้า|ข้ามไป|เข้าหน้า|นำทาง|ขอไป|อยากไป|ดูหน้า|เปิดฟอร์ม|พาผมไป|พาฉันไป|ช่วยพา|navigate|go to|open/i.test(text);
    const isDirectPage = /^(หน้านักเรียน|หน้าตารางสอน|หน้าห้องเรียน|หน้าอาจารย์|หน้ารายวิชา|หน้ากลุ่มเรียน|หน้ากลุ่มนักเรียน|หน้าภาระงาน|หน้าลงทะเบียน|หน้าแดชบอร์ด|หน้าคู่มือ)$/i.test(text);
    const isAddAction = /เพิ่ม|add|กรอก|สร้าง|ลงทะเบียนใหม่|new/i.test(text);

    let navTarget = null;
    if (/นักเรียน|นักศึกษา|student/i.test(text)) {
      navTarget = { name: 'ข้อมูลนักเรียน / นักศึกษา', icon: 'fa-user-graduate', file: 'students.html', action: isAddAction ? 'form' : null, desc: isAddAction ? 'ฟอร์มสำหรับเพิ่มข้อมูลนักเรียน' : 'รายชื่อและข้อมูลนักเรียนทั้งหมด' };
    } else if (/ตารางสอน|ตารางเรียน|schedule/i.test(text) && (isNavVerb || isDirectPage || /หน้า/.test(text))) {
      navTarget = { name: 'จัดการตารางสอน', icon: 'fa-calendar-days', file: 'schedule.html', action: isAddAction ? 'add' : null, desc: isAddAction ? 'เปิดหน้าต่างเพิ่มรายวิชาในตาราง' : 'ตารางสอนและระบบจัดตาราง AI' };
    } else if (/อาจารย์|ครู|ผู้สอน|teacher/i.test(text)) {
      navTarget = { name: 'ข้อมูลอาจารย์และครูผู้สอน', icon: 'fa-chalkboard-user', file: 'teachers.html', action: isAddAction ? 'form' : null, desc: isAddAction ? 'ฟอร์มสำหรับเพิ่มข้อมูลอาจารย์' : 'รายชื่อและข้อมูลอาจารย์ทั้งหมด' };
    } else if (/ห้องเรียน|ห้องปฏิบัติการ|ห้องแล็บ|ห้องคอม|room/i.test(text)) {
      navTarget = { name: 'ข้อมูลห้องเรียนและห้องปฏิบัติการ', icon: 'fa-door-open', file: 'rooms.html', action: isAddAction ? 'form' : null, desc: isAddAction ? 'ฟอร์มสำหรับเพิ่มห้องเรียน' : 'รายการห้องเรียนทั้งหมด' };
    } else if (/รายวิชา|วิชา|หลักสูตร|subject/i.test(text)) {
      navTarget = { name: 'ข้อมูลรายวิชา', icon: 'fa-book-open', file: 'subjects.html', action: isAddAction ? 'form' : null, desc: isAddAction ? 'ฟอร์มสำหรับเพิ่มรายวิชา' : 'รายชื่อวิชาทั้งหมด' };
    } else if (/กลุ่มเรียน|กลุ่มนักเรียน|ชั้นเรียน|group/i.test(text)) {
      navTarget = { name: 'ข้อมูลกลุ่มนักเรียน', icon: 'fa-users', file: 'groups.html', action: isAddAction ? 'form' : null, desc: isAddAction ? 'ฟอร์มสำหรับเพิ่มกลุ่มนักเรียน' : 'รายชื่อกลุ่มเรียนทั้งหมด' };
    } else if (/ภาระงาน|ภาระงานสอน|teaching load|โหลดสอน/i.test(text)) {
      navTarget = { name: 'ภาระงานสอนอาจารย์', icon: 'fa-person-chalkboard', file: 'teaching-load.html', action: isAddAction ? 'form' : null, desc: isAddAction ? 'ฟอร์มมอบหมายภาระงานสอน' : 'ตารางภาระงานสอนครูทุกคน' };
    } else if (/ลงทะเบียน|registration/i.test(text)) {
      navTarget = { name: 'ข้อมูลการลงทะเบียนเรียน', icon: 'fa-clipboard-list', file: 'registration.html', action: isAddAction ? 'form' : null, desc: isAddAction ? 'ฟอร์มลงทะเบียนรายวิชา' : 'รายการลงทะเบียนของกลุ่มเรียน' };
    } else if (/แดชบอร์ด|dashboard|หน้าแรก|หน้าหลัก|home/i.test(text)) {
      navTarget = { name: 'แดชบอร์ดภาพรวม', icon: 'fa-chart-pie', file: 'index.html', action: null, desc: 'ภาพรวมระบบและสถิติสำคัญ' };
    } else if (/คู่มือ|วิธีใช้|help/i.test(text)) {
      navTarget = { name: 'คู่มือการใช้งานระบบ', icon: 'fa-circle-question', file: 'help.html', action: null, desc: 'คู่มือและเอกสารการใช้งาน EduSched AI' };
    }

    if (navTarget && (isNavVerb || isDirectPage || isAddAction)) {
      const currentPath = (typeof window !== 'undefined' && window.location) ? window.location.pathname : '';
      const isCurrentPage = currentPath.endsWith('/' + navTarget.file) || 
        (navTarget.file === 'index.html' && (currentPath === '/' || currentPath.endsWith('/index.html') || currentPath === ''));

      if (isCurrentPage) {
        if (navTarget.action === 'form') {
          setTimeout(() => {
            if (typeof STUDENTS !== 'undefined' && typeof STUDENTS.switchTab === 'function') STUDENTS.switchTab('form');
            else if (typeof ROOMS !== 'undefined' && typeof ROOMS.switchTab === 'function') ROOMS.switchTab('form');
            else if (typeof TEACHERS !== 'undefined' && typeof TEACHERS.switchTab === 'function') TEACHERS.switchTab('form');
            else if (typeof GROUPS !== 'undefined' && typeof GROUPS.switchTab === 'function') GROUPS.switchTab('form');
            else if (typeof SUBJECTS !== 'undefined' && typeof SUBJECTS.switchTab === 'function') SUBJECTS.switchTab('form');
            else if (typeof TEACHING_LOAD !== 'undefined' && typeof TEACHING_LOAD.switchTab === 'function') TEACHING_LOAD.switchTab('form');
            else if (typeof REGISTRATION !== 'undefined' && typeof REGISTRATION.switchTab === 'function') REGISTRATION.switchTab('form');
          }, 150);
          return `
            <p>📍 <strong>คุณอยู่ที่หน้า ${navTarget.name} อยู่แล้วครับ!</strong></p>
            <p>✨ ผมได้เปิด <strong>${navTarget.desc}</strong> ให้เรียบร้อยแล้ว สามารถกรอกข้อมูลได้ทันทีครับ</p>
          `;
        } else if (navTarget.action === 'add' && typeof SCHED !== 'undefined' && typeof SCHED.openAddModal === 'function') {
          setTimeout(() => SCHED.openAddModal(), 150);
          return `
            <p>📍 <strong>คุณอยู่ที่หน้า ${navTarget.name} อยู่แล้วครับ!</strong></p>
            <p>✨ เปิดหน้าต่างสำหรับเพิ่มรายวิชาในตารางให้เรียบร้อยแล้วครับ</p>
          `;
        }
        return `
          <p>📍 <strong>คุณอยู่ที่หน้า ${navTarget.name} อยู่แล้วครับ!</strong> มีข้อมูลใดที่ต้องการให้ผมช่วยค้นหา ตรวจสอบ หรือดำเนินการเพิ่มเติม แจ้งได้เลยครับ</p>
        `;
      } else {
        const targetUrl = navTarget.action === 'form' 
          ? `${navTarget.file}?tab=form` 
          : (navTarget.action === 'add' ? `${navTarget.file}?action=add` : navTarget.file);

        setTimeout(() => {
          if (typeof window !== 'undefined' && window.location) {
            window.location.href = targetUrl;
          }
        }, 1200);

        return `
          <p>🧭 <strong>รับทราบครับ! กำลังพาคุณไปยังหน้า ${navTarget.name}...</strong></p>
          <div class="copilot-action-card" style="border-left: 3px solid #38bdf8; margin:8px 0; padding:10px 14px; background:rgba(56,189,248,0.06); border-radius:8px;">
            <div class="card-title" style="color:#38bdf8; font-weight:600; font-size:13px; display:flex; align-items:center; gap:6px;">
              <i class="fas ${navTarget.icon}"></i> ${navTarget.name}
            </div>
            <div style="font-size:12px; color:#cbd5e1; margin:6px 0;">${navTarget.desc}</div>
            <a href="${targetUrl}" class="btn btn-primary btn-sm" style="display:inline-flex; align-items:center; gap:6px; margin-top:6px; background:#0284c7; border:none; text-decoration:none; padding:6px 14px; border-radius:6px; color:#fff; font-size:12px; font-weight:600; cursor:pointer;">
              <i class="fas fa-arrow-up-right-from-square"></i> คลิกเพื่อไปทันที
            </a>
          </div>
          <div style="font-size:11px; color:#94a3b8; display:flex; align-items:center; gap:6px; margin-top:4px;">
            <i class="fas fa-spinner fa-spin"></i> ระบบกำลังนำทางอัตโนมัติภายใน 1.2 วินาที...
          </div>
        `;
      }
    }

    // ─────────────────────────────────────────────────────────
    // เมนูระบบทั้งหมด (System Navigation Menu)
    // ─────────────────────────────────────────────────────────
    if (/มีหน้าอะไรบ้าง|เมนูทั้งหมด|หน้าระบบ|รายการหน้า|รายชื่อหน้า/.test(text)) {
      return `
        <p>🧭 <strong>หน้าระบบทั้งหมดใน EduSched AI:</strong></p>
        <ul style="margin:6px 0; padding-left:18px; line-height:1.7; font-size:12px;">
          <li><a href="index.html" style="color:#38bdf8; text-decoration:none;">📊 <strong>แดชบอร์ด</strong> (ภาพรวมวิทยาลัยและสถิติ)</a></li>
          <li><a href="schedule.html" style="color:#38bdf8; text-decoration:none;">📅 <strong>จัดการตารางสอน</strong> (ระบบจัดตาราง AI)</a></li>
          <li><a href="rooms.html" style="color:#38bdf8; text-decoration:none;">🚪 <strong>ห้องเรียน</strong> (ข้อมูลห้องและห้องแล็บ)</a></li>
          <li><a href="groups.html" style="color:#38bdf8; text-decoration:none;">👥 <strong>กลุ่มนักเรียน</strong> (ข้อมูลชั้นเรียน)</a></li>
          <li><a href="students.html" style="color:#38bdf8; text-decoration:none;">🎓 <strong>ข้อมูลนักเรียน</strong> (รายชื่อและเงื่อนไขพิเศษ)</a></li>
          <li><a href="teachers.html" style="color:#38bdf8; text-decoration:none;">👨‍🏫 <strong>ข้อมูลอาจารย์</strong> (รายชื่อและเพดานชั่วโมง)</a></li>
          <li><a href="subjects.html" style="color:#38bdf8; text-decoration:none;">📖 <strong>รายวิชา</strong> (หลักสูตรและหน่วยกิต)</a></li>
          <li><a href="teaching-load.html" style="color:#38bdf8; text-decoration:none;">📋 <strong>ภาระงานสอน</strong> (มอบหมายชั่วโมงสอน)</a></li>
          <li><a href="registration.html" style="color:#38bdf8; text-decoration:none;">📝 <strong>การลงทะเบียน</strong> (รายวิชาที่กลุ่มเรียนลง)</a></li>
          <li><a href="help.html" style="color:#38bdf8; text-decoration:none;">❓ <strong>คู่มือการใช้งาน</strong> (วิธีใช้งานระบบ)</a></li>
        </ul>
        <p style="font-size:11.5px; color:#94a3b8; margin-top:4px;">💡 คุณสามารถบอกผม เช่น <em>"พาไปหน้านักเรียน"</em> หรือ <em>"เปิดหน้าห้องเรียน"</em> ได้เลยครับ</p>
      `;
    }

    // ─────────────────────────────────────────────────────────
    // 1. สั่งจัดตารางสอน (Generate Schedule Command)
    // ─────────────────────────────────────────────────────────
    if (/จัดตาราง|สร้างตาราง|รันตาราง|รัน ai|generate|auto sched/.test(text)) {
      if (typeof SCHED !== 'undefined' && typeof SCHED.generateAutoSchedule === 'function') {
        setTimeout(() => {
          SCHED.generateAutoSchedule();
        }, 500);

        return `
          <p>🚀 <strong>รับคำสั่งเรียบร้อยครับ!</strong></p>
          <p>กำลังส่งคำสั่งไปยัง <strong>Constraint Solver Agent</strong> เพื่อเริ่มประมวลผลตารางสอนแบบ <em>Zero-Collision</em> ทันที...</p>
          <div class="copilot-action-card">
            <div class="card-title"><i class="fas fa-microchip"></i> สถานะการประมวลผล</div>
            <div style="font-size:12px; color:#cbd5e1;">หน้าต่างความคืบหน้า (AI Progress Modal) กำลังเริ่มทำงาน กรุณารอสักครู่</div>
          </div>
        `;
      } else {
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.location) {
            window.location.href = 'schedule.html?action=auto';
          }
        }, 1200);

        return `
          <p>🚀 <strong>รับคำสั่งจัดตารางสอนครับ!</strong></p>
          <p>กำลังพาคุณไปยังหน้า <strong>จัดการตารางสอน (schedule.html)</strong> เพื่อเริ่มประมวลผลจัดตารางแบบ Zero-Collision ทันที...</p>
          <div class="copilot-action-card" style="border-left: 3px solid #a855f7; margin:8px 0; padding:10px 14px; background:rgba(168,85,247,0.06); border-radius:8px;">
            <div class="card-title" style="color:#c084fc; font-weight:600; font-size:13px; display:flex; align-items:center; gap:6px;">
              <i class="fas fa-wand-magic-sparkles"></i> จัดการตารางสอน (AI Engine)
            </div>
            <a href="schedule.html?action=auto" class="btn btn-primary btn-sm" style="display:inline-flex; align-items:center; gap:6px; margin-top:6px; background:#7c3aed; border:none; text-decoration:none; padding:6px 14px; border-radius:6px; color:#fff; font-size:12px; font-weight:600;">
              <i class="fas fa-calendar-days"></i> ไปที่หน้าตารางสอนทันที
            </a>
          </div>
          <div style="font-size:11px; color:#94a3b8; display:flex; align-items:center; gap:6px; margin-top:4px;">
            <i class="fas fa-spinner fa-spin"></i> กำลังเปลี่ยนหน้าอัตโนมัติใน 1.2 วินาที...
          </div>
        `;
      }
    }

    // ─────────────────────────────────────────────────────────
    // 2. สั่งพิมพ์ หรือ ส่งออก Excel / PDF
    // ─────────────────────────────────────────────────────────
    if (/พิมพ์|ปริ้น|print|pdf/.test(text)) {
      if (typeof SCHED !== 'undefined' && typeof SCHED.printSchedule === 'function') {
        close();
        setTimeout(() => SCHED.printSchedule(), 350);
        return `<p>🖨️ <strong>เปิดหน้าต่างเตรียมพิมพ์ตารางสอน (Print Preview / Save PDF) เรียบร้อยครับ!</strong> กล่องแชทถูกซ่อนอัตโนมัติเพื่อให้เอกสารพอดีหน้า A4 แนวนอน</p>`;
      }
    }

    if (/excel|export|ดาวน์โหลด excel|ส่งออก/.test(text)) {
      if (typeof SCHED !== 'undefined' && typeof SCHED.exportExcel === 'function') {
        setTimeout(() => SCHED.exportExcel(), 400);
        return `<p>📗 <strong>กำลังดาวน์โหลดไฟล์ Excel (.xlsx) ให้เรียบร้อยครับ!</strong> พร้อมการรวมเซลล์คาบต่อเนื่องและหัวตารางเอกสารทางการศึกษา</p>`;
      }
    }

    // ─────────────────────────────────────────────────────────
    // 3. สั่งลบข้อมูล / ล้างตารางสอน
    // ─────────────────────────────────────────────────────────
    if (/ล้างตาราง|ลบตาราง|ลบข้อมูลตาราง|clear schedule|ลบตารางสอน/.test(text)) {
      if (typeof SCHED !== 'undefined' && typeof SCHED.openClearModal === 'function') {
        setTimeout(() => SCHED.openClearModal(), 400);
        return `
          <p style="color:#fbbf24;"><i class="fas fa-triangle-exclamation"></i> <strong>เปิดหน้าต่างยืนยันการล้างตารางสอนเรียบร้อยครับ</strong></p>
          <p>เพื่อความปลอดภัยของข้อมูล กรุณากดเลือกขอบเขตที่ต้องการลบในหน้าต่างยืนยันบนหน้าจอครับ</p>
        `;
      }
    }

    // ─────────────────────────────────────────────────────────
    // 4. สั่งเพิ่มข้อมูลห้องเรียน (Add Room)
    // ─────────────────────────────────────────────────────────
    const matchRoom = rawText.match(/เพิ่มห้อง\s+([A-Za-z0-9\-_]+)(?:\s+(?:ชื่อ\s+)?([^\s\d]+))?(?:\s+(?:ความจุ\s+)?(\d+))?/i);
    if (matchRoom) {
      const roomId = matchRoom[1];
      const roomName = matchRoom[2] || `ห้อง ${roomId}`;
      const capacity = parseInt(matchRoom[3] || '40', 10);
      const roomType = roomId.includes('LAB') ? 'ห้องปฏิบัติการ' : 'ห้องเรียนทั่วไป';

      try {
        const { error } = await db.from('rooms').upsert([{
          room_id: roomId,
          room_name: roomName,
          room_type: roomType,
          capacity: capacity
        }], { onConflict: 'room_id' });

        if (error) throw error;
        if (typeof showToast === 'function') showToast('success', 'เพิ่มห้องเรียนสำเร็จ', `${roomId} (${roomName})`);
        if (typeof SCHED !== 'undefined' && SCHED.loadAllData) SCHED.loadAllData();

        return `
          <p style="color:#34d399; font-weight:700;"><i class="fas fa-check-circle"></i> บันทึกข้อมูลห้องเรียนใหม่สำเร็จ!</p>
          <ul>
            <li><strong>รหัสห้อง:</strong> <code>${roomId}</code></li>
            <li><strong>ชื่อห้อง:</strong> ${roomName}</li>
            <li><strong>ประเภท:</strong> ${roomType}</li>
            <li><strong>ความจุ:</strong> ${capacity} ที่นั่ง</li>
          </ul>
        `;
      } catch (err) {
        return `<p style="color:#f87171;"><i class="fas fa-circle-xmark"></i> เพิ่มห้องเรียนไม่สำเร็จ: ${err.message}</p>`;
      }
    }

    // ─────────────────────────────────────────────────────────
    // 5. สั่งเพิ่มข้อมูลอาจารย์ (Add Teacher)
    // ─────────────────────────────────────────────────────────
    const matchTeacher = rawText.match(/เพิ่มอาจารย์\s+([A-Za-z0-9\-_]+)\s+([^\s\d]+)(?:\s+(?:ชั่วโมง|ชม\.|max)?\s*(\d+))?/i);
    if (matchTeacher) {
      const tId = matchTeacher[1];
      const tName = matchTeacher[2];
      const maxH = parseInt(matchTeacher[3] || '20', 10);

      try {
        const { error } = await db.from('teachers').upsert([{
          teacher_id: tId,
          teacher_name: tName,
          role: 'ครูผู้สอน',
          max_hours: maxH,
          unavailable_time: '[]'
        }], { onConflict: 'teacher_id' });

        if (error) throw error;
        if (typeof showToast === 'function') showToast('success', 'เพิ่มอาจารย์สำเร็จ', `${tName} (${tId})`);
        if (typeof SCHED !== 'undefined' && SCHED.loadAllData) SCHED.loadAllData();

        return `
          <p style="color:#34d399; font-weight:700;"><i class="fas fa-check-circle"></i> บันทึกข้อมูลอาจารย์สำเร็จ!</p>
          <ul>
            <li><strong>รหัสอาจารย์:</strong> <code>${tId}</code></li>
            <li><strong>ชื่อ-นามสกุล:</strong> ${tName}</li>
            <li><strong>ชั่วโมงสอนสูงสุด:</strong> ${maxH} คาบ/สัปดาห์</li>
          </ul>
        `;
      } catch (err) {
        return `<p style="color:#f87171;"><i class="fas fa-circle-xmark"></i> เพิ่มอาจารย์ไม่สำเร็จ: ${err.message}</p>`;
      }
    }

    // ─────────────────────────────────────────────────────────
    // 6. สั่งเพิ่มข้อมูลรายวิชา (Add Subject)
    // ─────────────────────────────────────────────────────────
    const matchSubject = rawText.match(/เพิ่มวิชา\s+([0-9\-]+)\s+([^\s\d]+)(?:\s+(?:ทฤษฎี\s*)?(\d+))?(?:\s+(?:ปฏิบัติ\s*)?(\d+))?/i);
    if (matchSubject) {
      const sId = matchSubject[1];
      const sName = matchSubject[2];
      const theory = parseInt(matchSubject[3] || '2', 10);
      const practice = parseInt(matchSubject[4] || '0', 10);
      const credit = theory + Math.floor(practice / 2);

      try {
        const { error } = await db.from('subjects').upsert([{
          subject_id: sId,
          subject_name: sName,
          theory: theory,
          practice: practice,
          credit: credit || 2
        }], { onConflict: 'subject_id' });

        if (error) throw error;
        if (typeof showToast === 'function') showToast('success', 'เพิ่มวิชาสำเร็จ', `${sId} ${sName}`);
        if (typeof SCHED !== 'undefined' && SCHED.loadAllData) SCHED.loadAllData();

        return `
          <p style="color:#34d399; font-weight:700;"><i class="fas fa-check-circle"></i> บันทึกข้อมูลรายวิชาสำเร็จ!</p>
          <ul>
            <li><strong>รหัสวิชา:</strong> <code>${sId}</code></li>
            <li><strong>ชื่อวิชา:</strong> ${sName}</li>
            <li><strong>ทฤษฎี / ปฏิบัติ / หน่วยกิต:</strong> ${theory}-${practice}-${credit}</li>
          </ul>
        `;
      } catch (err) {
        return `<p style="color:#f87171;"><i class="fas fa-circle-xmark"></i> เพิ่มรายวิชาไม่สำเร็จ: ${err.message}</p>`;
      }
    }

    // ─────────────────────────────────────────────────────────
    // 7. สั่งลบข้อมูลเฉพาะตัว (Delete Room / Subject / Teacher)
    // ─────────────────────────────────────────────────────────
    const matchDel = rawText.match(/ลบ(ห้อง|อาจารย์|ครู|วิชา)\s+([A-Za-z0-9\-_]+)/i);
    if (matchDel) {
      const type = matchDel[1];
      const id = matchDel[2];
      const tableMap = {
        'ห้อง': { table: 'rooms', col: 'room_id', label: 'ห้องเรียน' },
        'อาจารย์': { table: 'teachers', col: 'teacher_id', label: 'อาจารย์' },
        'ครู': { table: 'teachers', col: 'teacher_id', label: 'อาจารย์' },
        'วิชา': { table: 'subjects', col: 'subject_id', label: 'รายวิชา' }
      };

      const meta = tableMap[type];
      if (meta) {
        try {
          if (meta.table === 'rooms') {
            await db.from('schedules').delete().eq('room_id', id);
          } else if (meta.table === 'teachers') {
            await db.from('schedules').delete().eq('teacher_id', id);
            await db.from('teaching_loads').delete().eq('teacher_id', id);
          } else if (meta.table === 'subjects') {
            await db.from('schedules').delete().eq('subject_id', id);
            await db.from('teaching_loads').delete().eq('subject_id', id);
            await db.from('registrations').delete().eq('subject_id', id);
          }

          const { error } = await db.from(meta.table).delete().eq(meta.col, id);
          if (error) throw error;

          if (typeof showToast === 'function') showToast('success', `ลบ${meta.label}สำเร็จ`, `รหัส: ${id}`);
          if (typeof SCHED !== 'undefined' && SCHED.loadAllData) SCHED.loadAllData();

          return `<p style="color:#34d399;"><i class="fas fa-check-circle"></i> ลบข้อมูล${meta.label} รหัส <code>${id}</code> และรายการเชื่อมโยงเรียบร้อยแล้วครับ</p>`;
        } catch (err) {
          return `<p style="color:#f87171;"><i class="fas fa-circle-xmark"></i> ลบข้อมูลไม่สำเร็จ: ${err.message}</p>`;
        }
      }
    }

    // ─────────────────────────────────────────────────────────
    // 8. ดึงสถิติตารางสดเพื่อเป็น Context ส่งให้ Groq LLM
    // ─────────────────────────────────────────────────────────
    let conflictCount = 0;
    let auditData = null;
    if (typeof SCHED !== 'undefined' && typeof SCHED.calculateConflicts === 'function') {
      conflictCount = SCHED.calculateConflicts();
      auditData = SCHED.getLastAuditData ? SCHED.getLastAuditData() : null;
    }

    // เตรียม System Prompt พร้อมข้อมูลระบบสด (เน้นตอบสั้น กระชับ ตรงประเด็น)
    const systemPrompt = `คุณคือ EduSched AI Copilot ผู้ช่วยอัจฉริยะประจำระบบ EduSched AI ขับเคลื่อนด้วย Groq LPU Ultra-Fast

กฎเหล็กสำคัญที่สุด (ตอบสั้น กระชับ ตรงประเด็น):
1. "ตอบสั้น กระชับ ไม่อารัมภบท ไม่ยืดยาว" (Brief & Concise):
   - ห้ามเกริ่นทักทายยาว ห้ามพูดพร่ำเพื่อ ให้เข้าประเด็นคำตอบทันที
   - ตอบสั้นๆ 2-4 บรรทัด หรือใช้ bullet points สั้นๆ เฉพาะสาระสำคัญ (ความยาวคำตอบไม่ควรเกิน 3-5 ข้อสั้นๆ)
   - หากถามวิธีทำ/สูตร ให้บอกวัตถุดิบหลักและขั้นตอนสั้นๆ 3 ขั้นตอน จบประโยคสมบูรณ์
2. ตอบได้ทุกคำถาม: สามารถตอบได้ทั้งคำถามทั่วไป (อาหาร, เขียนโปรแกรม, วิทยาศาสตร์, ทั่วไป) และเรื่องระบบจัดตารางสอน EduSched AI
3. เรื่องตารางสอน/ภาระงานครู/ข้อขัดแย้ง: ให้บอกสาเหตุและวิธีแก้สั้นๆ 1-3 ข้อ (เช่น ปรับ max_hours ในหน้าอาจารย์, เพิ่มครู, มอบหมายวิชาใหม่)
4. การนำทาง: บอกชื่อหน้าสั้นๆ หรือแนะนำให้สั่ง "พาไปหน้า..." เช่น หน้านักเรียน (students.html), หน้าตารางสอน (schedule.html)

ข้อมูลระบบปัจจุบัน (ใช้อ้างอิงสั้นๆ เมื่อถามเรื่องตาราง):
- ข้อขัดแย้ง: ${conflictCount === 0 ? '0 จุด (Zero-Collision)' : `${conflictCount} จุด`}, ครูเกินชั่วโมง: ${auditData?.overloadConflicts?.length || 0} คน, ครูภาระน้อย: ${auditData?.underloadWarnings?.length || 0} คน, ห้องชน: ${auditData?.roomConflicts?.length || 0} จุด`;

    // ─────────────────────────────────────────────────────────
    // 9. เรียกใช้งาน Groq LLM API แบบ Ultra-Fast
    // ─────────────────────────────────────────────────────────
    // ดึงบทสนทนาก่อนหน้าเพื่อรักษาบริบทการพูดคุย
    const recentHistory = [];
    const prevHistory = _chatHistory.slice(0, -1);
    for (let i = Math.max(0, prevHistory.length - 4); i < prevHistory.length; i++) {
      const msg = prevHistory[i];
      if (msg && msg.role && msg.content) {
        const cleanContent = msg.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleanContent && !cleanContent.includes('ประมวลผลโดย Groq LPU')) {
          recentHistory.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: cleanContent.substring(0, 300)
          });
        }
      }
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...recentHistory,
      { role: 'user', content: rawText }
    ];

    const groqRes = await callGroqLLM(messages, 450);
    if (groqRes && groqRes.content) {
      const htmlContent = formatMarkdown(groqRes.content);
      return `
        ${htmlContent}
        <div style="margin-top:8px; font-size:10px; color:#94a3b8; display:flex; align-items:center; gap:5px; border-top:1px solid rgba(255,255,255,0.06); padding-top:6px;">
          <i class="fas fa-bolt" style="color:#f97316;"></i> ประมวลผลโดย <strong>Groq LPU (${groqRes.model})</strong>
        </div>
      `;
    }

    // ─────────────────────────────────────────────────────────
    // 10. Fallback กรณีเกิดข้อผิดพลาดในการเชื่อมต่อ Groq
    // ─────────────────────────────────────────────────────────
    return `
      <p>💡 ผมได้รับคำถาม: <em>"${escapeHtml(rawText)}"</em></p>
      <p>คุณสามารถสั่งงานให้ผมช่วยเหลือเรื่องใดเรื่องหนึ่งดังนี้ครับ:</p>
      <ul>
        <li>⚡ พิมพ์ <code>จัดตารางสอนให้หน่อย</code> เพื่อเริ่มจัดตารางอัตโนมัติ</li>
        <li>🔍 พิมพ์ <code>ตรวจสอบข้อขัดแย้ง</code> เพื่อดูจุดชนและวิธีแก้</li>
        <li>📊 พิมพ์ <code>วิเคราะห์ตารางสอน</code> เพื่อดูบทสรุปผู้บริหาร</li>
        <li>➕ พิมพ์ <code>เพิ่มห้อง LAB-NEW ความจุ 30</code> หรือ <code>เพิ่มอาจารย์...</code></li>
        <li>🗑️ พิมพ์ <code>ล้างตารางสอน</code> หรือ <code>ลบวิชา...</code></li>
      </ul>
    `;
  }

  // Auto-init on load
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('DOMContentLoaded', init);
    if (typeof document !== 'undefined' && (document.readyState === 'complete' || document.readyState === 'interactive')) {
      setTimeout(init, 50);
    }
  }

  return {
    init,
    toggle,
    open,
    close,
    clearChat,
    sendQuickPrompt,
    handleSubmit,
    processCommand,
    callGroqLLM,
    speakText,
    speakThisMessage,
    stopSpeaking,
    toggleVoice,
    toggleSpeechRecognition
  };
})();

if (typeof window !== 'undefined') {
  window.AI_COPILOT = AI_COPILOT;
}
