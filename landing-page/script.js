const heroStage = document.querySelector('#heroStage');
const heroCurtain = document.querySelector('.hero-curtain');
const ribbonSection = document.querySelector('.features-section');
const ribbonPath = document.querySelector('#ribbonPathActive');
const ribbonPoint = document.querySelector('#ribbonPoint');

const connectionPill = document.querySelector('#connectionPill');
const phoneValue = document.querySelector('#phoneValue');
const nameValue = document.querySelector('#nameValue');
const healthValue = document.querySelector('#healthValue');

const groupResult = document.querySelector('#groupResult');
const tableResult = document.querySelector('#tableResult');
const messageResult = document.querySelector('#messageResult');
const groupTableBody = document.querySelector('#groupTableBody');
const groupSearchInput = document.querySelector('#groupSearchInput');
const quickActionOutput = document.querySelector('#quickActionOutput');

const quickMessages = {
  connect: 'WhatsApp verified. The admin can safely continue.',
  group: 'Group created. Members are ready for review.',
  send: 'Message sent. The result is tracked in the dashboard.',
  track: 'Metrics updated. Admin work is now visible.'
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
      button.textContent = 'Connection verified';
    }

    if (action === 'group') {
      const name = document.querySelector('#groupNameInput').value.trim() || 'New WhatsApp Group';
      groupResult.textContent = `${name} created with 3 participants.`;
      groupResult.classList.add('success');
      button.textContent = 'Group created';
    }

    if (action === 'search') {
      const query = groupSearchInput.value.trim();
      tableResult.textContent = query
        ? `Showing groups matching "${query}".`
        : '2 groups loaded.';
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
    tableResult.textContent = `Opened details for ${groupName}.`;
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

const setupRibbon = () => {
  if (!ribbonPath || !ribbonPoint) return;

  const pathLength = ribbonPath.getTotalLength();
  ribbonPath.style.strokeDasharray = pathLength;
  ribbonPath.style.strokeDashoffset = pathLength;

  const updateRibbon = () => {
    if (!ribbonSection) return;

    const rect = ribbonSection.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    const rawProgress = (window.innerHeight - rect.top) / (scrollable + window.innerHeight);
    const progress = Math.max(0, Math.min(1, rawProgress));
    const drawLength = pathLength * progress;
    const point = ribbonPath.getPointAtLength(drawLength);

    ribbonPath.style.strokeDashoffset = pathLength - drawLength;
    ribbonPoint.setAttribute('cx', point.x);
    ribbonPoint.setAttribute('cy', point.y);
  };

  updateRibbon();
  window.addEventListener('scroll', updateRibbon, { passive: true });
  window.addEventListener('resize', updateRibbon);
};

setupRibbon();
