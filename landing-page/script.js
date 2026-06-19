const heroStage = document.querySelector('#heroStage');
const heroCurtain = document.querySelector('.hero-curtain');
const featuresSection = document.querySelector('.features-section');
const featureRibbonPath = document.querySelector('#featureRibbonPath');
const featureRibbonPoint = document.querySelector('#featureRibbonPoint');

const connectionPill = document.querySelector('#connectionPill');
const phoneValue = document.querySelector('#phoneValue');
const nameValue = document.querySelector('#nameValue');
const healthValue = document.querySelector('#healthValue');
const phoneScanMock = document.querySelector('#phoneScanMock');
const phoneScanStatus = document.querySelector('#phoneScanStatus');

const groupResult = document.querySelector('#groupResult');
const tableResult = document.querySelector('#tableResult');
const messageResult = document.querySelector('#messageResult');
const groupTableBody = document.querySelector('#groupTableBody');
const groupSearchInput = document.querySelector('#groupSearchInput');
const leadPanel = document.querySelector('#leadPanel');
const leadList = document.querySelector('#leadList');
const quickActionOutput = document.querySelector('#quickActionOutput');

const quickMessages = {
  connect: 'WhatsApp verified. The admin can safely continue.',
  group: 'Group created. Members are ready for review.',
  send: 'Message sent. The result is tracked in the dashboard.',
  track: 'Metrics updated. Admin work is now visible.'
};

const groupLeads = {
  'June Leads': [
    'Ayesha Khan - +92 300 1111111',
    'Bilal Ahmed - +92 301 2222222',
    'Minaal Raza - +92 302 3333333'
  ],
  'Support Broadcast': [
    'Noman Ali - +92 310 4444444',
    'Sara Malik - +92 311 5555555',
    'Usman Tariq - +92 312 6666666'
  ],
  'New Customers': [
    'Hira Sheikh - +92 320 7777777',
    'Danish Iqbal - +92 321 8888888',
    'Zain Fatima - +92 322 9999999'
  ],
  'Renewal Pipeline': [
    'Sameer Shah - +92 330 1010101',
    'Iqra Noor - +92 331 2020202',
    'Hamza Qureshi - +92 332 3030303'
  ],
  'VIP Broadcast': [
    'Wateen Admin - +92 340 4040404',
    'Priority Lead - +92 341 5050505',
    'Enterprise Contact - +92 342 6060606'
  ]
};

heroStage?.addEventListener('mousemove', (event) => {
  const rect = heroStage.getBoundingClientRect();
  const x = `${event.clientX - rect.left}px`;
  const y = `${event.clientY - rect.top}px`;

  heroCurtain.style.setProperty('--mx', x);
  heroCurtain.style.setProperty('--my', y);
});

document.querySelectorAll('[data-quick-action]').forEach((button) => {
  button.addEventListener('click', () => {
    quickActionOutput.textContent = quickMessages[button.dataset.quickAction] || 'Action completed.';
  });
});

document.querySelectorAll('[data-demo-action]').forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.demoAction;

    if (action === 'connect') {
      connectionPill.textContent = 'Connected';
      connectionPill.classList.add('connected');
      phoneValue.textContent = '923126604697';
      nameValue.textContent = 'H1grow';
      healthValue.textContent = 'Operational';
      phoneScanMock?.classList.add('connected');
      if (phoneScanStatus) {
        phoneScanStatus.textContent = 'Connected';
      }
      button.textContent = 'QR scanned';
    }

    if (action === 'group') {
      const name = document.querySelector('#groupNameInput').value.trim() || 'New WhatsApp Group';
      groupResult.textContent = `${name} created with 5 CSV contacts.`;
      groupResult.classList.add('success');
      button.textContent = 'Group created';
    }

    if (action === 'search') {
      const query = groupSearchInput.value.trim();
      tableResult.textContent = query
        ? `Showing groups matching "${query}".`
        : '5 groups loaded.';
      tableResult.classList.add('success');
    }

    if (action === 'message') {
      messageResult.textContent = 'Message sent successfully through Watify.';
      messageResult.classList.add('success');
      button.textContent = 'Message sent';
    }
  });
});

document.querySelectorAll('[data-row-action]').forEach((button) => {
  button.addEventListener('click', () => {
    const row = button.closest('tr');
    const groupName = row.children[1].textContent;
    const leads = groupLeads[groupName] || ['No leads available for this group.'];

    if (leadPanel && leadList) {
      leadPanel.querySelector('strong').textContent = `${groupName} leads`;
      leadPanel.querySelector('span').textContent = `${leads.length} visible leads`;
      leadList.replaceChildren(
        ...leads.map((lead) => {
          const item = document.createElement('li');
          item.textContent = lead;
          return item;
        })
      );
    }

    tableResult.textContent = `Showing leads for ${groupName}.`;
    tableResult.classList.add('success');
  });
});

groupSearchInput?.addEventListener('input', () => {
  const query = groupSearchInput.value.trim().toLowerCase();
  Array.from(groupTableBody.rows).forEach((row) => {
    const name = row.children[1].textContent.toLowerCase();
    row.style.display = name.includes(query) ? '' : 'none';
  });
});

const setupFeatureRibbon = () => {
  if (!featuresSection || !featureRibbonPath || !featureRibbonPoint) {
    return;
  }

  const length = featureRibbonPath.getTotalLength();
  featureRibbonPath.style.strokeDasharray = length;
  featureRibbonPath.style.strokeDashoffset = length;

  const updateRibbon = () => {
    const rect = featuresSection.getBoundingClientRect();
    const travel = Math.max(rect.height + window.innerHeight * 0.48, 1);
    const rawProgress = (window.innerHeight * 0.58 - rect.top) / travel;
    const progress = Math.max(0, Math.min(1, rawProgress));
    const easedProgress = Math.pow(progress, 1.14);
    const drawLength = length * easedProgress;
    const point = featureRibbonPath.getPointAtLength(drawLength);

    featureRibbonPath.style.strokeDashoffset = length - drawLength;
    featureRibbonPoint.setAttribute('cx', point.x);
    featureRibbonPoint.setAttribute('cy', point.y);
    featureRibbonPoint.style.transform = `scale(${0.85 + easedProgress * 0.45})`;
  };

  updateRibbon();
  window.addEventListener('scroll', updateRibbon, { passive: true });
  window.addEventListener('resize', updateRibbon);
};

setupFeatureRibbon();
