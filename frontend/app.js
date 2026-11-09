const titles={home:'Overview',apply:'Passport services','my-applications':'My applications',checklist:'Document checklist',offices:'Find an office',dashboard:'National dashboard'};
const pages=[...document.querySelectorAll('.page')];
function showPage(name){pages.forEach(p=>p.classList.toggle('active',p.id===`page-${name}`));document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===name));document.getElementById('topTitle').textContent=titles[name]||'Overview';window.scrollTo({top:0,behavior:'smooth'});}
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.go)));
document.querySelectorAll('[data-kind]').forEach(b=>b.addEventListener('click',()=>{document.getElementById('applicationType').value=b.dataset.kind;showPage('checklist');renderChecklist();}));
const checklistData={adult:{new:[['National identity card','Bring your valid identity card.'],['Appropriate passport fee','Confirm the current fee and accepted payment method.']],replacement:[['Old passport','Bring the passport that is being replaced.'],['National identity card','Bring your valid identity card.'],['Appropriate passport fee','Confirm the current fee and accepted payment method.']]},minor:{new:[['Child’s birth certificate','Bring the child’s birth certificate.'],['Parent or guardian accompaniment','A parent or legal guardian must accompany the child.'],['Parent or guardian consent letter','Prepare the required consent letter.'],['Parent or guardian identity documents','Bring the relevant parent or guardian identity documents.'],['Appropriate passport fee','Confirm the current fee and accepted payment method.']],replacement:[['Child’s birth certificate','Confirm the replacement requirements with the Ministry.'],['Parent or guardian accompaniment','A parent or legal guardian must accompany the child.'],['Parent or guardian identity documents','Bring the relevant parent or guardian identity documents.'],['Old passport, if available','Confirm the exact replacement documents with the Ministry.'],['Appropriate passport fee','Confirm the current fee and accepted payment method.']]}};
function renderChecklist(){const age=document.getElementById('applicantAge').value,type=document.getElementById('applicationType').value;const items=checklistData[age][type];document.getElementById('checkTitle').textContent=`${age==='adult'?'Adult (16+)':'Child (below 16)'} ${type==='new'?'first-time':'replacement'} application`;const host=document.getElementById('checkItems');host.innerHTML='';items.forEach((item,i)=>{const row=document.createElement('label');row.className='check-item';row.innerHTML=`<input type="checkbox" data-check="${i}"><span><strong>${item[0]}</strong><small>${item[1]}</small></span>`;host.appendChild(row);});host.querySelectorAll('input').forEach(x=>x.addEventListener('change',updateProgress));updateProgress();}
function updateProgress(){const checks=[...document.querySelectorAll('[data-check]')];const done=checks.filter(x=>x.checked).length;document.getElementById('progressLabel').textContent=`${done} of ${checks.length} ready`;document.getElementById('progressBar').style.width=checks.length?`${done/checks.length*100}%`:'0%';}
document.getElementById('applicantAge').addEventListener('change',renderChecklist);document.getElementById('applicationType').addEventListener('change',renderChecklist);document.getElementById('resetChecks').addEventListener('click',()=>{document.querySelectorAll('[data-check]').forEach(x=>x.checked=false);updateProgress();});renderChecklist();
let officeRecords=[];
function renderOffices(records) {
    const host = document.getElementById('officeGrid');
    host.innerHTML = '';

    records.forEach(o => {
        const card = document.createElement('article');
        card.className = 'office-card';

        const phone = o.phone || 'Contact number not available';
        const extraPhone = o.additional_phone
            ? `<p><strong>${escapeHtml(o.additional_contact || 'Additional contact')}:</strong> ${escapeHtml(o.additional_phone)}</p>`
            : '';

        const services = (o.services || [])
            .map(service => `<li>${escapeHtml(service)}</li>`)
            .join('');

        card.innerHTML = `
            <div class="office-top">
                <span class="office-district">${escapeHtml(o.district || 'LESOTHO')}</span>
                <span class="office-pin">⌖</span>
            </div>
            <h3>${escapeHtml(o.office || 'Passport office')}</h3>
            <p><strong>Telephone:</strong> ${escapeHtml(phone)}</p>
            ${extraPhone}
            <p><strong>Address:</strong> ${escapeHtml(o.address || 'To be verified')}</p>
            <p><strong>Opening hours:</strong> ${escapeHtml(o.opening_hours || 'To be confirmed')}</p>
            <details>
                <summary>View office services</summary>
                <ul>${services}</ul>
            </details>
            <div class="office-status">VERIFY ADDRESS AND HOURS BEFORE VISITING</div>
        `;

        host.appendChild(card);
    });

    document.getElementById('officeCount').textContent =
        `${records.length} locations listed`;
}

