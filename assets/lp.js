/* Mountaintop landing pages: phone tracking, ad attribution, 2-step quote form, sticky bar. */
(function () {
  'use strict';
  var C = window.MTMG_CONFIG || {};
  window.dataLayer = window.dataLayer || [];

  /* ---------- Phone + email from config ---------- */
  if (C.PHONE_DISPLAY) {
    document.querySelectorAll('.js-phone').forEach(function (el) {
      if (el.textContent !== C.PHONE_DISPLAY) el.textContent = C.PHONE_DISPLAY;
    });
  }
  if (C.PHONE_TEL) {
    document.querySelectorAll('a.js-tel').forEach(function (a) { a.setAttribute('href', 'tel:' + C.PHONE_TEL); });
  }
  if (C.CONTACT_EMAIL) {
    document.querySelectorAll('a.js-email').forEach(function (a) {
      a.setAttribute('href', 'mailto:' + C.CONTACT_EMAIL);
      a.textContent = C.CONTACT_EMAIL;
    });
  }
  document.querySelectorAll('.js-year').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- phone_click on every tel: link ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"]');
    if (a) window.dataLayer.push({ event: 'phone_click', location: a.getAttribute('data-loc') || 'page' });
  });

  /* ---------- Ad click attribution (first-party cookie, 90 days) ---------- */
  var KEYS = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  var COOKIE = 'mtmg_attr';
  function readCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? m[1] : '';
  }
  var attr = {};
  try { attr = JSON.parse(decodeURIComponent(readCookie(COOKIE)) || '{}') || {}; } catch (err) { attr = {}; }
  var params = new URLSearchParams(location.search);
  var fresh = {};
  KEYS.forEach(function (k) { var v = params.get(k); if (v) fresh[k] = v.slice(0, 200); });
  if (Object.keys(fresh).length) {          // a new ad click replaces the old attribution
    attr = fresh;
    attr.landing_page = (location.pathname + location.search).slice(0, 300);
  } else if (!attr.landing_page) {
    attr.landing_page = (location.pathname + location.search).slice(0, 300);
  }
  try {
    document.cookie = COOKIE + '=' + encodeURIComponent(JSON.stringify(attr)) + ';max-age=' + (90 * 24 * 60 * 60) +
      ';path=/;SameSite=Lax' + (location.protocol === 'https:' ? ';Secure' : '');
  } catch (err) { /* cookies blocked: hidden fields still get this visit's values */ }

  /* ---------- Quote form ---------- */
  var form = document.getElementById('quoteForm');
  if (form) initForm(form);

  function initForm(form) {
    KEYS.concat('landing_page').forEach(function (k) {
      var input = form.querySelector('input[name="' + k + '"]');
      if (input) input.value = attr[k] || '';
    });
    var key = form.querySelector('input[name="access_key"]');
    if (key && C.WEB3FORMS_KEY) key.value = C.WEB3FORMS_KEY;

    var step1 = form.querySelector('[data-step="1"]');
    var step2 = form.querySelector('[data-step="2"]');
    var bars = form.querySelectorAll('.progress span');
    var status = form.querySelector('.form-status');
    var submitBtn = form.querySelector('button[type="submit"]');
    var submitText = submitBtn.textContent;
    var thisYear = new Date().getFullYear();

    var rules = {
      pickup_zip: function (v) { return /^\d{5}$/.test(v) || 'Enter a 5-digit ZIP code.'; },
      delivery_zip: function (v) { return /^\d{5}$/.test(v) || 'Enter a 5-digit ZIP code.'; },
      year: function (v) { return (/^\d{4}$/.test(v) && +v >= 1900 && +v <= thisYear + 2) || 'Enter a 4-digit year.'; },
      make: function (v) { return !!v || 'Enter the vehicle make.'; },
      model: function (v) { return !!v || 'Enter the vehicle model.'; },
      name: function (v) { return v.length >= 2 || 'Enter your name.'; },
      phone: function (v) { return v.replace(/\D/g, '').length === 10 || 'Enter a 10-digit U.S. phone number.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Enter a valid email address.'; },
      condition: function (v) { return !!v || 'Select the vehicle condition.'; },
      consent: function (v, el) { return el.checked || 'Please check this box so dispatch can contact you.'; }
    };

    function check(el) {
      var rule = rules[el.id];
      if (!rule) return true;
      var res = rule(el.value.trim(), el);
      var msg = res === true ? '' : res;
      var errEl = document.getElementById(el.id + '-err');
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (errEl) errEl.textContent = msg;
      return !msg;
    }
    function checkStep(step) {
      var first = null;
      step.querySelectorAll('input,select,textarea').forEach(function (el) {
        if (!check(el) && !first) first = el;
      });
      if (first) first.focus();
      return !first;
    }

    form.querySelectorAll('input,select,textarea').forEach(function (el) {
      if (!rules[el.id]) return;
      el.addEventListener('blur', function () { if (el.value || el.getAttribute('aria-invalid')) check(el); });
      el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') check(el); });
      el.addEventListener('change', function () { if (el.getAttribute('aria-invalid') === 'true') check(el); });
    });

    // Digits only for ZIP and year
    ['pickup_zip', 'delivery_zip', 'year'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () {
        var d = el.value.replace(/\D/g, '').slice(0, id === 'year' ? 4 : 5);
        if (d !== el.value) el.value = d;
      });
    });

    // US phone mask: (555) 555-5555
    var phone = document.getElementById('phone');
    if (phone) phone.addEventListener('input', function () {
      var d = phone.value.replace(/\D/g, '');
      if (d.length === 11 && d.charAt(0) === '1') d = d.slice(1);
      d = d.slice(0, 10);
      var out = d;
      if (d.length > 6) out = '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
      else if (d.length > 3) out = '(' + d.slice(0, 3) + ') ' + d.slice(3);
      else if (d.length) out = '(' + d;
      phone.value = out;
    });

    function showStep(n) {
      step1.hidden = n !== 1;
      step2.hidden = n !== 2;
      bars.forEach(function (b, i) { b.classList.toggle('on', i < n); });
      var focusEl = (n === 1 ? step1 : step2).querySelector('input,select');
      if (focusEl) focusEl.focus({ preventScroll: true });
      form.closest('.form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    form.querySelector('.js-next').addEventListener('click', function () {
      if (checkStep(step1)) {
        showStep(2);
        window.dataLayer.push({ event: 'quote_form_step2' });
      }
    });
    form.querySelector('.js-back').addEventListener('click', function () { showStep(1); });
    // Enter key in step 1 moves to step 2 instead of submitting
    step1.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); form.querySelector('.js-next').click(); }
    });

    var sending = false;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;
      status.textContent = '';
      if (!step2.hidden && !checkStep(step2)) return;
      if (step2.hidden) { form.querySelector('.js-next').click(); return; }

      // Honeypot: bots fill the hidden field; pretend success without sending
      var hp = form.querySelector('input[name="botcheck"]');
      if (hp && hp.checked) { location.href = '/thank-you'; return; }

      // Basic rate limit: one request per minute per browser
      var last = 0;
      try { last = +localStorage.getItem('mtmg_last_submit') || 0; } catch (err) {}
      if (Date.now() - last < 60000) {
        status.textContent = 'Your request was just sent. Please wait a minute before sending another, or call dispatch.';
        return;
      }

      sending = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = typeof v === 'string' ? v.trim() : v; });
      delete data.botcheck;
      data.subject = 'New Quote Request: ' + (data['Customer Type'] || '') + ' | ' +
        data['Pickup ZIP'] + ' to ' + data['Delivery ZIP'] + ' | ' + data['Number of Vehicles'] + ' vehicle(s)';

      if (C.WEBHOOK_URL) {
        try {
          fetch(C.WEBHOOK_URL, { method: 'POST', mode: 'no-cors', keepalive: true,
            headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(data) });
        } catch (err) {}
      }

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res || !res.success) throw new Error((res && res.message) || 'Send failed');
          finish(data, false);
        })
        .catch(function () {
          // Fallback: regular form post (Web3Forms redirects to /thank-you)
          form.querySelector('input[name="subject"]').value = data.subject;
          finish(data, true);
        });
    });

    function finish(data, viaPost) {
      try { localStorage.setItem('mtmg_last_submit', String(Date.now())); } catch (err) {}
      var done = false;
      function go() {
        if (done) return;
        done = true;
        if (viaPost) HTMLFormElement.prototype.submit.call(form);
        else location.href = '/thank-you';
      }
      window.dataLayer.push({
        event: 'quote_form_submit',
        customer_type: data['Customer Type'] || '',
        vehicles: data['Number of Vehicles'] || '',
        eventCallback: go,
        eventTimeout: 1500
      });
      setTimeout(go, 1600);
    }
  }

  /* ---------- Sticky call/quote bar: reacts to the form being on screen ---------- */
  var bar = document.getElementById('stickyCta');
  var card = document.getElementById('quote');
  if (bar) {
    document.body.classList.add('has-sticky');
    if (card && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          bar.classList.toggle('off', en.isIntersecting);
          bar.classList.toggle('form-on', en.isIntersecting);  // v2 mobile: keep Call, hide Get Quote
        });
      }, { threshold: 0.15 }).observe(card);
    }
  }
})();
