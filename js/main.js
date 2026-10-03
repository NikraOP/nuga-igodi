/* Нуга & Ягоды. Свадьба. Без зависимостей. */
(function () {
  'use strict';

  var $ = function (s, root) { return (root || document).querySelector(s); };
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var smooth = reduceMotion ? 'auto' : 'smooth';

  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }
  var fmtKg = function (kg) { return String(kg).replace('.', ',') + ' кг'; };

  /* ---------- Шапка и меню ---------- */
  var header = $('#header');
  var menu = $('#menu');
  var burger = $('.burger');
  var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 24); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    header.classList.toggle('is-open', open);
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
  });

  /* ---------- Слайдер первого экрана ---------- */
  var hero = $('.hero');
  var slider = $('[data-slider]');
  if (slider) {
    var slides = $$('.slide', slider);
    var dots = $$('.hero__dots button');
    var titleEl = $('[data-slide-title]');
    var metaEl = $('[data-slide-meta]');
    var cur = 0;

    var show = function (i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) {
        s.classList.toggle('is-active', n === cur);
        s.setAttribute('aria-hidden', String(n !== cur));
        var img = s.querySelector('img[loading="lazy"]');
        if (img && (n === cur || n === (cur + 1) % slides.length)) img.loading = 'eager';
      });
      dots.forEach(function (d, n) {
        d.classList.remove('is-active');
        d.classList.toggle('is-done', n < cur);
        d.removeAttribute('aria-current');
      });
      void dots[cur].offsetWidth; // перезапуск анимации полосы
      dots[cur].classList.add('is-active');
      dots[cur].setAttribute('aria-current', 'true');
      titleEl.textContent = slides[cur].dataset.title;
      metaEl.textContent = slides[cur].dataset.meta;
      if (caption) {
        caption.classList.remove('is-changing');
        void caption.offsetWidth;
        caption.classList.add('is-changing');
      }
    };

    // полоса заполняется CSS-анимацией; когда дошла до конца, переключаем
    dots.forEach(function (d, n) {
      d.addEventListener('click', function () { caption.setAttribute('aria-live', 'polite'); show(n); });
      d.addEventListener('animationend', function () { if (!reduceMotion && n === cur) show(cur + 1); });
    });
    var pauseBtn = $('[data-slide-pause]');
    var caption = $('[data-slide-caption]');
    var stopped = reduceMotion;
    var pause = function () { hero.classList.add('is-paused'); };
    var resume = function () { if (!stopped) hero.classList.remove('is-paused'); };
    var setStopped = function (v) {
      stopped = v;
      pauseBtn.setAttribute('aria-pressed', String(v));
      pauseBtn.setAttribute('aria-label', v ? 'Продолжить смену тортов' : 'Остановить смену тортов');
      hero.classList.toggle('is-paused', v);
    };
    pauseBtn.addEventListener('click', function () { setStopped(!stopped); });
    if (reduceMotion) setStopped(true);
    hero.addEventListener('mouseenter', pause);
    hero.addEventListener('mouseleave', resume);
    hero.addEventListener('focusin', pause);
    hero.addEventListener('focusout', resume);
    document.addEventListener('visibilitychange', function () { document.hidden ? pause() : resume(); });

    var sx = null;
    slider.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
      sx = null;
    }, { passive: true });
    show(0);
  }

  /* ---------- Каталог: показать ещё ---------- */
  var moreBtn = $('[data-cakes-more]');
  if (moreBtn) {
    var cakesList = $('[data-cakes]');
    var mobileCatalog = window.matchMedia('(max-width: 639px)');
    var remainingCakes = $$('[data-cakes] [data-more]').length;
    var mobilePreviewExtra = cakesList ? Math.max(0, $$('.cake', cakesList).length - remainingCakes - 5) : 0;
    var updateMoreLabel = function () {
      var count = remainingCakes + (mobileCatalog.matches ? mobilePreviewExtra : 0);
      moreBtn.textContent = 'Показать ещё ' + count;
      moreBtn.parentElement.hidden = !count;
    };
    updateMoreLabel();
    mobileCatalog.addEventListener('change', updateMoreLabel);
    moreBtn.addEventListener('click', function () {
      var hidden = $$('[data-cakes] [data-more]');
      hidden.forEach(function (el) { el.hidden = false; el.removeAttribute('data-more'); });
      if (cakesList) cakesList.classList.add('is-expanded');
      moreBtn.parentElement.hidden = true;
      var firstTitle = hidden[0] && $('.cake__title', hidden[0]);
      if (firstTitle) { firstTitle.tabIndex = -1; firstTitle.focus({ preventScroll: true }); }
    });
  }

  /* ---------- Тема заявки ---------- */
  var form = $('#order-form');
  var topicMap = { tasting: 'Дегустационный сет', cake: 'Свадебный торт', agency: 'Сотрудничество для агентства' };
  var setTopic = function (key) {
    var r = form && topicMap[key] ? $('input[name="topic"][value="' + topicMap[key] + '"]', form) : null;
    if (r) r.checked = true;
  };
  document.addEventListener('click', function (e) {
    var link = e.target.closest('[data-order]');
    if (link) setTopic(link.dataset.order);
  });

  /* ---------- Выбранное: торты и начинки, уведомление, плашки ---------- */
  var sel = { cakes: [], fillings: [] };
  var onSel = [];
  var selChanged = function () {
    // Один необязательный виджет не должен мешать обновлению самого набора.
    onSel.forEach(function (f) {
      try { f(); } catch (err) { console.error('Не удалось обновить часть выбранного:', err); }
    });
  };

  var toastEl = $('[data-toast]');
  var toastText = $('[data-toast-text]');
  var toastTimer = null;
  var hideToast = function () {
    toastEl.classList.remove('is-shown');
    setTimeout(function () { if (!toastEl.classList.contains('is-shown')) toastEl.hidden = true; }, 400);
  };
  var toast = function (text, type) {
    toastText.textContent = text;
    toastEl.classList.toggle('toast--error', type === 'error');
    toastEl.hidden = false;
    toastEl.classList.remove('is-shown');
    void toastEl.offsetWidth;
    toastEl.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 4200);
  };
  toastEl.addEventListener('mouseenter', function () { clearTimeout(toastTimer); });
  toastEl.addEventListener('mouseleave', function () { toastTimer = setTimeout(hideToast, 1500); });
  $('[data-toast-link]').addEventListener('click', hideToast);

  var toggleSel = function (kind, name) {
    var arr = sel[kind];
    var i = arr.indexOf(name);
    var added = i === -1;
    if (kind === 'fillings' && added && arr.length >= 10) {
      toast('В дегустационный набор можно добавить не более 10 начинок', 'error');
      return false;
    }
    if (added) arr.push(name); else arr.splice(i, 1);
    if (kind === 'cakes') toast(added ? 'Торт «' + name + '» добавлен в заявку' : 'Торт «' + name + '» убран из заявки');
    else toast(added ? 'Начинка «' + name + '» добавлена в дегустационный набор' : 'Начинка «' + name + '» убрана из набора');
    selChanged();
    return added;
  };

  var pop = function (el) { el.classList.remove('is-pop'); void el.offsetWidth; el.classList.add('is-pop'); };

  // плашка с крестиком
  var renderChips = function (ul, list) {
    ul.innerHTML = '';
    list.forEach(function (it) {
      var li = document.createElement('li');
      li.className = 'chip';
      var t = document.createElement('span');
      t.textContent = it.label;
      var x = document.createElement('button');
      x.type = 'button';
      x.className = 'chip__x';
      x.setAttribute('aria-label', 'Убрать ' + it.name);
      x.addEventListener('click', function () { toggleSel(it.kind, it.name); });
      li.appendChild(t);
      li.appendChild(x);
      ul.appendChild(li);
    });
  };

  // карточки каталога
  var cakeBtns = $$('[data-want]');
  cakeBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      if (toggleSel('cakes', b.dataset.want)) setTopic('cake');
      pop(b);
    });
  });
  onSel.push(function () {
    cakeBtns.forEach(function (b) {
      if (!b.isConnected) return;
      var on = sel.cakes.indexOf(b.dataset.want) !== -1;
      b.setAttribute('aria-pressed', String(on));
      b.querySelector('.cake__want-label').textContent = on ? 'В заявке' : 'Хочу такой';
      var card = b.closest('.cake');
      if (card) card.classList.toggle('is-picked', on);
    });
  });

  // сводка выбранного в форме
  var formPicked = $('[data-form-picked]');
  var formCakes = $('[data-form-cakes]');
  var formFillings = $('[data-form-fillings]');
  var formCakeChips = $('[data-form-cake-chips]');
  var formFillingChips = $('[data-form-filling-chips]');
  var formSelection = $('[data-form-selection]');
  onSel.push(function () {
    renderChips(formCakeChips, sel.cakes.map(function (n) { return { kind: 'cakes', name: n, label: n }; }));
    renderChips(formFillingChips, sel.fillings.map(function (n) { return { kind: 'fillings', name: n, label: n }; }));
    formCakes.hidden = !sel.cakes.length;
    formFillings.hidden = !sel.fillings.length;
    formPicked.hidden = !(sel.cakes.length || sel.fillings.length);
    formSelection.value = [
      sel.cakes.length ? 'Торты: ' + sel.cakes.join(', ') : '',
      sel.fillings.length ? 'Начинки для дегустации: ' + sel.fillings.join(', ') : ''
    ].filter(Boolean).join('. ');
  });

  /* ---------- Начинки: поворотный стенд ---------- */
  var wheel = $('[data-wheel]');
  if (wheel) {
    var stage = $('[data-wheel-stage]');
    var items = $$('.wheel__item', wheel);
    var N = items.length;
    var nameEl = $('[data-wheel-name]');
    var descEl = $('[data-wheel-desc]');
    var priceEl = $('[data-wheel-price]');
    var idxEl = $('[data-wheel-index]');
    var toggle = $('[data-wheel-toggle]');
    var limitText = $('[data-wheel-limit]');
    var pickedCount = $('[data-picked-count]');
    var pickedEmpty = $('[data-picked-empty]');
    var pickedChips = $('[data-picked-chips]');
    var pickedBox = $('.picked__box');
    var toggleLabel = $('[data-toggle-label]');

    var pos = 0;        // текущее положение (дробное, анимируется)
    var target = 0;     // куда едем
    var vel = 0;
    var shown = -1;
    var raf = null;
    var dragging = false;

    var wrap = function (d) { d = ((d % N) + N) % N; return d > N / 2 ? d - N : d; };
    var current = function () { return ((Math.round(target) % N) + N) % N; };

    var spreadFor = function () { var w = stage.clientWidth; return w < 640 ? w * 0.36 : Math.min(w * 0.2, 250); };
    var layout = function () {
      var spread = spreadFor();
      items.forEach(function (el, i) {
        var d = wrap(i - pos);
        var a = Math.abs(d);
        var x = Math.sin(d * 0.5) * spread * 2.4;
        var y = (1 - Math.cos(d * 0.5)) * spread * 0.7;
        var s = a <= 1 ? 1 - a * 0.44 : Math.max(0.26, 0.56 - (a - 1) * 0.12);
        var o = a <= 1 ? 1 - a * 0.52 : a <= 2 ? 0.48 - (a - 1) * 0.26 : Math.max(0, 0.22 - (a - 2) * 0.44);
        el.style.transform = 'translate(-50%, 0) translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + (d * 7).toFixed(2) + 'deg) scale(' + s.toFixed(3) + ')';
        el.style.opacity = o.toFixed(3);
        el.style.zIndex = String(100 - Math.round(a * 10));
        el.style.filter = a > 0.05 ? 'brightness(' + Math.max(0.38, 1 - a * 0.3).toFixed(2) + ')' : '';
        el.style.visibility = o === 0 ? 'hidden' : 'visible';
        el.setAttribute('aria-hidden', String(a > 0.5));
      });
    };

    var renderPicked = function () {
      var name = items[current()].dataset.name;
      var on = sel.fillings.indexOf(name) !== -1;
      var atLimit = !on && sel.fillings.length >= 10;
      toggle.hidden = atLimit;
      limitText.hidden = !atLimit;
      toggle.setAttribute('aria-pressed', String(on));
      toggleLabel.textContent = on ? 'В наборе' : 'Добавить в дегустацию';
      items.forEach(function (it) { it.classList.toggle('is-picked', sel.fillings.indexOf(it.dataset.name) !== -1); });
      pickedCount.textContent = 'Выбрано ' + sel.fillings.length + ' из 10';
      pickedEmpty.hidden = sel.fillings.length > 0;
      renderChips(pickedChips, sel.fillings.map(function (n) { return { kind: 'fillings', name: n, label: n }; }));
    };
    onSel.push(renderPicked);

    var renderInfo = function () {
      var i = current();
      if (i === shown) return;
      shown = i;
      var it = items[i];
      var info = nameEl.parentElement;
      info.classList.remove('is-swap'); void info.offsetWidth; info.classList.add('is-swap');
      nameEl.textContent = it.dataset.name;
      descEl.textContent = it.dataset.desc;
      priceEl.textContent = it.dataset.price.replace(/&nbsp;/g, ' ');
      idxEl.textContent = (i < 9 ? '0' : '') + (i + 1);
      renderPicked();
    };

    // пружина: плавно доводит pos до target
    var last = 0;
    var tick = function (now) {
      if (dragging) { raf = null; return; }
      var dt = last ? Math.min(3, (now - last) / 16.67) : 1;
      last = now;
      vel = vel * Math.pow(0.72, dt) + (target - pos) * 0.02 * dt; // критическое затухание: плавно, без отскока
      pos += vel * dt;
      if (Math.abs(target - pos) < 0.001 && Math.abs(vel) < 0.001) { pos = target; vel = 0; last = 0; layout(); raf = null; return; }
      layout();
      raf = requestAnimationFrame(tick);
    };
    var run = function () {
      if (reduceMotion) { pos = target; layout(); return; }
      if (!raf) raf = requestAnimationFrame(tick);
    };
    var go = function (to) { target = to; renderInfo(); run(); };

    $('[data-wheel-prev]').addEventListener('click', function () { go(Math.round(target) - 1); });
    $('[data-wheel-next]').addEventListener('click', function () { go(Math.round(target) + 1); });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(Math.round(target) + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(Math.round(target) - 1); }
    });

    // перетаскивание и свайп
    var startX = 0, startPos = 0, lastX = 0, lastT = 0, speed = 0, moved = false;
    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      dragging = true; moved = false;
      startX = lastX = e.clientX; lastT = performance.now(); startPos = pos; speed = 0;
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var unit = spreadFor() * 0.95;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      pos = startPos - dx / unit;
      var now = performance.now();
      speed = (e.clientX - lastX) / Math.max(1, now - lastT);
      lastX = e.clientX; lastT = now;
      target = pos;
      renderInfo();
      layout();
    });
    var release = function (e) {
      if (!dragging) return;
      dragging = false;
      if (!moved) {
        // клик по соседнему срезу: повернуть к нему
        var hit = document.elementFromPoint(e.clientX, e.clientY);
        var li = hit && hit.closest ? hit.closest('.wheel__item') : null;
        if (li) { var i = items.indexOf(li); go(Math.round(target) + wrap(i - current())); return; }
      }
      var unit = spreadFor() * 0.95;
      var fling = -speed * 220 / unit;
      go(Math.round(pos + Math.max(-3, Math.min(3, fling))));
    };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
    window.addEventListener('resize', layout);

    toggle.addEventListener('click', function () {
      var name = items[current()].dataset.name;
      var added = toggleSel('fillings', name);
      // Обновляем набор в этот же клик, а не после следующего движения карусели.
      renderPicked();
      pop(toggle);
      if (added) {
        if (pickedBox) pop(pickedBox);
      }
    });

    layout();
    renderInfo();
  }

  /* ---------- Калькулятор веса ---------- */
  var calc = $('[data-calc]');
  if (calc) {
    var num = $('#calc-guests');
    var out = $('[data-calc-kg]');
    var formula = $('[data-calc-formula]');
    var presets = $$('[data-preset]', calc);
    var value = 50;
    var update = function (v, fromInput) {
      v = Math.max(14, Math.min(500, Math.round(v) || 14));
      value = v;
      if (!fromInput) num.value = v;
      var portion = parseInt(($('input[name="calc-portion"]:checked', calc) || {}).value || 150, 10);
      var kg = Math.round(v * portion / 1000 * 2) / 2; // гости × 150 или 200 г, до 0,5 кг
      var txt = fmtKg(kg);
      if (out.textContent !== txt) { out.textContent = txt; pop(out); }
      formula.textContent = v + ' ' + plural(v, 'гость', 'гостя', 'гостей') + ' × ' + portion + ' г';
      presets.forEach(function (p) { p.setAttribute('aria-pressed', String(+p.dataset.preset === v)); });
    };
    num.addEventListener('input', function () { var v = parseInt(num.value, 10); if (!isNaN(v)) update(v, true); });
    num.addEventListener('blur', function () { num.value = value; });
    $('[data-calc-minus]').addEventListener('click', function () { update(value - 5); });
    $('[data-calc-plus]').addEventListener('click', function () { update(value + 5); });
    presets.forEach(function (p) { p.addEventListener('click', function () { update(+p.dataset.preset); }); });
    $$('input[name="calc-portion"]', calc).forEach(function (r) { r.addEventListener('change', function () { update(value); }); });
    update(50);
  }

  /* ---------- Форма ---------- */
  if (form) {
    var phone = $('#f-phone');
    var date = $('#f-date');
    var status = $('[data-form-status]');
    var done = $('[data-form-done]');
    var submitBtn = form.querySelector('[type="submit"]');
    var applicationText = $('[data-application-text]');
    var applicationHint = $('[data-application-hint]');
    var emailLink = $('[data-application-email]');
    var composedText = '';
    submitBtn.disabled = false;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var minD = new Date(); minD.setDate(minD.getDate() + 5);
    var minStr = minD.getFullYear() + '-' + pad(minD.getMonth() + 1) + '-' + pad(minD.getDate());
    date.min = minStr;

    var digits = function (v) {
      var d = v.replace(/\D/g, '');
      if (d[0] === '8') d = '7' + d.slice(1);
      if (d && d[0] !== '7') d = '7' + d;
      return d.slice(0, 11);
    };
    var formatPhone = function (d) {
      if (!d) return '';
      var r = '+7';
      if (d.length > 1) r += ' (' + d.slice(1, 4);
      if (d.length >= 4) r += ')';
      if (d.length > 4) r += ' ' + d.slice(4, 7);
      if (d.length > 7) r += '-' + d.slice(7, 9);
      if (d.length > 9) r += '-' + d.slice(9, 11);
      return r;
    };
    phone.addEventListener('input', function () { phone.value = formatPhone(digits(phone.value)); });
    phone.addEventListener('blur', function () { if (digits(phone.value).length <= 1) phone.value = ''; });

    var setError = function (input, errEl, bad) {
      var field = input.closest('.field');
      if (field) field.classList.toggle('is-invalid', bad);
      input.setAttribute('aria-invalid', String(bad));
      errEl.hidden = !bad;
      return bad;
    };
    var validate = function () {
      var bad = [];
      var name = $('#f-name'), consent = $('#f-consent');
      if (setError(name, $('#f-name-err'), !name.value.trim())) bad.push(name);
      if (setError(phone, $('#f-phone-err'), digits(phone.value).length !== 11)) bad.push(phone);
      if (setError(date, $('#f-date-err'), !!date.value && date.value < minStr)) bad.push(date);
      if (setError(consent, $('#f-consent-err'), !consent.checked)) bad.push(consent);
      return bad;
    };
    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true') validate();
    });
    var readableDate = function (value) {
      if (!value) return '';
      var parts = value.split('-').map(Number);
      return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
        .format(new Date(parts[0], parts[1] - 1, parts[2]));
    };
    var composeApplication = function () {
      var lines = [
        'Здравствуйте! Заявка с сайта:',
        'Имя: ' + $('#f-name').value.trim(),
        'Телефон: ' + phone.value.trim()
      ];
      if (date.value) lines.push('Дата праздника: ' + readableDate(date.value));
      var guests = $('#f-guests').value.trim();
      if (guests) lines.push('Гостей: ' + guests);
      lines.push('Интересует: ' + $('input[name="topic"]:checked', form).value);
      if (sel.cakes.length) lines.push('Торт: ' + sel.cakes.join(', '));
      if (sel.fillings.length) lines.push('Выбранные начинки: ' + sel.fillings.join(', '));
      var wishes = $('#f-wishes').value.trim();
      if (wishes) lines.push('Пожелания: ' + wishes);
      return lines.join('\n');
    };
    var copyApplication = function () {
      var field = document.createElement('textarea');
      field.value = composedText;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      var copied = false;
      try { copied = document.execCommand('copy'); } catch (error) { copied = false; }
      field.remove();
      if (copied) return Promise.resolve();
      if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(composedText);
      return Promise.reject(new Error('copy failed'));
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = validate();
      if (bad.length) { bad[0].focus(); return; }
      composedText = composeApplication();
      applicationText.textContent = composedText;
      emailLink.href = 'mailto:nugaiyagody@mail.ru?subject=' + encodeURIComponent('Заявка с сайта «Нуга & Ягоды»') + '&body=' + encodeURIComponent(composedText);
      applicationHint.textContent = '';
      status.textContent = '';
      form.hidden = true;
      done.hidden = false;
      done.focus();
    });
    $$('[data-application-channel]', done).forEach(function (button) {
      button.addEventListener('click', function () {
        var channel = button.dataset.applicationChannel;
        var url = channel === 'max'
          ? 'https://max.ru/:share?text=' + encodeURIComponent(composedText)
          : 'https://t.me/Gauf14?text=' + encodeURIComponent(composedText);
        copyApplication().then(function () {
          window.location.assign(url);
        }).catch(function () {
          window.location.assign(url);
        });
      });
    });
    $('[data-application-edit]', done).addEventListener('click', function () {
      done.hidden = true;
      form.hidden = false;
      $('#f-name').focus();
    });
  }

  /* ---------- Видео распаковки сета (когда появится) ---------- */
  var media = $('.tasting__media');
  if (media && media.dataset.video) {
    var poster = media.dataset.poster;
    var box = document.createElement('div');
    box.className = 'set-video';
    box.innerHTML = (poster ? '<img src="' + poster + '" alt="" loading="lazy">' : '') +
      '<button class="set-video__play" type="button" aria-label="Смотреть, как открывается дегустационный набор"><span><svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg></span></button>';
    box.querySelector('button').addEventListener('click', function () {
      var v = document.createElement('video');
      v.src = media.dataset.video; v.controls = true; v.playsInline = true; v.autoplay = true; v.preload = 'metadata';
      if (poster) v.poster = poster;
      box.innerHTML = ''; box.appendChild(v);
      if (v.play) v.play().catch(function () {});
    });
    var lineup = media.querySelector('.lineup');
    if (lineup) lineup.hidden = true;
    media.insertBefore(box, media.firstChild);
  }

  /* ---------- Живые блоки: появление, счёт цифр, параллакс ---------- */
  var alive = $$('.alive');
  if ('IntersectionObserver' in window && !reduceMotion) {
    document.documentElement.classList.add('motion');
    var countUp = function (b) {
      var full = b.textContent;
      var m = full.replace(/\u00a0/g, ' ').match(/^([\d ]+)(.*)$/);
      if (!m) return;
      var to = parseInt(m[1].replace(/ /g, ''), 10);
      var suffix = m[2];
      var t0 = null;
      var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); };
      var step = function (now) {
        if (!t0) t0 = now;
        var p = Math.min(1, (now - t0) / 1400);
        var e = 1 - Math.pow(1 - p, 3);
        b.textContent = fmt(Math.round(to * e)) + suffix.replace(/ /g, '\u00a0');
        if (p < 1) requestAnimationFrame(step); else b.textContent = full;
      };
      requestAnimationFrame(step);
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        if (en.target.matches('.facts li')) countUp(en.target.querySelector('b'));
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    alive.forEach(function (sec) {
      $$('.facts li, .steps li, .lines li, .calc__panel, .weights, .block__head, .partners__call, .form', sec).forEach(function (el, i) {
        el.classList.add('reveal');
        el.style.setProperty('--d', (i % 6) * 70 + 'ms');
        io.observe(el);
      });
    });

    // параллакс фонового торта
    var par = $('[data-parallax]');
    if (par) {
      var ticking = false;
      var move = function () {
        var r = par.parentElement.getBoundingClientRect();
        var p = (window.innerHeight - r.top) / (window.innerHeight + r.height);
        par.style.transform = 'translate3d(0,' + ((p - 0.5) * -120).toFixed(1) + 'px,0)';
        ticking = false;
      };
      window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(move); } }, { passive: true });
      move();
    }
  }

  var y = $('[data-year]');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Каталог: прозрачные фотографии тортов ---------- */
  /* Присланные полноразмерные фотографии для оставшихся моделей. */
  var providedCatalogPhotos = {
    'Торт с лепестками и кольцами': ['petals-rings.webp', 'Белый торт с лепестками, золотыми кольцами и топпером Mr & Mrs'],
    'Трёхъярусный торт с золотыми листьями': ['gold-leaves.webp', 'Белый трёхъярусный торт с золотыми листьями'],
    'Торт с плиссе, рюшами и кольцами': ['rings-pleats.webp', 'Белый торт с плиссе, рюшами и золотыми кольцами'],
    'Двухъярусный торт с плиссе и топпером Mr & Mrs': ['mr-mrs-pleats.webp', 'Белый двухъярусный торт с плиссе и топпером Mr & Mrs'],
    'Мраморный торт с белыми розами': ['marble-roses.webp', 'Белый мраморный торт с розами и лепестками'],
    'Торт с ранункулюсами': ['pastel-flowers.webp', 'Двухъярусный торт с розовым мрамором и цветами']
  };
  var catalogCards = $$('.cakes .cake:not(.cake--generated)');
  catalogCards.forEach(function (card) {
    var image = $('img', card);
    var title = $('.cake__title', card);
    var providedPhoto = title && providedCatalogPhotos[title.textContent.trim()];
    if (!image || !providedPhoto) return;
    image.src = 'assets/img/cakes/provided/' + providedPhoto[0];
    image.alt = providedPhoto[1];
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    image.classList.add('cake__image--transparent');
    card.classList.add('cake--transparent');
    if (providedPhoto[0] === 'gold-leaves.webp' || providedPhoto[0] === 'marble-roses.webp') {
      card.classList.add('cake--larger-photo');
    }
    var buy = $('.cake__buy', card);
    if (buy) {
      var price = $('.cake__price', buy);
      if (price) card.appendChild(price);
      buy.remove();
    }
    if (providedPhoto[0] === 'pastel-flowers.webp' || providedPhoto[0] === 'marble-roses.webp') card.classList.add('cake--focus');
  });

  /* ---------- Плавное появление секций снизу ---------- */
  /* Полный контент остаётся видимым без JS и при настройке «уменьшение движения». */
  if ('IntersectionObserver' in window && !reduceMotion) {
    var sectionReveal = $$('#main > .block > .container');
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-section-visible');
        sectionObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -9% 0px', threshold: 0.08 });
    sectionReveal.forEach(function (section) {
      section.classList.add('section-reveal');
      sectionObserver.observe(section);
    });
  }
})();
