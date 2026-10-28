// ============================================================
//  EDUSCHED AI - STUDENTS MANAGEMENT (ข้อมูลนักเรียน)
// ============================================================

const STUDENTS = (() => {
  let _students = [];
  let _groups = [];
  let _filteredStudents = [];
  let _searchQuery = '';
  let _selectedGroup = '';
  let _selectedCondition = '';

  const LOCAL_STORAGE_KEY = 'edusched_students_cache';

  async function init() {
    await loadGroups();
    await loadStudents();
    renderTable();
  }

  // ── Load Groups for Select Dropdown ────────────────────────
  async function loadGroups() {
    try {
      const { data, error } = await db.from(TABLES.GROUPS).select('*').order('group_id');
      if (error) throw error;
      _groups = data || [];
      populateGroupSelects();
    } catch (err) {
      console.warn('Cannot load groups from Supabase:', err.message);
    }
  }

  function populateGroupSelects() {
    const sGroup = document.getElementById('s-group');
    const filterGroup = document.getElementById('filter-group');

    if (sGroup) {
      sGroup.innerHTML = '<option value="">-- เลือกกลุ่มเรียน --</option>';
      _groups.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.group_id;
        opt.textContent = `${g.group_id} - ${g.group_name}`;
        sGroup.appendChild(opt);
      });
    }

    if (filterGroup) {
      filterGroup.innerHTML = '<option value="">ทุกกลุ่มเรียน</option>';
      _groups.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.group_id;
        opt.textContent = `${g.group_id} - ${g.group_name}`;
        filterGroup.appendChild(opt);
      });
    }
  }

  // ── Auto-fill Department & Level when group selected ────────
  function onGroupSelected() {
    const sGroup = document.getElementById('s-group');
    const sLevel = document.getElementById('s-level');

    if (!sGroup || !sGroup.value) return;

    const g = _groups.find(x => x.group_id === sGroup.value);
    if (g) {
      // Auto-fill level from group name
      if (sLevel) {
        if (g.group_name.includes('ปวช.1')) sLevel.value = 'ปวช.1';
        else if (g.group_name.includes('ปวช.2')) sLevel.value = 'ปวช.2';
        else if (g.group_name.includes('ปวช.3')) sLevel.value = 'ปวช.3';
        else if (g.group_name.includes('ปวส.1')) sLevel.value = 'ปวส.1';
        else if (g.group_name.includes('ปวส.2')) sLevel.value = 'ปวส.2';
      }
    }
  }

  // ── Load Students ──────────────────────────────────────────
  async function loadStudents() {
    try {
      const { data, error } = await db.from(TABLES.STUDENTS).select('*').order('student_code');
      if (error) throw error;
      _students = data || [];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(_students));
    } catch (err) {
      console.warn('Supabase students table not ready, using local storage fallback:', err.message);
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        _students = JSON.parse(cached);
      } else {
        // Initial sample seed dataset for student competency
        _students = generateInitialStudents();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(_students));
      }
    }
    applyFilters();
  }

  function generateInitialStudents() {
    return [
      { id: 1, student_code: '67204010101', name: 'นายกิตติกร มั่นคง', group_id: '672040101', department: 'เทคโนโลยีสารสนเทศ', level: 'ปวช.1', special_condition: 'ปกติ' },
      { id: 2, student_code: '67204010102', name: 'นางสาวจิราภรณ์ วงศ์สว่าง', group_id: '672040101', department: 'เทคโนโลยีสารสนเทศ', level: 'ปวช.1', special_condition: 'ปกติ' },
      { id: 3, student_code: '67204010103', name: 'นายณัฐดนัย สมบูรณ์', group_id: '672040101', department: 'เทคโนโลยีสารสนเทศ', level: 'ปวช.1', special_condition: 'กลุ่มเรียนคู่ขนาน' },
      { id: 4, student_code: '67219010101', name: 'นายธนกฤต ศรีสุข', group_id: '672190101', department: 'ช่างยนต์', level: 'ปวช.1', special_condition: 'ปกติ' },
      { id: 5, student_code: '67219010102', name: 'นายธีรภัทร ใจกล้า', group_id: '672190101', department: 'ช่างยนต์', level: 'ปวช.1', special_condition: 'นักศึกษาวิชาทหาร (นศท.)' },
      { id: 6, student_code: '67219010201', name: 'นายปฏิภาณ เจริญผล', group_id: '672190102', department: 'ช่างยนต์', level: 'ปวช.1', special_condition: 'กลุ่มเรียนคู่ขนาน' },
      { id: 7, student_code: '66204010101', name: 'นายวรเมธ เกียรติศักดิ์', group_id: '662040101', department: 'เทคโนโลยีสารสนเทศ', level: 'ปวช.2', special_condition: 'ระบบทวิภาคี' }
    ];
  }

  // ── Render Stats ───────────────────────────────────────────
  function renderStats() {
    const sTotal = document.getElementById('stat-total-students');
    const sGroups = document.getElementById('stat-total-groups');
    const sSpecial = document.getElementById('stat-special-students');

    if (sTotal) sTotal.textContent = _students.length.toLocaleString();

    const uniqueGroups = new Set(_students.map(s => s.group_id).filter(Boolean));
    if (sGroups) sGroups.textContent = uniqueGroups.size;

    const specialCount = _students.filter(s => s.special_condition && s.special_condition !== 'ปกติ').length;
    if (sSpecial) sSpecial.textContent = specialCount;
  }

  // ── Filter and Search ──────────────────────────────────────
  function onSearch(query) {
    _searchQuery = (query || '').toLowerCase().trim();
    applyFilters();
  }

  function applyFilters() {
    const filterGroupEl = document.getElementById('filter-group');
    const filterCondEl = document.getElementById('filter-condition');

    _selectedGroup = filterGroupEl ? filterGroupEl.value : '';
    _selectedCondition = filterCondEl ? filterCondEl.value : '';

    _filteredStudents = _students.filter(s => {
      const matchSearch = !_searchQuery ||
        (s.student_code && s.student_code.toLowerCase().includes(_searchQuery)) ||
        (s.name && s.name.toLowerCase().includes(_searchQuery));

      const matchGroup = !_selectedGroup || s.group_id === _selectedGroup;
      const matchCond = !_selectedCondition || s.special_condition === _selectedCondition;

      return matchSearch && matchGroup && matchCond;
    });

    renderTable();
  }

  // ── Render Table ───────────────────────────────────────────
  function renderTable() {
    const tbody = document.getElementById('students-tbody');
    if (!tbody) return;

    if (_filteredStudents.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty">
            <i class="fas fa-user-slash"></i>
            <p>ไม่พบข้อมูลนักเรียน</p>
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    _filteredStudents.forEach((s, idx) => {
      const g = _groups.find(x => x.group_id === s.group_id);
      const groupLabel = g ? `${g.group_id} (${g.group_name})` : (s.group_id || '-');

      let badgeClass = 'badge-gray';
      if (s.special_condition === 'กลุ่มเรียนคู่ขนาน') badgeClass = 'badge-warning';
      else if (s.special_condition === 'ระบบทวิภาคี') badgeClass = 'badge-info';
      else if (s.special_condition && s.special_condition.includes('นศท')) badgeClass = 'badge-danger';
      else if (s.special_condition === 'เรียนร่วม') badgeClass = 'badge-primary';
      else if (s.special_condition === 'ปกติ') badgeClass = 'badge-success';

      html += `
        <tr>
          <td>${idx + 1}</td>
          <td><strong style="color:var(--text-primary);letter-spacing:0.3px;">${s.student_code}</strong></td>
          <td>${s.name}</td>
          <td><span style="color:#94a3b8;font-size:12.5px;">${groupLabel}</span></td>
          <td>${s.level || '-'}</td>
          <td><span class="badge ${badgeClass}">${s.special_condition || 'ปกติ'}</span></td>
          <td style="text-align:center;">
            <div style="display:inline-flex;gap:6px;">
              <button class="icon-btn" title="แก้ไข" onclick="STUDENTS.edit('${s.student_code}')" style="width:30px;height:30px;font-size:12px;">
                <i class="fas fa-pen-to-square"></i>
              </button>
              <button class="icon-btn text-danger" title="ลบ" onclick="STUDENTS.remove('${s.student_code}')" style="width:30px;height:30px;font-size:12px;">
                <i class="fas fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  // ── Save (Create / Update) ─────────────────────────────────
  async function save() {
    const sDbId = document.getElementById('student-db-id').value;
    const sCode = document.getElementById('s-code').value.trim();
    const sName = document.getElementById('s-name').value.trim();
    const sGroup = document.getElementById('s-group').value;
    const sLevel = document.getElementById('s-level').value;
    const sSpecial = document.getElementById('s-special').value;

    if (!sCode) {
      showToast('warning', 'กรุณากรอกรหัสประจำตัว', 'รหัสประจำตัวนักเรียนเป็นข้อมูลจำเป็น');
      document.getElementById('s-code').focus();
      return;
    }
    if (!sName) {
      showToast('warning', 'กรุณากรอกชื่อ-นามสกุล', 'ชื่อ-นามสกุลนักเรียนเป็นข้อมูลจำเป็น');
      document.getElementById('s-name').focus();
      return;
    }

    const payload = {
      student_code: sCode,
      name: sName,
      group_id: sGroup || null,
      level: sLevel || 'ปวช.1',
      special_condition: sSpecial || 'ปกติ'
    };

    const btn = document.getElementById('btn-save-student');
    if (btn) btn.disabled = true;

    try {
      let isSupabaseSuccess = false;
      try {
        if (sDbId) {
          const { error } = await db.from(TABLES.STUDENTS).update(payload).eq('id', sDbId);
          if (!error) isSupabaseSuccess = true;
        } else {
          const { error } = await db.from(TABLES.STUDENTS).insert([payload]);
          if (!error) isSupabaseSuccess = true;
        }
      } catch (e) {
        console.warn('Supabase direct write fallback:', e.message);
      }

      // Update local storage
      const existingIdx = _students.findIndex(s => s.student_code === sCode || (sDbId && s.id == sDbId));
      if (existingIdx >= 0) {
        _students[existingIdx] = { ..._students[existingIdx], ...payload };
      } else {
        _students.push({ id: Date.now(), ...payload });
      }

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(_students));

      showToast('success', 'บันทึกสำเร็จ', `ข้อมูลนักเรียน ${sName} ถูกบันทึกเรียบร้อยแล้ว`);
      clearForm();
      renderStats();
      applyFilters();
      switchTab('table');
    } catch (err) {
      showToast('error', 'บันทึกไม่สำเร็จ', err.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  // ── Edit Student ───────────────────────────────────────────
  function edit(studentCode) {
    const student = _students.find(s => s.student_code === studentCode);
    if (!student) return;

    document.getElementById('student-db-id').value = student.id || '';
    document.getElementById('s-code').value = student.student_code || '';
    document.getElementById('s-name').value = student.name || '';
    document.getElementById('s-group').value = student.group_id || '';
    document.getElementById('s-level').value = student.level || 'ปวช.1';
    document.getElementById('s-special').value = student.special_condition || 'ปกติ';

    switchTab('form');
    document.getElementById('s-name').focus();
  }

  // ── Delete Student ─────────────────────────────────────────
  async function remove(studentCode) {
    const student = _students.find(s => s.student_code === studentCode);
    if (!student) return;

    if (!confirm(`คุณต้องการลบข้อมูลนักเรียน "${student.name}" ใช่หรือไม่?`)) return;

    try {
      try {
        await db.from(TABLES.STUDENTS).delete().eq('student_code', studentCode);
      } catch (e) {
        console.warn('Supabase delete fallback:', e);
      }

      _students = _students.filter(s => s.student_code !== studentCode);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(_students));

      showToast('info', 'ลบสำเร็จ', `ลบข้อมูลนักเรียน ${student.name} เรียบร้อยแล้ว`);
      renderStats();
      applyFilters();
    } catch (err) {
      showToast('error', 'เกิดข้อผิดพลาด', err.message);
    }
  }

  // ── Clear Form ─────────────────────────────────────────────
  function clearForm() {
    document.getElementById('student-db-id').value = '';
    document.getElementById('s-code').value = '';
    document.getElementById('s-name').value = '';
    document.getElementById('s-group').value = '';
    document.getElementById('s-level').value = 'ปวช.1';
    document.getElementById('s-special').value = 'ปกติ';
  }

  // ── Tab Switcher ───────────────────────────────────────────
  function switchTab(tab) {
    const tabForm = document.getElementById('tab-form');
    const tabTable = document.getElementById('tab-table');
    const secForm = document.getElementById('section-form');
    const secTable = document.getElementById('section-table');

    if (tab === 'form') {
      tabForm.classList.add('active');
      tabTable.classList.remove('active');
      secForm.classList.remove('hidden');
      secTable.classList.add('hidden');
    } else {
      tabTable.classList.add('active');
      tabForm.classList.remove('active');
      secTable.classList.remove('hidden');
      secForm.classList.add('hidden');
    }
  }

  // ── Export Excel ───────────────────────────────────────────
  function exportExcel() {
    if (typeof XLSX === 'undefined') {
      showToast('error', 'ไม่พบไลบรารี XLSX');
      return;
    }

    if (_students.length === 0) {
      showToast('warning', 'ไม่มีข้อมูลนักเรียนที่จะส่งออก');
      return;
    }

    const dataRows = _students.map((s, idx) => ({
      'ลำดับ': idx + 1,
      'รหัสประจำตัว': s.student_code,
      'ชื่อ-นามสกุล': s.name,
      'รหัสกลุ่มเรียน': s.group_id || '',
      'ระดับชั้น': s.level || '',
      'แผนกวิชา': s.department || '',
      'เงื่อนไขพิเศษ': s.special_condition || 'ปกติ'
    }));

    const ws = XLSX.utils.json_to_sheet(dataRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'นักเรียน');
    saveXlsx(wb, `EduSched_Students_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('success', 'ส่งออกสำเร็จ', 'ดาวน์โหลดไฟล์ Excel เรียบร้อยแล้ว');
  }

  // ── Download Template Excel ────────────────────────────────
  function downloadTemplate() {
    if (typeof XLSX === 'undefined') {
      showToast('error', 'ไม่พบไลบรารี XLSX');
      return;
    }
    const templateData = [
      { 'รหัสประจำตัว': '67219010201', 'ชื่อ-นามสกุล': 'นายกิตติศักดิ์ พรหมดี', 'รหัสกลุ่มเรียน': '672190102', 'ระดับชั้น': 'ปวช.1', 'แผนกวิชา': 'เทคโนโลยีสารสนเทศ', 'เงื่อนไขพิเศษ': 'ปกติ' },
      { 'รหัสประจำตัว': '67219010202', 'ชื่อ-นามสกุล': 'น.ส.ชลธิชา สุขเกษม', 'รหัสกลุ่มเรียน': '672190102', 'ระดับชั้น': 'ปวช.1', 'แผนกวิชา': 'เทคโนโลยีสารสนเทศ', 'เงื่อนไขพิเศษ': 'ปกติ' },
      { 'รหัสประจำตัว': '67204010101', 'ชื่อ-นามสกุล': 'นายวรเมธ วิทยากร', 'รหัสกลุ่มเรียน': '672040101', 'ระดับชั้น': 'ปวช.1', 'แผนกวิชา': 'คอมพิวเตอร์ธุรกิจ', 'เงื่อนไขพิเศษ': 'โควตาพิเศษ' }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'แม่แบบนักเรียน');
    saveXlsx(wb, 'EduSched_Students_Template.xlsx');
    showToast('success', 'ดาวน์โหลดแม่แบบสำเร็จ', 'บันทึกเป็นไฟล์ Excel (.xlsx)');
  }

  // ── Import Excel ───────────────────────────────────────────
  function importExcel(inputEl) {
    const file = inputEl.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);

        if (!rows || rows.length === 0) {
          showToast('warning', 'ไฟล์ว่างเปล่า', 'ไม่พบข้อมูลในไฟล์ Excel');
          return;
        }

        let importedCount = 0;
        const dbBatch = [];
        rows.forEach(r => {
          const code = String(r['รหัสประจำตัว'] || r['student_code'] || r['รหัสนักเรียน'] || '').trim();
          const name = String(r['ชื่อ-นามสกุล'] || r['name'] || r['ชื่อ'] || '').trim();
          if (code && name) {
            const group = String(r['รหัสกลุ่มเรียน'] || r['group_id'] || r['กลุ่มเรียน'] || '').trim();
            const level = String(r['ระดับชั้น'] || r['level'] || 'ปวช.1').trim();
            const dept = String(r['แผนกวิชา'] || r['department'] || 'เทคโนโลยีสารสนเทศ').trim();
            const cond = String(r['เงื่อนไขพิเศษ'] || r['special_condition'] || 'ปกติ').trim();

            const existingIdx = _students.findIndex(s => s.student_code === code);
            const item = { student_code: code, name, group_id: group || null, level, department: dept, special_condition: cond };

            if (existingIdx >= 0) {
              _students[existingIdx] = { ..._students[existingIdx], ...item };
            } else {
              _students.push({ id: Date.now() + Math.random(), ...item });
            }
            dbBatch.push(item);
            importedCount++;
          }
        });

        // Upsert to Supabase
        if (dbBatch.length > 0) {
          try {
            await db.from(TABLES.STUDENTS).upsert(dbBatch, { onConflict: 'student_code' });
          } catch (supErr) {
            console.warn('Supabase students upsert fallback:', supErr.message);
          }
        }

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(_students));
        showToast('success', 'นำเข้าสำเร็จ', `นำเข้าข้อมูลนักเรียน ${importedCount} คนเรียบร้อยแล้ว`);

        renderStats();
        applyFilters();
        switchTab('table');
      } catch (err) {
        showToast('error', 'นำเข้าไฟล์ไม่สำเร็จ', err.message);
      } finally {
        inputEl.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // Auto initialize on DOM ready
  document.addEventListener('DOMContentLoaded', init);

  return {
    init,
    save,
    edit,
    remove,
    clearForm,
    switchTab,
    onSearch,
    applyFilters,
    onGroupSelected,
    exportExcel,
    importExcel,
    downloadTemplate
  };
})();