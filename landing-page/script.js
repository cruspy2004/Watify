const heroReveal = document.querySelector('#heroReveal');
const pulseDashboardButton = document.querySelector('#pulseDashboardButton');
const demoOutput = document.querySelector('#demoOutput');

const featureMessages = {
  group: 'Group created. Members are queued and ready for validation.',
  message: 'Campaign sent. Delivery status is now being tracked.',
  health: 'Connection checked. WhatsApp Web is operational.',
  subscriber: 'Subscriber added. Dashboard counts are refreshed.'
};

const sequenceMessages = {
  connect: 'Connected to WhatsApp number 923126604697. Health check passed.',
  group: 'Created "June Leads" with 24 members in one action.',
  send: 'Message sent to the selected WhatsApp group.',
  track: 'Dashboard updated with the newest activity.'
};

pulseDashboardButton?.addEventListener('click', () => {
  heroReveal.classList.toggle('is-revealed');
  pulseDashboardButton.textContent = heroReveal.classList.contains('is-revealed')
    ? 'Hide dashboard'
    : 'Reveal dashboard';
});

document.querySelectorAll('[data-action]').forEach((button) => {
  button.addEventListener('click', () => {
    const card = button.closest('[data-feature-card]');
    const output = card.querySelector('output');
    const action = button.dataset.action;

    card.classList.add('is-complete');
    output.textContent = featureMessages[action] || 'Action completed.';
    button.textContent = 'Done';
  });
});

document.querySelectorAll('[data-sequence-step]').forEach((button) => {
  button.addEventListener('click', () => {
    demoOutput.textContent = sequenceMessages[button.dataset.sequenceStep] || 'Workflow updated.';
  });
});
