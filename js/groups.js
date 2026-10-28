
const GROUPS = (() => {
  let _groups = []; let _deleteId = null;
  async function loadAll() {
    const { data, error } = await db.from(TABLES.GROUPS).select('*').order('group_id');
    if (error) { showToast('error', 'โหลดล้มเหลว', error.message); return; }
    _groups = data || []; renderTable();
  }
  async function loadAdvisors() {
    const sel = document.getElementById('g-advisor');
    if(!sel) return;
    const { data } = await db.from(TABLES.TEACHERS).select('*').order('teacher_name');
    if(data) sel.innerHTML = '<option value="">-- เลือกอาจารย์ที่ปรึกษา --</option>' + data.map(t => `<option value="${t.teacher_id}">${t.teacher_name}</option>`).join('');
  }
  async function save() {
    const id = document.getElementById('g-id').value.trim();
    const name = document.getElementById('g-name').value.trim();
    const count = document.getElementById('g-count').value;
    const advisor = document.getElementById('g-advisor').value;
    if (!id || !name) { showToast('error', 'กรุณากรอกข้อมูล * ให้ครบ'); return; }
    const payload = { group_id: id, group_name: name, student_count: count ? parseInt(count) : 0, advisor };
    const btn = document.getElementById('btn-save-group');
    btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>';
    const { error } = await db.from(TABLES.GROUPS).upsert([payload], { onConflict: 'group_id' });
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-floppy-disk"></i> บันทึกข้อมูล';
    if (error) { showToast('error', 'บันทึกล้มเหลว', error.message); return; }
    showToast('success', 'บันทึกสำเร็จ'); clearForm(); loadAll();
  }
  function renderTable(data = _groups) {
    const tbody = document.getElementById('groups-tbody');
    if (data.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;">ไม่มีข้อมูล</td></tr>'; return; }
    tbody.innerHTML = data.map((g, i) => `<tr>
      <td>${i+1}</td>
      <td><span class="badge badge-gray">${g.group_id}</span></td>
      <td style="font-weight:600;">${g.group_name}</td>
      <td>${g.student_count || 0}</td>
      <td>${g.advisor || '-'}</td>
      <td><button class="btn btn-danger btn-sm" onclick="GROUPS.openModal(${g.id})" title="ลบกลุ่มเรียน"><i class="fas fa-trash"></i></button></td>
    </tr>`).join('');
  }
  function clearForm() { document.getElementById('g-id').value=''; document.getElementById('g-name').value=''; document.getElementById('g-count').value=''; document.getElementById('g-advisor').value=''; }
  function switchTab(tab) {
    document.getElementById('section-form').classList.toggle('hidden', tab!=='form');
    document.getElementById('section-table').classList.toggle('hidden', tab!=='table');
    document.getElementById('tab-form').classList.toggle('active', tab==='form');
    document.getElementById('tab-table').classList.toggle('active', tab==='table');
  }
  function filter(q) { renderTable(_groups.filter(g => g.group_id.toLowerCase().includes(q.toLowerCase()) || g.group_name.toLowerCase().includes(q.toLowerCase()))); }
  function openModal(id) { _deleteId = id; document.getElementById('deleteModal').classList.remove('hidden'); }
  function closeModal() { _deleteId = null; document.getElementById('deleteModal').classList.add('hidden'); }
  async function confirmDelete() {
    if(!_deleteId) return;
    const { error } = await db.from(TABLES.GROUPS).delete().eq('id', _deleteId);
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
      { 'รหัสกลุ่มเรียน': '672190101', 'ชื่อกลุ่มเรียน': '2 ทส 1', 'จำนวนนักเรียน': 30, 'อาจารย์ที่ปรึกษา': 'ครูสมชาย ใจดี' },
      { 'รหัสกลุ่มเรียน': '672190102', 'ชื่อกลุ่มเรียน': '2 ทส 2', 'จำนวนนักเรียน': 28, 'อาจารย์ที่ปรึกษา': 'ครูนภัสสร เรียนดี' },
      { 'รหัสกลุ่มเรียน': '672040101', 'ชื่อกลุ่มเรียน': '1 คอม 1', 'จำนวนนักเรียน': 35, 'อาจารย์ที่ปรึกษา': 'ครูประสิทธิ์ ศักดานันท์' }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'แม่แบบกลุ่มเรียน');
    saveXlsx(wb, 'EduSched_Groups_Template.xlsx');
    showToast('success', 'ดาวน์โหลดแม่แบบสำเร็จ', 'บันทึกเป็นไฟล์ Excel (.xlsx)');
  }

  // ── Export Excel ───────────────────────────────────────────
  function exportExcel() {
    if (typeof XLSX === 'undefined') {
      showToast('error', 'ไม่พบไลบรารี XLSX');
      return;
    }
    if (_groups.length === 0) {
      showToast('warning', 'ไม่มีข้อมูลกลุ่มเรียน');
      return;
    }
    const rows = _groups.map((g, idx) => ({
      'ลำดับ': idx + 1,
      'รหัสกลุ่มเรียน': g.group_id,
      'ชื่อกลุ่มเรียน': g.group_name,
      'จำนวนนักเรียน': g.student_count || 0,
      'อาจารย์ที่ปรึกษา': g.advisor || '-'
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'กลุ่มเรียน');
    saveXlsx(wb, `EduSched_Groups_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
          const groupId = (r['รหัสกลุ่มเรียน'] || r['group_id'] || r['รหัสกลุ่ม'] || r['กลุ่มเรียน'] || '').toString().trim();
          const groupName = (r['ชื่อกลุ่มเรียน'] || r['group_name'] || r['ชื่อกลุ่ม'] || groupId).toString().trim();
          const count = parseInt(r['จำนวนนักเรียน'] || r['student_count'] || r['จำนวน'] || 0, 10);
          const advisor = (r['อาจารย์ที่ปรึกษา'] || r['advisor'] || r['ที่ปรึกษา'] || '').toString().trim();

          if (groupId) {
            batch.push({
              group_id: groupId,
              group_name: groupName,
              student_count: isNaN(count) ? 0 : count,
              advisor: advisor || null
            });
          }
        }

        if (batch.length === 0) {
          showToast('error', 'รูปแบบข้อมูลไม่ถูกต้อง', 'ไม่พบคอลัมน์ รหัสกลุ่มเรียน');
          return;
        }

        const { error } = await db.from(TABLES.GROUPS).upsert(batch, { onConflict: 'group_id' });
        if (error) throw error;
        showToast('success', 'นำเข้าข้อมูลสำเร็จ', `นำเข้ากลุ่มเรียนทั้งหมด ${batch.length} รายการ`);
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

  return { loadAll, loadAdvisors, save, clearForm, switchTab, filter, openModal, closeModal, confirmDelete, exportExcel, importExcel, downloadTemplate };
})();
document.addEventListener('DOMContentLoaded', () => { GROUPS.loadAll(); GROUPS.loadAdvisors(); });
