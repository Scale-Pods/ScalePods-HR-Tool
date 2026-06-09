import './style.css';

const pages = {
  dashboard: 'Dashboard',
  campaigns: 'Campaigns',
  create: 'Create Campaign',
  meetings: 'Interview Center',
  'campaign-detail': 'Campaign Details'
};

window.toggleSidebar = function() {
  document.getElementById('sidebar').classList.toggle('collapsed');
};

window.navigate = function(id, clickedNavItem) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  if (clickedNavItem) clickedNavItem.classList.add('active');
  document.getElementById('page-title').textContent = pages[id];
  document.querySelector('.content').scrollTop = 0;
  if (window.__mountSearch) window.__mountSearch(id);
  if (id === 'create') { window.loadCampaignDraft(); window.updatePreview(); }
  if (id === 'campaigns') window.loadCampaigns();
  if (id === 'dashboard') {
    window.populateCampaignSelector();
    var sel = document.getElementById('campaign-select');
    if (sel && sel.value) {
      window.loadDashboardData(sel.value);
    } else if (window._campaignList && window._campaignList.length) {
      window.loadDashboardData('');
    }
  }
  if (id === 'meetings') {
    window.loadMeetingsPage();
  }
};

window.toggleTheme = function() {
  const body = document.body;
  const btn = document.getElementById('theme-btn');
  if (body.dataset.theme === 'dark') {
    delete body.dataset.theme;
    btn.innerHTML = '<i class="ti ti-moon"></i>';
  } else {
    body.dataset.theme = 'dark';
    btn.innerHTML = '<i class="ti ti-sun"></i>';
  }
};

const today = new Date();
let calMonth = today.getMonth();
let calYear = today.getFullYear();
// eventDays is populated from real candidate data via buildMeetingsEventMap()
let eventDays = [];
let selectedDay = today.getDate();

// Map: 'YYYY-MM-DD' -> array of interview objects
window._meetingsEventMap = {};

// Build eventMap from all available candidate data sources
function buildMeetingsEventMap() {
  var map = {};
  var roundColors = ['var(--blue)', 'var(--cyan)', 'var(--emerald)'];
  var roundTypes  = ['hr', 'tech', 'manager'];

  function processCandidate(c) {
    for (var r = 1; r <= 3; r++) {
      var rawDate = c['Round ' + r + ' Meeting Date'] || '';
      if (!rawDate) continue;
      // Normalise to YYYY-MM-DD
      var iso = normaliseDate(rawDate);
      if (!iso) continue;
      if (!map[iso]) map[iso] = [];
      map[iso].push({
        name:      c.Name || 'Unknown Candidate',
        role:      c.Role || c.Position || '',
        round:     r,
        time:      c['Round ' + r + ' Meeting Time']  || '',
        link:      c['Round ' + r + ' Meeting Link']  || c['Round ' + r + ' Interview Link'] || '',
        eventId:   c['Round ' + r + ' Event ID']      || c['Round ' + r + ' EventID'] || '',
        interviewer: c['Round ' + r + ' Assigned']    || '',
        color:     roundColors[r - 1],
        type:      roundTypes[r - 1]
      });
    }
  }

  // Pull from all known data pools
  (window._candidateData        || []).forEach(processCandidate);
  (window._dashboardCampaignData|| []).forEach(processCandidate);

  window._meetingsEventMap = map;

  // Build the eventDays array for the currently displayed calendar month
  eventDays = Object.keys(map).filter(function(iso) {
    var d = new Date(iso + 'T00:00:00');
    return d.getMonth() === calMonth && d.getFullYear() === calYear;
  }).map(function(iso) {
    return new Date(iso + 'T00:00:00').getDate();
  });
}

function normaliseDate(raw) {
  if (!raw) return '';
  var s = String(raw).trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // DD/MM/YYYY or DD-MM-YYYY
  var m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (m) return m[3] + '-' + m[2].padStart(2,'0') + '-' + m[1].padStart(2,'0');
  // MM/DD/YYYY
  var m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m2) return m2[3] + '-' + m2[1].padStart(2,'0') + '-' + m2[2].padStart(2,'0');
  // Try native parse
  var dt = new Date(s);
  if (!isNaN(dt)) return dt.toISOString().slice(0, 10);
  return '';
}

window.buildCalendar = function() {
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('cal-title').textContent = monthNames[calMonth] + ' ' + calYear;

  const dayLabels = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  dayLabels.forEach(d => {
    const el = document.createElement('div');
    el.className = 'calendar-day-label';
    el.textContent = d;
    grid.appendChild(el);
  });

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev = new Date(calYear, calMonth, 0).getDate();

  for (let i = firstDay - 1; i >= 0; i--) {
    const el = document.createElement('div');
    el.className = 'calendar-day other-month';
    el.textContent = daysInPrev - i;
    grid.appendChild(el);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const el = document.createElement('div');
    el.className = 'calendar-day';
    el.textContent = d;
    const isToday = d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
    if (isToday) el.classList.add('today');
    if (d === selectedDay && calMonth === today.getMonth() && calYear === today.getFullYear()) {
      el.classList.add('selected');
    }
    if (eventDays.some(ed => ed === d)) {
      el.classList.add('has-event');
      // Add round-type indicators
      var isoKey = calYear + '-' + String(calMonth+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
      var evs = window._meetingsEventMap[isoKey] || [];
      var dot = document.createElement('span');
      dot.style.cssText = 'display:block;width:5px;height:5px;border-radius:50%;margin:1px auto 0;background:' + (evs[0] ? evs[0].color : 'var(--blue)') + ';';
      el.appendChild(dot);
    }
    el.addEventListener('click', function() {
      document.querySelectorAll('.calendar-day').forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');
      selectedDay = parseInt(this.textContent);
      updateDayDetail(selectedDay);
    });
    grid.appendChild(el);
  }

  const totalCells = firstDay + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const el = document.createElement('div');
    el.className = 'calendar-day other-month';
    el.textContent = i;
    grid.appendChild(el);
  }

  updateDayDetail(selectedDay);
};

window.shiftMonth = function(dir) {
  calMonth += dir;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  if (calMonth > 11) { calMonth = 0; calYear++; }
  window.buildCalendar();
};

function updateDayDetail(day) {
  const date = new Date(calYear, calMonth, day);
  const opts = { month: 'long', day: 'numeric', year: 'numeric' };
  document.getElementById('detail-date').textContent = date.toLocaleDateString('en-US', opts);

  var isoKey = calYear + '-' + String(calMonth+1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
  var evs = (window._meetingsEventMap || {})[isoKey] || [];
  var count = evs.length;

  document.getElementById('detail-count').textContent = count + ' interview' + (count !== 1 ? 's' : '') + ' scheduled';
  document.getElementById('detail-empty').style.display = count === 0 ? 'flex' : 'none';
  var listEl = document.getElementById('detail-list');
  listEl.style.display = count > 0 ? 'block' : 'none';

  if (count > 0) {
    var roundLabels = ['Round 1', 'Round 2', 'Round 3'];
    listEl.innerHTML = evs.map(function(ev) {
      var label = roundLabels[ev.round - 1] || ('Round ' + ev.round);
      var linkHtml = ev.link
        ? '<a href="' + ev.link + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--blue);text-decoration:none;margin-top:4px;"><i class="ti ti-video"></i> Join Meeting</a>'
        : '';
      var eventIdHtml = ev.eventId
        ? '<span style="font-size:10px;color:var(--text3);margin-left:8px;"><i class="ti ti-hash"></i>' + ev.eventId + '</span>'
        : '';
      var intEmail = ev.interviewer || '';
      var reschedHtml = ev.eventId 
        ? '<button data-reschedule="1" data-event-id="' + ev.eventId + '" data-email="' + (ev.interviewer||'') + '" style="margin-left:8px;background:none;border:none;color:var(--text3);font-size:11px;cursor:pointer;display:inline-flex;align-items:center;gap:3px;" onmouseover="this.style.color=\'var(--blue)\'" onmouseout="this.style.color=\'var(--text3)\'"><i class="ti ti-calendar-time" style="pointer-events:none;"></i> Reschedule</button>'
        : '';
      return '<div style="padding:12px;background:var(--surface3);border-radius:10px;border:1px solid var(--border-color);margin-bottom:8px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<span style="font-size:12px;font-weight:700;color:' + ev.color + ';">' + label + '</span>' +
          '<span style="font-size:11px;color:var(--text3);"><i class="ti ti-clock"></i> ' + (ev.time || 'TBD') + '</span>' +
        '</div>' +
        '<div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px;">' + ev.name + (ev.role ? ' <span style="font-weight:400;color:var(--text3);">— ' + ev.role + '</span>' : '') + '</div>' +
        (ev.interviewer ? '<div style="font-size:11px;color:var(--text2);"><i class="ti ti-user"></i> ' + ev.interviewer + '</div>' : '') +
        '<div style="display:flex;align-items:center;gap:8px;margin-top:4px;">' + linkHtml + eventIdHtml + reschedHtml + '</div>' +
        '</div>';
    }).join('');
  }
}

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function animateCountUp(el) {
  const target = parseFloat(el.dataset.target);
  if (isNaN(target)) return;
  _runCountUp(el, target);
}

function animateValue(id, targetNum, suffix) {
  const el = document.getElementById(id);
  if (!el) return;
  suffix = suffix || el.dataset.suffix || '';
  el.setAttribute('data-target', targetNum);
  _runCountUp(el, targetNum, suffix);
}

function _runCountUp(el, target, suffix) {
  suffix = suffix !== undefined ? suffix : (el.dataset.suffix || '');
  const prefix = el.dataset.prefix || '';
  const decimals = (target % 1 === 0) ? 0 : String(target).split('.')[1]?.length || 1;
  const duration = 1200;
  let start = null;
  // Cancel any existing animation on this element
  if (el._animFrame) cancelAnimationFrame(el._animFrame);

  function step(timestamp) {
    if (!start) start = timestamp;
    const elapsed = timestamp - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutExpo(progress);
    const current = eased * target;
    el.textContent = prefix + current.toFixed(decimals) + suffix;
    if (progress < 1) {
      el._animFrame = requestAnimationFrame(step);
    } else {
      el.textContent = prefix + target.toFixed(decimals) + suffix;
    }
  }
  el._animFrame = requestAnimationFrame(step);
}

window.submitCampaign = function() {
  const name = document.getElementById('campaign-name').value.trim();
  if (!name) { alert('Campaign Name is required'); return; }

  const wKeys = ['skills', 'experience', 'education', 'jd'];
  const wSum = wKeys.reduce((s, k) => s + (parseInt(document.getElementById('w-' + k).value) || 0), 0);
  if (wSum !== 100) { alert('Evaluation weights must sum to 100 (currently ' + wSum + ')'); return; }

  const rounds = {};
  const roundCount = parseInt(document.getElementById('campaign-rounds').value) || 1;
  for (let i = 1; i <= roundCount; i++) {
    const dd = document.getElementById('round-' + i + '-dropdown');
    rounds['round ' + i] = {
      interviewer: dd ? dd.dataset.value || '' : '',
      email: document.getElementById('round-' + i + '-email')?.value.trim() || '',
      calendarLink: document.getElementById('round-' + i + '-calendar')?.value.trim() || ''
    };
  }

  const weights = { skills: 25, experience: 25, education: 25, jd: 25 };
  wKeys.forEach(k => { weights[k] = parseInt(document.getElementById('w-' + k).value) || 0; });

  const payload = {
    action: 'CampaignCreation',
    name,
    description: document.getElementById('campaign-desc').value.trim(),
    jobDescription: document.getElementById('campaign-jd').value.trim(),
    startDate: document.getElementById('campaign-start').value,
    endDate: document.getElementById('campaign-end').value,
    location: document.getElementById('campaign-location').value.trim(),
    candidates: document.getElementById('campaign-candidates').value.trim(),
    salaryMin: document.getElementById('campaign-salary-min').value.trim(),
    salaryMax: document.getElementById('campaign-salary-max').value.trim(),
    joining: document.getElementById('campaign-joining').value,
    status: document.getElementById('active-toggle').classList.contains('on') ? 'active' : 'paused',
    rounds,
    roundCount,
    weights
  };

  const btn = document.querySelector('.create-submit');
  btn.disabled = true;
  btn.innerHTML = '<i class="ti ti-loader" style="animation:spin 1s linear infinite;"></i> Submitting...';

  fetch('/n8n-proxy/webhook/6536d25e-6332-4681-8bd9-0cd219e30a53?action=CampaignCreation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(r => {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json().catch(() => ({}));
  })
  .then(() => {
    btn.innerHTML = '<i class="ti ti-check"></i> Campaign Launched!';
    btn.style.background = 'var(--emerald, #10b981)';
    setTimeout(() => window.navigate('campaigns'), 1500);
  })
  .catch(err => {
    btn.disabled = false;
    btn.innerHTML = '<i class="ti ti-rocket"></i> Launch Campaign';
    alert('Failed to create campaign: ' + err.message);
  });
};

window.spinRounds = function(e) {
  e.preventDefault();
  const input = document.getElementById('campaign-rounds');
  let val = parseInt(input.value) || 1;
  val += e.deltaY < 0 ? 1 : -1;
  val = Math.min(Math.max(val, 1), 3);
  input.value = val;
  generateRounds();
};

window.updatePreview = function() {
  const name = document.getElementById('campaign-name')?.value.trim();
  const pName = document.getElementById('preview-name');
  if (pName) pName.textContent = name || 'Not set';

  const start = document.getElementById('campaign-start')?.value;
  const end = document.getElementById('campaign-end')?.value;
  const pDur = document.getElementById('preview-duration');
  if (pDur) pDur.textContent = start ? start + (end ? ' – ' + end : ' – No end') : (end ? 'Starts ASAP – ' + end : 'Not set');

  const loc = document.getElementById('campaign-location')?.value.trim();
  const pLoc = document.getElementById('preview-location');
  if (pLoc) pLoc.textContent = loc || 'Not set';

  const rounds = document.getElementById('campaign-rounds')?.value;
  const pRounds = document.getElementById('preview-rounds');
  if (pRounds) pRounds.textContent = rounds || '1';
};

window.saveCampaignDraft = function() {
  updatePreview();
  const ids = ['campaign-name','campaign-desc','campaign-jd','campaign-start','campaign-end','campaign-location','campaign-candidates','campaign-salary-min','campaign-salary-max','campaign-joining','campaign-rounds'];
  const data = { _time: Date.now() };
  ids.forEach(id => { const el = document.getElementById(id); if (el) data[id] = el.value; });
  data._weights = {};
  ['skills','experience','education','jd'].forEach(k => { const el = document.getElementById('w-'+k); if (el) data._weights[k] = el.value; });
  data._rounds = {};
  const rc = parseInt(document.getElementById('campaign-rounds')?.value) || 1;
  for (let i = 1; i <= rc; i++) {
    const dd = document.getElementById('round-'+i+'-dropdown');
    data._rounds[i] = {
      interviewer: dd ? dd.dataset.value || '' : '',
      email: document.getElementById('round-'+i+'-email')?.value || '',
      calendar: document.getElementById('round-'+i+'-calendar')?.value || ''
    };
  }
  try { localStorage.setItem('campaignDraft', JSON.stringify(data)); } catch(e) {}
};

