const titles={home:'Overview',apply:'Passport services','my-applications':'My applications',checklist:'Document checklist',offices:'Find an office',dashboard:'National dashboard',security:'Security centre',admin:'Security administration'};
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
function renderOffices(records){const host=document.getElementById('officeGrid');host.innerHTML='';records.forEach(o=>{const card=document.createElement('article');card.className='office-card';const phone=o.phone||'Contact number not available';card.innerHTML=`<div class="office-top"><span class="office-district">${escapeHtml(o.district||'LESOTHO')}</span><span class="office-pin">⌖</span></div><h3>${escapeHtml(o.office||'Passport office')}</h3><div class="office-phone">${escapeHtml(phone)}</div><div class="office-status">DEMO DIRECTORY · CONFIRM BEFORE VISITING</div>`;host.appendChild(card);});document.getElementById('officeCount').textContent=`${records.length} locations listed`;}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function loadOffices(){try{const res=await fetch('/api/offices');if(!res.ok)throw new Error('Could not load offices');const data=await res.json();officeRecords=(data.offices||[]).map(o=>({...o,phone:''}));renderOffices(officeRecords);}catch(e){document.getElementById('officeGrid').innerHTML='<div class="panel">Office data could not be loaded. Check that the backend server is running.</div>';document.getElementById('officeCount').textContent='Unavailable';}}
document.getElementById('officeSearch').addEventListener('input',e=>{const q=e.target.value.toLowerCase();renderOffices(officeRecords.filter(o=>`${o.district} ${o.office}`.toLowerCase().includes(q)));});

