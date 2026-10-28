// ============================================================
//  EDUSCHED AI - REGISTRATIONS (ข้อมูลการลงทะเบียน)
// ============================================================

const REG = (() => {
  let _registrations = [];
  let _subjects = [];
  let _groups = [];
  let _deleteId = null;

  async function loadAll() {
    try {
      const [regsRes, subjectsRes, groupsRes] = await Promise.all([
        db.from(TABLES.REGISTRATIONS).select('*').order('id', { ascending: false }),
        db.from(TABLES.SUBJECTS).select('*').order('subject_id'),
        db.from(TABLES.GROUPS).select('*').order('group_id')
      ]);

      _registrations = regsRes.data || [];
      _subjects = subjectsRes.data || [];
      _groups = groupsRes.data || [];

      populateDropdowns();
      renderTable();
    } catch (err) {
      console.error('Error loading registrations:', err);
      showToast('error', 'โหลดข้อมูลล้มเหลว', err.message);
    }
  }

  function populateDropdowns() {
    const sSelect = document.getElementById('reg-subject');
    const gSelect = document.getElementById('reg-group1');

    if (sSelect) {
      sSelect.innerHTML = '<option value="">-- เลือกรายวิชา --</option>' +
        _subjects.map(s => `<option value="${s.subject_id}">${s.subject_id} - ${s.subject_name}</option>`).join('');
    }

    if (gSelect) {
      gSelect.innerHTML = '<option value="">-- เลือกกลุ่มเรียน --</option>' +
        _groups.map(g => `<option value="${g.group_id}">${g.group_id} - ${g.group_name}</option>`).join('');
    }
  }

  async function save() {
    const subjectId = document.getElementById('reg-subject')?.value;
    const groupId = document.getElementById('reg-group1')?.value;

    if (!subjectId || !groupId) {
      showToast('warning', 'กรุณากรอกข้อมูลให้ครบ', 'โปรดเลือกทั้งรายวิชาและกลุ่มเรียน');
      return;
    }

    // Determine subject type (general or lab)
    const clean = subjectId.replace(/[^0-9]/g, '');
    const subjectType = (clean.startsWith('20') || clean.startsWith('30')) ? 'สามัญ' : 'ปฏิบัติ';

    const payload = {
      subject_id: subjectId,
      group_id: groupId,
      subject_type: subjectType,
      semester: '1',
      academic_year: '2568'
    };

    const btn = document.getElementById('btn-save-reg');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner"></div> กำลังบันทึก...';
    }

    try {
      const { error } = await db.from(TABLES.REGISTRATIONS).insert([payload]);
      if (error) throw error;
      showToast('success', 'บันทึกสำเร็จ', 'เพิ่มรายการลงทะเบียนเรียบร้อยแล้ว');
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
    const sSelect = document.getElementById('reg-subject');
    const gSelect = document.getElementById('reg-group1');
    if (sSelect) sSelect.value = '';
    if (gSelect) gSelect.value = '';
  }

  function renderTable(data = _registrations) {
    const tbody = document.getElementById('reg-tbody');
    if (!tbody) return;

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted);">ไม่มีข้อมูลการลงทะเบียน</td></tr>';
      return;
    }

    tbody.innerHTML = data.map((r, i) => {
      const s = _subjects.find(sbj => sbj.subject_id === r.subject_id);
      const g = _groups.find(grp => grp.group_id === r.group_id);
      return `
        <tr>
          <td>${i + 1}</td>
          <td><span class="badge badge-primary">${r.subject_id}</span></td>
          <td style="font-weight:600;">${s ? s.subject_name : '-'}</td>
          <td><span class="badge badge-gray">${r.group_id}</span></td>
          <td>${g ? g.group_name : '-'}</td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="REG.openDeleteModal(${r.id})" title="ลบรายการลงทะเบียน">
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
    renderTable(_registrations.filter(r => {
      const s = _subjects.find(sbj => sbj.subject_id === r.subject_id);
      const g = _groups.find(grp => grp.group_id === r.group_id);
      return (
        r.subject_id.toLowerCase().includes(query) ||
        (s && s.subject_name.toLowerCase().includes(query)) ||
        r.group_id.toLowerCase().includes(query) ||
        (g && g.group_name.toLowerCase().includes(query))
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
      const { error } = await db.from(TABLES.REGISTRATIONS).delete().eq('id', _deleteId);
      if (error) throw error;
      showToast('success', 'ลบสำเร็จ', 'ลบรายการลงทะเบียนเรียบร้อย');
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
    if (_registrations.length === 0) {
      showToast('warning', 'ไม่มีข้อมูลการลงทะเบียน');
      return;
    }
    const rows = _registrations.map((r, idx) => {
      const s = _subjects.find(sbj => sbj.subject_id === r.subject_id);
      const g = _groups.find(grp => grp.group_id === r.group_id);
      return {
        'ลำดับ': idx + 1,
        'รหัสวิชา': r.subject_id,
        'ชื่อวิชา': s ? s.subject_name : '',
        'รหัสกลุ่มเรียน': r.group_id,
        'ชื่อกลุ่มเรียน': g ? g.group_name : '',
        'ประเภทวิชา': r.subject_type || 'ปฏิบัติ'
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ข้อมูลการลงทะเบียน');
    saveXlsx(wb, `EduSched_Registrations_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('success', 'ส่งออกสำเร็จ', 'บันทึกเป็นไฟล์ Excel (.xlsx)');
  }

  function downloadTemplate() {
    if (typeof XLSX === 'undefined') { showToast('error', 'ไม่พบไลบรารี XLSX'); return; }
    const ws = XLSX.utils.json_to_sheet([
      { 'รหัสวิชา': '20000-1101', 'รหัสกลุ่มเรียน': '672040101', 'ประเภทวิชา': 'สามัญ' },
      { 'รหัสวิชา': '30204-2001', 'รหัสกลุ่มเรียน': '672190101', 'ประเภทวิชา': 'ปฏิบัติ' },
      { 'รหัสวิชา': '20001-1001', 'รหัสกลุ่มเรียน': '672190102', 'ประเภทวิชา': 'สามัญ' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'แม่แบบลงทะเบียน');
    saveXlsx(wb, 'EduSched_Registrations_Template.xlsx');
    showToast('success', 'ดาวน์โหลดแม่แบบสำเร็จ');
  }

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
          const sid = String(r['รหัสวิชา'] || r['subject_id'] || '').trim();
          const gid = String(r['รหัสกลุ่มเรียน'] || r['group_id'] || '').trim();
          if (sid && gid) {
            const sType = String(r['ประเภทวิชา'] || r['subject_type'] || 'ปฏิบัติ').trim();
            const key = `${sid}_${gid}_1_2568`;
            map.set(key, { subject_id: sid, group_id: gid, subject_type: sType, semester: '1', academic_year: '2568' });
          }
        });
        const batch = Array.from(map.values());
        if (batch.length) {
          const { error } = await db.from(TABLES.REGISTRATIONS).upsert(batch, {
            onConflict: 'subject_id,group_id,semester,academic_year'
          });
          if (error) {
            // Fallback to normal insert if onConflict is different
            const { error: insertErr } = await db.from(TABLES.REGISTRATIONS).insert(batch);
            if (insertErr) throw insertErr;
          }
          showToast('success', `นำเข้าข้อมูลลงทะเบียน ${batch.length} รายการเรียบร้อย`);
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
    importExcel
  };
})();

document.addEventListener('DOMContentLoaded', () => REG.loadAll());