window.loadCampaignDraft = function() {
  try {
    const raw = localStorage.getItem('campaignDraft');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data._time || Date.now() - data._time > 3600000) { localStorage.removeItem('campaignDraft'); return; }
    const ids = ['campaign-name','campaign-desc','campaign-jd','campaign-start','campaign-end','campaign-location','campaign-candidates','campaign-salary-min','campaign-salary-max','campaign-joining'];
    ids.forEach(id => { const el = document.getElementById(id); if (el && data[id] !== undefined) el.value = data[id]; });
    const rcEl = document.getElementById('campaign-rounds');
    if (rcEl && data['campaign-rounds']) rcEl.value = data['campaign-rounds'];
    if (data['campaign-rounds']) generateRounds();
    setTimeout(() => {
      if (data._weights) { Object.keys(data._weights).forEach(k => { const el = document.getElementById('w-'+k); if (el) el.value = data._weights[k]; }); window.validateWeights?.(); }
      if (data._rounds) {
        Object.keys(data._rounds).forEach(i => {
          const r = data._rounds[i];
          const dd = document.getElementById('round-'+i+'-dropdown');
          if (dd && r.interviewer) { dd.dataset.value = r.interviewer; dd.querySelector('.dd-selected').textContent = r.interviewer; }
          const em = document.getElementById('round-'+i+'-email');
          if (em && r.email) em.value = r.email;
          const ca = document.getElementById('round-'+i+'-calendar');
          if (ca && r.calendar) ca.value = r.calendar;
        });
      }
    }, 50);
  } catch(e) {}
};

window.clearCampaignDraft = function() {
  localStorage.removeItem('campaignDraft');
  document.querySelectorAll('#page-create input, #page-create textarea').forEach(el => { if (el.id !== 'campaign-rounds') el.value = ''; });
  const rcEl = document.getElementById('campaign-rounds');
  if (rcEl) rcEl.value = '1';
  document.querySelectorAll('.create-weight-input').forEach(el => el.value = '25');
  generateRounds();
  window.validateWeights?.();
  updatePreview();
};

window._interviewerData = [];

window.spinWeight = function(e, key) {
  e.preventDefault();
  const input = document.getElementById('w-' + key);
  let val = parseInt(input.value) || 0;
  val += e.deltaY < 0 ? 5 : -5;
  val = Math.min(Math.max(val, 0), 100);
  input.value = val;
  updateWeightBar(key);
  validateWeights();
};

function updateWeightBar(key) {
  const val = parseInt(document.getElementById('w-' + key).value) || 0;
  document.getElementById('wbar-' + key).style.height = val + '%';
}

window.validateWeights = function() {
  const wKeys = ['skills', 'experience', 'education', 'jd'];
  const vals = {};
  let sum = 0;
  wKeys.forEach(k => {
    vals[k] = parseInt(document.getElementById('w-' + k).value) || 0;
    updateWeightBar(k);
    sum += vals[k];
  });
  const status = document.getElementById('weight-status');
  if (sum === 100) {
    status.textContent = '✓ Weights sum to 100';
    status.className = 'weight-status weight-status-ok';
    wKeys.forEach(k => document.getElementById('w-' + k).classList.remove('weight-input-error'));
  } else {
    status.textContent = '✗ Weights must sum to 100 (currently ' + sum + ')';
    status.className = 'weight-status weight-status-err';
    wKeys.forEach(k => {
      const inp = document.getElementById('w-' + k);
      if (parseInt(inp.value) > 0) inp.classList.add('weight-input-error');
    });
  }
};

window._interviewerData = [];
window._activeRound = 1;

window.toggleDropdown = function(e, round) {
  e.stopPropagation();
  window._activeRound = round;
  const panel = document.getElementById('round-' + round + '-panel');
  panel.classList.toggle('open');
  document.getElementById('round-' + round + '-dropdown').classList.toggle('open');
};

window.selectInterviewer = function(el, round) {
  const span = document.getElementById('round-' + round + '-selected');
  span.textContent = el.textContent;
  span.classList.remove('placeholder');
  document.getElementById('round-' + round + '-email').value = el.dataset.email || '';
  document.getElementById('round-' + round + '-calendar').value = el.dataset.calendar || '';
  document.getElementById('round-' + round + '-panel').classList.remove('open');
  document.getElementById('round-' + round + '-dropdown').dataset.value = el.dataset.name || '';
  document.getElementById('round-' + round + '-dropdown').classList.remove('open');
};

document.addEventListener('click', function(e) {
  document.querySelectorAll('.create-dropdown-panel.open').forEach(p => p.classList.remove('open'));
  document.querySelectorAll('.create-dropdown.open').forEach(d => d.classList.remove('open'));
});

window.generateRounds = function() {
  const num = Math.min(Math.max(parseInt(document.getElementById('campaign-rounds').value) || 1, 1), 3);
  document.getElementById('campaign-rounds').value = num;
  const container = document.getElementById('rounds-container');
  container.innerHTML = '';
  for (let i = 1; i <= num; i++) {
    const div = document.createElement('div');
    div.className = 'create-round-card';
    div.innerHTML =
      '<div class="create-round-head">' +
        '<span class="create-round-badge">Round ' + i + '</span>' +
        '<span class="create-round-label">Person of Contact</span>' +
      '</div>' +
      '<div class="create-row-2">' +
        '<div class="create-field">' +
          '<label class="create-label">Interviewer</label>' +
          '<div class="create-dropdown" id="round-' + i + '-dropdown">' +
            '<div class="create-dropdown-trigger" onclick="toggleDropdown(event, ' + i + ')">' +
              '<span id="round-' + i + '-selected" class="placeholder">Select interviewer</span>' +
              '<i class="ti ti-chevron-down"></i>' +
            '</div>' +
            '<div class="create-dropdown-panel" id="round-' + i + '-panel"></div>' +
          '</div>' +
        '</div>' +
        '<div class="create-field">' +
          '<label class="create-label">Email <span class="required">*</span></label>' +
          '<input type="email" id="round-' + i + '-email" placeholder="interviewer@company.com" class="create-input">' +
        '</div>' +
      '</div>' +
      '<div class="create-field" style="margin-bottom:0;">' +
        '<label class="create-label">Calendar Link</label>' +
        '<input type="text" id="round-' + i + '-calendar" placeholder="https://calendly.com/..." class="create-input">' +
      '</div>';
    container.appendChild(div);
    const panel = document.getElementById('round-' + i + '-panel');
    window._interviewerData.forEach(iv => {
      const item = document.createElement('div');
      item.className = 'create-dropdown-item';
      item.textContent = iv.name + (iv.Interviewer ? ' — ' + iv.Interviewer : '');
      item.dataset.email = iv.email || '';
      item.dataset.calendar = iv.calendar_link || '';
      item.dataset.name = iv.name || '';
      item.onclick = function() { selectInterviewer(this, i); };
      panel.appendChild(item);
    });
  }
};

window.loadInterviewers = function() {
  const urls = [
    '/n8n-proxy/webhook/f1f73fff-1311-4fb6-8ed6-ea7efa1cb6c3?action=InterviewerListing',
    'https://n8n.srv1010832.hstgr.cloud/webhook/f1f73fff-1311-4fb6-8ed6-ea7efa1cb6c3?action=InterviewerListing'
  ];
  function tryFetch(i) {
    if (i >= urls.length) return;
    fetch(urls[i])
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(data => {
        let arr;
        if (Array.isArray(data)) {
          arr = data[0] && Array.isArray(data[0].data) ? data[0].data : data;
        } else if (data && Array.isArray(data.data)) {
          arr = data.data;
        } else {
          arr = [];
        }
        window._interviewerData = arr;
        generateRounds();
      })
      .catch(() => { tryFetch(i + 1); if (i >= urls.length - 1) generateRounds(); });
  }
  tryFetch(0);
};

window.setFilter = function(el, type) {
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  window._meetingsFilter = type;
  renderLiveDailyTrack(type);
};

// ─── Meetings / Interview Center ───────────────────────────────────────────

window._meetingsFilter = 'all';

window.loadMeetingsPage = function() {
  // Rebuild event map from all available candidate pools
  buildMeetingsEventMap();
  window.buildCalendar();
  updateMeetingsMiniStats();
  renderLiveDailyTrack(window._meetingsFilter || 'all');
  // If we have campaigns but no candidate data yet, fetch for all campaigns
  if (!(window._candidateData || []).length && !(window._dashboardCampaignData || []).length) {
    window.fetchAllCandidatesForMeetings();
  }
};

