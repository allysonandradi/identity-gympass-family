/* ============================================
   VitaMove — Mobile App Logic
   Screen navigation, form validation,
   plan carousel, micro-interactions
   ============================================ */

(function () {
  'use strict';

  // ---- State ----
  const state = {
    currentScreen: 'screen-welcome',
    currentPlan: 2, // Premium (index 2) is default
    isDragging: false,
    startX: 0,
    currentX: 0,
    planOffset: 0,
  };

  // ---- DOM Refs ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ---- Screen Navigation ----
  function navigateTo(screenId, direction = 'forward') {
    const current = $(`#${state.currentScreen}`);
    const next = $(`#${screenId}`);
    if (!current || !next || state.currentScreen === screenId) return;

    // Set transition direction
    if (direction === 'forward') {
      next.style.transform = 'translateX(100%)';
      current.classList.add('exit-left');
    } else {
      next.style.transform = 'translateX(-30%)';
      next.style.opacity = '0';
    }

    // Remove active from current
    current.classList.remove('active');

    // Force reflow
    void next.offsetWidth;

    // Activate next
    next.style.transform = '';
    next.style.opacity = '';
    next.classList.remove('exit-left');
    next.classList.add('active');

    state.currentScreen = screenId;

    // Clean up current after animation
    setTimeout(() => {
      current.classList.remove('exit-left');
      current.style.transform = '';
      current.style.opacity = '';
    }, 500);
  }

  // ---- Welcome Screen ----
  function initWelcome() {
    const btnSignup = $('#btn-signup');
    const btnLogin = $('#btn-goto-login');

    btnSignup?.addEventListener('click', () => {
      navigateTo('screen-login', 'forward');
    });

    btnLogin?.addEventListener('click', () => {
      navigateTo('screen-login', 'forward');
    });
  }

  // ---- Login Screen ----
  function initLogin() {
    const form = $('#login-form');
    const backBtn = $('#btn-back-login');
    const togglePwd = $('#toggle-password');
    const passwordInput = $('#password');
    const btnGoSignup = $('#btn-goto-signup');

    // Back button
    backBtn?.addEventListener('click', () => {
      navigateTo('screen-welcome', 'back');
    });

    // Go to signup (same as login for demo)
    btnGoSignup?.addEventListener('click', (e) => {
      e.preventDefault();
      // For demo, just shake the form slightly
      form.style.animation = 'shake 0.4s ease';
      setTimeout(() => form.style.removeProperty('animation'), 400);
    });

    // Toggle password visibility
    togglePwd?.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePwd.querySelector('.eye-open').style.display = isPassword ? 'none' : 'block';
      togglePwd.querySelector('.eye-closed').style.display = isPassword ? 'block' : 'none';
      togglePwd.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
    });

    // Form submit
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validateLogin()) {
        submitLogin();
      }
    });

    // Clear errors on input
    $('#email')?.addEventListener('input', () => clearError('email'));
    passwordInput?.addEventListener('input', () => clearError('password'));
  }

  function validateLogin() {
    let valid = true;
    const email = $('#email');
    const password = $('#password');

    // Email validation
    if (!email.value.trim()) {
      showError('email', 'Digite seu e-mail');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      showError('email', 'Digite um e-mail válido');
      valid = false;
    }

    // Password validation
    if (!password.value) {
      showError('password', 'Digite sua senha');
      valid = false;
    } else if (password.value.length < 6) {
      showError('password', 'A senha deve ter pelo menos 6 caracteres');
      valid = false;
    }

    return valid;
  }

  function showError(field, message) {
    const group = $(`#group-${field}`);
    const error = $(`#error-${field}`);
    group?.classList.add('error');
    if (error) {
      error.textContent = message;
      error.classList.add('visible');
    }

    // Subtle shake
    const input = $(`#${field}`);
    input.style.animation = 'shake 0.4s ease';
    setTimeout(() => input.style.removeProperty('animation'), 400);
  }

  function clearError(field) {
    const group = $(`#group-${field}`);
    const error = $(`#error-${field}`);
    group?.classList.remove('error');
    if (error) {
      error.textContent = '';
      error.classList.remove('visible');
    }
  }

  function submitLogin() {
    const btn = $('#btn-login');
    const btnText = btn.querySelector('.btn__text');
    const btnLoader = btn.querySelector('.btn__loader');

    // Show loader
    btnText.style.display = 'none';
    btnLoader.style.display = 'flex';
    btn.disabled = true;
    btn.style.pointerEvents = 'none';

    // Simulate API call
    setTimeout(() => {
      btnText.style.display = '';
      btnLoader.style.display = 'none';
      btn.disabled = false;
      btn.style.pointerEvents = '';

      // Navigate to plans
      navigateTo('screen-plans', 'forward');
    }, 1500);
  }

  // ---- Plans Screen ----
  function initPlans() {
    const backBtn = $('#btn-back-plans');
    const track = $('#plans-track');
    const tabs = $$('.plans-page__tab');
    const dots = $$('.plans-page__dot');
    const cards = $$('.plan-card');

    // Back button
    backBtn?.addEventListener('click', () => {
      navigateTo('screen-login', 'back');
    });

    // Tab clicks
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const planIndex = parseInt(tab.dataset.plan);
        scrollToPlan(planIndex);
      });
    });

    // Dot clicks
    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.dataset.index);
        scrollToPlan(idx);
      });
    });

    // Touch/Swipe for carousel
    initCarouselTouch(track, cards);

    // Plan CTA buttons
    $$('.btn--plan').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.plan-card');
        const planName = card?.querySelector('.plan-card__name')?.textContent;
        showToast(`Plano ${planName} selecionado! ✨`);
      });
    });

    // Scroll to popular plan (Premium) initially
    setTimeout(() => scrollToPlan(2, false), 100);
  }

  function scrollToPlan(index, animate = true) {
    const track = $('#plans-track');
    const cards = $$('.plan-card');
    if (!track || !cards.length) return;

    state.currentPlan = Math.max(0, Math.min(index, cards.length - 1));

    const card = cards[state.currentPlan];
    const trackRect = track.parentElement.getBoundingClientRect();
    const cardWidth = card.offsetWidth;
    const gap = 16; // gap between cards
    const padding = 32; // track padding

    // Center the card
    const offset = state.currentPlan * (cardWidth + gap);
    const centerOffset = (trackRect.width - cardWidth) / 2 - padding;
    const translateX = -(offset - centerOffset);

    state.planOffset = translateX;

    if (animate) {
      track.style.transition = `transform 500ms cubic-bezier(0.16, 1, 0.3, 1)`;
    } else {
      track.style.transition = 'none';
    }
    track.style.transform = `translateX(${translateX}px)`;

    // Update active tab
    $$('.plans-page__tab').forEach((tab, i) => {
      tab.classList.toggle('active', i === state.currentPlan);
      tab.setAttribute('aria-selected', i === state.currentPlan ? 'true' : 'false');
    });

    // Update dots
    $$('.plans-page__dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === state.currentPlan);
    });

    // Scale effect on active card
    cards.forEach((c, i) => {
      if (i === state.currentPlan) {
        c.style.transform = 'scale(1)';
        c.style.opacity = '1';
      } else {
        c.style.transform = 'scale(0.95)';
        c.style.opacity = '0.7';
      }
    });

    // Scroll tab into view
    const activeTab = $(`.plans-page__tab[data-plan="${state.currentPlan}"]`);
    activeTab?.scrollIntoView({ behavior: animate ? 'smooth' : 'auto', block: 'nearest', inline: 'center' });
  }

  function initCarouselTouch(track, cards) {
    if (!track) return;

    let startX = 0;
    let startOffset = 0;
    let isDragging = false;
    let startTime = 0;

    const onStart = (e) => {
      isDragging = true;
      startX = getX(e);
      startOffset = state.planOffset;
      startTime = Date.now();
      track.style.transition = 'none';
    };

    const onMove = (e) => {
      if (!isDragging) return;
      const deltaX = getX(e) - startX;
      const newOffset = startOffset + deltaX;
      track.style.transform = `translateX(${newOffset}px)`;
      state.planOffset = newOffset;
    };

    const onEnd = (e) => {
      if (!isDragging) return;
      isDragging = false;

      const deltaX = getX(e) - startX;
      const deltaTime = Date.now() - startTime;
      const velocity = Math.abs(deltaX / deltaTime);

      // Determine direction
      const threshold = velocity > 0.3 ? 30 : 80;

      if (deltaX < -threshold && state.currentPlan < cards.length - 1) {
        scrollToPlan(state.currentPlan + 1);
      } else if (deltaX > threshold && state.currentPlan > 0) {
        scrollToPlan(state.currentPlan - 1);
      } else {
        scrollToPlan(state.currentPlan); // snap back
      }
    };

    const getX = (e) => {
      if (e.changedTouches) return e.changedTouches[0].clientX;
      if (e.touches) return e.touches[0].clientX;
      return e.clientX;
    };

    // Touch events
    track.addEventListener('touchstart', onStart, { passive: true });
    track.addEventListener('touchmove', onMove, { passive: true });
    track.addEventListener('touchend', onEnd);

    // Mouse events (for desktop)
    track.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', (e) => {
      if (isDragging) onMove(e);
    });
    window.addEventListener('mouseup', (e) => {
      if (isDragging) onEnd(e);
    });
  }

  // ---- Toast ----
  function showToast(message) {
    // Remove existing toast
    const existing = $('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.add('show');
      });
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 500);
    }, 2500);
  }

  // ---- Shake animation (add to styles dynamically) ----
  const shakeStyle = document.createElement('style');
  shakeStyle.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(6px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(4px); }
    }
  `;
  document.head.appendChild(shakeStyle);

  // ---- Handle window resize (recalculate plan position) ----
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      scrollToPlan(state.currentPlan, false);
    }, 200);
  });

  // ---- Keyboard navigation for plans ----
  document.addEventListener('keydown', (e) => {
    if (state.currentScreen !== 'screen-plans') return;

    if (e.key === 'ArrowLeft' && state.currentPlan > 0) {
      scrollToPlan(state.currentPlan - 1);
    } else if (e.key === 'ArrowRight' && state.currentPlan < 4) {
      scrollToPlan(state.currentPlan + 1);
    }
  });

  // ---- Initialize ----
  function init() {
    initWelcome();
    initLogin();
    initPlans();

    // Prevent pull-to-refresh on mobile
    document.body.addEventListener('touchmove', (e) => {
      if (e.target.closest('.plans-page__track')) return;
    }, { passive: true });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
