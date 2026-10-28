// ============================================================
//  EDUSCHED AI – TEACHERS MANAGEMENT (อาจารย์ผู้สอน)
//  Unavailable-time stored as structured JSON for schedule engine
// ============================================================

const TEACHERS = (() => {
  let _teachers = [];
  let _deleteId = null;

  // ── Constants ──────────────────────────────────────────────
  const DAYS    = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];
  const DAY_SHORT = { จันทร์: 'จ.', อังคาร: 'อ.', พุธ: 'พ.', พฤหัสบดี: 'พฤ.', ศุกร์: 'ศ.' };
  const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const P_TIMES = ['', '08:00', '08:50', '09:40', '10:30', '11:20', '12:10', '13:00', '13:50', '14:40', '15:30'];

  // ── Unavailability State (Set of "วัน-คาบ" keys) ──────────
  let _unavailSlots = new Set();

  // ── Build Interactive Grid ─────────────────────────────────
  function buildUnavailGrid() {
    const container = document.getElementById('unavail-grid-container');
    if (!container) return;

    let html = `<table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:rgba(255,255,255,0.03);">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:var(--text-muted);
              font-weight:600;border-bottom:1px solid var(--border);min-width:88px;">
            วัน \\ คาบ
          </th>`;

    PERIODS.forEach(p => {
      const isLunch = p === 5;
      html += `<th title="${P_TIMES[p]}–${P_TIMES[Math.min(p + 1, 10)]}"
        style="padding:7px 2px;text-align:center;font-size:10px;color:var(--text-muted);
          font-weight:600;border-bottom:1px solid var(--border);cursor:default;
          ${isLunch ? 'background:rgba(251,191,36,0.07);' : ''}">
        <div style="font-size:12px;font-weight:700;color:var(--text-secondary);">${p}</div>
        <div style="font-size:9px;opacity:0.55;">${P_TIMES[p]}</div>
      </th>`;
    });

    html += `<th style="padding:7px 8px;text-align:center;font-size:10px;color:var(--text-muted);
        font-weight:600;border-bottom:1px solid var(--border);min-width:52px;">ทั้งวัน</th>
      </tr>
    </thead><tbody>`;

    DAYS.forEach((day, di) => {
      html += `<tr style="${di % 2 === 1 ? 'background:rgba(255,255,255,0.015);' : ''}">
        <td style="padding:5px 12px;font-size:12px;font-weight:600;color:var(--text-secondary);
            white-space:nowrap;border-bottom:1px solid rgba(255,255,255,0.04);">${day}</td>`;

      PERIODS.forEach(p => {
        const isLunch = p === 5;
        html += `<td style="padding:3px 2px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.04);
            ${isLunch ? 'background:rgba(251,191,36,0.03);' : ''}">
          <div id="slot-${day}-${p}"
            onclick="TEACHERS.toggleSlot('${day}',${p})"
            title="${day} คาบ ${p} (${P_TIMES[p]}–${P_TIMES[Math.min(p + 1, 10)]})"
            style="width:30px;height:26px;border-radius:5px;border:1px solid var(--border);cursor:pointer;
              transition:background 0.12s,border-color 0.12s;margin:0 auto;display:flex;
              align-items:center;justify-content:center;font-size:9px;
              background:rgba(255,255,255,0.04);user-select:none;"></div>
        </td>`;
      });

      html += `<td style="padding:3px 4px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.04);">
        <button type="button" onclick="TEACHERS.selectDay('${day}')"
          title="เลือก/ยกเลิกทั้งวัน${day}"
          style="width:30px;height:26px;border-radius:5px;border:1px solid var(--border);cursor:pointer;
            background:rgba(255,255,255,0.04);color:var(--text-muted);font-size:11px;
            transition:background 0.12s;"
          onmouseover="this.style.background='rgba(239,68,68,0.14)'"
          onmouseout="this.style.background='rgba(255,255,255,0.04)'">✕</button>
      </td></tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  }

  // ── Toggle single slot ─────────────────────────────────────
  function toggleSlot(day, period) {
    const key = `${day}-${period}`;
    _unavailSlots.has(key) ? _unavailSlots.delete(key) : _unavailSlots.add(key);
    refreshSlot(day, period);
  }

  function refreshSlot(day, period) {
    const el = document.getElementById(`slot-${day}-${period}`);
    if (!el) return;
    if (_unavailSlots.has(`${day}-${period}`)) {
      el.style.background    = 'rgba(239,68,68,0.18)';
      el.style.borderColor   = 'rgba(239,68,68,0.6)';
      el.innerHTML           = '<i class="fas fa-xmark" style="color:#f87171;font-size:9px;"></i>';
    } else {
      el.style.background    = 'rgba(255,255,255,0.04)';
      el.style.borderColor   = 'var(--border)';
      el.innerHTML           = '';
    }
  }

  // ── Toggle all periods in one day ──────────────────────────
  function selectDay(day) {
    const allOn = PERIODS.every(p => _unavailSlots.has(`${day}-${p}`));
    PERIODS.forEach(p => {
      const key = `${day}-${p}`;
      allOn ? _unavailSlots.delete(key) : _unavailSlots.add(key);
      refreshSlot(day, p);
    });
  }

  // ── Clear all slots ────────────────────────────────────────
  function clearUnavail() {
    _unavailSlots.clear();
    DAYS.forEach(day => PERIODS.forEach(p => refreshSlot(day, p)));
  }

  // ── Serialize → JSON string for DB storage ─────────────────
  // Format: {"จันทร์":[1,2],"พุธ":[6,7,8,9,10]}
  function getUnavailJSON() {
    if (_unavailSlots.size === 0) return null;
    const obj = {};
    _unavailSlots.forEach(key => {
      const dash = key.lastIndexOf('-');
      const day  = key.slice(0, dash);
      const p    = parseInt(key.slice(dash + 1));
      (obj[day] = obj[day] || []).push(p);
    });
    DAYS.forEach(d => { if (obj[d]) obj[d].sort((a, b) => a - b); });
    return JSON.stringify(obj);
  }

  // ── Deserialize from DB JSON (or old text → ignored) ───────
  function setUnavailFromData(jsonStr) {
    clearUnavail();
    if (!jsonStr || jsonStr === 'ไม่มี' || jsonStr === '-' || jsonStr === 'null') return;
    try {
      const obj = JSON.parse(jsonStr);
      Object.entries(obj).forEach(([day, periods]) => {
        (periods || []).forEach(p => {
          _unavailSlots.add(`${day}-${p}`);
          refreshSlot(day, p);
        });
      });
    } catch (e) {
      console.warn('[TEACHERS] Old text format cannot be parsed into grid:', jsonStr);
    }
  }

  // ── Format for table cell display ─────────────────────────
  function formatUnavail(jsonStr) {
    if (!jsonStr || jsonStr === 'ไม่มี' || jsonStr === 'null') {
      return '<span style="color:#64748b;">–</span>';
    }
    try {
      const obj = JSON.parse(jsonStr);
      const parts = [];
      DAYS.forEach(d => {
        if (obj[d] && obj[d].length > 0) {
          const pStr = obj[d].length === 10 ? 'ทุกคาบ' : `คาบ ${obj[d].join(',')}`;
          parts.push(`<span class="badge badge-warning" style="font-size:10px;margin:1px;">${DAY_SHORT[d]} ${pStr}</span>`);
        }
      });
      return parts.length
        ? `<div style="display:flex;flex-wrap:wrap;gap:2px;">${parts.join('')}</div>`
        : '<span style="color:#64748b;">–</span>';
    } catch (e) {
      // Old free-text fallback
      return `<span class="badge badge-warning" style="font-size:10px;">${jsonStr}</span>`;
    }
  }

  // ── Load All ───────────────────────────────────────────────
  async function loadAll() {
    try {
      const { data, error } = await db.from(TABLES.TEACHERS).select('*').order('teacher_id');
      if (error) throw error;
      _teachers = data || [];
      renderTable();
    } catch (err) {
      showToast('error', 'โหลดล้มเหลว', err.message);
    }
  }

  // ── Save / Upsert ──────────────────────────────────────────
  async function save() {
    const id      = document.getElementById('t-id').value.trim();
    const name    = document.getElementById('t-name').value.trim();
    const role    = document.getElementById('t-role').value;
    const maxH    = parseInt(document.getElementById('t-max-hours')?.value || '20', 10);
    const unavail = getUnavailJSON();

    if (!id || !name || !role) {
      showToast('error', 'กรุณากรอกข้อมูล * ให้ครบ');
      return;
    }

    const payload = { teacher_id: id, teacher_name: name, role, max_hours: maxH, unavailable_time: unavail };
    const btn = document.getElementById('btn-save-teacher');
    if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>'; }

    try {
      const { error } = await db.from(TABLES.TEACHERS).upsert([payload], { onConflict: 'teacher_id' });
      if (error) throw error;
      showToast('success', 'บันทึกสำเร็จ', `ข้อมูล ${name} ถูกบันทึกเรียบร้อย`);
      clearForm();
      await loadAll();
      switchTab('table');
    } catch (err) {
      showToast('error', 'บันทึกล้มเหลว', err.message);
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-floppy-disk"></i> บันทึกข้อมูล'; }
    }
  }

  // ── Render Table ───────────────────────────────────────────
  function renderTable(data = _teachers) {
    const tbody = document.getElementById('teachers-tbody');
    if (!tbody) return;

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted);">ไม่มีข้อมูลอาจารย์</td></tr>';
      return;
    }

    tbody.innerHTML = data.map((t, i) => `<tr>
      <td>${i + 1}</td>
      <td><span class="badge badge-gray" style="font-weight:700;">${t.teacher_id}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--cyan));
              display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;">
            ${(t.teacher_name || 'T').charAt(0)}
          </div>
          <span style="font-weight:600;">${t.teacher_name}</span>
        </div>
      </td>
      <td><span class="badge ${t.role === 'อาจารย์' ? 'badge-primary' : 'badge-info'}">${t.role}</span></td>
      <td><span style="font-weight:600;color:#38bdf8;">${t.max_hours || 20}</span> คาบ/สัปดาห์</td>
      <td>${formatUnavail(t.unavailable_time)}</td>
      <td style="text-align:center;">
        <div style="display:inline-flex;gap:6px;">
          <button class="btn btn-ghost btn-sm" onclick="TEACHERS.edit(${t.id})" title="แก้ไขข้อมูล">
            <i class="fas fa-pen-to-square"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="TEACHERS.openModal(${t.id})" title="ลบอาจารย์">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>`).join('');
  }

  // ── Edit (load into form) ──────────────────────────────────
  function edit(id) {
    const t = _teachers.find(x => x.id === id);
    if (!t) return;
    document.getElementById('t-id').value   = t.teacher_id;
    document.getElementById('t-name').value = t.teacher_name;
    document.getElementById('t-role').value = t.role || 'อาจารย์';
    const mhEl = document.getElementById('t-max-hours');
    if (mhEl) mhEl.value = t.max_hours || 20;
    setUnavailFromData(t.unavailable_time);
    switchTab('form');
    document.getElementById('t-name').focus();
    showToast('info', 'โหมดแก้ไขข้อมูล', `กำลังแก้ไขข้อมูล ${t.teacher_name}`);
  }

  // ── Clear Form ─────────────────────────────────────────────
  function clearForm() {
    document.getElementById('t-id').value   = '';
    document.getElementById('t-name').value = '';
    document.getElementById('t-role').value = 'อาจารย์';
    const mhEl = document.getElementById('t-max-hours');
    if (mhEl) mhEl.value = '20';
    clearUnavail();
  }

  // ── Tab Switcher ───────────────────────────────────────────
  function switchTab(tab) {
    document.getElementById('section-form')?.classList.toggle('hidden', tab !== 'form');
    document.getElementById('section-table')?.classList.toggle('hidden', tab !== 'table');
    document.getElementById('tab-form')?.classList.toggle('active', tab === 'form');
    document.getElementById('tab-table')?.classList.toggle('active', tab === 'table');
  }

  // ── Filter / Search ────────────────────────────────────────
  function filter(q) {
    const qLow = q.toLowerCase();
    renderTable(_teachers.filter(t =>
      (t.teacher_id   && t.teacher_id.toLowerCase().includes(qLow)) ||
      (t.teacher_name && t.teacher_name.toLowerCase().includes(qLow))
    ));
  }

  function filterRole(role) {
    renderTable(role ? _teachers.filter(t => t.role === role) : _teachers);
  }

  // ── Delete Modal ───────────────────────────────────────────
  function openModal(id) {
    _deleteId = id;
    document.getElementById('deleteModal')?.classList.remove('hidden');
  }

  function closeModal() {
    _deleteId = null;
    document.getElementById('deleteModal')?.classList.add('hidden');
  }

  async function confirmDelete() {
    if (!_deleteId) return;
    try {
      const { error } = await db.from(TABLES.TEACHERS).delete().eq('id', _deleteId);
      if (error) throw error;
      showToast('success', 'ลบสำเร็จ');
      closeModal();
      loadAll();
    } catch (err) {
      showToast('error', 'ลบล้มเหลว', err.message);
    }
  }

  // ── XLSX Helper ────────────────────────────────────────────
  function saveXlsx(wb, filename) {
    const name = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    try {
      const b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      const a = Object.assign(document.createElement('a'), {
        href: 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + b64,
        download: name
      });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (e) {
      XLSX.writeFile(wb, name);
    }
  }

  // ── Unavail JSON → readable string (for Excel export) ──────
  function unavailToText(jsonStr) {
    if (!jsonStr || jsonStr === 'null') return '–';
    try {
      const obj = JSON.parse(jsonStr);
      return DAYS.filter(d => obj[d] && obj[d].length)
        .map(d => `${d} คาบ ${obj[d].join(',')}`)
        .join(' | ') || '–';
    } catch (e) {
      return jsonStr;
    }
  }

  // ── Download Template ──────────────────────────────────────
  function downloadTemplate() {
    if (typeof XLSX === 'undefined') { showToast('error', 'ไม่พบไลบรารี XLSX'); return; }
    const ws = XLSX.utils.json_to_sheet([
      { 'รหัสอาจารย์': 'T01', 'ชื่อ-นามสกุล': 'ครูสมชาย ใจดี', 'ตำแหน่ง': 'อาจารย์', 'ชั่วโมงสอนสูงสุด': 20, 'เวลาที่ไม่สะดวก (JSON)': '{"จันทร์":[1,2]}' },
      { 'รหัสอาจารย์': 'T02', 'ชื่อ-นามสกุล': 'ครูสมหญิง รักเรียน', 'ตำแหน่ง': 'หัวหน้าแผนก', 'ชั่วโมงสอนสูงสุด': 18, 'เวลาที่ไม่สะดวก (JSON)': '{"พุธ":[6,7,8,9,10]}' },
      { 'รหัสอาจารย์': 'T03', 'ชื่อ-นามสกุล': 'ครูวิชัย เก่งการ', 'ตำแหน่ง': 'ครูพิเศษ', 'ชั่วโมงสอนสูงสุด': 24, 'เวลาที่ไม่สะดวก (JSON)': '' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'แม่แบบอาจารย์');
    saveXlsx(wb, 'EduSched_Teachers_Template.xlsx');
    showToast('success', 'ดาวน์โหลดแม่แบบสำเร็จ', 'รูปแบบ JSON ตัวอย่างอยู่ในคอลัมน์สุดท้าย');
  }

  // ── Export Excel ───────────────────────────────────────────
  function exportExcel() {
    if (typeof XLSX === 'undefined') { showToast('error', 'ไม่พบไลบรารี XLSX'); return; }
    if (_teachers.length === 0) { showToast('warning', 'ไม่มีข้อมูลอาจารย์'); return; }
    const rows = _teachers.map((t, i) => ({
      'ลำดับ': i + 1,
      'รหัสอาจารย์': t.teacher_id,
      'ชื่อ-นามสกุล': t.teacher_name,
      'ตำแหน่ง': t.role,
      'ชั่วโมงสอนสูงสุด': t.max_hours || 20,
      'เวลาที่ไม่สะดวก': unavailToText(t.unavailable_time)
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'อาจารย์');
    saveXlsx(wb, `EduSched_Teachers_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('success', 'ส่งออกสำเร็จ', 'บันทึกเป็นไฟล์ Excel (.xlsx)');
  }

  // ── Import Excel ───────────────────────────────────────────
  function importExcel(inputEl) {
    const file = inputEl.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const wb   = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        if (!rows?.length) { showToast('warning', 'ไม่พบข้อมูลในไฟล์ Excel'); return; }
        const batch = rows.flatMap(r => {
          const id   = String(r['รหัสอาจารย์'] || r['teacher_id'] || '').trim();
          const name = String(r['ชื่อ-นามสกุล'] || r['teacher_name'] || '').trim();
          if (!id || !name) return [];
          return [{
            teacher_id: id,
            teacher_name: name,
            role: String(r['ตำแหน่ง'] || r['role'] || 'อาจารย์').trim(),
            max_hours: parseInt(r['ชั่วโมงสอนสูงสุด'] || r['max_hours'] || 20, 10),
            unavailable_time: r['เวลาที่ไม่สะดวก (JSON)'] || r['unavailable_time'] || null
          }];
        });
        if (batch.length) {
          const { error } = await db.from(TABLES.TEACHERS).upsert(batch, { onConflict: 'teacher_id' });
          if (error) throw error;
          showToast('success', `นำเข้าข้อมูลอาจารย์ ${batch.length} ท่านเรียบร้อย`);
          await loadAll();
          switchTab('table');
        }
      } catch (err) {
        showToast('error', 'นำเข้าล้มเหลว', err.message);
      } finally {
        inputEl.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    loadAll,
    buildUnavailGrid,
    save,
    clearForm,
    switchTab,
    filter,
    filterRole,
    openModal,
    closeModal,
    confirmDelete,
    exportExcel,
    importExcel,
    downloadTemplate,
    edit,
    toggleSlot,
    selectDay,
    clearUnavail,
    // Expose for schedule engine
    getUnavailJSON,
    setUnavailFromData
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  TEACHERS.buildUnavailGrid();
  TEACHERS.loadAll();
});