function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function loadOffices(){try{const res=await fetch('/api/offices');if(!res.ok)throw new Error('Could not load offices');const data=await res.json();officeRecords = data.offices || [];renderOffices(officeRecords);}catch(e){document.getElementById('officeGrid').innerHTML='<div class="panel">Office data could not be loaded. Check that the backend server is running.</div>';document.getElementById('officeCount').textContent='Unavailable';}}
document.getElementById('officeSearch').addEventListener('input',e=>{const q=e.target.value.toLowerCase();renderOffices(officeRecords.filter(o=>`${o.district} ${o.office}`.toLowerCase().includes(q)));});
async function loadDashboard(){try{const [overviewRes,officesRes]=await Promise.all([fetch('/api/overview'),fetch('/api/offices')]);if(!overviewRes.ok||!officesRes.ok)throw new Error('API unavailable');const overview=await overviewRes.json();const offices=await officesRes.json();const metrics=[['Applications received',overview.applications_received],['Applications processed',overview.applications_processed],['Passports printed',overview.passports_printed],['Passports collected',overview.passports_collected]];document.getElementById('metricGrid').innerHTML=metrics.map(m=>`<div class="metric-card"><span>${m[0]}</span><strong>${Number(m[1]).toLocaleString()}</strong><small>Across the selected reporting period</small></div>`).join('');document.getElementById('officeTable').innerHTML=(offices.offices||[]).map(o=>`<tr><td>${escapeHtml(o.district)}</td><td>${escapeHtml(o.office)}</td><td>${Number(o.applications_received).toLocaleString()}</td><td>${Number(o.passports_printed).toLocaleString()}</td><td>${Number(o.outstanding_backlog).toLocaleString()}</td></tr>`).join('');}catch(e){document.getElementById('metricGrid').innerHTML='<div class="panel">Could not load service metrics. Check the backend server.</div>';document.getElementById('officeTable').innerHTML='<tr><td colspan="5">Office data unavailable.</td></tr>';}}
let analyticsPayload=null;
async function loadAnalytics(){
  try{
    const response=await fetch('/api/analytics');if(!response.ok)throw new Error('Report unavailable');
    analyticsPayload=await response.json();
    const selector=document.getElementById('analyticsPeriod');
    const render=()=>{
      const period=selector?.value||'monthly'; let rows=analyticsPayload[period]||[]; if(period==='daily') rows=rows.slice(-30);
      const received=rows.reduce((s,r)=>s+Number(r.applications_received||0),0);
      const processed=rows.reduce((s,r)=>s+Number(r.applications_processed||0),0);
      const printed=rows.reduce((s,r)=>s+Number(r.passports_printed||0),0);
      const collected=rows.reduce((s,r)=>s+Number(r.passports_collected||0),0);
      const summary=document.getElementById('analyticsSummary');
      if(summary)summary.innerHTML=[['Applications received',received],['Applications processed',processed],['Passports printed',printed],['Passports collected',collected]].map(([k,v])=>`<div><small>${k}</small><strong>${Number(v).toLocaleString()}</strong></div>`).join('');
      const title=document.getElementById('analyticsChartTitle');
      if(title)title.textContent=`Applications received by ${period==='daily'?'day (last 30 days)':period==='monthly'?'month':'year'}`;
      const max=Math.max(1,...rows.map(r=>Number(r.applications_received||0)));
      const chart=document.getElementById('analyticsChart');
      if(chart)chart.innerHTML=rows.map(r=>`<div class="chart-row"><span>${escapeHtml(r.period)}</span><div class="chart-track"><i style="width:${Math.max(2,Number(r.applications_received||0)/max*100)}%"></i></div><b>${Number(r.applications_received||0).toLocaleString()}</b></div>`).join('');
      const comp=document.getElementById('passportComparisonChart');
      const cmax=Math.max(1,printed,collected);
      if(comp)comp.innerHTML=[['Printed',printed],['Collected',collected]].map(([k,v])=>`<div class="chart-row"><span>${k}</span><div class="chart-track"><i style="width:${v/cmax*100}%"></i></div><b>${Number(v).toLocaleString()}</b></div>`).join('');
      const table=document.getElementById('analyticsTable');
      if(table)table.innerHTML=rows.map(r=>`<tr><td>${escapeHtml(r.period)}</td><td>${Number(r.applications_received).toLocaleString()}</td><td>${Number(r.applications_processed).toLocaleString()}</td><td>${Number(r.passports_printed).toLocaleString()}</td><td>${Number(r.passports_collected).toLocaleString()}</td></tr>`).join('');
    };
    selector?.addEventListener('change',render);render();
  }catch(error){const chart=document.getElementById('analyticsChart');if(chart)chart.textContent='Could not load passport activity reports.';}
}
async function loadTechnologyInsights(){
  try{
    const response=await fetch('/api/technology'); if(!response.ok)throw new Error('Insights unavailable');
    const data=await response.json();
    const ai=data.ai||{}, metrics=ai.model_metrics||[];
    const aiHost=document.getElementById('aiInsightMetrics'), aiChart=document.getElementById('aiModelChart');
    if(aiHost) aiHost.innerHTML=`<div><small>30-day demand planning estimate</small><strong>${Number(ai.forecast_next_30_days_received||0).toLocaleString()}</strong></div><div><small>Average daily backlog</small><strong>${Number(ai.forecast_daily_backlog_average||0).toLocaleString()}</strong></div>`;
    if(aiChart) aiChart.innerHTML=metrics.filter(m=>m.Target==='applications_received').map(m=>`<div class="chart-row"><span>${escapeHtml(m.Model)}</span><div class="chart-track"><i style="width:${Math.max(4,Math.min(100,Number(m.R_squared||0)*100))}%"></i></div><b>${(Number(m.R_squared||0)*100).toFixed(1)}% R²</b></div>`).join('')||'Model evaluation is not available.';
    const chainHost=document.getElementById('blockchainInsightMetrics'), chainChart=document.getElementById('blockchainChart');
    if(chainHost)chainHost.innerHTML='<div><small>Audit design</small><strong>SHA-256</strong></div><div><small>Record integrity</small><strong>Hash-linked</strong></div>';
    if(chainChart)chainChart.innerHTML='<div class="chain-flow"><span>Event</span><b>→</b><span>Previous hash</span><b>→</b><span>Event hash</span><b>→</b><span>Next event</span></div>';
  }catch(error){const ai=document.getElementById('aiModelChart');if(ai)ai.textContent='AI insights are temporarily unavailable.';}
}
loadOffices();loadDashboard();loadAnalytics();loadTechnologyInsights();


