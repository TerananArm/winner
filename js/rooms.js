// ============================================================
//  EDUSCHED AI - ROOMS MANAGEMENT (ห้องเรียน)
// ============================================================

const ROOMS = (() => {
  let _rooms = [];
  let _deleteId = null;

  async function loadAll() {
    try {
      const { data, error } = await db.from(TABLES.ROOMS).select('*').order('room_id');
      if (error) throw error;
      _rooms = data || [];
      renderTable();
    } catch (err) {
      showToast('error', 'โหลดล้มเหลว', err.message);
    }
  }

  async function save() {
    const id = document.getElementById('r-id').value.trim();
    const name = document.getElementById('r-name').value.trim();
    const type = document.getElementById('r-type').value;
    const capacityVal = document.getElementById('r-capacity')?.value;
    const capacity = capacityVal ? parseInt(capacityVal, 10) : 40;

    if (!id || !name || !type) {
      showToast('error', 'กรุณากรอกข้อมูล * ให้ครบ');
      return;
    }

    const payload = {
      room_id: id,
      room_name: name,
      room_type: type,
      capacity: capacity
    };

    const btn = document.getElementById('btn-save-room');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner"></div>';
    }

    try {
      const { error } = await db.from(TABLES.ROOMS).upsert([payload], { onConflict: 'room_id' });
      if (error) throw error;
      showToast('success', 'บันทึกสำเร็จ', `ข้อมูลห้อง ${id} ถูกบันทึกแล้ว`);
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

  function renderTable(data = _rooms) {
    const tbody = document.getElementById('rooms-tbody');
    if (!tbody) return;

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted);">ไม่มีข้อมูลห้องเรียน</td></tr>';
      return;
    }

    tbody.innerHTML = data.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><span class="badge badge-gray" style="font-weight:700;">${r.room_id}</span></td>
        <td style="font-weight:600;">${r.room_name}</td>
        <td><span class="badge badge-primary">${r.room_type}</span></td>
        <td><span style="font-weight:700;color:#38bdf8;">${r.capacity || 40}</span> ที่นั่ง</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="ROOMS.openModal(${r.id})" title="ลบห้องเรียน">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  function clearForm() {
    document.getElementById('r-id').value = '';
    document.getElementById('r-name').value = '';
    document.getElementById('r-type').value = 'ห้องเรียนทั่วไป';
    if (document.getElementById('r-capacity')) document.getElementById('r-capacity').value = '40';
  }

  function switchTab(tab) {
    document.getElementById('section-form')?.classList.toggle('hidden', tab !== 'form');
    document.getElementById('section-table')?.classList.toggle('hidden', tab !== 'table');
    document.getElementById('tab-form')?.classList.toggle('active', tab === 'form');
    document.getElementById('tab-table')?.classList.toggle('active', tab === 'table');
  }

  function filter(q) {
    const query = q.toLowerCase();
    renderTable(_rooms.filter(r =>
      (r.room_id && r.room_id.toLowerCase().includes(query)) ||
      (r.room_name && r.room_name.toLowerCase().includes(query)) ||
      (r.room_type && r.room_type.toLowerCase().includes(query))
    ));
  }

  function filterType(t) {
    renderTable(t ? _rooms.filter(r => r.room_type === t) : _rooms);
  }

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
      const { error } = await db.from(TABLES.ROOMS).delete().eq('id', _deleteId);
      if (error) throw error;
      showToast('success', 'ลบสำเร็จ');
      closeModal();
      loadAll();
    } catch (err) {
      showToast('error', 'ลบล้มเหลว', err.message);
    }
  }

  function saveXlsx(wb, filename) {
    const finalName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    try {
      const b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      const dataUri = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + b64;
      const a = document.createElement('a');
      a.href = dataUri;
      a.download = finalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.warn('saveXlsx base64 fallback:', e);
      XLSX.writeFile(wb, finalName);
    }
  }

  // ── Download Template Excel (เกณฑ์ 3.5.3 A) ─────────────────
  function downloadTemplate() {
    if (typeof XLSX === 'undefined') {
      showToast('error', 'ไม่พบไลบรารี XLSX');
      return;
    }
    const templateData = [
      { 'รหัสห้อง': 'R101', 'ชื่อห้อง': 'ห้องเรียนทฤษฎี 1', 'ประเภทห้อง': 'ห้องเรียนทั่วไป', 'ความจุ': 40 },
      { 'รหัสห้อง': 'LAB301', 'ชื่อห้อง': 'ห้องปฏิบัติการคอมพิวเตอร์ 1', 'ประเภทห้อง': 'ห้องปฏิบัติการคอมพิวเตอร์', 'ความจุ': 35 },
      { 'รหัสห้อง': 'LAB_TIGHT', 'ชื่อห้อง': 'ห้องปฏิบัติการช่างยนต์', 'ประเภทห้อง': 'ห้องปฏิบัติการ', 'ความจุ': 30 }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'แม่แบบห้องเรียน');
    saveXlsx(wb, 'EduSched_Rooms_Template.xlsx');
    showToast('success', 'ดาวน์โหลดแม่แบบสำเร็จ', 'ไฟล์ EduSched_Rooms_Template.xlsx (.xlsx แท้) พร้อมเปิดด้วย Excel');
  }

  // ── Export Excel ───────────────────────────────────────────
  function exportExcel() {
    if (typeof XLSX === 'undefined') {
      showToast('error', 'ไม่พบไลบรารี XLSX');
      return;
    }
    if (_rooms.length === 0) {
      showToast('warning', 'ไม่มีข้อมูลห้องเรียน');
      return;
    }
    const rows = _rooms.map((r, idx) => ({
      'ลำดับ': idx + 1,
      'รหัสห้อง': r.room_id,
      'ชื่อห้อง': r.room_name,
      'ประเภทห้อง': r.room_type,
      'ความจุ (ที่นั่ง)': r.capacity || 40
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ห้องเรียน');
    saveXlsx(wb, `EduSched_Rooms_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
        rows.forEach(r => {
          const id = String(r['รหัสห้อง'] || r['room_id'] || '').trim();
          const name = String(r['ชื่อห้อง'] || r['room_name'] || '').trim();
          const type = String(r['ประเภทห้อง'] || r['room_type'] || 'ห้องเรียนทั่วไป').trim();
          const cap = parseInt(r['ความจุ'] || r['capacity'] || 40, 10);
          if (id && name) {
            batch.push({ room_id: id, room_name: name, room_type: type, capacity: cap });
          }
        });
        if (batch.length > 0) {
          const { error } = await db.from(TABLES.ROOMS).upsert(batch, { onConflict: 'room_id' });
          if (error) throw error;
          showToast('success', `นำเข้าข้อมูลห้องเรียน ${batch.length} ห้องเรียบร้อย`);
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
    switchTab,
    filter,
    filterType,
    openModal,
    closeModal,
    confirmDelete,
    exportExcel,
    importExcel,
    downloadTemplate
  };
})();

document.addEventListener('DOMContentLoaded', () => ROOMS.loadAll());