async function loadDashboard() {
  try {
    const [overviewRes, officesRes] = await Promise.all([
      fetch('/api/overview'),
      fetch('/api/offices')
    ]);

    if (!overviewRes.ok || !officesRes.ok) {
      throw new Error('Dashboard API unavailable');
    }

    const overview = await overviewRes.json();
    const offices = await officesRes.json();

    const metrics = [
      ['Applications received', overview.applications_received],
      ['Applications processed', overview.applications_processed],
      ['Passports printed', overview.passports_printed],
      ['Passports collected', overview.passports_collected]
    ];

    document.getElementById('metricGrid').innerHTML =
      metrics.map(m => `
        <div class="metric-card">
          <span>${escapeHtml(m[0])}</span>
          <strong>${Number(m[1]).toLocaleString()}</strong>
          <small>Synthetic demonstration data</small>
        </div>
      `).join('');

    document.getElementById('officeTable').innerHTML =
      (offices.offices || []).map(o => `
        <tr>
          <td>${escapeHtml(o.district)}</td>
          <td>${escapeHtml(o.office)}</td>
          <td>${Number(o.applications_received).toLocaleString()}</td>
          <td>${Number(o.passports_printed).toLocaleString()}</td>
          <td>${Number(o.outstanding_backlog).toLocaleString()}</td>
        </tr>
      `).join('');

    // Load the AI forecasting demonstration separately.
    try {
      const response = await fetch('/api/forecast');
      if (!response.ok) throw new Error('Forecast unavailable');

      const forecast = await response.json();

      document.getElementById('forecastSummary').innerHTML = `
        <div class="forecast-stat">
          <span>Projected applications (next 30 days)</span>
          <strong>${Number(forecast.forecast_next_30_days_received).toLocaleString()}</strong>
        </div>
        <div class="forecast-stat">
          <span>Average daily outstanding backlog</span>
          <strong>${Number(forecast.forecast_daily_backlog_average).toLocaleString()}</strong>
        </div>
      `;

      document.getElementById('forecastMethod').textContent =
        forecast.method || 'Forecasting method not specified';

      const results = forecast.model_evaluation || [];
      const evaluation = document.getElementById('modelEvaluation');

      if (results.length) {
        const columns = Object.keys(results[0]);

        evaluation.innerHTML = `
          <h4>Saved model evaluation results</h4>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>${columns.map(c => `<th>${escapeHtml(c)}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${results.map(row => `
                  <tr>${columns.map(c =>
                    `<td>${escapeHtml(row[c] ?? '—')}</td>`
                  ).join('')}</tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else {
        evaluation.textContent =
          'No saved model evaluation results are available.';
      }

    } catch (forecastError) {
      document.getElementById('forecastSummary').textContent =
        'Forecast data is currently unavailable.';
      document.getElementById('forecastMethod').textContent =
        forecastError.message;
    }

  } catch (error) {
    document.getElementById('metricGrid').innerHTML =
      '<div class="panel">Could not load demonstration metrics. Check the backend server.</div>';

    document.getElementById('officeTable').innerHTML =
      '<tr><td colspan="5">Office data unavailable.</td></tr>';
  }
}

loadOffices();loadDashboard();


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
    console.log('OFFICER CHECK:', {
  staffRows,
  staffError,
  isArray: Array.isArray(staffRows),
  userId: user.id
});
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
    window.scrollTo({top:0,behavior:'smooth'});
  }

  const signInForm = document.getElementById('prototypeSignIn');
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

  const signUpForm = document.getElementById('prototypeSignUp');
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
    let data, error;
    try {
      ({ data, error } = await authClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone } }
      }));
    } catch (networkError) {
      console.error('PASSASSIST registration network failure:', networkError);
      button.disabled = false;
      button.innerHTML = 'Create account <span>→</span>';
      showMessage('signupMessage', 'Could not reach Supabase. Check your internet connection, Supabase Project URL, publishable key, and Supabase project status. Open Chrome DevTools → Network for the exact request error.', true);
      return;
    }
    button.disabled = false;
    button.innerHTML = 'Create account <span>→</span>';
    if (error) {
      showMessage('signupMessage', error.message, true);
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
    renderApplicationChecklist([]);
    setApplicationMessage('');
  }

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
      checklist_complete: checked.length === requirements.length
    };
  }

  async function currentCitizen() {
    if (!authClient) throw new Error('Supabase is not configured.');
    const { data, error } = await authClient.auth.getSession();
    if (error) throw error;
    if (!data.session?.user) throw new Error('Please sign in before continuing.');
    return data.session.user;
  }

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
      const confirmed = window.confirm('Review complete: submit this demonstration application? You will not be able to edit it after submission.');
      if (!confirmed) return;
      const { data, error } = await authClient.rpc('passassist_submit_application', { p_application_id: applicationId });
      if (error) throw error;
      setApplicationMessage(`Application submitted in the prototype. Reference: ${data}`);
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
    const confirmed = window.confirm('Confirm that this demonstration passport has been collected?');
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

})();
async function loadAnalytics() {
  const periodSelect = document.getElementById('analyticsPeriod');
  const metricsBox = document.getElementById('analyticsMetrics');
  const chartBox = document.getElementById('analyticsChart');
  const chartTitle = document.getElementById('analyticsChartTitle');
  const tableBody = document.getElementById('analyticsTable');

  if (!periodSelect || !metricsBox || !chartBox || !tableBody) return;

  try {
    const response = await fetch('/api/analytics');
    if (!response.ok) throw new Error('Analytics could not be loaded.');

    const data = await response.json();

    function renderAnalytics() {
      const period = periodSelect.value;
      const records = data[period] || [];

      if (!records.length) {
        metricsBox.innerHTML = '<div class="metric-card">No analytics available.</div>';
        chartBox.textContent = 'No chart data available.';
        tableBody.innerHTML = '<tr><td colspan="6">No records available.</td></tr>';
        return;
      }

      const totals = records.reduce((sum, row) => {
        Object.keys(row).forEach(key => {
          if (key !== 'date' && key !== 'index') {
            sum[key] = (sum[key] || 0) + Number(row[key] || 0);
          }
        });
        return sum;
      }, {});

      metricsBox.innerHTML = [
        ['Applications received', totals.applications_received],
        ['Applications processed', totals.applications_processed],
        ['Passports printed', totals.passports_printed],
        ['Passports collected', totals.passports_collected]
      ].map(item => `
        <div class="metric-card">
          <span>${item[0]}</span>
          <strong>${Number(item[1] || 0).toLocaleString()}</strong>
          <small>Synthetic demonstration data</small>
        </div>
      `).join('');

      const labelKey = period === 'daily' ? 'date' :
                       period === 'monthly' ? 'date' : 'date';

      chartTitle.textContent =
        period.charAt(0).toUpperCase() + period.slice(1) +
        ' applications received';

      const maxValue = Math.max(
        ...records.map(row => Number(row.applications_received || 0)),
        1
      );

      chartBox.innerHTML = records.map(row => {
        const value = Number(row.applications_received || 0);
        const width = Math.max((value / maxValue) * 100, value > 0 ? 2 : 0);

        return `
          <div class="analytics-bar-row">
            <span>${escapeHtml(row[labelKey] || '—')}</span>
            <div class="analytics-bar-track">
              <div class="analytics-bar-fill" style="width:${width}%"></div>
            </div>
            <strong>${value.toLocaleString()}</strong>
          </div>
        `;
      }).join('');

            const comparisonBox = document.getElementById('passportComparisonChart');

      if (comparisonBox) {
        const maxPassportValue = Math.max(
          ...records.map(row => Math.max(
            Number(row.passports_printed || 0),
            Number(row.passports_collected || 0)
          )),
          1
        );

        comparisonBox.innerHTML = records.map(row => {
          const printed = Number(row.passports_printed || 0);
          const collected = Number(row.passports_collected || 0);

          return `
            <div class="analytics-bar-row">
              <span>${escapeHtml(row.date || '—')}</span>
              <div class="analytics-comparison">
                <div class="analytics-bar-track">
                  <div class="analytics-bar-fill" style="width:${printed / maxPassportValue * 100}%"></div>
                </div>
                <small>Printed: ${printed.toLocaleString()}</small>
                <div class="analytics-bar-track">
                  <div class="analytics-bar-fill collected-fill" style="width:${collected / maxPassportValue * 100}%"></div>
                </div>
                <small>Collected: ${collected.toLocaleString()}</small>
              </div>
            </div>
          `;
        }).join('');
      }

      tableBody.innerHTML = records.map(row => `
        <tr>
          <td>${escapeHtml(row.date || '—')}</td>
          <td>${Number(row.applications_received || 0).toLocaleString()}</td>
          <td>${Number(row.applications_processed || 0).toLocaleString()}</td>
          <td>${Number(row.applications_approved || 0).toLocaleString()}</td>
          <td>${Number(row.passports_printed || 0).toLocaleString()}</td>
          <td>${Number(row.passports_collected || 0).toLocaleString()}</td>
        </tr>
      `).join('');
    }

    periodSelect.addEventListener('change', renderAnalytics);
    renderAnalytics();

  } catch (error) {
    metricsBox.textContent = 'Analytics unavailable.';
    chartBox.textContent = error.message;
    tableBody.innerHTML = '<tr><td colspan="6">Could not load analytics.</td></tr>';
  }
}

loadAnalytics();