// PASSASSIST public screens and Supabase authentication.
(function setupPublicScreens(){
  const publicSite = document.getElementById('publicSite');
  if (!publicSite) return;

  function showPublicView(view) {
    document.querySelectorAll('.public-view').forEach(section => section.classList.remove('active'));
    const target = document.getElementById(`public-${view}`);
    if (target) target.classList.add('active');
    document.body.classList.remove('show-citizen-demo');
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  function showMessage(id, message, isError=false) {
    const node = document.getElementById(id);
    if (!node) return;
    node.textContent = message;
    node.classList.toggle('error', isError);
  }

  publicSite.querySelectorAll('[data-public-view]').forEach(button => {
    button.addEventListener('click', () => showPublicView(button.dataset.publicView));
  });

  publicSite.querySelectorAll('[data-scroll]').forEach(button => {
    button.addEventListener('click', () => {
      showPublicView('welcome');
      const targetId = button.dataset.scroll;
      setTimeout(() => document.getElementById(targetId)?.scrollIntoView({behavior:'smooth'}), 50);
    });
  });

  const config = window.PASSASSIST_SUPABASE_CONFIG || {};
  const configured = config.url && config.anonKey &&
    !config.url.includes('PASTE_YOUR_') &&
    !config.anonKey.includes('PASTE_YOUR_');
  const supabaseLib = window.supabase;
  let authClient = null;

  if (configured && supabaseLib?.createClient) {
    authClient = supabaseLib.createClient(config.url, config.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }

  function setCitizenProfile(user, profile) {
    const name = (profile?.full_name || user?.user_metadata?.full_name || user?.email || 'Citizen').trim();
    const avatar = name ? name.charAt(0).toUpperCase() : 'C';
    const chip = document.querySelector('.profile-chip');
    if (chip) {
      chip.innerHTML = `<span class="avatar">${escapeHtml(avatar)}</span><span>${escapeHtml(name)}</span><span class="chevron">⌄</span>`;
    }
  }

  async function enterCitizenPortal(user) {
    if (!user) return;
    // Security administrators are routed to their own restricted application.
    // Access is verified by a protected Supabase RPC, not by browser metadata.
    try {
      const { error: adminGateError } = await authClient.rpc('passassist_admin_overview');
      if (!adminGateError) {
        window.location.replace('/security-admin');
        return;
      }
    } catch (_) { /* Not a security administrator; continue with normal role checks. */ }
    let profile = null;
    const { data, error } = await authClient
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Could not load PASSASSIST profile:', error.message);
      showPublicView('welcome');
      showMessage('signinMessage', 'Your account is signed in, but the profile table is not ready. Check the Phase 2 database setup instructions.', true);
      return;
    }
    profile = data;

    // Officer access is determined by a protected database assignment, never by
    // a browser-supplied role or a public registration field.
    const { data: staffRows, error: staffError } = await authClient.rpc('passassist_get_officer_context');
    if (!staffError && Array.isArray(staffRows) && staffRows.length) {
      const staff = staffRows[0];
      document.body.classList.remove('show-citizen-demo');
      document.body.classList.add('show-officer-portal');
      document.getElementById('officerOfficeLabel').textContent = staff.office_name || 'Assigned office';
      currentOfficerRole = staff.staff_role || 'officer';
      document.getElementById('officerRoleLabel').textContent = String(currentOfficerRole).toUpperCase();
      loadOfficerQueue();
      window.scrollTo({top:0,behavior:'smooth'});
      return;
    }

    if (profile && profile.role !== 'citizen') {
      await authClient.auth.signOut();
      showPublicView('welcome');
      showMessage('signinMessage', 'This account has no active citizen or officer assignment. Contact the system administrator.', true);
      return;
    }

    document.body.classList.remove('show-officer-portal');
    setCitizenProfile(user, profile);
    document.body.classList.add('show-citizen-demo');
    loadCitizenApplications();
    loadCitizenAppointmentRequests();
    loadChecklistProgress();
    loadUploadedDocuments();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  const signInForm = document.getElementById('serviceSignIn');
  signInForm?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!authClient) {
      showMessage('signinMessage', 'Supabase is not configured yet. Follow PHASE2_SETUP.md, add your Project URL and publishable/anon key to supabase-config.js, then refresh.', true);
      return;
    }
    const button = signInForm.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Signing in...';
    const email = document.getElementById('signinEmail').value.trim();
    const password = document.getElementById('signinPassword').value;
    const { data, error } = await authClient.auth.signInWithPassword({email, password});
    button.disabled = false;
    button.innerHTML = 'Sign in <span>→</span>';
    if (error) {
      showMessage('signinMessage', error.message, true);
      return;
    }
    showMessage('signinMessage', '');
    await enterCitizenPortal(data.user);
  });

  const signUpForm = document.getElementById('serviceSignUp');
  signUpForm?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!authClient) {
      showMessage('signupMessage', 'Supabase is not configured yet. Follow PHASE2_SETUP.md, add your Project URL and publishable/anon key to supabase-config.js, then refresh.', true);
      return;
    }
    const button = signUpForm.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Creating account...';
    const fullName = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const phone = document.getElementById('signupPhone').value.trim();
    const password = document.getElementById('signupPassword').value;
    const { data, error } = await authClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
        emailRedirectTo: 'https://passassist-national.onrender.com/'
      }
    });
    button.disabled = false;
    button.innerHTML = 'Create account <span>→</span>';
    if (error) {
      const friendly = /rate limit|email rate/i.test(error.message || '')
        ? 'Email verification is temporarily rate-limited by the email provider. Do not submit repeatedly. Wait for the limit to reset, or ask the administrator to configure a verified SMTP provider in Supabase Auth.'
        : error.message;
      showMessage('signupMessage', friendly, true);
      return;
    }
    if (data.session && data.user) {
      showMessage('signupMessage', 'Account created successfully. Opening your citizen portal...');
      await enterCitizenPortal(data.user);
    } else {
      showMessage('signupMessage', 'Account created. Please check your email for the verification link, verify your address, then return here to sign in.');
    }
    signUpForm.reset();
  });

  const logoutButton = document.getElementById('logoutButton');
  logoutButton?.addEventListener('click', async () => {
    if (!authClient) return;
    const { error } = await authClient.auth.signOut();
    if (error) {
      alert('Sign out could not be completed: ' + error.message);
      return;
    }
    document.body.classList.remove('show-citizen-demo','show-officer-portal');
    showPublicView('welcome');
  });


  // Complete citizen application lifecycle. Citizens may create/edit drafts,
  // submit them through a database RPC, track status and acknowledge collection.
  const checklistRequirements = {
    adult: {
      new: [
        ['identity_card','National identity card','Prepare your valid identity card.'],
        ['passport_fee','Appropriate passport fee','Confirm the current fee and accepted payment method with the Ministry.']
      ],
      replacement: [
        ['old_passport','Old passport','Prepare the passport being replaced.'],
        ['identity_card','National identity card','Prepare your valid identity card.'],
        ['passport_fee','Appropriate passport fee','Confirm the current fee and accepted payment method with the Ministry.']
      ]
    },
    minor: {
      new: [
        ['birth_certificate','Child’s birth certificate','Prepare the child’s birth certificate.'],
        ['guardian_accompaniment','Parent or guardian accompaniment','A parent or legal guardian must accompany the child.'],
        ['consent_letter','Parent or guardian consent letter','Prepare the required consent letter.'],
        ['guardian_identity','Parent or guardian identity documents','Prepare the relevant parent or guardian identity documents.'],
        ['passport_fee','Appropriate passport fee','Confirm the current fee and accepted payment method with the Ministry.']
      ],
      replacement: [
        ['birth_certificate','Child’s birth certificate','Confirm replacement requirements with the Ministry.'],
        ['guardian_accompaniment','Parent or guardian accompaniment','A parent or legal guardian must accompany the child.'],
        ['guardian_identity','Parent or guardian identity documents','Prepare the relevant identity documents.'],
        ['old_passport','Old passport, if available','Confirm the exact replacement requirements with the Ministry.'],
        ['passport_fee','Appropriate passport fee','Confirm the current fee and accepted payment method with the Ministry.']
      ]
    }
  };

  function getApplicationRequirements() {
    const category = document.getElementById('recordCategory').value;
    const type = document.getElementById('recordType').value;
    return checklistRequirements[category][type];
  }

  function renderApplicationChecklist(saved = []) {
    const host = document.getElementById('applicationChecklistItems');
    if (!host) return;
    const checked = new Set(saved || []);
    host.innerHTML = '';
    getApplicationRequirements().forEach(([key, title, description]) => {
      const row = document.createElement('label');
      row.className = 'check-item';
      row.innerHTML = `<input type="checkbox" data-application-check="${escapeHtml(key)}" ${checked.has(key) ? 'checked' : ''}><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(description)}</small></span>`;
      host.appendChild(row);
    });
    updateApplicationChecklistProgress();
  }

  function getCheckedApplicationItems() {
    return [...document.querySelectorAll('[data-application-check]:checked')].map(el => el.dataset.applicationCheck);
  }

  function updateApplicationChecklistProgress() {
    const total = document.querySelectorAll('[data-application-check]').length;
    const done = getCheckedApplicationItems().length;
    const label = document.getElementById('applicationChecklistProgress');
    if (label) label.textContent = `${done} of ${total} items checked`;
  }

  function setApplicationMessage(message, isError = false) {
    const node = document.getElementById('applicationMessage');
    if (!node) return;
    node.textContent = message;
    node.classList.toggle('error', isError);
  }

  function resetApplicationForm() {
    document.getElementById('applicationForm').reset();
    document.getElementById('editingApplicationId').value = '';
    document.getElementById('applicationFormHeading').textContent = 'Prepare a passport application';
    document.getElementById('draftModeLabel').textContent = 'NEW DRAFT';
    document.getElementById('cancelApplicationEdit').hidden = true;
    ['previousPassportNumber','previousPassportIssueDate','previousPassportExpiryDate','previousPassportPlace','previousPassportFileNumber'].forEach(id=>{const n=document.getElementById(id);if(n)n.value='';});
    document.getElementById('previousDiplomaticStatus').value='not_available';
    document.getElementById('previousAppliedNotIssued').value='no';
    showPreviousPassportSection();
    renderApplicationChecklist([]);
    setApplicationMessage('');
  }

  function readPreviousPassportDetails() {
    if (document.getElementById('recordType').value !== 'replacement') return {};
    return {
      passport_number: document.getElementById('previousPassportNumber').value.trim() || null,
      date_of_issue: document.getElementById('previousPassportIssueDate').value || null,
      date_of_expiry: document.getElementById('previousPassportExpiryDate').value || null,
      place_of_issue: document.getElementById('previousPassportPlace').value.trim() || null,
      file_number: document.getElementById('previousPassportFileNumber').value.trim() || null,
      diplomatic_official_status: document.getElementById('previousDiplomaticStatus').value,
      previously_applied_not_issued: document.getElementById('previousAppliedNotIssued').value
    };
  }
  function showPreviousPassportSection() {
    const section = document.getElementById('previousPassportSection');
    if (section) section.hidden = document.getElementById('recordType').value !== 'replacement';
  }
  function fillPreviousPassportDetails(details = {}) {
    const map = {
      previousPassportNumber: 'passport_number',
      previousPassportIssueDate: 'date_of_issue',
      previousPassportExpiryDate: 'date_of_expiry',
      previousPassportPlace: 'place_of_issue',
      previousPassportFileNumber: 'file_number',
      previousDiplomaticStatus: 'diplomatic_official_status',
      previousAppliedNotIssued: 'previously_applied_not_issued'
    };
    Object.entries(map).forEach(([id,key]) => {
      const node = document.getElementById(id);
      if (node && details[key] != null) node.value = details[key];
    });
    showPreviousPassportSection();
  }
  document.getElementById('recordType')?.addEventListener('change', showPreviousPassportSection);
  showPreviousPassportSection();

  function applicationPayload(user) {
    const requirements = getApplicationRequirements();
    const checked = getCheckedApplicationItems();
    const fullName = document.getElementById('applicantTestName').value.trim();
    const dob = document.getElementById('applicantTestDob').value;
    const office = document.getElementById('recordOffice').value;
    if (!fullName || !dob || !office) throw new Error('Complete the applicant name, date of birth and preferred office.');
    return {
      applicant_id: user.id,
      application_type: document.getElementById('recordType').value,
      applicant_category: document.getElementById('recordCategory').value,
      passport_book_type: document.getElementById('recordBook').value,
      office_name: office,
      applicant_full_name: fullName,
      applicant_date_of_birth: dob,
      contact_demo: document.getElementById('applicantContact').value.trim() || null,
      checklist_items: checked,
      checklist_complete: checked.length === requirements.length,
      previous_passport_details: readPreviousPassportDetails()
    };
  }

  async function currentCitizen() {
    if (!authClient) throw new Error('Supabase is not configured.');
    const { data, error } = await authClient.auth.getSession();
    if (error) throw error;
    if (!data.session?.user) throw new Error('Please sign in before continuing.');
    return data.session.user;
  }

  async function loadChecklistProgress() {
    const status = document.getElementById('checklistSaveStatus');
    try {
      const user = await currentCitizen();
      const category = document.getElementById('applicantAge').value;
      const type = document.getElementById('applicationType').value;
      const { data, error } = await authClient.from('citizen_preparation_checklists')
        .select('checked_items').eq('user_id', user.id)
        .eq('applicant_category', category).eq('application_type', type).maybeSingle();
      if (error) throw error;
      const saved = new Set((data?.checked_items || []).map(Number));
      document.querySelectorAll('[data-check]').forEach((box,index)=>{box.checked=saved.has(index);});
      updateProgress();
      if (status) status.textContent = data ? 'Your saved preparation progress has been restored.' : 'No saved progress for this checklist yet.';
    } catch (error) {
      if (status) status.textContent = error.message || 'Sign in to save your preparation progress.';
    }
  }
  async function saveChecklistProgress() {
    const button = document.getElementById('saveChecks');
    const status = document.getElementById('checklistSaveStatus');
    if (button) button.disabled = true;
    try {
      const user = await currentCitizen();
      const checked = [...document.querySelectorAll('[data-check]')].map((box,index)=>box.checked?index:null).filter(v=>v!==null);
      const payload = {
        user_id: user.id,
        applicant_category: document.getElementById('applicantAge').value,
        application_type: document.getElementById('applicationType').value,
        checked_items: checked,
        updated_at: new Date().toISOString()
      };
      const { error } = await authClient.from('citizen_preparation_checklists')
        .upsert(payload,{onConflict:'user_id,applicant_category,application_type'});
      if (error) throw error;
      if (status) status.textContent = `Saved: ${checked.length} preparation item(s) checked.`;
    } catch (error) {
      if (status) status.textContent = error.message || 'Could not save preparation progress.';
    } finally { if (button) button.disabled = false; }
  }
  async function loadUploadedDocuments() {
    const host = document.getElementById('uploadedDocuments');
    if (!host) return;
    try {
      const user = await currentCitizen();
      const { data, error } = await authClient.from('citizen_documents')
        .select('id,document_type,file_name,file_path,file_size,created_at')
        .eq('user_id',user.id).order('created_at',{ascending:false});
      if (error) throw error;
      if (!data?.length) { host.textContent = 'No documents uploaded yet.'; return; }
      host.innerHTML = data.map(d=>`<div class="uploaded-document"><span><strong>${escapeHtml(d.file_name)}</strong><small>${escapeHtml(d.document_type.replaceAll('_',' '))} · ${(Number(d.file_size||0)/1024).toFixed(0)} KB</small></span><button type="button" data-document-path="${escapeHtml(d.file_path)}">Open securely</button></div>`).join('');
    } catch (error) { host.textContent = error.message || 'Sign in to view uploaded documents.'; }
  }
  document.getElementById('uploadedDocuments')?.addEventListener('click',async event=>{
    const button=event.target.closest('[data-document-path]'); if(!button)return;
    try {
      const {data,error}=await authClient.storage.from('citizen-documents').createSignedUrl(button.dataset.documentPath,60);
      if(error)throw error;
      window.open(data.signedUrl,'_blank','noopener,noreferrer');
    } catch(error) { const msg=document.getElementById('uploadMessage'); if(msg)msg.textContent=error.message; }
  });
  document.getElementById('uploadDocument')?.addEventListener('click',async()=>{
    const button=document.getElementById('uploadDocument'), fileInput=document.getElementById('documentFile');
    const msg=document.getElementById('uploadMessage'); const file=fileInput?.files?.[0];
    if(!file){msg.textContent='Choose a file first.';return;}
    if(file.size>5*1024*1024){msg.textContent='Each file must be 5 MB or smaller.';return;}
    if(!['application/pdf','image/jpeg','image/png'].includes(file.type)){msg.textContent='Only PDF, JPG and PNG files are accepted.';return;}
    button.disabled=true; msg.textContent='Uploading securely…';
    try {
      const user=await currentCitizen();
      const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-100);
      const path=`${user.id}/${crypto.randomUUID()}-${safeName}`;
      const {error:uploadError}=await authClient.storage.from('citizen-documents').upload(path,file,{contentType:file.type,upsert:false});
      if(uploadError)throw uploadError;
      const {error:metaError}=await authClient.from('citizen_documents').insert({
        user_id:user.id,document_type:document.getElementById('uploadDocumentType').value,
        file_name:file.name,file_path:path,mime_type:file.type,file_size:file.size
      });
      if(metaError){await authClient.storage.from('citizen-documents').remove([path]);throw metaError;}
      msg.textContent='Document uploaded. It is stored in your private document vault.';
      fileInput.value=''; await loadUploadedDocuments();
    } catch(error){msg.textContent=error.message||'Document upload failed.';}
    finally{button.disabled=false;}
  });
  document.getElementById('saveChecks')?.addEventListener('click',saveChecklistProgress);
  // Keep the persisted checklist in sync when a citizen resets the visible items.
  document.getElementById('resetChecks')?.addEventListener('click',saveChecklistProgress);
  document.getElementById('applicantAge')?.addEventListener('change',loadChecklistProgress);
  document.getElementById('applicationType')?.addEventListener('change',loadChecklistProgress);

  async function saveApplicationDraft() {
    const button = document.getElementById('saveApplicationDraft');
    button.disabled = true;
    try {
      const user = await currentCitizen();
      const payload = applicationPayload(user);
      const editingId = document.getElementById('editingApplicationId').value;
      let result;
      if (editingId) {
        const { applicant_id, ...updates } = payload;
        result = await authClient.from('applications').update(updates)
          .eq('id', editingId).eq('applicant_id', user.id).eq('status', 'draft').select('id').single();
      } else {
        result = await authClient.from('applications').insert({...payload, status:'draft'}).select('id').single();
      }
      if (result.error) throw result.error;
      setApplicationMessage('Draft saved. You can return to edit it before submitting.');
      await loadCitizenApplications();
    } catch (error) {
      setApplicationMessage(error.message || 'Could not save this draft.', true);
    } finally {
      button.disabled = false;
    }
  }

  async function submitApplication() {
    try {
      const user = await currentCitizen();
      let applicationId = document.getElementById('editingApplicationId').value;
      const payload = applicationPayload(user);
      if (!payload.checklist_complete) {
        setApplicationMessage('Please confirm every required preparation item before submitting.', true);
        return;
      }
      if (!applicationId) {
        const { data, error } = await authClient.from('applications')
          .insert({...payload, status:'draft'}).select('id').single();
        if (error) throw error;
        applicationId = data.id;
      } else {
        const { applicant_id, ...updates } = payload;
        const { error } = await authClient.from('applications').update(updates)
          .eq('id', applicationId).eq('applicant_id', user.id).eq('status','draft');
        if (error) throw error;
      }
      const confirmed = window.confirm('Review complete: submit this application? You will not be able to edit it after submission.');
      if (!confirmed) return;
      const { data, error } = await authClient.rpc('passassist_submit_application', { p_application_id: applicationId });
      if (error) throw error;
      setApplicationMessage(`Application submitted in the service. Reference: ${data}`);
      resetApplicationForm();
      await loadCitizenApplications();
    } catch (error) {
      setApplicationMessage(error.message || 'Could not submit this application.', true);
    }
  }

  async function loadCitizenApplications() {
    const tbody = document.getElementById('applicationsTable');
    if (!tbody || !authClient) return;
    try {
      const user = await currentCitizen();
      tbody.innerHTML = '<tr><td colspan="6">Loading your applications...</td></tr>';
      const { data, error } = await authClient.from('applications')
        .select('id, reference_number, application_type, applicant_category, passport_book_type, office_name, status, created_at, updated_at, applicant_full_name')
        .eq('applicant_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      if (!data?.length) {
        tbody.innerHTML = '<tr><td colspan="6">No applications yet. Start a new draft above.</td></tr>';
        return;
      }
      tbody.innerHTML = data.map(row => {
        const statusLabels = {draft:'Draft',submitted:'Submitted',under_review:'Under review',approved:'Approved',rejected:'Rejected',printing:'Printing',ready_for_collection:'Ready for collection',collected:'Collected'};
        const status = statusLabels[row.status] || String(row.status || 'draft').replaceAll('_',' ');
        const canEdit = row.status === 'draft';
        const canCollect = row.status === 'ready_for_collection';
        return `<tr>
          <td>${escapeHtml(row.reference_number || 'DRAFT')}</td>
          <td>${row.application_type === 'new' ? 'New' : 'Replacement'} · ${row.applicant_category === 'adult' ? 'Adult' : 'Minor'} · ${row.passport_book_type === 'regular_32' ? '32 pages' : '64 pages'}</td>
          <td>${escapeHtml(row.office_name || 'Not selected')}</td>
          <td>${escapeHtml(status)}</td>
          <td>${row.updated_at ? new Date(row.updated_at).toLocaleDateString() : '—'}</td>
          <td>${canEdit ? `<button type="button" class="primary-btn" data-edit-application="${row.id}">Edit draft</button>` : canCollect ? `<button type="button" class="primary-btn" data-ack-collection="${row.id}">Acknowledge collection</button>` : `<span class="muted small">Tracking only</span>`}</td>
        </tr>`;
      }).join('');
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message || 'Could not load your records.')}</td></tr>`;
    }
  }

  async function editApplication(id) {
    try {
      const user = await currentCitizen();
      const { data, error } = await authClient.from('applications')
        .select('*').eq('id', id).eq('applicant_id', user.id).eq('status','draft').single();
      if (error) throw error;
      document.getElementById('editingApplicationId').value = data.id;
      document.getElementById('recordType').value = data.application_type;
      document.getElementById('recordCategory').value = data.applicant_category;
      document.getElementById('recordBook').value = data.passport_book_type;
      document.getElementById('recordOffice').value = data.office_name || '';
      document.getElementById('applicantTestName').value = data.applicant_full_name || '';
      document.getElementById('applicantTestDob').value = data.applicant_date_of_birth || '';
      document.getElementById('applicantContact').value = data.contact_demo || '';
      fillPreviousPassportDetails(data.previous_passport_details || {});
      renderApplicationChecklist(data.checklist_items || []);
      document.getElementById('applicationFormHeading').textContent = 'Resume your saved draft';
      document.getElementById('draftModeLabel').textContent = 'EDITING DRAFT';
      document.getElementById('cancelApplicationEdit').hidden = false;
      setApplicationMessage('Draft loaded. Make changes and save, or review and submit when ready.');
      document.getElementById('page-my-applications').scrollIntoView({behavior:'smooth'});
    } catch (error) {
      setApplicationMessage(error.message || 'Could not open this draft.', true);
    }
  }

  async function acknowledgeCollection(id) {
    const confirmed = window.confirm('Confirm that this passport has been collected?');
    if (!confirmed) return;
    try {
      const { error } = await authClient.rpc('passassist_acknowledge_collection', { p_application_id: id });
      if (error) throw error;
      setApplicationMessage('Collection acknowledgement recorded.');
      await loadCitizenApplications();
    } catch (error) {
      setApplicationMessage(error.message || 'Could not record collection.', true);
    }
  }

  document.getElementById('recordType')?.addEventListener('change', () => renderApplicationChecklist([]));
  document.getElementById('recordCategory')?.addEventListener('change', () => renderApplicationChecklist([]));
  document.getElementById('applicationChecklistItems')?.addEventListener('change', updateApplicationChecklistProgress);
  document.getElementById('saveApplicationDraft')?.addEventListener('click', saveApplicationDraft);
  document.getElementById('submitApplication')?.addEventListener('click', submitApplication);
  document.getElementById('cancelApplicationEdit')?.addEventListener('click', resetApplicationForm);
  document.getElementById('refreshApplications')?.addEventListener('click', loadCitizenApplications);
  document.getElementById('applicationsTable')?.addEventListener('click', event => {
    const edit = event.target.closest('[data-edit-application]');
    const collect = event.target.closest('[data-ack-collection]');
    if (edit) editApplication(edit.dataset.editApplication);
    if (collect) acknowledgeCollection(collect.dataset.ackCollection);
  });
  renderApplicationChecklist([]);
  if (authClient) {
    authClient.auth.getSession().then(({data, error}) => {
      if (error) {
        console.error('Session check failed:', error.message);
        return;
      }
      if (data.session?.user) enterCitizenPortal(data.session.user);
    });
    authClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        document.body.classList.remove('show-citizen-demo','show-officer-portal');
        showPublicView('welcome');
      }
    });
  }

  // Phase 4 officer workspace. All queue reads and processing updates are
  // performed through protected Supabase RPC functions scoped to the staff office.
  let officerApplications = [];
  let selectedOfficerApplication = null;
  let currentOfficerRole = 'officer';
  const officerStatusLabels = {submitted:'Submitted',under_review:'Under review',approved:'Approved',rejected:'Rejected',printing:'Printing',ready_for_collection:'Ready for collection'};
  const officerTransitions = {
    submitted:[['under_review','Move to under review']],
    under_review:[['approved','Approve application'],['rejected','Reject application']],
    approved:[['printing','Send to printing']],
    printing:[['ready_for_collection','Mark ready for collection']]
  };
  async function loadOfficerQueue(){
    const tbody=document.getElementById('officerQueueTable'); if(!tbody||!authClient)return;
    tbody.innerHTML='<tr><td colspan="7">Loading assigned-office applications...</td></tr>';
    try{
      const {data,error}=await authClient.rpc('passassist_officer_queue'); if(error)throw error;
      officerApplications=Array.isArray(data)?data:[];
      renderOfficerQueue();
    }catch(error){
      tbody.innerHTML=`<tr><td colspan="7">${escapeHtml(error.message||'Could not load the office queue.')}</td></tr>`;
      document.getElementById('officerMetrics').innerHTML='<div class="panel">The officer queue could not be loaded. Check the Phase 4 SQL setup and staff assignment.</div>';
    }
  }
  function renderOfficerQueue(){
    const filter=document.getElementById('officerStatusFilter')?.value||'all';
    const rows=officerApplications.filter(r=>filter==='all'||r.status===filter);
    const counts={submitted:0,under_review:0,ready_for_collection:0}; officerApplications.forEach(r=>{if(counts[r.status]!==undefined)counts[r.status]++;});
    document.getElementById('officerMetrics').innerHTML=[['Office queue',officerApplications.length,'Assigned office only'],['Submitted',counts.submitted,'Awaiting review'],['Under review',counts.under_review,'In assessment'],['Ready for collection',counts.ready_for_collection,'Awaiting citizen collection']].map(x=>`<div class="metric-card"><span>${x[0]}</span><strong>${Number(x[1]).toLocaleString()}</strong><small>${x[2]}</small></div>`).join('');
    const tbody=document.getElementById('officerQueueTable');
    if(!rows.length){tbody.innerHTML='<tr><td class="officer-empty" colspan="7">No applications match this filter for your assigned office.</td></tr>';return;}
    tbody.innerHTML=rows.map(r=>{const canProcess=!!(officerTransitions[r.status]&&officerTransitions[r.status].length) && (currentOfficerRole!=='officer' || r.status==='submitted');return `<tr><td>${escapeHtml(r.reference_number||'—')}</td><td>${escapeHtml(r.applicant_full_name||'Test applicant')}</td><td>${r.application_type==='new'?'New':'Replacement'} · ${r.applicant_category==='adult'?'Adult':'Minor'}</td><td>${r.passport_book_type==='regular_32'?'32 pages':'64 pages'}</td><td>${escapeHtml(officerStatusLabels[r.status]||r.status)}</td><td>${r.submitted_at?new Date(r.submitted_at).toLocaleDateString():'—'}</td><td><button class="officer-action-btn" type="button" data-officer-open="${r.id}" ${canProcess?'':'disabled'}>${canProcess?'Process':'View status'}</button></td></tr>`;}).join('');
  }
  function openOfficerRecord(id){
    const row=officerApplications.find(r=>r.id===id);if(!row)return;selectedOfficerApplication=row;
    document.getElementById('officerSelectedHeading').textContent=row.reference_number||'Application record';
    document.getElementById('officerRecordSummary').innerHTML=[['Applicant',row.applicant_full_name],['Office',row.office_name],['Application',`${row.application_type} · ${row.applicant_category}`],['Passport book',row.passport_book_type],['Current status',officerStatusLabels[row.status]||row.status],['Submitted',row.submitted_at?new Date(row.submitted_at).toLocaleString():'—']].map(([k,v])=>`<div><span>${escapeHtml(k)}</span><strong>${escapeHtml(v||'—')}</strong></div>`).join('');
    let options=officerTransitions[row.status]||[];if(currentOfficerRole==='officer' && row.status!=='submitted') options=[];const select=document.getElementById('officerNextStatus');select.innerHTML=options.map(([v,label])=>`<option value="${v}">${label}</option>`).join('');
    select.disabled=!options.length;document.getElementById('officerProcessForm').querySelector('button[type="submit"]').disabled=!options.length;
    document.getElementById('officerProcessMessage').textContent=options.length?'Choose the next permitted processing status.':'No further processing action is available from this status.';
    document.getElementById('officerProcessPanel').hidden=false;document.getElementById('officerProcessPanel').scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function saveOfficerDecision(event){
    event.preventDefault();if(!selectedOfficerApplication)return;
    const button=event.currentTarget.querySelector('button[type="submit"]');button.disabled=true;
    try{const nextStatus=document.getElementById('officerNextStatus').value;const note=document.getElementById('officerProcessNote').value.trim();
      const {error}=await authClient.rpc('passassist_process_application',{p_application_id:selectedOfficerApplication.id,p_new_status:nextStatus,p_note:note||null});if(error)throw error;
      document.getElementById('officerProcessMessage').textContent='Processing action recorded successfully.';document.getElementById('officerProcessNote').value='';
      await loadOfficerQueue();const panel=document.getElementById('officerProcessPanel');panel.hidden=true;selectedOfficerApplication=null;
    }catch(error){document.getElementById('officerProcessMessage').textContent=error.message||'Could not save the processing decision.';document.getElementById('officerProcessMessage').classList.add('error');}
    finally{button.disabled=false;}
  }
  document.getElementById('refreshOfficerQueue')?.addEventListener('click',loadOfficerQueue);
  document.getElementById('officerStatusFilter')?.addEventListener('change',renderOfficerQueue);
  document.getElementById('officerQueueTable')?.addEventListener('click',event=>{const button=event.target.closest('[data-officer-open]');if(button)openOfficerRecord(button.dataset.officerOpen);});
  document.getElementById('officerProcessForm')?.addEventListener('submit',saveOfficerDecision);
  document.getElementById('closeOfficerProcess')?.addEventListener('click',()=>{document.getElementById('officerProcessPanel').hidden=true;selectedOfficerApplication=null;});
  document.getElementById('officerSignOut')?.addEventListener('click',async()=>{if(!authClient)return;const {error}=await authClient.auth.signOut();if(error){alert('Sign out could not be completed: '+error.message);return;}document.body.classList.remove('show-citizen-demo','show-officer-portal');showPublicView('welcome');});
// ==========================================
// STEP 5: CITIZEN APPOINTMENT REQUESTS
// ==========================================

async function loadAppointmentOfficeOptions() {
    const select = document.getElementById('appointmentOffice');
    if (!select) return;

    try {
        const response = await fetch('/api/offices');
        if (!response.ok) throw new Error('Could not load offices.');

        const result = await response.json();
        const offices = result.offices || [];

        select.innerHTML = '<option value="">Choose an office</option>';

        offices.forEach(office => {
            const name = office.office || office.district;
            if (!name) return;

            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
    } catch (error) {
        select.innerHTML = '<option value="">Office list unavailable</option>';
    }
}

function setAppointmentMessage(message, isError = false) {
    const element = document.getElementById('appointmentRequestMessage');
    if (!element) return;

    element.textContent = message;
    element.classList.toggle('error', isError);
}

async function loadCitizenAppointmentRequests() {
    const tbody = document.getElementById('appointmentRequestsTable');
    if (!tbody || !authClient) return;

    try {
        const user = await currentCitizen();

        tbody.innerHTML =
            '<tr><td colspan="6">Loading your requests...</td></tr>';

        const { data, error } = await authClient
            .from('appointment_requests')
            .select('id, office_name, requested_date, requested_time, reason, status, created_at')
            .eq('applicant_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="6">You have not submitted any appointment requests.</td></tr>';
            return;
        }

        const labels = {
            pending: 'Pending review',
            under_review: 'Under review',
            approved_for_followup: 'Approved for follow-up — not confirmed',
            declined: 'Declined',
            change_requested: 'Change requested',
            cancelled: 'Cancelled'
        };

        tbody.innerHTML = data.map(request => {
            const date = new Date(
                request.requested_date + 'T00:00:00'
            ).toLocaleDateString();

            const time = String(request.requested_time).slice(0, 5);

            const submitted = new Date(
                request.created_at
            ).toLocaleDateString();

            return `
                <tr>
                    <td>${escapeHtml(request.office_name)}</td>
                    <td>${escapeHtml(date)}</td>
                    <td>${escapeHtml(time)}</td>
                    <td>${escapeHtml(request.reason)}</td>
                    <td>${escapeHtml(labels[request.status] || request.status)}</td>
                    <td>${escapeHtml(submitted)}</td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        tbody.innerHTML =
            `<tr><td colspan="6">${escapeHtml(error.message || 'Could not load requests.')}</td></tr>`;
    }
}