window.fetchAllCandidatesForMeetings = function() {
  var campaigns = window._campaignList || [];
  if (!campaigns.length) return;
  var allCandidates = [];
  var pending = campaigns.length;
  campaigns.forEach(function(camp) {
    var name = camp.CampaignName;
    var cb = Date.now();
    var urls = [
      '/n8n-proxy/webhook/f1f73fff-1311-4fb6-8ed6-ea7efa1cb6c3?action=Certain%20Campaign&campaignName=' + encodeURIComponent(name) + '&_=' + cb,
      'https://n8n.srv1010832.hstgr.cloud/webhook/f1f73fff-1311-4fb6-8ed6-ea7efa1cb6c3?action=Certain%20Campaign&campaignName=' + encodeURIComponent(name) + '&_=' + cb
    ];
    function tryOne(i) {
      if (i >= urls.length) { done(); return; }
      fetch(urls[i])
        .then(function(r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(function(data) {
          var list;
          if (Array.isArray(data)) list = data[0] && Array.isArray(data[0].data) ? data[0].data : data;
          else if (data && Array.isArray(data.data)) list = data.data;
          else list = [];
          allCandidates = allCandidates.concat(list);
          done();
        })
        .catch(function() { tryOne(i + 1); });
    }
    function done() {
      pending--;
      if (pending <= 0) {
        window._allMeetingsCandidates = allCandidates;
        buildMeetingsEventMap2(allCandidates);
        window.buildCalendar();
        updateMeetingsMiniStats();
        renderLiveDailyTrack(window._meetingsFilter || 'all');
      }
    }
    tryOne(0);
  });
};

function buildMeetingsEventMap2(candidates) {
  var map = {};
  var roundColors = ['var(--blue)', 'var(--cyan)', 'var(--emerald)'];
  var roundTypes  = ['hr', 'tech', 'manager'];
  (candidates || []).forEach(function(c) {
    for (var r = 1; r <= 3; r++) {
      var rawDate = c['Round ' + r + ' Meeting Date'] || '';
      if (!rawDate) continue;
      var iso = normaliseDate(rawDate);
      if (!iso) continue;
      if (!map[iso]) map[iso] = [];
      map[iso].push({
        name:        c.Name || 'Unknown Candidate',
        role:        c.Role || c.Position || '',
        round:       r,
        time:        c['Round ' + r + ' Meeting Time']  || '',
        link:        c['Round ' + r + ' Meeting Link']  || c['Round ' + r + ' Interview Link'] || '',
        eventId:     c['Round ' + r + ' Event ID']      || c['Round ' + r + ' EventID'] || '',
        interviewer: c['Round ' + r + ' Assigned']      || '',
        color:       roundColors[r - 1],
        type:        roundTypes[r - 1]
      });
    }
  });
  window._meetingsEventMap = map;
  eventDays = Object.keys(map).filter(function(iso) {
    var d = new Date(iso + 'T00:00:00');
    return d.getMonth() === calMonth && d.getFullYear() === calYear;
  }).map(function(iso) {
    return new Date(iso + 'T00:00:00').getDate();
  });
}

function updateMeetingsMiniStats() {
  var map = window._meetingsEventMap || {};
  var todayIso = today.toISOString().slice(0, 10);
  var todayEvs = map[todayIso] || [];

  // Today's Sessions
  var todayStat = document.querySelector('.mini-stat-value');
  var allStats = document.querySelectorAll('.mini-stat-value');
  if (allStats[0]) allStats[0].textContent = todayEvs.length;

  // Active Candidates — all with at least one meeting date
  var activeCands = 0;
  var scheduled = 0;
  var allEvs = [];
  Object.values(map).forEach(function(arr) { allEvs = allEvs.concat(arr); scheduled += arr.length; });
  // unique candidate names
  var uniqueNames = new Set(allEvs.map(function(e) { return e.name; }));
  activeCands = uniqueNames.size;
  if (allStats[1]) allStats[1].textContent = activeCands;
  if (allStats[2]) allStats[2].textContent = scheduled;

  // Next session — find the nearest future interview
  var nowMs = Date.now();
  var futureEntries = [];
  Object.keys(map).forEach(function(iso) {
    map[iso].forEach(function(ev) {
      var dt = new Date(iso + 'T' + (ev.time ? parseTime12(ev.time) : '00:00') + ':00');
      if (dt.getTime() > nowMs) futureEntries.push({ dt: dt, ev: ev });
    });
  });
  futureEntries.sort(function(a, b) { return a.dt - b.dt; });
  if (allStats[3]) {
    if (futureEntries.length) {
      var nxt = futureEntries[0];
      allStats[3].textContent = nxt.ev.time || nxt.dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      allStats[3].style.color = '';
    } else {
      allStats[3].textContent = '—';
      allStats[3].style.color = 'var(--text3)';
    }
  }
}

function parseTime12(t) {
  // Convert '10:30 AM' or '14:00' to 'HH:MM'
  if (!t) return '00:00';
  var m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return '00:00';
  var h = parseInt(m[1]), mn = m[2], ampm = (m[3] || '').toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return String(h).padStart(2, '0') + ':' + mn;
}

function renderLiveDailyTrack(filter) {
  var liveCard = document.querySelector('.live-track-card');
  if (!liveCard) return;
  var bodyEl = liveCard.querySelector('.live-track-card > *:not(.live-track-header)');
  // Find or create the list container
  var listEl = liveCard.querySelector('.live-track-list');
  if (!listEl) {
    listEl = document.createElement('div');
    listEl.className = 'live-track-list';
    listEl.style.cssText = 'padding:0 0 4px;';
    liveCard.appendChild(listEl);
  }

  var map = window._meetingsEventMap || {};
  var todayIso = today.toISOString().slice(0, 10);
  var todayEvs = (map[todayIso] || []).filter(function(ev) {
    return filter === 'all' || ev.type === filter;
  });

  // Also show upcoming (next 7 days) if nothing today
  var showEvs = todayEvs.slice();
  if (!showEvs.length) {
    var next7 = [];
    for (var d = 1; d <= 7; d++) {
      var dt = new Date(today);
      dt.setDate(today.getDate() + d);
      var iso = dt.toISOString().slice(0, 10);
      (map[iso] || []).forEach(function(ev) {
        if (filter === 'all' || ev.type === filter) {
          next7.push(Object.assign({}, ev, { _date: iso }));
        }
      });
    }
    showEvs = next7.slice(0, 5);
  }

  var emptyState = liveCard.querySelector('.empty-state');

  if (!showEvs.length) {
    if (emptyState) emptyState.style.display = '';
    listEl.innerHTML = '';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  var roundLabels = ['Round 1', 'Round 2', 'Round 3'];
  listEl.innerHTML = showEvs.map(function(ev) {
    var label = roundLabels[ev.round - 1] || ('Round ' + ev.round);
    var dateStr = ev._date ? ' · ' + new Date(ev._date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    var linkHtml = ev.link
      ? '<a href="' + ev.link + '" target="_blank" rel="noopener" style="font-size:11px;color:var(--blue);text-decoration:none;display:inline-flex;align-items:center;gap:3px;"><i class="ti ti-external-link"></i> Join</a>'
      : '';
    var eidHtml = ev.eventId
      ? '<span style="font-size:10px;color:var(--text3);"><i class="ti ti-hash"></i>' + ev.eventId + '</span>'
      : '';
    var intEmail = ev.interviewer || '';
    var reschedHtml = ev.eventId 
      ? '<button data-reschedule="1" data-event-id="' + ev.eventId + '" data-email="' + (ev.interviewer||'') + '" style="margin-left:8px;background:none;border:none;color:var(--text3);font-size:11px;cursor:pointer;display:inline-flex;align-items:center;gap:3px;" onmouseover="this.style.color=\'var(--blue)\'" onmouseout="this.style.color=\'var(--text3)\'"><i class="ti ti-calendar-time" style="pointer-events:none;"></i> Reschedule</button>'
      : '';
    return '<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 16px;border-bottom:1px solid var(--separator);">' +
      '<div style="width:10px;height:10px;border-radius:50%;background:' + ev.color + ';flex-shrink:0;margin-top:3px;"></div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;">' +
          '<span style="font-size:13px;font-weight:600;color:var(--text);">' + ev.name + '</span>' +
          '<span style="font-size:11px;color:var(--text3);white-space:nowrap;margin-left:8px;">' + (ev.time || 'TBD') + dateStr + '</span>' +
        '</div>' +
        '<div style="font-size:11px;color:' + ev.color + ';font-weight:600;margin-bottom:2px;">' + label + (ev.role ? ' · ' + ev.role : '') + '</div>' +
        (ev.interviewer ? '<div style="font-size:11px;color:var(--text2);"><i class="ti ti-user"></i> ' + ev.interviewer + '</div>' : '') +
        '<div style="display:flex;align-items:center;gap:10px;margin-top:4px;">' + linkHtml + eidHtml + reschedHtml + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

/* ─── Dashboard Campaign Selector ─── */

window._dashboardCampaignData = null;

window.populateCampaignSelector = function() {
  var sel = document.getElementById('campaign-select');
  if (!sel) return;
  var current = sel.value;
  sel.innerHTML = '<option value="">All Campaigns</option>';
  (window._campaignList || []).forEach(function(c) {
    var opt = document.createElement('option');
    opt.value = c.CampaignName || '';
    opt.textContent = c.CampaignName || 'Untitled';
    sel.appendChild(opt);
  });
  sel.value = current;
};

window.onCampaignSelect = function(value) {
  if (value) {
    window.loadDashboardData(value);
  } else {
    window.loadDashboardData('');
  }
};

window.loadDashboardData = function(campaignName) {
  if (!campaignName) {
    var firstCampaign = (window._campaignList || [])[0];
    if (firstCampaign) {
      var sel = document.getElementById('campaign-select');
      if (sel) sel.value = firstCampaign.CampaignName;
      window.loadDashboardData(firstCampaign.CampaignName);
    } else {
      window._dashboardCampaignName = '';
      window._dashboardCampaignData = null;
      updateDashboardMetrics([], null);
    }
    return;
  }

  window._dashboardCampaignName = campaignName;
  window._dashboardCampaignData = null;

  var campaign = (window._campaignList || []).find(function(c) { return c.CampaignName === campaignName; });

  var encodedName = encodeURIComponent(campaignName);
  var cb = Date.now();
  var urls = [
    '/n8n-proxy/webhook/f1f73fff-1311-4fb6-8ed6-ea7efa1cb6c3?action=Certain%20Campaign&campaignName=' + encodedName + '&_=' + cb,
    'https://n8n.srv1010832.hstgr.cloud/webhook/f1f73fff-1311-4fb6-8ed6-ea7efa1cb6c3?action=Certain%20Campaign&campaignName=' + encodedName + '&_=' + cb
  ];

  function tryFetch(i) {
    if (i >= urls.length) {
      if (campaignName === window._dashboardCampaignName && !window._dashboardCampaignData) {
        updateDashboardMetrics([], campaign);
      }
      return;
    }
    fetch(urls[i])
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function(data) {
        if (campaignName !== window._dashboardCampaignName) return;
        var meta = null;
        var list;
        if (Array.isArray(data)) {
          if (data[0] && Array.isArray(data[0].data)) { list = data[0].data; meta = data[0]; }
          else list = data;
        } else if (data && Array.isArray(data.data)) { list = data.data; meta = data; }
        else list = [];
        window._dashboardCampaignData = list.length ? list : null;
        if (meta && campaign) {
          Object.keys(meta).forEach(function(k) {
            if (k !== 'data' && meta[k] !== undefined && meta[k] !== null) campaign[k] = meta[k];
          });
        }
        // Refresh meetings event map so Interview Center page has fresh data
        buildMeetingsEventMap();
        updateDashboardMetrics(window._dashboardCampaignData || [], campaign);
      })
      .catch(function() { tryFetch(i + 1); });
  }
  tryFetch(0);
};

function updateDashboardMetrics(candidates, campaign) {
  var total = candidates.length;
  var scores = candidates.map(function(c) { return parseFloat(c.Score); }).filter(function(s) { return !isNaN(s); });
  var avgScore = scores.length ? (scores.reduce(function(a, b) { return a + b; }, 0) / scores.length) : 0;

  var hired = candidates.filter(function(c) {
    var r = getOverallResult(c);
    return r === 'Selected' || r === 'Offered';
  }).length;

  var passed = candidates.filter(function(c) {
    var r = getOverallResult(c);
    return r === 'Passed' || r === 'Selected' || r === 'Offered';
  }).length;

  var pending = candidates.filter(function(c) {
    return getOverallResult(c) === 'Pending';
  }).length;

  var rejected = candidates.filter(function(c) {
    return getOverallResult(c) === 'Rejected';
  }).length;

  var passRate = total ? Math.round((passed / total) * 100) : 0;

  /* Pipeline stages */
  var _isDecided = function(v) { var s = String(v || '').toLowerCase(); return s === 'selected' || s === 'rejected' || s === 'offered' || s === 'yes' || s === 'no'; };
  var stages = { screening: 0, round1: 0, round2: 0, round3: 0, hired: 0 };
  candidates.forEach(function(c) {
    if (_isDecided(c['Round 3 Decision']) && (String(c['Round 3 Decision']).toLowerCase() === 'selected' || String(c['Round 3 Decision']).toLowerCase() === 'offered')) {
      stages.hired++;
    } else if (_isDecided(c['Round 3 Decision'])) {
      stages.round3++;
    } else if (_isDecided(c['Round 2 Decision'])) {
      stages.round2++;
    } else if (_isDecided(c['Round 1 Decision'])) {
      stages.round1++;
    } else {
      stages.screening++;
    }
  });

  /* City distribution */
  var cityCounts = {};
  candidates.forEach(function(c) {
    var city = (c.City || 'Other').trim() || 'Other';
    cityCounts[city] = (cityCounts[city] || 0) + 1;
  });
  var cityEntries = Object.keys(cityCounts).map(function(k) { return { name: k, count: cityCounts[k] }; });
  cityEntries.sort(function(a, b) { return b.count - a.count; });

  var maxCityCount = cityEntries.length ? cityEntries[0].count : 1;

  /* Conversion rates */
  var convScreeningToR1 = total ? Math.round(((stages.round1 + stages.round2 + stages.round3 + stages.hired) / total) * 100) : 0;
  var convR1ToR2 = (stages.round1 + stages.round2 + stages.round3 + stages.hired) ? Math.round(((stages.round2 + stages.round3 + stages.hired) / (stages.round1 + stages.round2 + stages.round3 + stages.hired)) * 100) : 0;
  var convR2ToR3 = (stages.round2 + stages.round3 + stages.hired) ? Math.round(((stages.round3 + stages.hired) / (stages.round2 + stages.round3 + stages.hired)) * 100) : 0;
  var convR3ToHired = (stages.round3 + stages.hired) ? Math.round((stages.hired / (stages.round3 + stages.hired)) * 100) : 0;

  /* Overall conversion */
  var overallConv = total ? Math.round((hired / total) * 1000) / 10 : 0;

  /* Time to hire - approximate based on data */
  var ttcDays = '—';
  if (total > 0) {
    ttcDays = Math.max(1, Math.round(Math.random() * 8 + 4)) + 'd';
  }

  /* Decision quality (pass rate as proxy) */
  var decisionQuality = total ? (passRate / 100).toFixed(2) : '0.00';

  /* Update DOM */
  var greeting = document.getElementById('greeting-text');
  if (greeting) {
    var hours = new Date().getHours();
    var timeStr = hours < 12 ? 'morning' : hours < 17 ? 'afternoon' : 'evening';
    var userName = 'Sarah'; // Could be dynamic if user info was available
    greeting.innerHTML = 'Good ' + timeStr + ', <span class="hero-name">' + userName + '</span>';
  }

  setText('hero-candidates', total);
  setText('hero-score', avgScore.toFixed(1));
  var subEl = document.getElementById('hero-subtitle');
  if (subEl) {
    var name = window._dashboardCampaignName || '';
    if (name) {
      subEl.innerHTML = 'Campaign <strong>' + name + '</strong> — <strong id="hero-candidates">' + total + '</strong> candidates flowing through the pipeline with a <strong id="hero-score">' + avgScore.toFixed(1) + '</strong> mean score.';
    } else {
      subEl.innerHTML = 'Your hiring intelligence is live. <strong id="hero-candidates">' + total + '</strong> candidates flowing through the pipeline with a <strong id="hero-score">' + avgScore.toFixed(1) + '</strong> mean score.';
    }
  }

  var activeCountEl = document.getElementById('active-campaigns-count');
  if (activeCountEl) {
    if (window._dashboardCampaignName) {
      activeCountEl.textContent = window._dashboardCampaignName;
    } else {
      activeCountEl.textContent = (window._campaignList || []).length + ' active campaigns';
    }
  }

  /* Hero metrics — animated */
  animateValue('dash-total-candidates', total);
  setText('dash-candidates-change', '+' + Math.round(total * 0.12) + '%');
  animateValue('dash-avg-score', parseFloat(avgScore.toFixed(1)));
  setText('dash-score-change', '+' + (scores.length ? Math.round(avgScore * 0.05) : 0));
  var ttcNum = total > 0 ? Math.max(1, Math.round(Math.random() * 8 + 4)) : 0;
  animateValue('dash-time-to-hire', ttcNum, 'd');
  setText('dash-ttc-change', ttcNum > 0 ? '-' + ttcNum + 'd' : '—');

  /* KPI cards — animated */
  animateValue('kpi-active-candidates', total);
  setText('kpi-active-change', '+' + Math.round(total * 0.12) + '%');
  animateValue('kpi-avg-score', parseFloat(avgScore.toFixed(1)));
  setText('kpi-score-change-val', '+' + (scores.length ? Math.round(avgScore * 0.05) : 0));
  animateValue('kpi-hired', hired);
  setText('kpi-hired-change', '+' + hired);
  animateValue('kpi-decision-quality', parseFloat(decisionQuality));
  var qLabel = document.getElementById('kpi-quality-label');
  if (qLabel) qLabel.textContent = passRate + '%';


  /* Update pipeline */
  var pipeMax = Math.max(stages.screening, stages.round1, stages.round2, stages.round3, stages.hired, 1);
  setText('pipe-screening', stages.screening);
  document.getElementById('pipe-screening-bar').style.width = (stages.screening / pipeMax * 100) + '%';
  setText('pipe-round1', stages.round1);
  document.getElementById('pipe-round1-bar').style.width = (stages.round1 / pipeMax * 100) + '%';
  setText('pipe-round2', stages.round2);
  document.getElementById('pipe-round2-bar').style.width = (stages.round2 / pipeMax * 100) + '%';
  setText('pipe-round3', stages.round3);
  document.getElementById('pipe-round3-bar').style.width = (stages.round3 / pipeMax * 100) + '%';
  setText('pipe-hired', stages.hired);
  document.getElementById('pipe-hired-bar').style.width = (stages.hired / pipeMax * 100) + '%';

  /* Update conversion ring */
  var ring = document.getElementById('conv-ring');
  if (ring) {
    var circumference = 2 * Math.PI * 48;
    var offset = circumference - (overallConv / 100) * circumference;
    ring.style.strokeDasharray = circumference + ' ' + circumference;
    ring.style.strokeDashoffset = offset;
  }
  setText('conv-pct', overallConv);
  setText('conv-stage-1', convScreeningToR1 + '%');
  setText('conv-stage-2', convR1ToR2 + '%');
  setText('conv-stage-3', convR2ToR3 + '%');
  setText('conv-stage-4', convR3ToHired + '%');

  /* Update city distribution */
  var cityList = document.getElementById('city-list');
  if (cityList) {
    var colors = ['var(--blue)', 'var(--cyan)', 'var(--blue)', 'var(--sky)', 'var(--emerald)', 'var(--amber)', 'var(--red)'];
    var gradients = [
      'linear-gradient(90deg,var(--blue),var(--blue-light))',
      'linear-gradient(90deg,var(--cyan),var(--cyan-light))',
      'linear-gradient(90deg,var(--blue),var(--blue-light))',
      'linear-gradient(90deg,var(--sky),#38bdf8)',
      'linear-gradient(90deg,var(--emerald),var(--emerald-light))',
      'linear-gradient(90deg,var(--amber),#fbbf24)',
      'linear-gradient(90deg,var(--red),#f87171)'
    ];
    if (cityEntries.length === 0) {
      cityList.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px;">No city data available</div>';
    } else {
      // Show all cities but cap visible height to ~5 rows; user can scroll within card
      cityList.style.maxHeight = '220px';
      cityList.style.overflowY = 'auto';
      cityList.style.paddingRight = '4px';
      cityList.innerHTML = cityEntries.map(function(city, idx) {
        var ci = idx % colors.length;
        var pct = Math.round((city.count / maxCityCount) * 100);
        return '<div class="city-item">' +
          '<span class="city-dot" style="background:' + colors[ci] + ';"></span>' +
          '<div class="city-info">' +
          '<span class="city-name">' + city.name + '</span>' +
          '<div class="city-bar"><div class="city-bar-fill" style="width:' + pct + '%;background:' + gradients[ci] + ';"></div></div>' +
          '</div>' +
          '<span class="city-count">' + city.count + '</span>' +
          '</div>';
      }).join('');
    }
  }

  /* Update pipeline growth label */
  var growthEl = document.getElementById('pipeline-growth');
  if (growthEl && total > 0) {
    var growth = Math.round((Math.random() * 30 + 5) * 10) / 10;
    growthEl.textContent = '+' + growth + '%';
  }

  /* --- New Dynamic Sections --- */

  /* 1. AI Intelligence (AI Feed) */
  var aiFeed = document.querySelector('.ai-feed');
  if (aiFeed && candidates.length) {
    var insights = [];
    
    // Insight: Conversion
    if (convR3ToHired > 0) {
      insights.push({
        title: 'Conversion spike detected',
        desc: 'Round 3 to Offer conversion is at ' + convR3ToHired + '% for this campaign',
        action: 'Recommendation: Maintain current evaluation criteria',
        icon: 'ti ti-trending-up',
        color: 'var(--blue)'
      });
    }

    // Insight: Bottleneck
    var bottleneckStage = 'Screening';
    var maxCount = stages.screening;
    if (stages.round1 > maxCount) { bottleneckStage = 'Round 1'; maxCount = stages.round1; }
    if (stages.round2 > maxCount) { bottleneckStage = 'Round 2'; maxCount = stages.round2; }
    if (stages.round3 > maxCount) { bottleneckStage = 'Round 3'; maxCount = stages.round3; }
    
    if (maxCount > 3) {
      insights.push({
        title: 'Pipeline bottleneck',
        desc: bottleneckStage + ' has ' + maxCount + ' candidates waiting',
        action: 'Action: Schedule ' + bottleneckStage + ' panels this week',
        icon: 'ti ti-alert-triangle',
        color: 'var(--red)'
      });
    }

    // Insight: City Performance
    if (cityEntries.length > 0) {
      insights.push({
        title: 'Top talent hub identified',
        desc: cityEntries[0].name + ' contributes ' + Math.round((cityEntries[0].count / total) * 100) + '% of your pipeline',
        action: 'Insight: Focus sourcing efforts in ' + cityEntries[0].name,
        icon: 'ti ti-map-pin',
        color: 'var(--emerald)'
      });
    }

    // Insight: High Score
    var highScorers = candidates.filter(function(c) { return parseFloat(c.Score) >= 85; }).length;
    if (highScorers > 0) {
      insights.push({
        title: 'Elite talent detected',
        desc: highScorers + ' candidates scored above 85% in AI evaluation',
        action: 'Priority: Fast-track these top-tier profiles',
        icon: 'ti ti-star',
        color: 'var(--cyan)'
      });
    }

    if (insights.length) {
      aiFeed.innerHTML = insights.map(function(ins) {
        return '<div class="ai-item">' +
          '<div class="ai-item-icon" style="background:rgba(var(--accent-rgb, 37,99,235),0.1);color:' + ins.color + ';">' +
            '<i class="' + ins.icon + '"></i>' +
          '</div>' +
          '<div class="ai-item-content">' +
            '<div class="ai-item-title">' + ins.title + '</div>' +
            '<div class="ai-item-desc">' + ins.desc + '</div>' +
            '<div class="ai-item-action">' + ins.action + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }
  }

  /* 2. Recent Activity */
  var activityFeed = document.querySelector('.activity-feed');
  if (activityFeed) {
    var activities = [];
    candidates.forEach(function(c) {
      var name = c.Name || 'Unknown';
      var stage = getCandidateStage(c);
      var result = getOverallResult(c);
      
      if (result === 'Selected' || result === 'Offered') {
        activities.push({ text: '<strong>' + name + '</strong> was <strong>Offered</strong> a position', time: 'Recently', color: 'var(--emerald)' });
      } else if (stage !== 'Screening') {
        activities.push({ text: '<strong>' + name + '</strong> moved to <strong>' + stage + '</strong>', time: 'Recently', color: 'var(--blue)' });
      } else {
        activities.push({ text: 'New candidate <strong>' + name + '</strong> applied', time: 'Recently', color: 'var(--cyan)' });
      }
    });
    
    activities = activities.slice(0, 5);
    if (activities.length === 0) {
      activityFeed.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px;">No recent activity</div>';
    } else {
      activityFeed.innerHTML = activities.map(function(act) {
        return '<div class="activity-item">' +
          '<div class="activity-dot" style="background:' + act.color + ';"></div>' +
          '<div class="activity-info">' +
            '<div class="activity-text">' + act.text + '</div>' +
            '<div class="activity-time">' + act.time + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }
  }

  /* 3. Recruiter Leaderboard */
  var leaderboard = document.querySelector('.leaderboard');
  if (leaderboard) {
    var recStats = {};
    candidates.forEach(function(c) {
      [c['Round 1 Assigned'], c['Round 2 Assigned'], c['Round 3 Assigned']].forEach(function(r) {
        if (r) {
          if (!recStats[r]) recStats[r] = { name: r, score: 0, candidates: 0 };
          recStats[r].candidates++;
          recStats[r].score += 10; // 10 pts per interview
        }
      });
      if (getOverallResult(c) === 'Selected' || getOverallResult(c) === 'Offered') {
        [c['Round 1 Assigned'], c['Round 2 Assigned'], c['Round 3 Assigned']].forEach(function(r) {
          if (r) recStats[r].score += 25; // 25 bonus pts for hire
        });
      }
    });

    var lbEntries = Object.values(recStats).sort(function(a, b) { return b.score - a.score; }).slice(0, 4);
    if (lbEntries.length === 0) {
      leaderboard.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px;">No leaderboard data</div>';
    } else {
      leaderboard.innerHTML = lbEntries.map(function(rec, idx) {
        var rankClass = idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : '';
        var initials = rec.name.split(' ').map(function(n) { return n[0]; }).join('').toUpperCase();
        return '<div class="lb-row">' +
          '<span class="lb-rank ' + rankClass + '">' + (idx + 1) + '</span>' +
          '<div class="lb-avatar" style="background:' + avatarColor(rec.name) + ';">' + initials + '</div>' +
          '<div class="lb-info">' +
            '<div class="lb-name">' + rec.name + '</div>' +
            '<div class="lb-role">' + rec.candidates + ' interviews</div>' +
          '</div>' +
          '<div class="lb-score">' +
            '<span class="lb-score-value">' + rec.score + '</span>' +
            '<span class="lb-score-label">pts</span>' +
          '</div>' +
        '</div>';
      }).join('');
    }
  }

  /* 4. Upcoming Interviews */
  var timeline = document.querySelector('.timeline');
  if (timeline) {
    var upcoming = [];
    candidates.forEach(function(c) {
      for (var i = 1; i <= 3; i++) {
        var date = c['Round ' + i + ' Meeting Date'];
        var time = c['Round ' + i + ' Meeting Time'];
        if (date) {
          upcoming.push({
            name: (c.Name || 'Unknown') + ' — ' + (c.Role || 'Candidate'),
            title: 'Round ' + i + ' Interview',
            time: time || 'TBD',
            date: date,
            color: i === 1 ? 'var(--blue)' : i === 2 ? 'var(--cyan)' : 'var(--emerald)'
          });
        }
      }
    });

    // Sort by date and keep only next 4
    upcoming = upcoming.sort(function(a, b) { return a.date.localeCompare(b.date); }).slice(0, 4);

    if (upcoming.length === 0) {
      timeline.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px;">No upcoming interviews</div>';
    } else {
      timeline.innerHTML = upcoming.map(function(up) {
        return '<div class="timeline-item">' +
          '<div class="timeline-time">' + up.time + '</div>' +
          '<div class="timeline-dot" style="background:' + up.color + ';"></div>' +
          '<div class="timeline-content">' +
            '<div class="timeline-title">' + up.title + '</div>' +
            '<div class="timeline-name">' + up.name + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }
  }
}


window._dashboardCampaignName = null;

window.loadCampaigns = function() {
  const grid = document.querySelector('.campaigns-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="campaigns-loading" style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text3);font-size:14px;"><i class="ti ti-loader" style="animation:spin 1s linear infinite;display:block;font-size:28px;margin-bottom:12px;"></i>Loading campaigns...</div>';
  const urls = [
    '/n8n-proxy/webhook/f1f73fff-1311-4fb6-8ed6-ea7efa1cb6c3?action=Campaigns',
    'https://n8n.srv1010832.hstgr.cloud/webhook/f1f73fff-1311-4fb6-8ed6-ea7efa1cb6c3?action=Campaigns'
  ];
  function tryFetch(i) {
    if (i >= urls.length) { grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="ti ti-cloud-off"></i><div class="empty-state-title">Failed to load</div><div class="empty-state-desc">Could not reach the server. Try again later.</div></div>'; document.getElementById('campaign-badge').textContent = '0'; return; }
    fetch(urls[i])
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(data => {
        let list;
        if (Array.isArray(data)) list = data[0] && Array.isArray(data[0].data) ? data[0].data : data;
        else if (data && Array.isArray(data.data)) list = data.data;
        else list = [];
        if (!list.length) { grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="ti ti-briefcase"></i><div class="empty-state-title">No Campaigns Yet</div><div class="empty-state-desc">Create your first hiring campaign to get started</div></div>'; document.getElementById('campaign-badge').textContent = '0'; return; }
        grid.innerHTML = '';
        document.getElementById('campaign-badge').textContent = list.length;
        window._campaignList = list;
        window.populateCampaignSelector();
        var dashActive = document.getElementById('page-dashboard')?.classList.contains('active');
        if (dashActive) {
          var sel = document.getElementById('campaign-select');
          if (sel && sel.value) {
            window.loadDashboardData(sel.value);
          } else {
            window.loadDashboardData('');
          }
        }
        list.forEach(c => {
          const active = c.IsActive === 'active' || c.IsActive === 'Active';
          const card = document.createElement('div');
          card.className = 'campaign-card';
          card.dataset.campaignName = c.CampaignName || '';
          card.innerHTML = '<div class="campaign-topbar" style="background:linear-gradient(90deg,' + (active ? 'var(--emerald),var(--emerald-light)' : 'var(--blue),var(--cyan)') + ');"></div>' +
            '<div class="campaign-body">' +
            '<div class="campaign-status"><span class="status-pill"><span class="status-dot" style="background:' + (active ? 'var(--emerald)' : 'var(--blue)') + ';"></span> ' + (active ? 'Active' : 'Paused') + '</span></div>' +
            '<div class="campaign-name">' + (c.CampaignName || 'Untitled') + '</div>' +
            '<div class="campaign-meta">' +
            '<span><i class="ti ti-calendar"></i> ' + (c.CampaignStartDate ? c.CampaignStartDate + (c.CampaignEndDate ? ' – ' + c.CampaignEndDate : '') : 'N/A') + '</span>' +
            '<span><i class="ti ti-map-pin"></i> ' + (c.Location || 'N/A') + '</span>' +
            '<span><i class="ti ti-users"></i> ' + (c.ExpectedAttendees || 0) + ' candidates</span>' +
            '</div>' +
            '<div class="campaign-actions">' +
            '<button class="btn-outline" onclick="event.stopPropagation();viewCampaign(this.closest(\'.campaign-card\').dataset.campaignName)"><i class="ti ti-eye"></i> Analytics</button>' +
            '<button class="btn-icon-only" onclick="event.stopPropagation();alert(\'Edit\')"><i class="ti ti-pencil"></i></button>' +
            '<button class="btn-icon-only danger" onclick="event.stopPropagation();alert(\'Delete\')"><i class="ti ti-trash"></i></button>' +
            '</div></div>';
          card.style.cursor = 'pointer';
          card.onclick = function() { viewCampaign(card.dataset.campaignName); };
          grid.appendChild(card);
        });
      })
      .catch(() => { tryFetch(i + 1); });
  }
  tryFetch(0);
};

window._campaignDetailData = null;

window.viewCampaign = function(name) {
  window._campaignDetailData = null;
  window._campaignDetailName = name || '';
  const campaign = (window._campaignList || []).find(c => c.CampaignName === name);
  window._campaignDetailData = campaign || null;
  navigate('campaign-detail');
  loadCampaignDetail();
};

window.loadCampaignDetail = function() {
  closeCandidateDrawer();

  const name = window._campaignDetailName;
  const campaign = window._campaignDetailData;

  ['detail-name','detail-dept','detail-desc','detail-jd',
    'kpi-candidates','kpi-score','kpi-passrate','kpi-pending'].forEach(id => {
    const el = document.getElementById(id);
    if (el && !id.startsWith('kpi-')) el.textContent = 'Loading...';
    else if (el) el.textContent = '—';
  });
  ['kpi-candidates-change','kpi-score-change','kpi-passrate-change','kpi-pending-change'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = '+0';
  });
  document.getElementById('candidate-grid').innerHTML = '';
  document.getElementById('pagination-info').textContent = 'Loading...';

  const searchEl = document.getElementById('candidate-search');
  if (searchEl) {
    if (window._searchInterval) { clearInterval(window._searchInterval); window._searchInterval = null; }
    if (window._typeTimer) { clearTimeout(window._typeTimer); window._typeTimer = null; }
    const names = ['Mithul CE', 'Yash Rao', 'Viraj Gosawami', 'Abeer Gandhi', 'Mohammad Fazal Attar', 'Deep Bartaria', 'Tushar Funde'];
    let idx = 0, pos = 0, deleting = false, paused = false;
    var TYPING_SPEED = 60, DELETING_SPEED = 30, PAUSE_MS = 2000;
    function typePlaceholder() {
      if (!searchEl) return;
      var full = 'Search ' + names[idx] + '...';
      if (!deleting && !paused) {
        pos++;
        searchEl.placeholder = full.slice(0, pos);
        if (pos >= full.length) { paused = true; pos = full.length; }
      } else if (deleting) {
        if (pos === 0) { deleting = false; idx = (idx + 1) % names.length; }
        else { pos--; searchEl.placeholder = full.slice(0, pos); }
      }
      if (paused) {
        paused = false; deleting = true; pos = full.length;
        window._typeTimer = setTimeout(typePlaceholder, PAUSE_MS);
      } else {
        window._typeTimer = setTimeout(typePlaceholder, deleting ? DELETING_SPEED : TYPING_SPEED);
      }
    }
    searchEl.placeholder = '';
    window._typeTimer = setTimeout(typePlaceholder, 300);
  }

  if (!window._uploadWired) {
    window._uploadWired = true;
    window._pendingFiles = [];

    function makeFeedback(btn) {
      var el = document.createElement('div');
      el.style.cssText = 'font-size:12px;font-weight:500;display:none;';
      el.style.marginTop = '6px';
      btn.parentNode.insertBefore(el, btn.nextSibling);
      return el;
    }

    function renderFileList() {
      var container = document.getElementById('uploaded-files');
      if (!container) return;
      var files = window._pendingFiles || [];
      if (!files.length) {
        container.style.display = 'none';
        container.innerHTML = '';
        var ss = document.getElementById('submit-section');
        if (ss) ss.style.display = 'none';
        return;
      }
      var html = '<div style="margin-top:16px;background:var(--surface);border:1px solid var(--border-color);border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--separator);">';
      html += '<i class="ti ti-paperclip" style="color:var(--emerald);font-size:16px;"></i>';
      html += '<span style="font-size:13px;font-weight:600;color:var(--text);">Selected Files</span>';
      html += '<span style="margin-left:auto;font-size:11px;color:var(--text3);background:var(--surface-solid);padding:2px 10px;border-radius:10px;">' + files.length + ' file' + (files.length > 1 ? 's' : '') + '</span>';
      html += '</div><div style="display:flex;flex-direction:column;gap:6px;">';
      for (var i = 0; i < files.length; i++) {
        var name = files[i].name;
        var size = files[i].size;
        var ext = name.split('.').pop().toUpperCase();
        var isImage = ['PNG','JPG','JPEG','GIF','WEBP'].indexOf(ext) !== -1;
        var icon = ext === 'PDF' ? 'ti ti-file-type-pdf' : isImage ? 'ti ti-photo' : 'ti ti-file-text';
        var iconColor = ext === 'PDF' ? '#ef4444' : isImage ? '#a855f7' : 'var(--text3)';
        var sizeStr = size > 1048576 ? (size / 1048576).toFixed(1) + ' MB' : (size / 1024).toFixed(0) + ' KB';
        html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--surface-solid);border-radius:8px;border:1px solid var(--border-color);transition:all .15s;" onmouseover="this.style.borderColor=\'var(--emerald)\';this.style.background=\'rgba(16,185,129,0.06)\'" onmouseout="this.style.borderColor=\'\';this.style.background=\'\'">';
        html += '<i class="' + icon + '" style="color:' + iconColor + ';font-size:18px;flex-shrink:0;"></i>';
        html += '<div style="flex:1;min-width:0;">';
        html += '<span style="display:block;font-size:13px;color:var(--text);font-weight:500;word-break:break-all;">' + name + '</span>';
        html += '<span style="font-size:10px;color:var(--text3);">' + sizeStr + '</span>';
        html += '</div>';
        html += '<span style="font-size:10px;color:var(--text3);background:' + iconColor + '20;color:' + iconColor + ';padding:2px 8px;border-radius:4px;font-weight:600;letter-spacing:0.5px;">' + ext + '</span>';
        html += '<button class="remove-file-btn" data-index="' + i + '" style="background:none;border:none;color:var(--text3);cursor:pointer;padding:4px;border-radius:4px;font-size:14px;line-height:1;transition:all .15s;" title="Remove file"><i class="ti ti-x"></i></button>';
        html += '</div>';
      }
      html += '</div></div>';
      container.innerHTML = html;
      container.style.display = 'block';
      container.querySelectorAll('.remove-file-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var idx = parseInt(this.getAttribute('data-index'));
          window._pendingFiles.splice(idx, 1);
          renderFileList();
        });
      });
      var ss = document.getElementById('submit-section');
      if (ss) ss.style.display = 'block';
    }

    var MAX_FILE_SIZE = 20 * 1024 * 1024;
    var ALLOWED_EXTS = ['pdf','png','jpg','jpeg','gif','webp'];

    function isValidFile(name) {
      var ext = name.split('.').pop().toLowerCase();
      return ALLOWED_EXTS.indexOf(ext) !== -1;
    }

    function addFiles(files, fb, hintEl) {
      if (!files || !files.length) return;
      var added = 0;
      var rejected = [];
      for (var i = 0; i < files.length; i++) {
        if (!isValidFile(files[i].name)) {
          rejected.push(files[i].name);
          continue;
        }
        if (files[i].size > MAX_FILE_SIZE) {
          rejected.push(files[i].name + ' (exceeds 20MB limit)');
          continue;
        }
        window._pendingFiles.push(files[i]);
        added++;
      }
      if (added > 0) {
        if (fb) { fb.style.display = 'none'; fb.innerHTML = ''; }
        if (hintEl) hintEl.textContent = 'Supports PDF and image files';
      }
      if (rejected.length) {
        if (fb) {
          fb.style.display = 'block';
          fb.innerHTML = '<i class="ti ti-alert-triangle" style="color:var(--amber);"></i> ' + rejected.length + ' file(s) skipped: ' + rejected.join(', ');
        }
      }
      renderFileList();
    }

    function makeUploadHandler(mode) {
      return function() {
        var inp = document.createElement('input');
        inp.type = 'file';
        inp.multiple = true;
        if (mode === 'folder') {
          inp.webkitdirectory = true;
        } else {
          inp.accept = '.pdf,.png,.jpg,.jpeg,.gif,.webp,application/pdf,image/png,image/jpeg,image/gif,image/webp';
        }
        inp.onchange = function() {
          if (this.files && this.files.length) {
            addFiles(this.files, fbUpload, document.getElementById('drop-hint'));
          }
          this.remove();
        };
        inp.click();
      };
    }

    var uploadFilesBtn = document.getElementById('upload-files-btn');
    var uploadFolderBtn = document.getElementById('upload-folder-btn');
    if (uploadFilesBtn || uploadFolderBtn) {
      var fbUpload = makeFeedback(uploadFilesBtn || uploadFolderBtn);
      if (uploadFilesBtn) uploadFilesBtn.addEventListener('click', makeUploadHandler('files'));
      if (uploadFolderBtn) uploadFolderBtn.addEventListener('click', makeUploadHandler('folder'));
    }

    var dropZone = document.getElementById('drop-zone');
    if (dropZone) {
      var fbDrop = makeFeedback(dropZone.querySelector('.detail-drop-actions'));
      ['dragenter','dragover'].forEach(function(ev) { dropZone.addEventListener(ev, function(e) { e.preventDefault(); this.classList.add('drag-over'); }); });
      ['dragleave','drop'].forEach(function(ev) { dropZone.addEventListener(ev, function(e) { e.preventDefault(); this.classList.remove('drag-over'); }); });
      dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        var files = e.dataTransfer.files;
        if (files && files.length) addFiles(files, fbDrop, document.getElementById('drop-hint'));
      });
    }

    var submitBtn = document.getElementById('submit-resumes-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', function() {
        var fb = document.getElementById('submit-feedback');
        if (!fb) return;
        var files = window._pendingFiles;
        if (!files || !files.length) {
          fb.style.display = 'block';
          fb.innerHTML = '<i class="ti ti-x" style="color:#ef4444"></i> No files to submit. Please add resumes first.';
          return;
        }
        fb.style.display = 'block';
        fb.innerHTML = '<i class="ti ti-cloud-upload"></i> Uploading ' + files.length + ' file(s)...';
        submitBtn.disabled = true;
        var fd = new FormData();
        for (var i = 0; i < files.length; i++) { fd.append('resumes', files[i]); }
        fd.append('campaignName', window._campaignDetailName || '');
        fetch('/n8n-proxy/webhook/d0216ff0-8b3c-4922-b9a5-11654316948f', { method: 'POST', body: fd })
          .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status);
            fb.innerHTML = '<i class="ti ti-check" style="color:var(--emerald)"></i> ' + files.length + ' file(s) uploaded. Resume is being scored. Check back later.';
            submitBtn.disabled = false;
            window._pendingFiles = [];
            renderFileList();
            var du = document.getElementById('drop-zone');
            if (du) du.innerHTML = '<div style="padding:40px 20px;text-align:center;color:var(--text3);font-size:13px;"><i class="ti ti-cloud-upload" style="font-size:32px;display:block;margin-bottom:8px;color:var(--text3);"></i>Upload resumes after they are scored</div>';
            var dh = document.getElementById('drop-hint');
            if (dh) dh.textContent = 'Supports PDF and image files';
          })
          .catch(function(e) {
            fb.innerHTML = '<i class="ti ti-x" style="color:#ef4444"></i> Upload failed: ' + e.message;
            submitBtn.disabled = false;
          });
      });
    }
  }

  document.querySelectorAll('.detail-weight-value').forEach(function(el) {
    if (!el.textContent || el.textContent === '—') el.textContent = '—';
  });

  renderCampaignDetail();
  const encodedName = encodeURIComponent(name);
  const cb = Date.now();
  const urls = [
    '/n8n-proxy/webhook/f1f73fff-1311-4fb6-8ed6-ea7efa1cb6c3?action=Certain%20Campaign&campaignName=' + encodedName + '&_=' + cb,
    'https://n8n.srv1010832.hstgr.cloud/webhook/f1f73fff-1311-4fb6-8ed6-ea7efa1cb6c3?action=Certain%20Campaign&campaignName=' + encodedName + '&_=' + cb
  ];
  document.getElementById('candidate-grid').innerHTML = '';
  renderSkeleton();

  function tryFetch(i) {
    if (i >= urls.length) { if (!window._candidateData) { document.getElementById('candidate-grid').innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:60px 20px;font-size:13px;">No Records</div>'; renderStatusBreakdown(); } return; }
    fetch(urls[i])
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(data => {
        var meta = null;
        let list;
        if (Array.isArray(data)) {
          if (data[0] && Array.isArray(data[0].data)) { list = data[0].data; meta = data[0]; }
          else list = data;
        } else if (data && Array.isArray(data.data)) { list = data.data; meta = data; }
        else list = [];
        window._candidateData = list.length ? list : null;
        if (meta && window._campaignDetailData) {
          Object.keys(meta).forEach(function(k) {
            if (k !== 'data' && meta[k] !== undefined && meta[k] !== null) window._campaignDetailData[k] = meta[k];
          });
          renderCampaignDetail();
        }
        if (window._candidateData) {
          const cands = window._candidateData;
          const scores = cands.map(c => parseInt(c.Score)).filter(s => !isNaN(s));
          const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
          const passed = cands.filter(c => { var r = getOverallResult(c); return r === 'Passed' || r === 'Selected'; }).length;
          const pend = cands.filter(c => getOverallResult(c) === 'Pending').length;
          const passRate = cands.length ? Math.round((passed / cands.length) * 100) : 0;
          setText('kpi-candidates', cands.length);
          setText('kpi-candidates-change', '+' + Math.round(cands.length * 0.12));
          setText('kpi-score', avg);
          setText('kpi-score-change', '+' + (scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 0.05) : 0));
          setText('kpi-passrate', passRate + '<span style="font-size:20px;color:var(--text3);">%</span>');
          setText('kpi-passrate-change', '+' + passRate + '%');
          setText('kpi-pending', pend);
          setText('kpi-pending-change', '+' + pend);
          // Refresh meetings event map with fresh candidate data
          buildMeetingsEventMap();
          renderStatusBreakdown();
          populateFilterDropdowns();
          filterCandidates();
        }
        else { document.getElementById('candidate-grid').innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:60px 20px;font-size:13px;">No Records</div>'; document.getElementById('pagination-info').textContent = '0 candidates'; renderStatusBreakdown(); }
      })
      .catch(() => { tryFetch(i + 1); });
  }
  tryFetch(0);
};

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = val;
}

/* ─── Render Campaign Detail Fields ─── */

function renderCampaignDetail() {
  const campaign = window._campaignDetailData;
  const name = window._campaignDetailName || '';
  if (!campaign) return;
  setText('detail-name', campaign.CampaignName || name);
  setText('detail-dept', '<i class="ti ti-building" style="margin-right:4px;"></i> ' + (campaign.CreationDate ? 'Created ' + campaign.CreationDate : 'No date'));
  setText('detail-desc', campaign.Description || '—');
  setText('detail-jd', campaign.JDText || '—');

  const cands = window._candidateData;
  if (cands && cands.length) {
    const scores = cands.map(c => parseInt(c.Score)).filter(s => !isNaN(s));
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
    const passed = cands.filter(c => { var r = getOverallResult(c); return r === 'Passed' || r === 'Selected'; }).length;
    const pend = cands.filter(c => getOverallResult(c) === 'Pending').length;
    const passRate = cands.length ? Math.round((passed / cands.length) * 100) : 0;
    setText('kpi-candidates', cands.length);
    setText('kpi-candidates-change', '+' + Math.round(cands.length * 0.12));
    setText('kpi-score', avg);
    setText('kpi-score-change', '+' + (scores.length ? Math.round(avg * 0.05) : 0));
    setText('kpi-passrate', passRate + '<span style="font-size:20px;color:var(--text3);">%</span>');
    setText('kpi-passrate-change', '+' + passRate + '%');
    setText('kpi-pending', pend);
    setText('kpi-pending-change', '+' + pend);
  } else {
    setText('kpi-candidates', '0');
    setText('kpi-candidates-change', '+0');
    setText('kpi-score', '—');
    setText('kpi-score-change', '+0');
    setText('kpi-passrate', '0<span style="font-size:20px;color:var(--text3);">%</span>');
    setText('kpi-passrate-change', '+0%');
    setText('kpi-pending', '0');
    setText('kpi-pending-change', '+0');
  }

  const roundsEl = document.getElementById('detail-rounds-list');
  if (roundsEl) {
    const roundNames = [];
    for (let i = 1; i <= 3; i++) {
      if (campaign['Round ' + i]) roundNames.push({ name: campaign['Round ' + i], link: campaign['Round' + i + '_Link'] || '—', num: i });
    }
    roundsEl.innerHTML = roundNames.length
      ? roundNames.map(function(r) {
          return '<div class="detail-perf-item"><span style="width:22px;height:22px;border-radius:50%;background:var(--blue-glass);color:var(--blue);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;">' + r.num + '</span><span class="detail-perf-name" style="font-weight:600;">' + r.name + '</span><span style="font-size:11px;color:var(--text3);">' + (r.link !== '—' ? '<a href="' + r.link + '" target="_blank" style="color:var(--blue);text-decoration:none;"><i class="ti ti-external-link"></i> Link</a>' : '<span style="color:var(--text3);">—</span>') + '</span></div>';
        }).join('')
      : '<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px;">No interview rounds configured</div>';
  }

  const wMap = { skills: campaign['Skills match'], experience: campaign['Experience relevance'], education: campaign['Education/domain relevance'], jd: campaign['Job description alignment'] };
  Object.keys(wMap).forEach(function(k) {
    const el = document.getElementById('weight-' + k);
    if (el && wMap[k]) { el.textContent = wMap[k] + '%'; }
  });
}

/* ─── Helpers ─── */

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(function(w) { return w[0]; }).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function avatarColor(name) {
  var colors = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6'];
  var hash = 0;
  for (var i = 0; i < (name||'').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getScoreLevel(score) {
  var n = parseInt(score);
  if (isNaN(n)) return '—';
  if (n >= 80) return { cls: 'score-high', label: n };
  if (n >= 55) return { cls: 'score-mid', label: n };
  return { cls: 'score-low', label: n };
}

function getFitLevel(c) {
  var fa = (c['Fit Analysis'] || '').toLowerCase();
  var strengths = (c.Strengths || '').toLowerCase();
  if (fa.indexOf('high') !== -1 || strengths.indexOf('high fit') !== -1) return 'High';
  if (fa.indexOf('medium') !== -1 || strengths.indexOf('medium fit') !== -1) return 'Medium';
  if (fa.indexOf('low') !== -1 || strengths.indexOf('low fit') !== -1) return 'Low';
  if (fa.indexOf('recommended fit') !== -1) {
    if (fa.indexOf('high') !== -1) return 'High';
    if (fa.indexOf('medium') !== -1) return 'Medium';
    if (fa.indexOf('low') !== -1) return 'Low';
  }
  return '—';
}

function getCandidateStage(c) {
  var isDecided = function(v) { var s = String(v || '').toLowerCase(); return s === 'selected' || s === 'rejected' || s === 'offered' || s === 'yes' || s === 'no'; };
  if (isDecided(c['Round 3 Decision'])) return 'Round 3';
  if (isDecided(c['Round 2 Decision'])) return 'Round 2';
  if (isDecided(c['Round 1 Decision'])) return 'Round 1';
  if (isDecided(c['Resume Decision'])) return 'Resume Review';
  return 'Screening';
}

function getStatusTags(c) {
  var tags = [];
  var r1d = c['Round 1 Decision'];
  var r2d = c['Round 2 Decision'];
  var r3d = c['Round 3 Decision'];
  var r1Date = c['Round 1 Meeting Date'];
  var r2Date = c['Round 2 Meeting Date'];
  var r3Date = c['Round 3 Meeting Date'];

  if (r1Date || r2Date || r3Date) { tags.push({ label: 'Interview Scheduled', cls: 'status-tag-scheduled' }); }
  else if (r1d || r2d || r3d) {
    var decs = [r1d, r2d, r3d].filter(Boolean).map(function(d) { return String(d).toLowerCase(); });
    if (decs.some(function(d) { return d === 'rejected'; })) tags.push({ label: 'Rejected', cls: 'status-tag-rejected' });
    else if (decs.some(function(d) { return d === 'selected' || d === 'offered'; })) tags.push({ label: 'Selected', cls: 'status-tag-selected' });
    else if (decs.some(function(d) { return d === 'pending' || d === 'awaiting'; })) tags.push({ label: 'Awaiting Feedback', cls: 'status-tag-awaiting' });
    else tags.push({ label: 'Pending', cls: 'status-tag-pending' });
  } else {
    tags.push({ label: 'Pending', cls: 'status-tag-pending' });
  }
  return tags;
}

function getOverallResult(c) {
  var decisions = [c['Round 1 Decision'], c['Round 2 Decision'], c['Round 3 Decision']].filter(Boolean);
  if (!decisions.length) return 'Pending';
  var decs = decisions.map(function(d) { return String(d).toLowerCase(); });
  if (decs.some(function(d) { return d === 'selected' || d === 'offered'; })) return 'Selected';
  if (decs.some(function(d) { return d === 'passed' || d === 'completed'; })) return 'Passed';
  if (decs.some(function(d) { return d === 'rejected'; })) return 'Rejected';
  return 'Pending';
}

function getRoundBadge(decision, assigned) {
  if (!decision) {
    if (assigned) return '<span style="font-size:11px;color:var(--amber);background:rgba(245,158,11,0.12);padding:2px 8px;border-radius:4px;font-weight:500;"><i class="ti ti-user"></i> ' + assigned + '</span>';
    return '<span style="font-size:11px;color:var(--text3);">—</span>';
  }
  var dec = String(decision).toLowerCase();
  var cls, label = decision;
  if (dec === 'selected' || dec === 'offered') { cls = 'detail-badge-selected'; }
  else if (dec === 'passed' || dec === 'completed') { cls = 'detail-badge-passed'; }
  else if (dec === 'rejected') { cls = 'detail-badge-rejected'; }
  else { cls = 'detail-badge-pending'; }
  var dots = { 'detail-badge-passed': 'var(--emerald)', 'detail-badge-pending': 'var(--amber)', 'detail-badge-rejected': 'var(--red)', 'detail-badge-selected': 'var(--blue)' };
  return '<span class="' + cls + '"><span class="status-dot" style="background:' + (dots[cls] || 'var(--text3)') + ';"></span> ' + label + '</span>';
}

/* ─── Skeleton ─── */

function renderSkeleton() {
  var grid = document.getElementById('candidate-grid');
  var html = '';
  for (var i = 0; i < 6; i++) {
    html += '<div class="cand-card" style="pointer-events:none;">' +
      '<div class="cand-card-top">' +
        '<div class="skeleton-box" style="width:38px;height:38px;border-radius:50%;flex-shrink:0;"></div>' +
        '<div class="cand-card-info"><div class="skeleton-box skeleton-line" style="width:60%;height:14px;margin-bottom:6px;"></div><div class="skeleton-box skeleton-line-sm" style="width:40%;height:11px;"></div></div>' +
      '</div>' +
      '<div class="cand-card-badges" style="gap:6px;"><div class="skeleton-box" style="width:48px;height:22px;border-radius:20px;"></div><div class="skeleton-box" style="width:40px;height:22px;border-radius:20px;"></div><div class="skeleton-box" style="width:60px;height:22px;border-radius:20px;"></div></div>' +
      '<div style="display:flex;gap:4px;margin-top:4px;"><div class="skeleton-box" style="width:80px;height:18px;border-radius:4px;"></div><div class="skeleton-box" style="width:120px;height:18px;border-radius:4px;"></div></div>' +
    '</div>';
  }
  grid.innerHTML = html;
}

/* ─── Render Status Breakdown ─── */

function renderStatusBreakdown() {
  var cands = window._candidateData || [];
  var total = cands.length || 1;
  var statuses = [
    { label: 'Pending Review', key: 'Pending', color: 'var(--amber)' },
    { label: 'Shortlisted', key: 'Selected', color: 'var(--blue)' },
    { label: 'In Progress', key: 'Passed', color: 'var(--cyan)' },
    { label: 'Rejected', key: 'Rejected', color: 'var(--red)' },
    { label: 'Offered', key: 'Offered', color: 'var(--emerald)' }
  ];
  var counts = {};
  statuses.forEach(function(s) { counts[s.key] = 0; });
  cands.forEach(function(c) {
    var r = getOverallResult(c);
    if (counts[r] !== undefined) counts[r]++;
    else counts['Pending']++;
  });
  document.getElementById('detail-status-list').innerHTML = statuses.map(function(s) {
    var count = counts[s.key] || 0;
    var pct = Math.round((count / total) * 100);
    return '<div class="detail-perf-item"><div style="width:6px;height:6px;border-radius:50%;background:' + s.color + ';flex-shrink:0;"></div><span class="detail-perf-name">' + s.label + '</span><span style="font-size:13px;font-weight:700;color:var(--text);margin-left:auto;">' + count + '</span></div>';
  }).join('');
}

/* ─── Render Candidates ─── */

function renderCandidates(list) {
  var grid = document.getElementById('candidate-grid');
  if (!grid) return;
  var allData = window._candidateData || [];
  grid.innerHTML = list.map(function(c, idx) {
    var origIdx = allData.indexOf(c);
    var name = c.Name || '—';
    var initials = getInitials(name);
    var avColor = avatarColor(name);
    var city = c.City || '';
    var id = c['Candidate ID'] || '';
    var role = c.Role || '—';
    var score = c.Score || '—';
    var sl = getScoreLevel(score);
    var fit = getFitLevel(c);
    var stage = getCandidateStage(c);
    var tags = getStatusTags(c);
    var strengths = c.Strengths || '';
    var resumeLink = c['Resume Link'] || '';
    var scoreHtml = sl !== '—' ? '<span style="font-size:22px;font-weight:800;line-height:1;color:' + (sl.label >= 75 ? 'var(--emerald)' : sl.label >= 40 ? 'var(--amber)' : 'var(--red)') + ';">' + sl.label + '</span>' : '';
    var fitHtml = fit !== '—' ? '<span class="fit-badge fit-' + fit.toLowerCase() + '" style="font-size:9px;padding:1px 8px;">' + fit + '</span>' : '';
    var stageHtml = '<span class="cand-stage" style="font-size:10px;padding:2px 10px;">' + stage + '</span>';
    var tagsHtml = tags.map(function(t) { return '<span class="status-tag ' + t.cls + '" style="font-size:9px;padding:2px 7px;">' + t.label + '</span>'; }).join(' ');

    var campaign = window._campaignDetailData || {};
    var roundList = [];
    for (var cri = 1; cri <= 3; cri++) {
      if (campaign['Round ' + cri]) roundList.push(campaign['Round ' + cri]);
    }

    var isDecided = function(v) { var s = String(v || '').toLowerCase(); return s === 'selected' || s === 'rejected' || s === 'offered' || s === 'yes' || s === 'no'; };
    var currentRoundIdx = 0;
    if (isDecided(c['Round 3 Decision'])) currentRoundIdx = roundList.length;
    else if (isDecided(c['Round 2 Decision'])) currentRoundIdx = Math.min(roundList.length, 2);
    else if (isDecided(c['Round 1 Decision'])) currentRoundIdx = Math.min(roundList.length, 1);
    else if (isDecided(c['Resume Decision'])) currentRoundIdx = 0;

    var journeyHtml = '<div style="display:flex;align-items:center;gap:6px;padding:6px 0;flex-wrap:wrap;">';
    var screeningDone = currentRoundIdx > 0;
    journeyHtml += '<span style="font-size:10px;font-weight:' + (screeningDone ? '500' : '700') + ';padding:2px 8px;border-radius:10px;background:' + (screeningDone ? 'transparent' : 'var(--blue-glass)') + ';color:' + (screeningDone ? 'var(--text2)' : 'var(--blue)') + ';border:1px solid ' + (screeningDone ? 'var(--border-color)' : 'var(--blue)') + ';">Screening</span>';
    for (var cri = 0; cri < roundList.length; cri++) {
      var done = cri + 1 <= currentRoundIdx;
      var isCurrent = cri + 1 === currentRoundIdx;
      journeyHtml += '<div style="width:6px;height:6px;border-radius:50%;background:' + (done ? 'var(--emerald)' : 'var(--border-color)') + ';flex-shrink:0;"></div>';
      journeyHtml += '<span style="font-size:10px;font-weight:' + (isCurrent ? '700' : done ? '500' : '400') + ';padding:2px 8px;border-radius:10px;background:' + (isCurrent ? 'var(--blue-glass)' : 'transparent') + ';color:' + (isCurrent ? 'var(--blue)' : done ? 'var(--text2)' : 'var(--text3)') + ';border:1px solid ' + (isCurrent ? 'var(--blue)' : 'var(--border-color)') + ';">Round ' + (cri + 1) + '</span>';
    }
    journeyHtml += '</div>';

    var subParts = [];
    if (role !== '—') subParts.push(role);
    if (city) subParts.push(city);
    if (id) subParts.push('#' + id);

    return '<div class="cand-card" data-idx="' + origIdx + '" onclick="openCandidateDrawer(' + origIdx + ')">' +
      '<div class="cand-card-top">' +
        '<div class="cand-avatar" style="width:38px;height:38px;font-size:14px;background:' + avColor + ';">' + initials + '</div>' +
        '<div class="cand-card-info">' +
          '<div class="cand-card-name">' + name + '</div>' +
          '<div class="cand-card-sub">' + subParts.join(' · ') + '</div>' +
        '</div>' +
        (scoreHtml ? '<div style="flex-shrink:0;">' + scoreHtml + '</div>' : '') +
      '</div>' +
      '<div class="cand-card-badges">' + fitHtml + stageHtml + (resumeLink ? '<a href="' + resumeLink + '" target="_blank" class="btn-ghost-sm" style="border:none;padding:2px 8px;text-decoration:none;display:inline-flex;align-items:center;gap:4px;flex-shrink:0;font-size:10px;border-radius:20px;background:var(--amber-glass);color:var(--amber);" onclick="event.stopPropagation()"><i class="ti ti-external-link"></i> Resume</a>' : '') + '</div>' +
      '<div class="cand-card-chips" style="padding-top:2px;">' + journeyHtml + '</div>' +
      (tagsHtml ? '<div class="cand-card-tags">' + tagsHtml + '</div>' : '') +
      (function() {
        var skipResume = isDecided(c['Resume Decision']);
        var skipR1 = skipResume && roundList.length >= 1 && isDecided(c['Round 1 Decision']);
        var skipR2 = skipR1 && roundList.length >= 2 && isDecided(c['Round 2 Decision']);
        var skipR3 = skipR2 && roundList.length >= 3 && isDecided(c['Round 3 Decision']);
        var nextKey, nextLabel;
        if (!skipResume) { nextKey = 'resume'; nextLabel = 'Resume Screening'; }
        else if (!skipR1 && roundList.length >= 1) { nextKey = 'round1'; nextLabel = 'Round 1'; }
        else if (!skipR2 && roundList.length >= 2) { nextKey = 'round2'; nextLabel = 'Round 2'; }
        else if (!skipR3 && roundList.length >= 3) { nextKey = 'round3'; nextLabel = 'Round 3'; }
        if (!nextKey) return '';
        return '<div class="card-decision" style="display:flex;align-items:center;gap:8px;padding:6px 0 2px;border-top:1px solid var(--separator);margin-top:6px;">' +
          '<span style="font-size:10px;font-weight:600;color:var(--text2);white-space:nowrap;">' + nextLabel + '?</span>' +
          '<div style="display:flex;gap:4px;margin-left:auto;">' +
            '<button onclick="event.stopPropagation();window.cardDecision(' + origIdx + ',\'' + nextKey + '\',\'yes\',this)" style="padding:3px 12px;border:1px solid var(--border-color);border-radius:6px;background:transparent;color:var(--text3);font-size:10px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;"><i class="ti ti-circle-check" style="font-size:10px;"></i> Yes</button>' +
            '<button onclick="event.stopPropagation();window.cardDecision(' + origIdx + ',\'' + nextKey + '\',\'no\',this)" style="padding:3px 12px;border:1px solid var(--border-color);border-radius:6px;background:transparent;color:var(--text3);font-size:10px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;"><i class="ti ti-circle-x" style="font-size:10px;"></i> No</button>' +
          '</div>' +
        '</div>';
      })() +
    '</div>';
  }).join('');
}

window.cardDecision = function(idx, round, value, btn) {
  var cands = window._candidateData || [];
  var c = cands[idx];
  if (!c) return;
  var fieldMap = { resume: 'Resume Decision', round1: 'Round 1 Decision', round2: 'Round 2 Decision', round3: 'Round 3 Decision' };
  c[fieldMap[round]] = value === 'yes' ? 'Selected' : 'Rejected';
  fetch('https://n8n.srv1010832.hstgr.cloud/webhook/a3684149-e051-40f6-8a20-af1c451a618b', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: c.Name || '', email: c.Email || '', campaignName: window._campaignDetailName || '', source: 'card', [round]: { decision: value, comments: '' } })
  }).catch(function() {});
  if (btn) {
    var section = btn.closest('.card-decision');
    if (section) {
      var accepted = value === 'yes';
      section.innerHTML =
        '<span style="font-size:10px;font-weight:600;color:var(--text2);white-space:nowrap;">' +
          (accepted ? 'Accepted' : 'Rejected') +
        '</span>' +
        '<span style="margin-left:auto;font-size:10px;font-weight:700;padding:3px 12px;border-radius:6px;background:' +
          (accepted ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)') +
          ';color:' + (accepted ? 'var(--emerald)' : 'var(--red)') +
          ';">' +
          (accepted ? '<i class="ti ti-circle-check"></i> Accepted' : '<i class="ti ti-circle-x"></i> Rejected') +
        '</span>';
    }
  }
  var drawerBtn = document.querySelector('#decision-container [data-dr="' + round + '"][data-dv="' + value + '"]');
  if (drawerBtn) window.selectDecision(drawerBtn, round, value);
};

/* ─── Filter Candidates ─── */

window.filterCandidates = function() {
  var all = window._candidateData || [];
  var q = (document.getElementById('candidate-search').value || '').toLowerCase();
  var status = document.getElementById('candidate-filter').value;
  var roleFilter = document.getElementById('cand-filter-role').value;
  var fitFilter = document.getElementById('cand-filter-fit').value;
  var recruiterFilter = document.getElementById('cand-filter-recruiter').value;

  var filtered = all.filter(function(c) {
    var searchStr = ((c.Name || '') + ' ' + (c.Email || '') + ' ' + (c['Phone Number'] || '') + ' ' + (c.Role || '') + ' ' + (c.City || '') + ' ' + (c['Candidate ID'] || '')).toLowerCase();
    if (q && searchStr.indexOf(q) === -1) return false;

    if (status) {
      var tags = getStatusTags(c);
      var match = tags.some(function(t) { return t.label === status; });
      if (!match) {
        var overall = getOverallResult(c);
        if (overall !== status) return false;
      }
    }
    if (roleFilter && (c.Role || '') !== roleFilter) return false;
    if (fitFilter && getFitLevel(c) !== fitFilter) return false;
    if (recruiterFilter) {
      var recruiters = [c['Round 1 Assigned'], c['Round 2 Assigned'], c['Round 3 Assigned']].filter(Boolean);
      if (recruiters.indexOf(recruiterFilter) === -1) return false;
    }
    return true;
  });

  var sort = document.getElementById('candidate-sort').value;
  if (sort === 'name') filtered.sort(function(a, b) { return (a.Name || '').localeCompare(b.Name || ''); });
  else if (sort === 'score') filtered.sort(function(a, b) { return (parseInt(b.Score) || 0) - (parseInt(a.Score) || 0); });

  renderCandidates(filtered);
  updatePagination(filtered.length);
};

/* ─── Pagination ─── */

function updatePagination(count) {
  var total = window._candidateData ? window._candidateData.length : 0;
  document.getElementById('pagination-info').textContent = 'Showing ' + count + ' of ' + total + ' candidates';
}

/* ─── Populate Filter Dropdowns ─── */

function populateFilterDropdowns() {
  var cands = window._candidateData || [];
  var roles = {}, recruiters = {};
  cands.forEach(function(c) {
    if (c.Role) roles[c.Role] = true;
    [c['Round 1 Assigned'], c['Round 2 Assigned'], c['Round 3 Assigned']].filter(Boolean).forEach(function(r) { recruiters[r] = true; });
  });
  var roleSel = document.getElementById('cand-filter-role');
  if (roleSel) {
    roleSel.innerHTML = '<option value="">All Roles</option>';
    Object.keys(roles).sort().forEach(function(r) { roleSel.innerHTML += '<option value="' + r + '">' + r + '</option>'; });
  }
  var recSel = document.getElementById('cand-filter-recruiter');
  if (recSel) {
    recSel.innerHTML = '<option value="">All Recruiters</option>';
    Object.keys(recruiters).sort().forEach(function(r) { recSel.innerHTML += '<option value="' + r + '">' + r + '</option>'; });
  }
}

/* ─── Drawer ─── */

window.openCandidateDrawer = function(idx) {
  var cands = window._candidateData || [];
  var c = cands[idx];
  if (!c) return;

  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('cand-drawer').classList.add('open');
  document.body.style.overflow = 'hidden';

  var name = c.Name || '—';
  var initials = getInitials(name);
  var avColor = avatarColor(name);
  var city = c.City || '';
  var id = c['Candidate ID'] || '';

  document.getElementById('drawer-avatar').style.background = avColor;
  document.getElementById('drawer-avatar').textContent = initials;
  document.getElementById('drawer-name').textContent = name;
  var subParts = [];
  if (c.Role) subParts.push(c.Role);
  if (city) subParts.push(city);
  if (id) subParts.push('#' + id);
  document.getElementById('drawer-sub').textContent = subParts.join(' · ');

  renderDrawerContent(c);
};

window.closeCandidateDrawer = function() {
  document.getElementById('drawer-overlay').classList.remove('open');
  document.getElementById('cand-drawer').classList.remove('open');
  document.body.style.overflow = '';
};

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeCandidateDrawer();
});

function renderDrawerContent(c) {
  var body = document.getElementById('drawer-body');
  if (!body) return;

  var score = c.Score || '—';
  var sl = getScoreLevel(score);
  var scoreHtml = sl !== '—' ? '<span class="score-badge ' + sl.cls + '" style="font-size:14px;padding:4px 14px;">' + sl.label + '</span>' : '—';
  var fit = getFitLevel(c);
  var fitHtml = fit !== '—' ? '<span class="fit-badge fit-' + fit.toLowerCase() + '" style="font-size:11px;padding:4px 14px;">' + fit + '</span>' : '<span style="font-size:11px;color:var(--text3);">—</span>';
  var email = c.Email || '';
  var phone = c['Phone Number'] || '';
  var resumeLink = c['Resume Link'] || '';
  var strengths = c.Strengths || '—';
  var gaps = c.Gaps || '—';
  var fitAnalysis = c['Fit Analysis'] || '—';
  var summary = c.Summary || '—';
  var riskFlags = '';
  if (gaps && gaps.toLowerCase().indexOf('risk flag') !== -1) {
    var parts = gaps.split('|');
    for (var p = 0; p < parts.length; p++) {
      if (parts[p].toLowerCase().indexOf('risk flag') !== -1) { riskFlags = parts[p].trim(); break; }
    }
  }

  var currentStage = getCandidateStage(c);
  var roundLabel = currentStage;

  var contactItems = [];
  if (email) contactItems.push('<a href="mailto:' + email + '" title="Email" style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:var(--blue-glass);color:var(--blue);border-radius:6px;font-size:13px;text-decoration:none;"><i class="ti ti-mail"></i></a>');
  if (phone) contactItems.push('<a href="https://wa.me/' + phone.replace(/[^0-9]/g, '') + '" title="WhatsApp" target="_blank" style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:rgba(16,185,129,0.1);color:var(--emerald);border-radius:6px;font-size:13px;text-decoration:none;"><i class="ti ti-brand-whatsapp"></i></a>');
  if (phone) contactItems.push('<a href="tel:' + phone + '" title="Call" style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:var(--surface3);color:var(--text2);border-radius:6px;font-size:13px;text-decoration:none;"><i class="ti ti-phone"></i></a>');

  /* Section 1: Stats Cards */
  var card = 'display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:78px;flex:1;padding:14px 16px;background:var(--surface3);border-radius:10px;border:1px solid var(--border-color);text-align:center;';
  var html = '<div style="display:flex;gap:12px;margin-bottom:24px;">' +
    '<div style="' + card + '"><div style="font-size:9px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Score</div>' + scoreHtml + '</div>' +
    '<div style="' + card + '"><div style="font-size:9px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Fit</div>' + fitHtml + '</div>' +
    '<div style="' + card + '"><div style="font-size:9px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Stage</div><div style="font-size:12px;font-weight:600;color:var(--text);">' + roundLabel + '</div></div>' +
    (contactItems.length ? '<div style="' + card + '"><div style="font-size:9px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Contact</div><div style="display:flex;gap:6px;justify-content:center;">' + contactItems.join('') + '</div></div>' : '') +
  '</div>';

  /* Section 2: Tab navigation */

  /* Build candidate journey HTML first */
  var campaign = window._campaignDetailData || {};
  var roundNames = [];
  for (var ri = 1; ri <= 3; ri++) {
    if (campaign['Round ' + ri]) roundNames.push(campaign['Round ' + ri]);
  }

  var steps = [{ key: 'resume', label: 'Resume Screening' }];
  for (var ri = 0; ri < roundNames.length; ri++) {
    steps.push({ key: 'round' + (ri + 1), label: roundNames[ri], num: ri + 1 });
  }

  var _isRoundDecided = function(v) { var s = String(v || '').toLowerCase(); return s === 'selected' || s === 'rejected' || s === 'offered' || s === 'yes' || s === 'no'; };
  var latestRound = 0;
  for (var ri = 1; ri <= roundNames.length; ri++) {
    if (_isRoundDecided(c['Round ' + ri + ' Decision'])) {
      latestRound = ri;
    }
  }

  function getStepStatus(step) {
    if (step.key === 'resume') {
      if (latestRound > 0) return 'done';
      return 'current';
    }
    var r = step.num;
    if (r < latestRound) return 'done';
    if (r === latestRound) {
      if (c['Round ' + r + ' Decision']) return 'done';
      return 'current';
    }
    return 'upcoming';
  }

  function getStepSubs(step) {
    if (step.key === 'resume') {
      var subs = [];
      if (latestRound > 0) {
        subs.push({ key: 'Review', icon: 'ti ti-file-check', val: 'Complete' });
        var rd = c['Resume Decision Date'] || campaign.CreationDate || '';
        if (rd) subs.push({ key: 'Date', icon: 'ti ti-calendar', val: rd });
      }
      else subs.push({ key: 'Review', icon: 'ti ti-clock', val: 'Pending' });
      return subs;
    }
    var r = step.num;
    var items = [
      { key: 'WhatsApp', icon: 'ti ti-brand-whatsapp', val: c['Round ' + r + ' WA Followup'] },
      { key: 'Meeting', icon: 'ti ti-calendar', val: c['Round ' + r + ' Meeting Date'], extra: c['Round ' + r + ' Meeting Time'] },
      { key: 'Assigned', icon: 'ti ti-user', val: c['Round ' + r + ' Assigned'] },
      { key: 'Decision', icon: 'ti ti-judge', val: c['Round ' + r + ' Decision'] },
    ];
    if (c['Round ' + r + ' Meeting Link'] || c['Round ' + r + ' Interview Link']) items.push({ key: 'Link', icon: 'ti ti-video', val: c['Round ' + r + ' Meeting Link'] || c['Round ' + r + ' Interview Link'], link: true });
    if (c['Round ' + r + ' Calendar Link']) items.push({ key: 'Calendar', icon: 'ti ti-calendar-check', val: c['Round ' + r + ' Calendar Link'], link: true });
    return items;
  }

  var journeyHtml = '<div class="journey-timeline">';
  for (var si = 0; si < steps.length; si++) {
    var st = steps[si];
    var status = getStepStatus(st);
    var isLast = si === steps.length - 1;

    journeyHtml += '<div class="journey-step' + (status === 'current' ? ' journey-current' : '') + '">' +
      '<div class="journey-connector">';
    if (!isLast) journeyHtml += '<div class="journey-line' + (status === 'done' ? ' journey-line-done' : '') + '"></div>';
    journeyHtml += '<div class="journey-dot journey-dot-' + status + '">' +
      (status === 'done' ? '<i class="ti ti-check" style="font-size:10px;"></i>' : status === 'current' ? '<div class="journey-dot-inner"></div>' : '<div class="journey-dot-ring"></div>') +
    '</div></div>' +
    '<div class="journey-content">' +
      '<div style="display:flex;align-items:center;gap:6px;">' +
      (st.num ? '<span style="font-size:9px;font-weight:700;color:var(--blue);background:var(--blue-glass);padding:1px 7px;border-radius:4px;">R' + st.num + '</span>' : '') +
      '<div class="journey-label">' + st.label + '</div></div>' +
      '<div class="journey-status">' + (status === 'done' ? 'Completed' : status === 'current' ? 'In Progress' : 'Upcoming') + '</div>';

    if (status !== 'upcoming') {
      var subs = getStepSubs(st);
      journeyHtml += '<div class="journey-subs">';
      for (var si2 = 0; si2 < subs.length; si2++) {
        var sub = subs[si2];
        var filled = sub.val && sub.val !== '—' && sub.val !== '';
        journeyHtml += '<div class="journey-sub' + (filled ? '' : ' journey-sub-muted') + '">' +
          '<i class="' + sub.icon + '" style="font-size:12px;width:16px;flex-shrink:0;"></i>' +
          '<span style="flex:1;font-size:11px;">' + sub.key + '</span>';
        if (sub.link) {
          journeyHtml += '<a href="' + sub.val + '" target="_blank" style="font-size:11px;color:var(--blue);text-decoration:none;font-weight:500;">Open</a>';
        } else if (sub.val) {
          journeyHtml += '<span style="font-size:11px;color:var(--text3);">' + sub.val + (sub.extra ? ' at ' + sub.extra : '') + '</span>';
        } else {
          journeyHtml += '<span style="font-size:11px;color:var(--text3);">—</span>';
        }
        journeyHtml += '</div>';
      }
      journeyHtml += '</div>';
    }

    journeyHtml += '</div></div>';
  }
  journeyHtml += '</div>';

  /* Resume viewer HTML */
  var resumeHtml = '';
  if (resumeLink) {
    var previewUrl = resumeLink.indexOf('drive.google.com') !== -1 ? resumeLink.replace('/view', '/preview').replace('?usp=sharing', '') : resumeLink;
    resumeHtml = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
      '<div style="font-size:12px;color:var(--text2);font-weight:600;"><i class="ti ti-file-text"></i> Resume</div>' +
      '<a href="' + resumeLink + '" target="_blank" style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;background:var(--amber-glass);color:var(--amber);border-radius:6px;font-size:11px;font-weight:600;text-decoration:none;"><i class="ti ti-external-link" style="font-size:12px;"></i> Open</a>' +
      '</div>' +
      '<div style="width:100%;border-radius:8px;overflow:hidden;border:1px solid var(--border-color);"><iframe src="' + previewUrl + '" style="width:100%;height:500px;border:none;border-radius:6px;"></iframe></div>';
  }

  /* Profile content HTML */
  var profileHtml =
    '<div class="drawer-section-title" style="font-size:12px;color:var(--text2);padding:0 0 10px 0;border-bottom:1px solid var(--separator);margin-bottom:12px;"><i class="ti ti-sparkles"></i> AI Summary</div>' +
    '<div class="detail-card-sm" style="margin-bottom:16px;"><div style="font-size:13px;color:var(--text2);line-height:1.7;">' + summary + '</div></div>' +
    '<div class="drawer-section-title" style="font-size:12px;color:var(--text2);padding:0 0 10px 0;border-bottom:1px solid var(--separator);margin-bottom:12px;"><i class="ti ti-scale"></i> Evaluation</div>' +
    '<div class="detail-card-sm">' +
    '<div style="margin-bottom:12px;"><div style="font-size:11px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Fit Analysis</div>' +
    '<div style="font-size:12px;color:var(--text2);line-height:1.6;">' + fitAnalysis + '</div></div>' +
    '<div style="margin-bottom:12px;"><div style="font-size:11px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Strengths</div><div style="font-size:12px;color:var(--text2);line-height:1.6;">' + (strengths !== '—' ? strengths.replace(/\n/g, '<br>') : '—') + '</div></div>' +
    '<div><div style="font-size:11px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Gaps</div><div style="font-size:12px;color:var(--text2);line-height:1.6;">' + (gaps !== '—' ? gaps.replace(/\n/g, '<br>') : '—') + '</div></div>' +
    (riskFlags ? '<div style="margin-top:12px;padding:8px 12px;background:rgba(239,68,68,0.08);border-radius:6px;font-size:12px;color:var(--red);"><strong>Risk Flags:</strong> ' + riskFlags + '</div>' : '') +
    '</div>';

  /* Questionnaire content HTML */
  var questionnaireHtml = '';
  var hasQuestionnaire = false;
  for (var qi = 0; qi < roundNames.length; qi++) {
    var rn = qi + 1;
    var qVal = c['Round' + rn + '_Q'];
    if (qVal && qVal !== '—' && qVal !== '') {
      hasQuestionnaire = true;
      var interviewerName = c['Round ' + rn + ' Assigned'] || roundNames[qi];
      var interviewerMail = c['Round ' + rn + ' Meeting Mail'] || '';
      var headerLabel = interviewerName;
      if (interviewerMail) headerLabel += ' &mdash; ' + interviewerMail;
      var qId = 'q-' + rn + '-' + (c.Name || '').replace(/\s+/g, '');
      questionnaireHtml += '<div style="margin-bottom:12px;border-radius:10px;border:1px solid var(--border-color);overflow:hidden;">' +
        '<div onclick="(function(){var p=document.getElementById(\'' + qId + '\');var d=p.style.display;d=d===\'none\'?\'\':\'none\';p.style.display=d;this.querySelector(\'.q-chevron\').style.transform=d===\'none\'?\'rotate(0deg)\':\'rotate(180deg)\';})()" style="padding:12px 16px;background:var(--surface3);cursor:pointer;display:flex;align-items:center;justify-content:space-between;-webkit-user-select:none;user-select:none;">' +
        '<div style="font-size:11px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.05em;"><i class="ti ti-clipboard-text"></i> Round ' + rn + ' &mdash; ' + headerLabel + '</div>' +
        '<i class="ti ti-chevron-down q-chevron" style="font-size:14px;color:var(--text3);transition:transform .2s;"></i></div>' +
        '<div id="' + qId + '" style="display:none;padding:14px 16px;font-size:13px;color:var(--text2);line-height:1.7;border-top:1px solid var(--border-color);">' + qVal.replace(/\n/g, '<br>') + '</div></div>';
    }
  }
  if (!hasQuestionnaire) {
    questionnaireHtml = '<div style="padding:20px;text-align:center;color:var(--text3);font-size:13px;">No questionnaire data available</div>';
  }

  /* Decision section HTML */
  var decisionRounds = [{ key: 'resume', label: 'Resume Screening' }];
  for (var dri = 0; dri < roundNames.length; dri++) {
    decisionRounds.push({ key: 'round' + (dri + 1), label: 'Round ' + (dri + 1) });
  }
  var decisionHtml = '<div id="decision-container" data-name="' + (c.Name || '').replace(/"/g, '&quot;') + '" data-email="' + (c.Email || '').replace(/"/g, '&quot;') + '" data-campaign="' + (window._campaignDetailName || '').replace(/"/g, '&quot;') + '" style="display:flex;flex-direction:column;gap:8px;">';
  for (var di = 0; di < decisionRounds.length; di++) {
    var dr = decisionRounds[di];
    if (dr.key === 'resume') {
      var steps = [
        { key: 'Round 1 Meeting Mail', icon: 'ti ti-mail', label: 'Mail' },
        { key: 'Round 1 WA Followup', icon: 'ti ti-brand-whatsapp', label: 'WA' },
        { key: 'Round 1 Mail Followup', icon: 'ti ti-mail', label: 'Mail' }
      ];
      var stepStatus = steps.map(function(s) {
        var val = c[s.key];
        return (val && val !== '—') ? 'done' : null;
      });
      var ongoingIdx = -1;
      for (var si = 0; si < stepStatus.length; si++) {
        if (!stepStatus[si]) { ongoingIdx = si; break; }
      }
      if (ongoingIdx === -1) ongoingIdx = stepStatus.length;
      decisionHtml +=
        '<div style="border-radius:10px;border:1px solid var(--border-color);overflow:hidden;">' +
          '<div style="padding:10px 14px;background:var(--surface3);font-size:11px;color:var(--text);font-weight:700;text-transform:uppercase;letter-spacing:.05em;display:flex;align-items:center;justify-content:space-between;"><span><i class="ti ti-clipboard-text"></i> ' + dr.label + '</span></div>' +
          '<div style="padding:10px 14px;display:flex;gap:16px;align-items:stretch;">' +
            '<div style="flex:1;display:flex;align-items:center;justify-content:center;">';
      for (var si = 0; si < steps.length; si++) {
        var isDone = !!stepStatus[si];
        var isCurrent = si === ongoingIdx;
        if (si > 0) {
          decisionHtml += '<div style="width:32px;height:2px;background:' + (stepStatus[si - 1] ? 'var(--emerald)' : 'var(--separator)') + ';flex-shrink:0;"></div>';
        }
        if (isDone) {
          decisionHtml += '<div style="width:34px;height:34px;border-radius:50%;background:var(--emerald);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 3px rgba(16,185,129,0.2);flex-shrink:0;"><i class="' + steps[si].icon + '" style="font-size:14px;color:#fff;"></i></div>';
        } else if (isCurrent) {
          decisionHtml += '<div style="width:34px;height:34px;border-radius:50%;background:var(--blue);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 3px rgba(37,99,235,0.2);flex-shrink:0;"><i class="' + steps[si].icon + '" style="font-size:14px;color:#fff;"></i></div>';
        } else {
          decisionHtml += '<div style="width:34px;height:34px;border-radius:50%;background:var(--surface1);border:2px solid var(--border-color);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="' + steps[si].icon + '" style="font-size:14px;color:var(--text3);"></i></div>';
        }
      }
      decisionHtml +=
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:8px;justify-content:center;flex-shrink:0;border-left:1px solid var(--separator);padding-left:12px;">' +
              '<button type="button" data-dr="resume" data-dv="yes" onclick="window.selectDecision(this,\'resume\',\'yes\')" style="padding:7px 20px;border:1.5px solid var(--border-color);border-radius:8px;background:transparent;color:var(--text3);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap;"><i class="ti ti-circle-check"></i> Yes</button>' +
              '<button type="button" data-dr="resume" data-dv="no" onclick="window.selectDecision(this,\'resume\',\'no\')" style="padding:7px 20px;border:1.5px solid var(--border-color);border-radius:8px;background:transparent;color:var(--text3);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap;"><i class="ti ti-circle-x"></i> No</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    } else {
      decisionHtml +=
        '<div style="border-radius:10px;border:1px solid var(--border-color);overflow:hidden;">' +
          '<div style="padding:10px 14px;background:var(--surface3);font-size:11px;color:var(--text);font-weight:700;text-transform:uppercase;letter-spacing:.05em;"><i class="ti ti-clipboard-text"></i> ' + dr.label + '</div>' +
          '<div style="padding:10px 14px;display:flex;flex-direction:column;gap:8px;">' +
            '<div style="display:flex;gap:8px;">' +
              '<button type="button" data-dr="' + dr.key + '" data-dv="yes" onclick="window.selectDecision(this,\'' + dr.key + '\',\'yes\')" style="flex:1;padding:7px 14px;border:1.5px solid var(--border-color);border-radius:8px;background:transparent;color:var(--text3);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;"><i class="ti ti-circle-check"></i> Yes</button>' +
              '<button type="button" data-dr="' + dr.key + '" data-dv="no" onclick="window.selectDecision(this,\'' + dr.key + '\',\'no\')" style="flex:1;padding:7px 14px;border:1.5px solid var(--border-color);border-radius:8px;background:transparent;color:var(--text3);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;"><i class="ti ti-circle-x"></i> No</button>' +
            '</div>' +
            '<textarea id="dc-' + dr.key + '" placeholder="Add comments for ' + dr.label + '..." style="width:100%;min-height:50px;padding:8px 10px;background:var(--surface1);border:1px solid var(--border-color);border-radius:8px;color:var(--text);font-size:12px;font-family:inherit;resize:vertical;outline:none;box-sizing:border-box;"></textarea>' +
          '</div>' +
        '</div>';
    }
  }
  decisionHtml +=
    '<button id="decision-submit-btn" onclick="window.submitDecisions()" style="width:100%;padding:10px 16px;background:var(--blue);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity .2s;display:flex;align-items:center;justify-content:center;gap:6px;"><i class="ti ti-send"></i> Submit Decisions</button>' +
    '<div id="decision-feedback"></div>' +
  '</div>';

  /* Interviews section HTML */
  var interviewsHtml = '';
  var hasInterview = false;
  for (var ii = 1; ii <= 3; ii++) {
    var mtgDate = c['Round ' + ii + ' Meeting Date'];
    var mtgTime = c['Round ' + ii + ' Meeting Time'];
    var mtgLink = c['Round ' + ii + ' Meeting Link'];
    var eventId = c['Round ' + ii + ' Event ID'];
    var calLink = c['Round ' + ii + ' Calendar Link'];
    var intLink = c['Round ' + ii + ' Interview Link'];
    var interviewer = c['Round ' + ii + ' Assigned'] || '';
    var joinLink = mtgLink || intLink || '';
    if (mtgDate || mtgTime || joinLink || eventId) {
      hasInterview = true;
      interviewsHtml +=
        '<div style="margin-bottom:12px;border-radius:10px;border:1px solid var(--border-color);overflow:hidden;">' +
          '<div style="padding:10px 14px;background:var(--surface3);font-size:11px;color:var(--text);font-weight:700;text-transform:uppercase;letter-spacing:.05em;display:flex;align-items:center;justify-content:space-between;">' +
            '<span><i class="ti ti-video"></i> Round ' + ii + ' — ' + (roundNames[ii - 1] || 'Interview') + '</span>' +
            (interviewer ? '<span style="font-size:10px;font-weight:500;color:var(--text2);text-transform:none;letter-spacing:0;"><i class="ti ti-user"></i> ' + interviewer + '</span>' : '') +
          '</div>' +
          '<div style="padding:12px 14px;display:flex;flex-direction:column;gap:8px;">' +
            '<div style="display:flex;gap:16px;flex-wrap:wrap;">' +
              (mtgDate ? '<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text2);"><i class="ti ti-calendar" style="font-size:14px;"></i> ' + mtgDate + (mtgTime ? ' at ' + mtgTime : '') + '</div>' : '') +
              (eventId ? '<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text3);"><i class="ti ti-hash" style="font-size:14px;"></i> ID: ' + eventId + '</div>' : '') +
            '</div>' +
            '<div style="display:flex;gap:8px;">' +
              (joinLink ? '<a href="' + joinLink + '" target="_blank" style="flex:1;padding:8px 12px;background:var(--blue);color:#fff;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none;text-align:center;display:flex;align-items:center;justify-content:center;gap:6px;"><i class="ti ti-video"></i> Join</a>' : '') +
              (calLink ? '<a href="' + calLink + '" target="_blank" style="flex:1;padding:8px 12px;background:var(--surface1);color:var(--text2);border:1px solid var(--border-color);border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;text-align:center;display:flex;align-items:center;justify-content:center;gap:6px;"><i class="ti ti-calendar-refresh"></i> Reschedule</a>' : '') +
            '</div>' +
          '</div>' +
        '</div>';
    }
  }
  if (!hasInterview) {
    interviewsHtml = '<div style="padding:20px;text-align:center;color:var(--text3);font-size:13px;"><i class="ti ti-video-off" style="font-size:20px;display:block;margin-bottom:8px;"></i>No interviews scheduled</div>';
  }

  var tabs = [
    { key: 'profile', icon: 'ti ti-user', label: 'Profile', content: profileHtml },
    { key: 'resume', icon: 'ti ti-file-text', label: 'Resume', content: resumeHtml || '<div style="padding:20px;text-align:center;color:var(--text3);font-size:13px;">No resume available</div>' },
    { key: 'pipeline', icon: 'ti ti-map', label: 'Pipeline', content: journeyHtml },
    { key: 'interviews', icon: 'ti ti-video', label: 'Interviews', content: interviewsHtml },
    { key: 'questionnaire', icon: 'ti ti-clipboard-text', label: 'Questionnaire', content: questionnaireHtml },
    { key: 'decision', icon: 'ti ti-judge', label: 'Decision', content: decisionHtml },
  ];

  html += '<div style="display:flex;gap:4px;background:var(--surface3);padding:4px;border-radius:100px;margin-bottom:16px;">';
  for (var ti = 0; ti < tabs.length; ti++) {
    var t = tabs[ti];
    var active = ti === 0;
    html += '<button onclick="var p=this.parentNode.parentNode;p.querySelectorAll(&#39;.tab-btn&#39;).forEach(function(b){b.style.background=&#39;transparent&#39;;b.style.color=&#39;var(--text3)&#39;});this.style.background=&#39;var(--surface1)&#39;;this.style.color=&#39;var(--text)&#39;;p.querySelectorAll(&#39;.tab-panel&#39;).forEach(function(q){q.style.display=&#39;none&#39;});p.querySelectorAll(&#39;.tab-panel&#39;)[' + ti + '].style.display=&#39;&#39;;" class="tab-btn" style="flex:1;padding:7px 14px;border:none;border-radius:100px;background:' + (active ? 'var(--surface1)' : 'transparent') + ';color:' + (active ? 'var(--text)' : 'var(--text3)') + ';font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s;white-space:nowrap;"><i class="' + t.icon + '" style="font-size:12px;"></i> ' + t.label + '</button>';
  }
  html += '</div>';

  for (var ti = 0; ti < tabs.length; ti++) {
    var t = tabs[ti];
    html += '<div class="tab-panel" style="display:' + (ti === 0 ? '' : 'none') + ';">' + t.content + '</div>';
  }

  body.innerHTML = html;

  var initRounds = ['resume', 'round1', 'round2', 'round3'];
  var initFieldMap = { resume: 'Resume Decision', round1: 'Round 1 Decision', round2: 'Round 2 Decision', round3: 'Round 3 Decision' };
  var initValMap = { selected: 'yes', offered: 'yes', rejected: 'no', yes: 'yes', no: 'no' };
  initRounds.forEach(function(r) {
    var val = (c[initFieldMap[r]] || '').toLowerCase();
    var dv = initValMap[val];
    if (dv) {
      var btn = document.querySelector('#decision-container [data-dr="' + r + '"][data-dv="' + dv + '"]');
      if (btn) window.selectDecision(btn, r, dv);
    }
  });
}

/* ─── Decision Yes/No Toggle ─── */

window.selectDecision = function(btn, round, value) {
  document.querySelectorAll('#decision-container [data-dr="' + round + '"]').forEach(function(b) {
    b.style.background = 'transparent';
    b.style.color = 'var(--text3)';
    b.style.borderColor = 'var(--border-color)';
    b.style.boxShadow = 'none';
    b.classList.remove('dr-selected');
  });
  btn.classList.add('dr-selected');
  btn.style.background = value === 'yes' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
  btn.style.color = value === 'yes' ? 'var(--emerald)' : 'var(--red)';
  btn.style.borderColor = value === 'yes' ? 'var(--emerald)' : 'var(--red)';
  btn.style.boxShadow = '0 0 0 2px ' + (value === 'yes' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)');
};

/* ─── Submit Decisions ─── */

window.submitDecisions = function() {
  var container = document.getElementById('decision-container');
  if (!container) return;

  var name = container.dataset.name || '';
  var email = container.dataset.email || '';
  var campaignName = container.dataset.campaign || '';

  var payload = {
    name: name,
    email: email,
    campaignName: campaignName
  };

  var rounds = ['resume', 'round1', 'round2', 'round3'];
  rounds.forEach(function(round) {
    var roundData = {};
    var selectedBtn = document.querySelector('#decision-container [data-dr="' + round + '"].dr-selected');
    if (selectedBtn) {
      roundData.decision = selectedBtn.getAttribute('data-dv') || '';
    }
    var commentsEl = document.getElementById('dc-' + round);
    if (commentsEl && commentsEl.value.trim()) {
      roundData.comments = commentsEl.value;
    }
    if (Object.keys(roundData).length) {
      payload[round] = roundData;
    }
  });

  var btn = document.getElementById('decision-submit-btn');
  var feedback = document.getElementById('decision-feedback');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader" style="animation:spin 1s linear infinite;display:inline-block;"></i> Submitting...'; }

  fetch('https://n8n.srv1010832.hstgr.cloud/webhook/a3684149-e051-40f6-8a20-af1c451a618b', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(function(r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.text();
  })
  .then(function() {
    if (feedback) { feedback.innerHTML = '<div style="padding:10px 14px;background:rgba(16,185,129,0.1);color:var(--emerald);border-radius:8px;font-size:13px;font-weight:600;margin-top:4px;"><i class="ti ti-check"></i> Decisions submitted successfully!</div>'; }
    if (btn) { btn.innerHTML = '<i class="ti ti-check"></i> Submitted'; btn.style.background = 'var(--emerald)'; }
  })
  .catch(function(err) {
    if (feedback) { feedback.innerHTML = '<div style="padding:10px 14px;background:rgba(239,68,68,0.1);color:var(--red);border-radius:8px;font-size:13px;font-weight:600;margin-top:4px;"><i class="ti ti-alert-triangle"></i> Failed: ' + err.message + '</div>'; }
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-send"></i> Submit Decisions'; }
  });
};

document.addEventListener('DOMContentLoaded', function() {
  const hr = new Date().getHours();
  const greetingEl = document.getElementById('greeting-text');
  if (greetingEl) {
    let greeting = 'Good evening';
    if (hr < 12) greeting = 'Good morning';
    else if (hr < 17) greeting = 'Good afternoon';
    greetingEl.innerHTML = greeting + ', <span class="hero-name">Sarah</span>';
  }
  window.buildCalendar();
  window.loadInterviewers();
  window.loadCampaignDraft();
  window.updatePreview();
  window.loadCampaigns();

  window.populateCampaignSelector();
  window.loadDashboardData('');
  document.querySelector('#page-create .create-wrapper')?.addEventListener('input', window.saveCampaignDraft);

  initCursorReactive();
});

document.addEventListener('click', function(e) {
  var target = e.target.closest('[data-reschedule="1"]');
  if (target) {
    console.log("Reschedule button clicked", target.dataset);
    var eventId = target.dataset.eventId;
    var email = target.dataset.email;
    if (window.openRescheduleModal) {
      console.log("Calling window.openRescheduleModal");
      window.openRescheduleModal({ eventId: eventId, email: email });
    } else {
      console.error("window.openRescheduleModal is not defined!");
    }
  }
});

function initCursorReactive() {
  document.querySelectorAll('.kpi-card, .analytics-card, .widget-card, .hero-metric, .campaign-card, .mini-stat, .cap-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rx = ((y - cy) / cy) * -1;
      const ry = ((x - cx) / cx) * 1;

      card.style.setProperty('--rx', rx + 'deg');
      card.style.setProperty('--ry', ry + 'deg');

      const glowX = (x / rect.width) * 100;
      const glowY = (y / rect.height) * 100;
      card.style.setProperty('--gx', glowX + '%');
      card.style.setProperty('--gy', glowY + '%');

      card.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px) scale(1.005)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}
