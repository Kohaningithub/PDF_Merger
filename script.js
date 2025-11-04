(() => {
  /** @typedef {{ id: string, file: File, name: string, arrayBuffer: ArrayBuffer, pageCount: number, rangeStr: string }} FileEntry */

  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const selectBtn = document.getElementById('select-btn');
  const fileList = document.getElementById('file-list');
  const emptyState = document.getElementById('empty-state');
  const mergeBtn = document.getElementById('merge-btn');
  const clearBtn = document.getElementById('clear-btn');
  const statusEl = document.getElementById('status');
  const outputNameInput = document.getElementById('output-name');

  /** @type {FileEntry[]} */
  let filesData = [];
  let dragSrcId = null;
  let idCounter = 0;

  const setStatus = (msg) => { statusEl.textContent = msg || ''; };
  const enableControls = () => {
    const hasItems = filesData.length > 0;
    mergeBtn.disabled = !hasItems;
    clearBtn.disabled = !hasItems;
    emptyState.style.display = hasItems ? 'none' : 'block';
  };

  const generateId = () => `${Date.now()}-${idCounter++}`;

  // File adding logic
  const handleFiles = async (fileListLike) => {
    const picked = Array.from(fileListLike || [])
      .filter(f => f && (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')));
    if (!picked.length) return;

    setStatus('Loading files...');
    for (const file of picked) {
      await addFile(file);
    }
    setStatus('');
    renderList();
  };

  const addFile = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pageCount = srcDoc.getPageCount();
      filesData.push({ id: generateId(), file, name: file.name, arrayBuffer, pageCount, rangeStr: '' });
    } catch (e) {
      console.error('Failed to read PDF', e);
      setStatus(`Failed to load ${file.name}`);
    }
  };

  // UI rendering
  const renderList = () => {
    fileList.innerHTML = '';
    for (const entry of filesData) {
      fileList.appendChild(createListItem(entry));
    }
    enableControls();
  };

  const createListItem = (entry) => {
    const li = document.createElement('li');
    li.className = 'file-item';
    li.draggable = true;
    li.dataset.id = entry.id;

    const handle = document.createElement('div');
    handle.className = 'handle';
    handle.title = 'Drag to reorder';
    handle.textContent = '☰';

    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = entry.name;

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${entry.pageCount} page${entry.pageCount === 1 ? '' : 's'}`;

    const rangeWrap = document.createElement('div');
    rangeWrap.className = 'range-wrap';
    const range = document.createElement('input');
    range.type = 'text';
    range.className = 'input range-input';
    range.placeholder = 'Pages (e.g., 1-3,5,7-) — empty for all';
    range.value = entry.rangeStr || '';
    range.addEventListener('input', (e) => {
      entry.rangeStr = e.target.value;
    });
    const hint = document.createElement('div');
    hint.className = 'small muted';
    hint.textContent = 'Use 1-based pages. Ranges like 2-5, single pages like 8, open-ended like -3 or 10-';
    rangeWrap.appendChild(range);
    rangeWrap.appendChild(hint);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-danger';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      filesData = filesData.filter(f => f.id !== entry.id);
      renderList();
    });

    li.appendChild(handle);
    li.appendChild(name);
    li.appendChild(meta);
    li.appendChild(rangeWrap);
    li.appendChild(removeBtn);

    // Drag behavior
    li.addEventListener('dragstart', (e) => {
      dragSrcId = entry.id;
      li.classList.add('dragging');
      e.dataTransfer.setData('text/plain', entry.id);
      e.dataTransfer.effectAllowed = 'move';
    });
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      dragSrcId = null;
    });
    li.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      const srcId = dragSrcId || e.dataTransfer.getData('text/plain');
      const targetId = entry.id;
      if (!srcId || srcId === targetId) return;
      const srcIdx = filesData.findIndex(f => f.id === srcId);
      const tgtIdx = filesData.findIndex(f => f.id === targetId);
      if (srcIdx < 0 || tgtIdx < 0) return;
      const [moved] = filesData.splice(srcIdx, 1);
      filesData.splice(tgtIdx, 0, moved);
      renderList();
    });

    return li;
  };

  // Merge logic
  const parsePageRange = (input, pageCount) => {
    if (!input || !String(input).trim()) {
      return Array.from({ length: pageCount }, (_, i) => i);
    }
    const cleaned = String(input).replace(/\s+/g, '');
    const tokens = cleaned.split(',').filter(Boolean);
    const indices = [];
    const seen = new Set();

    const pushIdx = (idx) => {
      if (idx < 0 || idx >= pageCount) return;
      if (seen.has(idx)) return;
      seen.add(idx);
      indices.push(idx);
    };

    for (const t of tokens) {
      let m;
      if (/^\d+$/.test(t)) {
        const p = Number(t) - 1;
        pushIdx(p);
        continue;
      }
      m = t.match(/^(\d+)-(\d+)$/);
      if (m) {
        let a = Number(m[1]);
        let b = Number(m[2]);
        if (a > b) [a, b] = [b, a];
        a = Math.max(1, a);
        b = Math.min(pageCount, b);
        for (let p = a; p <= b; p++) pushIdx(p - 1);
        continue;
      }
      m = t.match(/^-(\d+)$/);
      if (m) {
        const b = Math.min(pageCount, Number(m[1]));
        for (let p = 1; p <= b; p++) pushIdx(p - 1);
        continue;
      }
      m = t.match(/^(\d+)-$/);
      if (m) {
        const a = Math.max(1, Number(m[1]));
        for (let p = a; p <= pageCount; p++) pushIdx(p - 1);
        continue;
      }
      // Ignore invalid tokens silently
    }
    return indices.length ? indices : Array.from({ length: pageCount }, (_, i) => i);
  };

  const mergePdfs = async () => {
    if (!filesData.length) return;
    mergeBtn.disabled = true;
    clearBtn.disabled = true;
    setStatus('Merging PDFs...');
    try {
      const outDoc = await PDFLib.PDFDocument.create();

      for (let i = 0; i < filesData.length; i++) {
        const entry = filesData[i];
        setStatus(`Adding ${entry.name} (${i + 1}/${filesData.length})...`);
        const srcDoc = await PDFLib.PDFDocument.load(entry.arrayBuffer, { ignoreEncryption: true });
        const pageIndices = parsePageRange(entry.rangeStr, entry.pageCount);
        const copied = await outDoc.copyPages(srcDoc, pageIndices);
        for (const page of copied) outDoc.addPage(page);
      }

      setStatus('Finalizing...');
      const bytes = await outDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const name = (outputNameInput.value || 'merged.pdf').trim();
      a.href = url;
      a.download = name.toLowerCase().endsWith('.pdf') ? name : `${name}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus('Done. File downloaded.');
    } catch (e) {
      console.error(e);
      setStatus('Merge failed. See console for details.');
    } finally {
      enableControls();
    }
  };

  // Event wiring
  selectBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async (e) => {
    await handleFiles(e.target.files);
    fileInput.value = '';
  });

  const onDropFiles = async (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const dt = e.dataTransfer;
    const items = dt?.items ? Array.from(dt.items).filter(i => i.kind === 'file').map(i => i.getAsFile()) : Array.from(dt.files);
    await handleFiles(items);
  };

  ['dragenter','dragover'].forEach(evt => dropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  }));
  ['dragleave','drop'].forEach(evt => dropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    if (evt === 'drop') return; // class removed in onDropFiles
    dropZone.classList.remove('dragover');
  }));
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
  });
  dropZone.addEventListener('drop', onDropFiles);

  mergeBtn.addEventListener('click', mergePdfs);
  clearBtn.addEventListener('click', () => {
    filesData = [];
    renderList();
    setStatus('');
  });

  // Initial
  enableControls();
})();



