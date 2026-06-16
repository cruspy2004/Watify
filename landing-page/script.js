const heroStage = document.querySelector('#heroStage');
const heroCurtain = document.querySelector('.hero-curtain');
const lockRevealButton = document.querySelector('#lockRevealButton');

const connectionPill = document.querySelector('#connectionPill');
const phoneValue = document.querySelector('#phoneValue');
const nameValue = document.querySelector('#nameValue');
const healthValue = document.querySelector('#healthValue');

const groupResult = document.querySelector('#groupResult');
const tableResult = document.querySelector('#tableResult');
const messageResult = document.querySelector('#messageResult');
const messagesMetric = document.querySelector('#messagesMetric');
const groupsMetric = document.querySelector('#groupsMetric');
const successMetric = document.querySelector('#successMetric');
const groupTableBody = document.querySelector('#groupTableBody');
const groupSearchInput = document.querySelector('#groupSearchInput');

let messageCount = 0;
let revealLocked = false;

heroStage?.addEventListener('mousemove', (event) => {
  const rect = heroStage.getBoundingClientRect();
  const x = `${event.clientX - rect.left}px`;
  const y = `${event.clientY - rect.top}px`;

  heroCurtain.style.setProperty('--mx', x);
  heroCurtain.style.setProperty('--my', y);
});

lockRevealButton?.addEventListener('click', () => {
  revealLocked = !revealLocked;
  heroStage.classList.toggle('is-revealed', revealLocked);
  lockRevealButton.textContent = revealLocked ? 'Release dashboard reveal' : 'Hold dashboard reveal';
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
      groupsMetric.textContent = '3';
      button.textContent = 'Group created';
    }

    if (action === 'search') {
      const query = groupSearchInput.value.trim();
      tableResult.textContent = query
        ? `Showing groups matching "${query}".`
        : '2 groups loaded from dummy WhatsApp data.';
      tableResult.classList.add('success');
    }

    if (action === 'message') {
      messageCount += 1;
      messageResult.textContent = 'Message sent successfully through the dummy workflow.';
      messageResult.classList.add('success');
      messagesMetric.textContent = String(messageCount);
      successMetric.textContent = '100%';
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
