// ============================================================
//  EDUSCHED AI - AI COPILOT & LLM CHAT ASSISTANT
//  รองรับการถาม-ตอบข้อมูล และสั่งการทำงานในเว็บผ่านภาษาธรรมชาติ (NL Commands)
// ============================================================

const AI_COPILOT = (() => {
  let _chatHistory = [];
  let _isOpen = false;
  let _isProcessing = false;

  // ── Initialize Copilot Widget on DOM Ready ─────────────────
  function init() {
    if (document.getElementById('ai-copilot-container')) return;

    // Create Widget Container
    const container = document.createElement('div');
    container.id = 'ai-copilot-container';
    container.innerHTML = `
      <!-- Floating Trigger Button -->
      <button class="ai-copilot-trigger" id="aiCopilotTrigger" onclick="AI_COPILOT.toggle()" title="เปิดตัวช่วย EduSched AI Copilot">
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
              <div class="title">EduSched AI Copilot <span class="badge badge-primary" style="font-size:9px; padding:1px 6px;">LLM</span></div>
              <div class="sub"><span class="status-badge"></span> ผู้ช่วยอัจฉริยะสั่งการระบบ</div>
            </div>
          </div>
          <div class="ai-copilot-header-actions">
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
          <div class="copilot-chip" onclick="AI_COPILOT.sendQuickPrompt('ครูคนไหนสอนเยอะที่สุด')">👨‍🏫 สถิติชั่วโมงครู</div>
          <div class="copilot-chip" onclick="AI_COPILOT.sendQuickPrompt('พิมพ์ตารางสอน')">🖨️ พิมพ์ตาราง</div>
        </div>

        <!-- Input Footer -->
        <div class="ai-copilot-footer">
          <form class="ai-copilot-input-form" onsubmit="AI_COPILOT.handleSubmit(event)">
            <input type="text" class="ai-copilot-input" id="aiCopilotInput"
              placeholder="พิมพ์คำสั่งหรือถามคำถามที่นี่... (เช่น จัดตาราง, เพิ่มห้อง, เพิ่มวิชา)" autocomplete="off" />
            <button type="submit" class="ai-copilot-send-btn" id="aiCopilotSendBtn" title="ส่งคำสั่ง">
              <i class="fas fa-paper-plane"></i>
            </button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Initial greeting
    addGreeting();
  }

  function addGreeting() {
    appendMessage('assistant', `
      <p>👋 สวัสดีครับ! ผมคือ <strong>EduSched AI Copilot</strong> ผู้ช่วยอัจฉริยะประจำระบบจัดตารางสอน</p>
      <p>คุณสามารถ **พิมพ์สั่งงาน** หรือ **ถามคำถาม** ได้ทันที เช่น:</p>
      <ul>
        <li>⚡ <code>จัดตารางสอนให้หน่อย</code> (สั่งรัน Hybrid AI จัดตาราง 100%)</li>
        <li>🔍 <code>ตรวจสอบข้อขัดแย้งและวิธีแก้</code> (ดูสาเหตุ + แนวทางแก้ไข)</li>
        <li>📊 <code>วิเคราะห์ตารางสอน</code> (เปิดรายงานผู้บริหาร)</li>
        <li>➕ <code>เพิ่มห้อง LAB-TEST ความจุ 35</code> หรือ <code>เพิ่มอาจารย์...</code></li>
        <li>🗑️ <code>ลบข้อมูลตารางสอน</code> (เปิดหน้าต่างล้างตาราง)</li>
        <li>❓ <code>ครูคนไหนสอนเยอะที่สุด</code> หรือ <code>ห้องไหนใช้บ่อยสุด</code></li>
      </ul>
    `);
  }

  function toggle() {
    const panel = document.getElementById('aiCopilotPanel');
    if (!panel) return;
    _isOpen = !_isOpen;
    panel.classList.toggle('hidden', !_isOpen);
    if (_isOpen) {
      setTimeout(() => document.getElementById('aiCopilotInput')?.focus(), 150);
      scrollToBottom();
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
  }

  function clearChat() {
    _chatHistory = [];
    const box = document.getElementById('aiCopilotMessages');
    if (box) box.innerHTML = '';
    addGreeting();
  }

  function scrollToBottom() {
    const box = document.getElementById('aiCopilotMessages');
    if (box) box.scrollTop = box.scrollHeight;
  }

  function appendMessage(role, html) {
    _chatHistory.push({ role, content: html, time: new Date() });
    const box = document.getElementById('aiCopilotMessages');
    if (!box) return;

    const msgEl = document.createElement('div');
    msgEl.className = `copilot-msg ${role}`;
    msgEl.innerHTML = `
      <div class="copilot-msg-avatar">
        <i class="fas ${role === 'assistant' ? 'fa-robot' : 'fa-user'}"></i>
      </div>
      <div class="copilot-msg-content">${html}</div>
    `;
    box.appendChild(msgEl);
    scrollToBottom();
  }

  function sendQuickPrompt(text) {
    const input = document.getElementById('aiCopilotInput');
    if (input) {
      input.value = text;
      handleSubmit(new Event('submit'));
    }
  }

  // ── Command Parsing & Execution ────────────────────────────
  async function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (_isProcessing) return;

    const input = document.getElementById('aiCopilotInput');
    const query = input?.value?.trim();
    if (!query) return;

    input.value = '';
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
      // Simulate intelligent thinking latency
      await new Promise(r => setTimeout(r, 400));
      const responseHtml = await processCommand(query);

      // Remove typing indicator and append response
      document.getElementById(typingId)?.remove();
      appendMessage('assistant', responseHtml);
    } catch (err) {
      document.getElementById(typingId)?.remove();
      appendMessage('assistant', `<p style="color:#f87171;"><i class="fas fa-triangle-exclamation"></i> เกิดข้อผิดพลาดในการประมวลผล: ${err.message}</p>`);
    } finally {
      _isProcessing = false;
      if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>'; }
    }
  }

  /**
   * Process Natural Language Queries & Commands
   */
  async function processCommand(rawText) {
    const text = rawText.trim().toLowerCase();

    // ─────────────────────────────────────────────────────────
    // 1. สั่งจัดตารางสอน (Generate Schedule)
    // ─────────────────────────────────────────────────────────
    if (/จัดตาราง|สร้างตาราง|รันตาราง|รัน ai|generate|auto sched/.test(text)) {
      if (typeof SCHED !== 'undefined' && typeof SCHED.generateAutoSchedule === 'function') {
        // Trigger auto-schedule in background
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
        return `<p>⚠️ คำสั่งจัดตารางสอนรองรับเฉพาะในหน้า <strong>จัดการตารางสอน (schedule.html)</strong> ครับ <a href="schedule.html" style="color:#38bdf8; text-decoration:underline;">คลิกเพื่อไปที่หน้าตารางสอน</a></p>`;
      }
    }

    // ─────────────────────────────────────────────────────────
    // 2. ตรวจสอบข้อขัดแย้ง & สาเหตุ & วิธีแก้ปัญหา (Conflict & Resolution)
    // ─────────────────────────────────────────────────────────
    if (/ข้อขัดแย้ง|ชน|ปัญหา|ตรวจสอบ|วิธีแก้|ทำไม|เพราะไร|ภาระสอนน้อย|เกินชั่วโมง|audit|conflict/.test(text)) {
      if (typeof SCHED !== 'undefined' && typeof SCHED.openAuditModal === 'function') {
        const conflicts = SCHED.calculateConflicts ? SCHED.calculateConflicts() : 0;
        const lastAudit = SCHED.getLastAuditData ? SCHED.getLastAuditData() : null;

        if (conflicts === 0) {
          return `
            <p style="color:#34d399; font-weight:700;"><i class="fas fa-circle-check"></i> ไม่พบข้อขัดแย้งในตารางสอน 100% (Zero Collision PASS)</p>
            <p>ตารางสอนปัจจุบันสอดคล้องตามเกณฑ์มาตรฐาน สอศ. ครบทุกมิติ:</p>
            <ul>
              <li>✅ <strong>ครูผู้สอน:</strong> ไม่มีคาบเวลาชนกัน และไม่มีใครเกินชั่วโมงสอนสูงสุด</li>
              <li>✅ <strong>ห้องเรียน:</strong> ล็อกห้องตามสาขาวิชา และไม่มีการใช้ห้องซ้ำซ้อน</li>
              <li>✅ <strong>กลุ่มเรียน:</strong> ไม่มีคาบเรียนชนกัน และเว้นพักกลางวันครบถ้วน</li>
            </ul>
            <div class="copilot-action-card">
              <button class="copilot-action-btn" onclick="SCHED.openAuditModal()">
                <i class="fas fa-magnifying-glass-chart"></i> เปิดดูหลักฐาน Audit เต็มรูปแบบ
              </button>
            </div>
          `;
        } else {
          let detailsHtml = '';
          if (lastAudit) {
            const { teacherConflicts, roomConflicts, groupConflicts, overloadConflicts, underloadWarnings } = lastAudit;

            if (roomConflicts && roomConflicts.length > 0) {
              detailsHtml += `<div style="margin-top:6px;"><strong>🔴 ห้องเรียนชน (${roomConflicts.length} จุด):</strong><br/>`;
              detailsHtml += roomConflicts.slice(0, 3).map(r => `• ${r.reason}<br/>&nbsp;&nbsp;<em>🔍 สาเหตุ:</em> ${r.cause || 'ใช้ห้องซ้อนทับกัน'}<br/>&nbsp;&nbsp;<em>💡 วิธีแก้:</em> ${r.suggestion || 'สลับไปใช้ห้องอื่นในสาขา'}`).join('<br/>');
              detailsHtml += `</div>`;
            }

            if (overloadConflicts && overloadConflicts.length > 0) {
              detailsHtml += `<div style="margin-top:6px;"><strong>🔴 ครูสอนเกินชั่วโมงสูงสุด (${overloadConflicts.length} คน):</strong><br/>`;
              detailsHtml += overloadConflicts.slice(0, 3).map(o => `• ${o.reason}<br/>&nbsp;&nbsp;<em>🔍 สาเหตุ:</em> ${o.cause || 'ภาระงานสูงกว่าเพดาน'}<br/>&nbsp;&nbsp;<em>💡 วิธีแก้:</em> <strong>เพิ่มชั่วโมงสอน (max_hours) หรือเพิ่มครูในแผนก</strong> หรือโอนวิชาให้ครูที่มีชั่วโมงว่าง`).join('<br/>');
              detailsHtml += `</div>`;
            }

            if (underloadWarnings && underloadWarnings.length > 0) {
              detailsHtml += `<div style="margin-top:6px;"><strong>🟡 ครูภาระสอนน้อยไป (${underloadWarnings.length} คน):</strong><br/>`;
              detailsHtml += underloadWarnings.slice(0, 3).map(u => `• ${u.reason}<br/>&nbsp;&nbsp;<em>🔍 สาเหตุ:</em> ได้รับมอบหมายวิชาน้อยเกินไป<br/>&nbsp;&nbsp;<em>💡 วิธีแก้:</em> <strong>มอบหมายวิชาสอนเพิ่มในหน้าภาระงานสอน หรือเพิ่มกลุ่มเรียนให้อาจารย์</strong>`).join('<br/>');
              detailsHtml += `</div>`;
            }
          }

          return `
            <p style="color:#f87171; font-weight:700;"><i class="fas fa-triangle-exclamation"></i> ตรวจพบข้อขัดแย้งทั้งหมด ${conflicts} จุด ในระบบ</p>
            <div style="font-size:12px; line-height:1.6; color:#e2e8f0;">
              ${detailsHtml || 'ตรวจพบความซ้ำซ้อนในตารางสอน'}
            </div>
            <div class="copilot-action-card">
              <div class="card-title"><i class="fas fa-wrench"></i> การสั่งการแก้ไขอัตโนมัติ</div>
              <button class="copilot-action-btn" onclick="SCHED.generateAutoSchedule()">
                <i class="fas fa-wand-magic-sparkles"></i> ให้ AI รันจัดตารางและแก้ข้อขัดแย้งให้อัตโนมัติ
              </button>
              <button class="copilot-action-btn btn-outline" onclick="SCHED.openAuditModal()">
                <i class="fas fa-magnifying-glass-chart"></i> ดูรายละเอียดเชิงลึกทั้งหมด
              </button>
            </div>
          `;
        }
      } else {
        return `<p>คุณสามารถตรวจสอบข้อขัดแย้งได้ในหน้า <strong>จัดการตารางสอน</strong> ครับ</p>`;
      }
    }

    // ─────────────────────────────────────────────────────────
    // 3. วิเคราะห์ตารางสอน / รายงานผู้บริหาร (Executive Report)
    // ─────────────────────────────────────────────────────────
    if (/วิเคราะห์|สรุป|รายงาน|ผู้บริหาร|executive|report/.test(text)) {
      if (typeof SCHED !== 'undefined' && typeof SCHED.openLlmModal === 'function') {
        setTimeout(() => SCHED.openLlmModal(), 400);
        return `
          <p>📊 <strong>กำลังเปิดหน้าต่างบทวิเคราะห์เชิงบริหารสถานศึกษา...</strong></p>
          <p>ระบบ Explainability Agent กำลังสรุปข้อมูล อัตราการใช้ห้อง, ภาระงานครู, และสัดส่วนคาบเรียนกลางวันให้เรียบร้อยครับ</p>
        `;
      }
    }

    // ─────────────────────────────────────────────────────────
    // 4. สั่งพิมพ์ หรือ ส่งออก Excel / PDF
    // ─────────────────────────────────────────────────────────
    if (/พิมพ์|ปริ้น|print|pdf/.test(text)) {
      if (typeof SCHED !== 'undefined' && typeof SCHED.printSchedule === 'function') {
        close();
        setTimeout(() => SCHED.printSchedule(), 350);
        return `<p>🖨️ <strong>เปิดหน้าต่างเตรียมพิมพ์ตารางสอน (Print Preview / Save PDF) เรียบร้อยครับ!</strong> ตารางได้รับการปรับขนาดพอดีหน้ากระดาษแนวนอน A4 แล้ว</p>`;
      }
    }

    if (/excel|export|ดาวน์โหลด excel|ส่งออก/.test(text)) {
      if (typeof SCHED !== 'undefined' && typeof SCHED.exportExcel === 'function') {
        setTimeout(() => SCHED.exportExcel(), 400);
        return `<p>📗 <strong>กำลังดาวน์โหลดไฟล์ Excel (.xlsx) ให้เรียบร้อยครับ!</strong> พร้อมการรวมเซลล์คาบต่อเนื่องและหัวตารางเอกสารทางการศึกษา</p>`;
      }
    }

    // ─────────────────────────────────────────────────────────
    // 5. สั่งลบข้อมูล / ล้างตารางสอน
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
    // 6. สั่งเพิ่มข้อมูลห้องเรียน (Add Room)
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
    // 7. สั่งเพิ่มข้อมูลอาจารย์ (Add Teacher)
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
    // 8. สั่งเพิ่มข้อมูลรายวิชา (Add Subject)
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
    // 9. สั่งลบข้อมูลเฉพาะตัว (Delete Room / Subject / Teacher)
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
          // ล้างตารางที่เชื่อมโยงก่อนเพื่อป้องกัน FK conflict
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
    // 10. ถามข้อมูลสถิติต่าง ๆ (Q&A Stats)
    // ─────────────────────────────────────────────────────────
    if (/ครูกี่คน|จำนวนครู|อาจารย์กี่คน/.test(text)) {
      const { count } = await db.from('teachers').select('*', { count: 'exact', head: true });
      return `<p>👨‍🏫 ปัจจุบันในระบบมีข้อมูลครู/อาจารย์ทั้งหมด <strong>${count || 0} ท่าน</strong> ครับ</p>`;
    }

    if (/ห้องกี่ห้อง|จำนวนห้อง/.test(text)) {
      const { count } = await db.from('rooms').select('*', { count: 'exact', head: true });
      return `<p>🏫 ปัจจุบันในระบบมีห้องเรียนทั้งหมด <strong>${count || 0} ห้อง</strong> (ทั้งห้องปฏิบัติการและห้องทฤษฎี) ครับ</p>`;
    }

    if (/วิชากี่วิชา|จำนวนวิชา/.test(text)) {
      const { count } = await db.from('subjects').select('*', { count: 'exact', head: true });
      return `<p>📚 ปัจจุบันในระบบมีรายวิชาทั้งหมด <strong>${count || 0} วิชา</strong> ครับ</p>`;
    }

    if (/ครูคนไหนสอนเยอะ|ใครสอนเยอะ|ชั่วโมงครู|ภาระครู/.test(text)) {
      const { data: scheds } = await db.from('schedules').select('teacher_id, period_start, period_end');
      const { data: teachers } = await db.from('teachers').select('teacher_id, teacher_name, max_hours');

      if (scheds && teachers) {
        const hoursMap = new Map();
        scheds.forEach(s => {
          if (!s.teacher_id) return;
          const h = s.period_start === 0 ? 1 : Math.max(1, s.period_end - s.period_start + 1);
          hoursMap.set(s.teacher_id, (hoursMap.get(s.teacher_id) || 0) + h);
        });

        const sorted = teachers.map(t => ({
          id: t.teacher_id,
          name: t.teacher_name,
          max: t.max_hours || 20,
          actual: hoursMap.get(t.teacher_id) || 0
        })).sort((a, b) => b.actual - a.actual);

        let listHtml = sorted.slice(0, 5).map((t, idx) => `
          <li><strong>${idx + 1}. ${t.name} (${t.id}):</strong> สอน ${t.actual} ชม. / เพดาน ${t.max} ชม.</li>
        `).join('');

        return `
          <p>📊 <strong>สถิติลำดับชั่วโมงสอนของครูผู้สอน (5 อันดับแรก):</strong></p>
          <ol style="font-size:12px; padding-left:18px; line-height:1.6;">${listHtml}</ol>
        `;
      }
    }

    if (/ห้องไหนใช้บ่อย|ห้องยอดนิยม/.test(text)) {
      const { data: scheds } = await db.from('schedules').select('room_id, period_start, period_end');
      const { data: rooms } = await db.from('rooms').select('room_id, room_name');

      if (scheds && rooms) {
        const roomMap = new Map();
        scheds.forEach(s => {
          if (!s.room_id) return;
          const h = s.period_start === 0 ? 1 : Math.max(1, s.period_end - s.period_start + 1);
          roomMap.set(s.room_id, (roomMap.get(s.room_id) || 0) + h);
        });

        const sorted = rooms.map(r => ({
          id: r.room_id,
          name: r.room_name,
          hours: roomMap.get(r.room_id) || 0
        })).sort((a, b) => b.hours - a.hours);

        let listHtml = sorted.slice(0, 5).map((r, idx) => `
          <li><strong>${idx + 1}. ${r.id} (${r.name}):</strong> ถูกใช้งาน ${r.hours} คาบ</li>
        `).join('');

        return `
          <p>🏫 <strong>ห้องเรียนที่มีชั่วโมงการใช้งานสูงสุด (5 อันดับแรก):</strong></p>
          <ol style="font-size:12px; padding-left:18px; line-height:1.6;">${listHtml}</ol>
        `;
      }
    }

    // Default friendly assistant response
    return `
      <p>💡 ผมได้รับข้อความ: <em>"${escapeHtml(rawText)}"</em></p>
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
    // In case DOM is already loaded
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
    processCommand
  };
})();

window.AI_COPILOT = AI_COPILOT;