async function submitCitizenAppointmentRequest(event) {
    event.preventDefault();

    const button = document.getElementById('submitAppointmentRequest');
    button.disabled = true;
    button.textContent = 'Submitting request...';

    try {
        const user = await currentCitizen();

        const office = document.getElementById('appointmentOffice').value;
        const date = document.getElementById('appointmentDate').value;
        const time = document.getElementById('appointmentTime').value;
        const reason = document.getElementById('appointmentReason').value;

        if (!office || !date || !time || !reason) {
            throw new Error('Please complete all appointment fields.');
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const selectedDate = new Date(date + 'T00:00:00');

        if (selectedDate < today) {
            throw new Error('Please select today or a future date.');
        }

        const { error } = await authClient
            .from('appointment_requests')
            .insert({
                applicant_id: user.id,
                office_name: office,
                requested_date: date,
                requested_time: time,
                reason: reason,
                status: 'pending'
            });

        if (error) throw error;

        setAppointmentMessage(
            'Your request was submitted successfully. Status: Pending review. This is not an official appointment confirmation.'
        );

        document.getElementById('appointmentRequestForm').reset();

        await loadCitizenAppointmentRequests();

    } catch (error) {
        setAppointmentMessage(
            error.message || 'Could not submit your request.',
            true
        );
    } finally {
        button.disabled = false;
        button.textContent = 'Submit appointment request';
    }
}

// Load available offices and set the earliest selectable date.
loadAppointmentOfficeOptions();

const appointmentDateInput =
    document.getElementById('appointmentDate');

if (appointmentDateInput) {
    const now = new Date();
    const localDate = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0')
    ].join('-');

    appointmentDateInput.min = localDate;
}

document.getElementById('appointmentRequestForm')
    ?.addEventListener('submit', submitCitizenAppointmentRequest);

document.getElementById('refreshAppointmentRequests')
    ?.addEventListener('click', loadCitizenAppointmentRequests);
})();
