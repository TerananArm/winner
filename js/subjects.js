
const SUBJECTS = (() => {
  let _subjects = []; let _deleteId = null;
  async function loadAll() {
    const { data, error } = await db.from(TABLES.SUBJECTS).select('*').order('subject_id');
    if (error) { showToast('error', 'โหลดล้มเหลว', error.message); return; }
    _subjects = data || []; renderTable();
  }
  async function save() {
    const id = document.getElementById('s-id').value.trim();
    const name = document.getElementById('s-name').value.trim();
    const theory = document.getElementById('s-theory').value;
    const practice = document.getElementById('s-practice').value;
    const credit = document.getElementById('s-credit').value;
    if (!id || !name) { showToast('error', 'กรุณากรอกข้อมูล * ให้ครบ'); return; }
    const payload = { subject_id: id, subject_name: name, theory: theory ? parseInt(theory) : 0, practice: practice ? parseInt(practice) : 0, credit: credit ? parseInt(credit) : 0 };
    const btn = document.getElementById('btn-save-subject');
    btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>';
    const { error } = await db.from(TABLES.SUBJECTS).upsert([payload], { onConflict: 'subject_id' });
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-floppy-disk"></i> บันทึกข้อมูล';
    if (error) { showToast('error', 'บันทึกล้มเหลว', error.message); return; }
    showToast('success', 'บันทึกสำเร็จ'); clearForm(); loadAll();
  }
  function autoDetectType(val) {
     const clean = val.replace(/[^0-9]/g, '');
     const hint = document.getElementById('subject-type-hint');
     if(!hint) return;
     if(clean.startsWith('20') || clean.startsWith('30')) hint.innerHTML = '<span style="color:var(--primary-light)"><i class="fas fa-users"></i> วิชาสามัญ</span>';
     else if(clean.length > 2) hint.innerHTML = '<span style="color:var(--warning)"><i class="fas fa-flask"></i> วิชาปฏิบัติ</span>';
     else hint.innerHTML = '';
  }
  function calcCredit() {
     const theory = parseInt(document.getElementById('s-theory').value) || 0;
     const practice = parseInt(document.getElementById('s-practice').value) || 0;
     document.getElementById('s-credit').value = theory + Math.floor(practice / 2);
  }
  function renderTable(data = _subjects) {
    const tbody = document.getElementById('subjects-tbody');
    if (data.length === 0) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;">ไม่มีข้อมูล</td></tr>'; return; }
    tbody.innerHTML = data.map((s, i) => {
      const type = (s.subject_id.startsWith('20') || s.subject_id.startsWith('30')) ? 'สามัญ' : 'ปฏิบัติ';
      const typeClass = type === 'สามัญ' ? 'badge-primary' : 'badge-warning';
      return `<tr>
      <td>${i+1}</td>
      <td><span class="badge ${typeClass}">${type}</span></td>
      <td><span class="badge badge-gray">${s.subject_id}</span></td>
      <td style="font-weight:600;">${s.subject_name}</td>
      <td>${s.theory||0}</td>
      <td>${s.practice||0}</td>
      <td><span class="badge badge-info">${s.credit||0}</span></td>
      <td><button class="btn btn-danger btn-sm" onclick="SUBJECTS.openModal(${s.id})" title="ลบรายวิชา"><i class="fas fa-trash"></i></button></td>
    </tr>`}).join('');
  }
  function clearForm() { document.getElementById('s-id').value=''; document.getElementById('s-name').value=''; document.getElementById('s-theory').value=''; document.getElementById('s-practice').value=''; document.getElementById('s-credit').value=''; document.getElementById('s-dept').value=''; document.getElementById('subject-type-hint').innerHTML=''; }
  function switchTab(tab) {
    document.getElementById('section-form').classList.toggle('hidden', tab!=='form');
    document.getElementById('section-table').classList.toggle('hidden', tab!=='table');
    document.getElementById('tab-form').classList.toggle('active', tab==='form');
    document.getElementById('tab-table').classList.toggle('active', tab==='table');
  }
  function filter(q) { renderTable(_subjects.filter(s => s.subject_id.toLowerCase().includes(q.toLowerCase()) || s.subject_name.toLowerCase().includes(q.toLowerCase()))); }
  function filterType(type) {
    ['all', 'samarn', 'practice'].forEach(k => document.getElementById(`ftab-${k}`)?.classList.remove('active'));
    const tabId = type === 'all' ? 'ftab-all' : type === 'สามัญ' ? 'ftab-samarn' : 'ftab-practice';
    document.getElementById(tabId)?.classList.add('active');
    if(type === 'all') renderTable(_subjects);
    else if(type === 'สามัญ') renderTable(_subjects.filter(s => s.subject_id.startsWith('20') || s.subject_id.startsWith('30')));
    else renderTable(_subjects.filter(s => !s.subject_id.startsWith('20') && !s.subject_id.startsWith('30')));
  }
  function openModal(id) { _deleteId = id; document.getElementById('deleteModal').classList.remove('hidden'); }
  function closeModal() { _deleteId = null; document.getElementById('deleteModal').classList.add('hidden'); }
  async function confirmDelete() {
    if(!_deleteId) return;
    const { error } = await db.from(TABLES.SUBJECTS).delete().eq('id', _deleteId);
    if(error) { showToast('error','ลบล้มเหลว'); return; }
    showToast('success','ลบสำเร็จ'); closeModal(); loadAll();
  }
  // ── Download Template Excel ────────────────────────────────
  function downloadTemplate() {
    if (typeof XLSX === 'undefined') {
      showToast('error', 'ไม่พบไลบรารี XLSX');
      return;
    }
    const templateData = [
      { 'รหัสวิชา': '20000-1101', 'ชื่อวิชา': 'ภาษาไทยพื้นฐาน', 'ทฤษฎี': 2, 'ปฏิบัติ': 0, 'หน่วยกิต': 2 },
      { 'รหัสวิชา': '20128-1001', 'ชื่อวิชา': 'เขียนแบบเทคนิคเบื้องต้น', 'ทฤษฎี': 1, 'ปฏิบัติ': 3, 'หน่วยกิต': 2 },
      { 'รหัสวิชา': '20204-2001', 'ชื่อวิชา': 'ระบบปฏิบัติการเบื้องต้น', 'ทฤษฎี': 2, 'ปฏิบัติ': 2, 'หน่วยกิต': 3 }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'แม่แบบรายวิชา');
    saveXlsx(wb, 'EduSched_Subjects_Template.xlsx');
    showToast('success', 'ดาวน์โหลดแม่แบบสำเร็จ', 'บันทึกเป็นไฟล์ Excel (.xlsx)');
  }

  // ── Export Excel ───────────────────────────────────────────
  function exportExcel() {
    if (typeof XLSX === 'undefined') {
      showToast('error', 'ไม่พบไลบรารี XLSX');
      return;
    }
    if (_subjects.length === 0) {
      showToast('warning', 'ไม่มีข้อมูลรายวิชา');
      return;
    }
    const rows = _subjects.map((s, idx) => ({
      'ลำดับ': idx + 1,
      'รหัสวิชา': s.subject_id,
      'ชื่อวิชา': s.subject_name,
      'ทฤษฎี': s.theory || 0,
      'ปฏิบัติ': s.practice || 0,
      'หน่วยกิต': s.credit || 0
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'รายวิชา');
    saveXlsx(wb, `EduSched_Subjects_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('success', 'ส่งออกสำเร็จ', 'บันทึกเป็นไฟล์ Excel (.xlsx)');
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
          showToast('warning', 'ไม่พบข้อมูลในไฟล์ Excel');
          return;
        }

        const batch = [];
        for (const r of rows) {
          const sId = (r['รหัสวิชา'] || r['subject_id'] || r['รหัส'] || '').toString().trim();
          const sName = (r['ชื่อวิชา'] || r['subject_name'] || r['ชื่อ'] || sId).toString().trim();
          const theory = parseInt(r['ทฤษฎี'] || r['theory'] || 0, 10);
          const practice = parseInt(r['ปฏิบัติ'] || r['practice'] || 0, 10);
          const credit = parseInt(r['หน่วยกิต'] || r['credit'] || 0, 10);

          if (sId) {
            batch.push({
              subject_id: sId,
              subject_name: sName,
              theory: isNaN(theory) ? 0 : theory,
              practice: isNaN(practice) ? 0 : practice,
              credit: isNaN(credit) ? 0 : credit
            });
          }
        }

        if (batch.length === 0) {
          showToast('error', 'รูปแบบข้อมูลไม่ถูกต้อง', 'ไม่พบคอลัมน์ รหัสวิชา');
          return;
        }

        const { error } = await db.from(TABLES.SUBJECTS).upsert(batch, { onConflict: 'subject_id' });
        if (error) throw error;
        showToast('success', 'นำเข้าข้อมูลสำเร็จ', `นำเข้ารายวิชาทั้งหมด ${batch.length} รายการ`);
        await loadAll();
        switchTab('table');
      } catch (err) {
        showToast('error', 'นำเข้าข้อมูลล้มเหลว', err.message);
      } finally {
        inputEl.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  }

  return { loadAll, save, clearForm, switchTab, filter, filterType, openModal, closeModal, confirmDelete, autoDetectType, calcCredit, exportExcel, importExcel, downloadTemplate };
})();
document.addEventListener('DOMContentLoaded', () => SUBJECTS.loadAll());
