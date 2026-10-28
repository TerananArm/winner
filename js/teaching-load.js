// ============================================================
//  EDUSCHED AI - TEACHING LOADS (ภาระงานสอน)
// ============================================================

const TL = (() => {
  let _loads = [];
  let _teachers = [];
  let _subjects = [];
  let _deleteId = null;

  async function loadAll() {
    try {
      const [loadsRes, teachersRes, subjectsRes] = await Promise.all([
        db.from(TABLES.TEACHING_LOADS).select('*').order('id', { ascending: false }),
        db.from(TABLES.TEACHERS).select('*').order('teacher_name'),
        db.from(TABLES.SUBJECTS).select('*').order('subject_id')
      ]);

      _loads = loadsRes.data || [];
      _teachers = teachersRes.data || [];
      _subjects = subjectsRes.data || [];

      populateDropdowns();
      renderTable();
    } catch (err) {
      console.error('Error loading teaching loads:', err);
      showToast('error', 'โหลดข้อมูลล้มเหลว', err.message);
    }
  }

  function populateDropdowns() {
    const tSelect = document.getElementById('tl-teacher');
    const sSelect = document.getElementById('tl-subject');

    if (tSelect) {
      tSelect.innerHTML = '<option value="">-- เลือกอาจารย์ --</option>' +
        _teachers.map(t => `<option value="${t.teacher_id}">${t.teacher_name} (${t.teacher_id})</option>`).join('');
    }

    if (sSelect) {
      sSelect.innerHTML = '<option value="">-- เลือกรายวิชา --</option>' +
        _subjects.map(s => `<option value="${s.subject_id}">${s.subject_id} - ${s.subject_name}</option>`).join('');
    }
  }

  async function save() {
    const teacherId = document.getElementById('tl-teacher')?.value;
    const subjectId = document.getElementById('tl-subject')?.value;

    if (!teacherId || !subjectId) {
      showToast('warning', 'กรุณากรอกข้อมูลให้ครบ', 'โปรดเลือกทั้งอาจารย์และรายวิชา');
      return;
    }

    const payload = {
      teacher_id: teacherId,
      subject_id: subjectId,
      hours_per_week: 0,
      semester: '1',
      academic_year: '2568'
    };

    const btn = document.getElementById('btn-save-tl');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner"></div> กำลังบันทึก...';
    }

    try {
      const { error } = await db.from(TABLES.TEACHING_LOADS).upsert([payload], {
        onConflict: 'teacher_id,subject_id,semester,academic_year'
      });
      if (error) throw error;
      showToast('success', 'บันทึกสำเร็จ', 'มอบหมายภาระงานสอนเรียบร้อยแล้ว');
      clearForm();
      await loadAll();
      switchTab('table');
    } catch (err) {
      showToast('error', 'บันทึกล้มเหลว', err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-floppy-disk"></i> บันทึกข้อมูล';
      }
    }
  }

  function clearForm() {
    const tSelect = document.getElementById('tl-teacher');
    const sSelect = document.getElementById('tl-subject');
    if (tSelect) tSelect.value = '';
    if (sSelect) sSelect.value = '';
  }

  function renderTable(data = _loads) {
    const tbody = document.getElementById('tl-tbody');
    if (!tbody) return;

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted);">ไม่มีข้อมูลภาระงานสอน</td></tr>';
      return;
    }

    tbody.innerHTML = data.map((l, i) => {
      const t = _teachers.find(tch => tch.teacher_id === l.teacher_id);
      const s = _subjects.find(sbj => sbj.subject_id === l.subject_id);
      return `
        <tr>
          <td>${i + 1}</td>
          <td><span class="badge badge-gray">${l.teacher_id}</span></td>
          <td style="font-weight:600;">${t ? t.teacher_name : '-'}</td>
          <td><span class="badge badge-primary">${l.subject_id}</span></td>
          <td>${s ? s.subject_name : '-'}</td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="TL.openDeleteModal(${l.id})" title="ลบภาระงานสอน">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function switchTab(tab) {
    document.getElementById('section-form')?.classList.toggle('hidden', tab !== 'form');
    document.getElementById('section-table')?.classList.toggle('hidden', tab !== 'table');
    document.getElementById('tab-form')?.classList.toggle('active', tab === 'form');
    document.getElementById('tab-table')?.classList.toggle('active', tab === 'table');
  }

  function filterTable(q) {
    const query = q.toLowerCase();
    renderTable(_loads.filter(l => {
      const t = _teachers.find(tch => tch.teacher_id === l.teacher_id);
      const s = _subjects.find(sbj => sbj.subject_id === l.subject_id);
      return (
        l.teacher_id.toLowerCase().includes(query) ||
        (t && t.teacher_name.toLowerCase().includes(query)) ||
        l.subject_id.toLowerCase().includes(query) ||
        (s && s.subject_name.toLowerCase().includes(query))
      );
    }));
  }

  function openDeleteModal(id) {
    _deleteId = id;
    document.getElementById('deleteModal')?.classList.remove('hidden');
  }

  function closeDeleteModal() {
    _deleteId = null;
    document.getElementById('deleteModal')?.classList.add('hidden');
  }

  async function confirmDelete() {
    if (!_deleteId) return;
    try {
      const { error } = await db.from(TABLES.TEACHING_LOADS).delete().eq('id', _deleteId);
      if (error) throw error;
      showToast('success', 'ลบสำเร็จ', 'ลบรายการภาระงานสอนเรียบร้อย');
      closeDeleteModal();
      await loadAll();
    } catch (err) {
      showToast('error', 'ลบล้มเหลว', err.message);
    }
  }

  function exportExcel() {
    if (typeof XLSX === 'undefined') {
      showToast('error', 'ไม่พบไลบรารี XLSX');
      return;
    }
    if (_loads.length === 0) {
      showToast('warning', 'ไม่มีข้อมูลภาระงานสอน');
      return;
    }
    const rows = _loads.map((l, idx) => {
      const t = _teachers.find(tch => tch.teacher_id === l.teacher_id);
      const s = _subjects.find(sbj => sbj.subject_id === l.subject_id);
      return {
        'ลำดับ': idx + 1,
        'รหัสอาจารย์': l.teacher_id,
        'ชื่ออาจารย์': t ? t.teacher_name : '',
        'รหัสวิชา': l.subject_id,
        'ชื่อวิชา': s ? s.subject_name : '',
        'ชั่วโมง/สัปดาห์': l.hours_per_week || 0
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ภาระงานสอน');
    saveXlsx(wb, `EduSched_TeachingLoads_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('success', 'ส่งออกสำเร็จ', 'บันทึกเป็นไฟล์ Excel (.xlsx)');
  }

  function downloadTemplate() {
    if (typeof XLSX === 'undefined') { showToast('error', 'ไม่พบไลบรารี XLSX'); return; }
    const ws = XLSX.utils.json_to_sheet([
      { 'รหัสอาจารย์': 'T01', 'รหัสวิชา': '20000-1101' },
      { 'รหัสอาจารย์': 'T02', 'รหัสวิชา': '30204-2001' },
      { 'รหัสอาจารย์': 'T03', 'รหัสวิชา': '20001-1001' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'แม่แบบภาระงานสอน');
    saveXlsx(wb, 'EduSched_TeachingLoads_Template.xlsx');
    showToast('success', 'ดาวน์โหลดแม่แบบสำเร็จ');
  }

  let _pendingImportBatch = [];

  function importExcel(inputEl) {
    const file = inputEl.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const wb   = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        if (!rows?.length) { showToast('warning', 'ไม่พบข้อมูลในไฟล์ Excel'); return; }
        const map = new Map();
        rows.forEach(r => {
          const tid = String(r['รหัสอาจารย์'] || r['teacher_id'] || '').trim();
          const sid = String(r['รหัสวิชา'] || r['subject_id'] || '').trim();
          if (tid && sid) {
            const key = `${tid}_${sid}_1_2568`;
            map.set(key, { teacher_id: tid, subject_id: sid, hours_per_week: 0, semester: '1', academic_year: '2568' });
          }
        });
        _pendingImportBatch = Array.from(map.values());
        if (!_pendingImportBatch.length) {
          showToast('warning', 'ไม่พบข้อมูลที่ถูกต้องในไฟล์', 'กรุณาตรวจสอบรหัสอาจารย์และรหัสวิชา');
          return;
        }

        // Render preview modal
        const totalEl = document.getElementById('tl-preview-total');
        const validEl = document.getElementById('tl-preview-valid');
        const tbodyEl = document.getElementById('tl-preview-tbody');
        if (totalEl) totalEl.textContent = rows.length;
        if (validEl) validEl.textContent = _pendingImportBatch.length;
        if (tbodyEl) {
          tbodyEl.innerHTML = _pendingImportBatch.slice(0, 5).map((item, idx) => `
            <tr>
              <td style="padding:6px 10px;">${idx + 1}</td>
              <td style="padding:6px 10px; font-weight:600; color:var(--primary-light);">${escapeHtml(item.teacher_id)}</td>
              <td style="padding:6px 10px;">${escapeHtml(item.subject_id)}</td>
              <td style="padding:6px 10px; color:var(--text-muted);">${item.semester}/${item.academic_year}</td>
            </tr>
          `).join('');
        }
        document.getElementById('importPreviewModal')?.classList.remove('hidden');
      } catch (err) {
        showToast('error', 'อ่านไฟล์ล้มเหลว', err.message);
      } finally {
        inputEl.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function closeImportPreviewModal() {
    document.getElementById('importPreviewModal')?.classList.add('hidden');
    _pendingImportBatch = [];
  }

  async function confirmImport() {
    if (!_pendingImportBatch.length) return;
    const btn = document.getElementById('tl-btn-confirm-import');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...'; }
    try {
      const { error } = await db.from(TABLES.TEACHING_LOADS).upsert(_pendingImportBatch, {
        onConflict: 'teacher_id,subject_id,semester,academic_year'
      });
      if (error) throw error;
      showToast('success', `นำเข้าภาระงานสอน ${_pendingImportBatch.length} รายการเรียบร้อย`);
      closeImportPreviewModal();
      await loadAll();
      switchTab('table');
    } catch (err) {
      showToast('error', 'บันทึกข้อมูลล้มเหลว', err.message);
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-floppy-disk"></i> ยืนยันบันทึกลงฐานข้อมูล'; }
    }
  }

  return {
    loadAll,
    save,
    clearForm,
    renderTable,
    switchTab,
    filterTable,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    exportExcel,
    downloadTemplate,
    importExcel,
    closeImportPreviewModal,
    confirmImport
  };
})();

document.addEventListener('DOMContentLoaded', () => TL.loadAll());

