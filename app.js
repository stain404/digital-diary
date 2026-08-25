/* ===========================================================
   Two Years — the scrapbook: pages, turning, and the DIYs.
   All words come from content.js.
   =========================================================== */
(() => {
  const D = window.DIARY;
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TURN_MS = reduced ? 20 : 1050;

  document.title = `${D.cover.kicker} — ${D.me} & ${D.her}`;

  const HEART = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 21s-8-5.1-8-10.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 3.6C20 15.9 12 21 12 21z'/%3E%3C/svg%3E\")";
  document.documentElement.style.setProperty('--heart', HEART);

  const longDate = (iso) => new Date(iso + 'T00:00:00')
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const daysSince = (iso) =>
    Math.max(0, Math.floor((Date.now() - new Date(iso + 'T00:00:00')) / 86400000));
  const paras = (text) => String(text || '').split(/\n\s*\n/)
    .map((p) => `<p>${esc(p.trim())}</p>`).join('');
  const chunk = (arr, n) => arr.reduce((out, x, i) =>
    (i % n ? out[out.length - 1].push(x) : out.push([x]), out), []);

  /* Split long writing into pages by actually laying it out in a hidden
     page of the real size, rather than guessing from character counts.
     Returns [{ head, paras }] — one entry per page. */
  const MEASURE_LEAF = '<div class="leaf measure" aria-hidden="true"><div class="face">' +
    '<div class="page page--recto"><div class="page__body"></div></div></div></div>';

  const SPLIT_RE = /\n\s*\n/;      // a blank line starts a new paragraph
  function paginate(text, headHTML, contHTML) {
    const parts = String(text || '').split(SPLIT_RE).map((x) => x.trim()).filter(Boolean);
    if (!parts.length) return [{ head: headHTML, paras: [] }];

    const bodyEl = host && host.querySelector('.measure .page__body');
    if (!bodyEl) return [{ head: headHTML, paras: parts }];   // nothing to measure into

    const sheets = [];
    let head = headHTML, cur = [];
    const reset = (h) => {
      bodyEl.innerHTML = h + '<div class="note"></div>';
      const note = bodyEl.querySelector('.note');
      note.style.flex = '0 0 auto';        // must not stretch, or it always "fits"
      return note;
    };
    let note = reset(head);

    parts.forEach((para) => {
      const el = document.createElement('p');
      el.textContent = para;
      note.appendChild(el);
      if (cur.length && bodyEl.scrollHeight > bodyEl.clientHeight + 1) {
        note.removeChild(el);              // it didn't fit: start the next page with it
        sheets.push({ head, paras: cur });
        head = contHTML; cur = [];
        note = reset(head);
        const again = document.createElement('p');
        again.textContent = para;
        note.appendChild(again);
      }
      cur.push(para);
    });
    sheets.push({ head, paras: cur });
    return sheets;
  }

  function polaroid(src, caption) {
    const cap = caption ? `<figcaption>${esc(caption)}</figcaption>` : '';
    if (!src) return `<figure class="polaroid"><div class="ph">Photo here<br>public/images/</div>${cap}</figure>`;
    return `<figure class="polaroid" data-full="${esc(src)}" data-cap="${esc(caption || '')}">
      <img src="${esc(src)}" data-slot alt="${esc(caption || `${D.me} and ${D.her}`)}" loading="lazy">${cap}</figure>`;
  }

  /* a plain image, for the frames that aren't polaroids */
  const bareImg = (src, alt) => src
    ? `<img src="${esc(src)}" data-slot alt="${esc(alt || `${D.me} and ${D.her}`)}" loading="lazy">`
    : `<div class="ph">Photo here<br>public/images/</div>`;

  // A missing file becomes a labelled empty frame, never a broken-image icon.
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (img.tagName !== 'IMG' || !img.hasAttribute('data-slot')) return;
    const fig = img.closest('.polaroid');
    const slot = document.createElement('div');
    slot.className = 'ph';
    slot.innerHTML = `Waiting for<br>${esc(img.getAttribute('src'))}`;
    img.replaceWith(slot);
    if (fig) fig.removeAttribute('data-full');
  }, true);

  /* -------------------------------------------------------
     Pages, in reading order.
     Even index = right-hand page, odd = left-hand page.
     ------------------------------------------------------- */
  let pages = [];

  /* Rebuilt on every mount: pagination depends on the real page size,
     so it has to run against a live page, not a guess. */
  function buildPages() {
    const pages = [];
    const add = (label, html, opts = {}) => pages.push({ label, html, ...opts });
    const blank = () => add('', '', { plain: true });
    // Each story is a unit: photo on the left, text running right-left-right.
    // That only works if the photo starts a spread, so keep it on a left page.
    const startLeft = () => { if (pages.length % 2 === 0) blank(); };
    // A page that has to exist for the binding to work out. A small pressed
    // heart makes it read as a deliberate endpaper rather than a gap.
    const endpaper = () => add('', '<div class="endpaper" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8-5.1-8-10.4' +
      'A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 3.6C20 15.9 12 21 12 21z"/></svg></div>',
      { plain: true });

    // Little marker hearts, scattered but kept clear of `avoid` (the lettering).
    const scatter = (n, seed, avoid) => {
      let s = seed;
      const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
      const out = [];
      for (let guard = 0; out.length < n && guard < n * 40; guard++) {
        const x = 6 + rnd() * 88, y = 5 + rnd() * 90;
        const rot = (rnd() * 60 - 30).toFixed(0), sc = (.6 + rnd() * .9).toFixed(2);
        if (avoid && x > avoid[0] && x < avoid[2] && y > avoid[1] && y < avoid[3]) continue;
        out.push(`<i style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;transform:rotate(${rot}deg) scale(${sc})"></i>`);
      }
      return out.join('');
    };

    /* front cover */
    add('Cover', `
      <div class="hearts" aria-hidden="true">${scatter(12, 7, [10, 28, 90, 66])}</div>
      <div class="cover-inner">
        <p class="cover-kicker">${esc(D.cover.kicker)}</p>
        <p class="cover-lettering">${esc(D.cover.lettering)}</p>
        <p class="cover-names">${esc(D.cover.names)}</p>
      </div>
      <p class="cover-hint">${esc(D.cover.invitation)}</p>`, { board: true });

    /* inside the cover */
    add('Bookplate', `
      <div class="bookplate">
        <span>${esc(D.bookplate.line)}</span>
        <b>${esc(D.bookplate.name)}</b>
        <i>${esc(D.bookplate.note)}</i>
      </div>`);

    /* the two dates */
    add('Two dates', `
      <p class="eyebrow">${esc(D.dates.title)}</p>
      <div class="dates">
        <div class="date-row">
          <span>${esc(D.dates.metLabel)}</span>
          <b>${longDate(D.metOn)}</b>
          <i>${daysSince(D.metOn).toLocaleString()} days ago</i>
        </div>
        <div class="date-join">then</div>
        <div class="date-row">
          <span>${esc(D.dates.togetherLabel)}</span>
          <b>${longDate(D.togetherOn)}</b>
          <i>${daysSince(D.togetherOn).toLocaleString()} days ago</i>
        </div>
      </div>
      <p class="eyebrow" style="margin:0">${esc(D.dates.footnote)}</p>`);

    /* the story — a photo, then as many pages as the writing needs */
    D.chapters.forEach((c, i) => {
      startLeft();
      const tape = ['taped--red', 'taped--sage', '', 'taped--red'][i % 4];
      add(c.title, `<div class="photo-page"><div class="taped ${tape}">${polaroid(c.photo, c.caption)}</div></div>`);

      const head = `<p class="eyebrow">${esc(c.date)}</p><h2 class="h">${esc(c.title)}</h2>`;
      const cont = `<p class="eyebrow">${esc(c.title)} &middot; continued</p>`;
      const sheets = paginate(c.body, head, cont);
      sheets.forEach((sheet, k) => {
        const last = k === sheets.length - 1;
        add(c.title, `${sheet.head}
          <div class="note">${sheet.paras.map((x) => `<p>${esc(x)}</p>`).join('')}</div>
          ${last && c.note ? `<p class="hand">${esc(c.note)}</p>` : ''}`, { fit: true });
      });
    });

    /* the long one — flows across as many pages as it needs */
    (() => {
      const body = String((D.essay && D.essay.body) || '').trim();
      if (!body) return;
      const head = D.essay.heading ? `<h2 class="h">${esc(D.essay.heading)}</h2>` : '';
      const cont = D.essay.heading ? `<p class="eyebrow">${esc(D.essay.heading)} &middot; continued</p>` : '';
      paginate(body, head, cont).forEach((sheet, i) => {
        add(D.essay.heading || 'The long one',
          `${sheet.head}<div class="note">${sheet.paras.map((x) => `<p>${esc(x)}</p>`).join('')}</div>`,
          { fit: true });
      });
    })();

    /* the writing pages */
    (D.notes || []).forEach((n, i) => {
      const head = n.heading ? `<h2 class="h">${esc(n.heading)}</h2>` : '';
      const cont = n.heading ? `<p class="eyebrow">${esc(n.heading)} &middot; continued</p>` : '';
      paginate(n.body, head, cont).forEach((sheet) => {
        add(n.heading || 'Notes',
          `${sheet.head}<div class="note">${sheet.paras.map((x) => `<p>${esc(x)}</p>`).join('')}</div>`,
          { fit: true });
      });
    });

    /* the letter */
    // If the envelope lands on a right-hand page its letter falls on the next
    // spread, so the envelope has to say where the letter went.
    const letterFaces = pages.length % 2 === 1;
    add('The letter', `
      <p class="eyebrow">Sealed</p>
      <div class="env-page">
        <div class="envelope" id="envelope" data-faces="${letterFaces}">
          <div class="env__body" id="envBody" role="button" tabindex="0" aria-label="Open the letter">
            <div class="env__pocket"></div>
            <div class="env__flap"></div>
            <div class="env__seal" aria-hidden="true">${esc(D.me[0])}</div>
          </div>
          <p class="env__hint hand" id="envHint">${esc(D.letter.envelopeNote)}</p>
        </div>
      </div>`);
    add('The letter', `
      <div class="letter__wait" id="letterWait">Break the seal</div>
      <div class="letter" id="letter" hidden>
        <p>${esc(D.letter.salutation)}</p>
        ${D.letter.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
        <p class="sig">${esc(D.letter.signoff)}<br>${esc(D.letter.signature)}</p>
      </div>`, { fit: true });

    /* photo pages, four to a page */
    chunk(D.gallery, 4).forEach((four, i) => {
      add('Photos', `<div class="grid4">${four.map((g) => polaroid(g.src, g.caption)).join('')}</div>`);
    });

    /* DIY: the pull-out card, then the scratch card */
    add('Pull-out card', `
      <p class="eyebrow">${esc(D.pullCard.hint)}</p>
      <div class="pull-page">
        <div class="pullcard" id="pullcard">
          <div class="pullcard__card"><p>${esc(D.pullCard.message)}</p></div>
          <!-- hearts live inside the pocket so its clip keeps them off the card -->
          <div class="pullcard__pocket"><div class="hearts" aria-hidden="true">${scatter(9, 31)}</div></div>
          <span class="pullcard__tab">${esc(D.pullCard.front)}</span>
          <div class="pullcard__grab" id="pullGrab" role="button" tabindex="0"
               aria-label="Pull the card out of the pocket"></div>
        </div>
      </div>`);
    add('Scratch card', `
      <p class="eyebrow">${esc(D.scratch.hint)}</p>
      <div class="scratch-page">
        <div class="scratch" id="scratch">
          <p class="scratch__msg">${esc(D.scratch.message)}</p>
          <canvas id="scratchCanvas" aria-label="Scratch to reveal a message"></canvas>
        </div>
      </div>
      <p style="text-align:center;margin:0"><button class="btn" id="scratchReveal">Just show me</button></p>`);

    /* DIY: lift the flap, then the wheel */
    add('Lift the flap', `
      <p class="eyebrow">${esc(D.flap.hint)}</p>
      <div class="flap-page">
        <div class="flapbox" id="flapbox">
          <div class="flapbox__under">
            ${bareImg(D.flap.photo, D.flap.message)}
            <p class="flapbox__msg">${esc(D.flap.message)}</p>
          </div>
          <div class="flapbox__flap" id="flapLift" role="button" tabindex="0" aria-label="Lift the flap">
            <span>${esc(D.flap.front)}</span>
          </div>
        </div>
      </div>`);
    add('The wheel', `
      <p class="eyebrow">${esc(D.wheelTitle)}</p>
      <div class="wheel-page">
        <div class="wheel" id="wheel">
          <div class="wheel__mark" aria-hidden="true"></div>
          <div class="wheel__disc" id="wheelDisc" role="slider" tabindex="0"
               aria-label="Spin to a month" aria-valuemin="1" aria-valuemax="${D.wheel.length}" aria-valuenow="1">
            ${D.wheel.map((w, i) =>
              `<i style="transform:rotate(${(i * 360 / D.wheel.length).toFixed(2)}deg)">${esc(w.label)}</i>`).join('')}
          </div>
          <div class="wheel__hub" aria-hidden="true"></div>
        </div>
        <p class="wheel__out" id="wheelOut">${esc(D.wheelHint)}</p>
      </div>`);

    /* DIY: the film strip, then the fold-out */
    add('The negatives', `
      <p class="eyebrow">${esc(D.filmTitle)} &middot; ${esc(D.filmHint)}</p>
      <div class="film-page">
        <div class="film" id="film">
          <div class="film__reel" id="filmReel">
            ${(D.film || []).map((f) => `<div class="film__frame">${bareImg(f.src, f.caption)}</div>`).join('')}
          </div>
        </div>
      </div>`);
    add('Fold-out', `
      <p class="eyebrow">${esc(D.foldout.title)} &middot; ${esc(D.foldout.hint)}</p>
      <div class="foldout-page">
        <div class="foldout" id="foldout">
          ${D.foldout.panels.map((p) => `<div class="foldout__panel">${esc(p)}</div>`).join('')}
        </div>
        <button class="btn" id="foldBtn">${esc(D.foldout.button)}</button>
      </div>`);

    /* DIY: the jar, then the cut-out phrases */
    add('The jar', `
      <p class="eyebrow">${esc(D.reasonsTitle)}</p>
      <div class="jar-page">
        <svg class="jar" viewBox="0 0 120 170" aria-hidden="true">
          <defs><linearGradient id="jarGlass" x1="0" x2="1">
            <stop offset="0" stop-color="#cfe0dc" stop-opacity=".55"/>
            <stop offset=".45" stop-color="#eef6f4" stop-opacity=".28"/>
            <stop offset="1" stop-color="#b9cfca" stop-opacity=".55"/>
          </linearGradient></defs>
          <rect x="34" y="6" width="52" height="14" rx="4" fill="#BE3A30"/>
          <rect x="30" y="18" width="60" height="9" rx="3" fill="#8E2A22"/>
          <path d="M22 40c0-9 8-13 8-13h60s8 4 8 13v104c0 12-8 18-18 18H40c-10 0-18-6-18-18z"
                fill="url(#jarGlass)" stroke="#e9f2ef" stroke-opacity=".45" stroke-width="2"/>
          <g fill="#FBF4E4" stroke="#DCCFB4">
            <rect x="36" y="118" width="26" height="12" rx="3" transform="rotate(-12 49 124)"/>
            <rect x="58" y="122" width="28" height="12" rx="3" transform="rotate(9 72 128)"/>
            <rect x="42" y="134" width="30" height="12" rx="3" transform="rotate(4 57 140)"/>
            <rect x="60" y="140" width="24" height="12" rx="3" transform="rotate(-7 72 146)"/>
            <rect x="34" y="148" width="28" height="12" rx="3" transform="rotate(6 48 154)"/>
          </g>
          <path d="M32 52v92" stroke="#fff" stroke-opacity=".3" stroke-width="5" stroke-linecap="round"/>
        </svg>
        <div>
          <div class="slip" id="slip">${esc(D.reasonsHint)}</div>
          <button class="btn" id="pullBtn">Pull one out</button>
        </div>
      </div>`);
    add('Cut-outs', `
      <p class="eyebrow">${esc(D.stickersTitle)}</p>
      <div class="stickers">${(D.stickers || []).map((s) => `<span>${esc(s)}</span>`).join('')}</div>`);

    /* the promises, the record, then the last page */
    add('Promises', `
      <p class="eyebrow">${esc(D.promisesTitle)}</p>
      <div class="promises" id="promises">
        ${D.promises.map((p, i) => `
          <button class="promise" type="button" aria-pressed="false" data-i="${i}">
            <span class="promise__box" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M4 13l5 5L20 6"/></svg>
            </span>
            <span class="promise__text">${esc(p)}</span>
          </button>`).join('')}
      </div>
      <p class="eyebrow" style="margin:0">${esc(D.promisesHint)}</p>`);
    add('The record', `
      <p class="eyebrow">${esc(D.recordTitle)}</p>
      <div class="record"><dl>${D.firsts.map((f) =>
        `<dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd>`).join('')}</dl></div>`);
    /* The ending wants to be a right-hand page, and the back board has to be
       the very last face in the book. If parity is off, the one blank goes
       before the ending as an endpaper — never trailing after it. */
    if (pages.length % 2 === 1) endpaper();
    add('The end', `
      <div class="outro">
        <h2 class="h">${esc(D.outro.title)}</h2>
        ${paras(D.outro.body)}
        <p class="hand">${esc(D.outro.signoff)}</p>
        <svg class="heart" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 21s-8-5.1-8-10.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 3.6C20 15.9 12 21 12 21z"/>
        </svg>
      </div>`, { fit: true });

    /* The back board has to be a left-hand page, so it sits as the back of
       the final leaf. One blank endpaper before it is normal in a real book;
       blanks anywhere else in the run are not, so nothing else pads. */
    if (pages.length % 2 === 0) blank();
    add('', `<div class="hearts" aria-hidden="true">${scatter(6, 91)}</div>`, { board: true, plain: true });

    return pages;
  }

  /* -------------------------------------------------------
     Mounting
     ------------------------------------------------------- */
  const book = $('#book');
  const host = $('#leaves');
  const narrow = matchMedia('(max-width: 820px)');
  let mode = narrow.matches ? 'single' : 'spread';
  let leaves = [];
  let turned = 0;
  let busy = false;

  const faceHTML = (page, i, back) => {
    const cls = `face${back ? ' face--back' : ''}`;
    if (!page) return `<div class="${cls}"></div>`;
    if (page.board) return `<div class="${cls} face--endboard">${page.html}</div>`;
    const side = i % 2 === 0 ? 'recto' : 'verso';
    const folio = page.plain ? '' : `<span class="page__folio">${i}</span>`;
    return `<div class="${cls}">
      <div class="page page--${side}">
        <div class="page__body"${page.fit ? ' data-fit' : ''}>${page.html}</div>${folio}
      </div></div>`;
  };

  function mount() {
    host.innerHTML = MEASURE_LEAF;   // a real, hidden page to lay text into
    pages = buildPages();
    const per = mode === 'spread' ? 2 : 1;
    const count = Math.ceil(pages.length / per);
    let html = '';
    for (let i = 0; i < count; i++) {
      const front = pages[i * per];
      const back = per === 2 ? pages[i * per + 1] : null;
      const f = (front && front.board && i === 0)
        ? `<div class="face face--cover">${front.html}</div>`
        : faceHTML(front, i * per, false);
      const b = per === 2 ? faceHTML(back, i * per + 1, true) : '<div class="face face--back"></div>';
      html += `<div class="leaf">${f}${b}</div>`;
    }
    host.innerHTML = html;
    leaves = $$('.leaf', host);
    wire();
    apply();
    fitText();
  }

  function apply() {
    leaves.forEach((el, i) => {
      const flipped = i < turned;
      el.classList.toggle('flipped', flipped);
      el.style.zIndex = flipped ? i + 1 : 1000 - i;
      // Only the two leaves you can see may take a click; the buried
      // ones must not swallow taps meant for the open spread.
      el.style.pointerEvents = (i === turned || i === turned - 1) ? 'auto' : 'none';
    });
    book.classList.toggle('closed', turned === 0);
    book.classList.toggle('opened', turned > 0);
    book.classList.toggle('ended', turned === leaves.length);
    $('#prev').disabled = turned === 0;
    $('#next').disabled = turned === leaves.length;
    // Name both open pages: the left one is the back of the leaf you just turned.
    const per = mode === 'spread' ? 2 : 1;
    const right = pages[turned * per];
    const left = per === 2 ? pages[turned * per - 1] : null;
    const names = [left && left.label, right && right.label]
      .filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
    $('#folio').textContent = turned === 0 ? 'Cover'
      : turned === leaves.length ? 'The end'
      : names.join(' · ') || `Page ${turned * per}`;
  }

  function go(dir) {
    if (busy) return;
    const target = turned + dir;
    if (target < 0 || target > leaves.length) return;
    const el = leaves[dir > 0 ? turned : turned - 1];
    busy = true;
    turned = target;
    apply();
    el.style.zIndex = 1500;          // ride above both stacks while crossing
    el.style.pointerEvents = 'none';
    setTimeout(() => { busy = false; apply(); }, TURN_MS);
  }

  /* -------------------------------------------------------
     Turning. Anything you can actually use is off limits —
     a drag across the scratch card must not turn the page.
     ------------------------------------------------------- */
  const LIVE = 'button, a, canvas, input, .env__body, .polaroid[data-full], .pullcard, .film, .wheel, .flapbox, .promise, .no-turn';
  const isLive = (t) => !!(t && t.closest && t.closest(LIVE));

  const dirFromX = (clientX) => {
    if (turned === 0) return 1;                 // closed: any click opens it
    if (turned === leaves.length) return -1;    // finished: any click goes back
    const r = book.getBoundingClientRect();
    return clientX < r.left + r.width / 2 ? -1 : 1;
  };

  book.addEventListener('click', (e) => {
    if (isLive(e.target)) return;
    go(dirFromX(e.clientX));
  });

  book.addEventListener('mousemove', (e) => {
    if (isLive(e.target)) {
      book.classList.remove('hint-next', 'hint-prev');
      book.style.cursor = '';
      return;
    }
    const d = dirFromX(e.clientX);
    const can = d > 0 ? turned < leaves.length : turned > 0;
    book.classList.toggle('hint-next', can && d > 0);
    book.classList.toggle('hint-prev', can && d < 0);
    book.style.cursor = can ? 'pointer' : 'default';
  });
  book.addEventListener('mouseleave', () => book.classList.remove('hint-next', 'hint-prev'));

  $('#next').addEventListener('click', () => go(1));
  $('#prev').addEventListener('click', () => go(-1));

  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest(LIVE)) return;
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'Escape') closeLightbox();
  });

  /* swipe — ignored when the gesture starts on something usable */
  let swipe = null;
  book.addEventListener('pointerdown', (e) => {
    swipe = isLive(e.target) ? null : { x: e.clientX, y: e.clientY };
  });
  book.addEventListener('pointerup', (e) => {
    if (!swipe) return;
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  });

  /* -------------------------------------------------------
     The DIYs. State lives out here so it survives a re-mount.
     ------------------------------------------------------- */
  let sealBroken = false, scratched = false, cardOut = false, jarPool = [];
  let flapOpen = false, foldOpen = false, wheelRot = 0, wheelTouched = false, filmX = 0;
  const ticked = new Set(load('diary.promises'));

  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
  }

  function wire() {
    initEnvelope();
    initPullCard();
    initScratch();
    initJar();
    initFlap();
    initWheel();
    initFilm();
    initFoldout();
    initPromises();
  }

  /* the flap you lift off a photo */
  function initFlap() {
    const box = $('#flapbox'), flap = $('#flapLift');
    if (!box) return;
    if (flapOpen) box.classList.add('open');
    const toggle = () => { flapOpen = !flapOpen; box.classList.toggle('open', flapOpen); };
    flap.addEventListener('click', toggle);
    flap.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  }

  /* the dial you spin to a month */
  function initWheel() {
    const disc = $('#wheelDisc'), out = $('#wheelOut');
    if (!disc) return;
    const n = D.wheel.length, step = 360 / n;
    const centre = () => {
      const r = disc.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    const angleAt = (e, c) => Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180 / Math.PI;
    const selected = () => ((Math.round(-wheelRot / step) % n) + n) % n;

    const render = (settled) => {
      disc.style.transition = settled ? '' : 'none';
      disc.style.transform = `rotate(${wheelRot}deg)`;
      const i = selected();
      $$('#wheelDisc i').forEach((el, k) => el.classList.toggle('on', k === i));
      disc.setAttribute('aria-valuenow', i + 1);
      disc.setAttribute('aria-valuetext', D.wheel[i].label);
      if (settled) out.textContent = wheelTouched ? D.wheel[i].text : D.wheelHint;
    };

    let drag = null;
    disc.addEventListener('pointerdown', (e) => {
      const c = centre();
      drag = { grip: angleAt(e, c) - wheelRot, c };
      disc.setPointerCapture(e.pointerId);
    });
    disc.addEventListener('pointermove', (e) => {
      if (!drag) return;
      wheelRot = angleAt(e, drag.c) - drag.grip;
      wheelTouched = true;
      render(false);
    });
    const settle = () => {
      if (!drag) return;
      drag = null;
      wheelRot = Math.round(wheelRot / step) * step;   // snap to the nearest month
      render(true);
    };
    disc.addEventListener('pointerup', settle);
    disc.addEventListener('pointercancel', settle);
    disc.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      wheelTouched = true;
      wheelRot += e.key === 'ArrowRight' ? -step : step;
      render(true);
    });
    render(true);
  }

  /* the strip of negatives you drag along */
  function initFilm() {
    const film = $('#film'), reel = $('#filmReel');
    if (!film) return;
    const limit = () => Math.max(0, reel.scrollWidth - film.clientWidth);
    const clamp = (v) => Math.max(-limit(), Math.min(0, v));
    const put = () => { reel.style.transform = `translateX(${filmX}px)`; };
    filmX = clamp(filmX); put();

    let drag = null;
    film.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, from: filmX };
      film.setPointerCapture(e.pointerId);
      reel.style.transition = 'none';
    });
    film.addEventListener('pointermove', (e) => {
      if (!drag) return;
      filmX = clamp(drag.from + (e.clientX - drag.x));
      put();
    });
    const stop = () => { drag = null; reel.style.transition = ''; };
    film.addEventListener('pointerup', stop);
    film.addEventListener('pointercancel', stop);
  }

  /* the concertina that opens one panel at a time */
  function initFoldout() {
    const fold = $('#foldout'), btn = $('#foldBtn');
    if (!fold) return;
    const paint = () => {
      fold.classList.toggle('open', foldOpen);
      btn.textContent = foldOpen ? 'Fold it back' : D.foldout.button;
    };
    paint();
    btn.addEventListener('click', () => { foldOpen = !foldOpen; paint(); });
  }

  /* promises you tick off — remembered on this device */
  function initPromises() {
    const list = $('#promises');
    if (!list) return;
    $$('.promise', list).forEach((b) => {
      const i = b.dataset.i;
      b.setAttribute('aria-pressed', ticked.has(i) ? 'true' : 'false');
      b.addEventListener('click', () => {
        const on = b.getAttribute('aria-pressed') === 'true';
        b.setAttribute('aria-pressed', on ? 'false' : 'true');
        on ? ticked.delete(i) : ticked.add(i);
        save('diary.promises', [...ticked]);
      });
    });
  }

  function initEnvelope() {
    const env = $('#envelope'), body = $('#envBody');
    if (!body) return;
    const open = () => {
      sealBroken = true;
      env.classList.add('open');
      $('#envHint').textContent = env.dataset.faces === 'true'
        ? 'read it whenever you want'
        : 'turn the page';
      showLetter();
    };
    body.addEventListener('click', open);
    body.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
    if (sealBroken) { env.classList.add('open'); showLetter(true); }
  }

  function showLetter(instant) {
    const letter = $('#letter'), wait = $('#letterWait');
    if (!letter) return;
    wait.classList.add('gone');
    letter.hidden = false;
    if (instant || reduced) letter.classList.add('show');
    else requestAnimationFrame(() => letter.classList.add('show'));
    fitText();
  }

  /* the card you slide up out of its pocket */
  function initPullCard() {
    const card = $('#pullcard'), grab = $('#pullGrab');
    if (!card) return;
    const inner = $('.pullcard__card', card);
    if (cardOut) card.classList.add('out');

    const set = (open) => { cardOut = open; card.classList.toggle('out', open); inner.style.transform = ''; };
    let drag = null;

    grab.addEventListener('pointerdown', (e) => {
      drag = { y: e.clientY, h: card.getBoundingClientRect().height, was: cardOut };
      grab.setPointerCapture(e.pointerId);
      inner.style.transition = 'none';
    });
    grab.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const base = drag.was ? -45 : 0;
      const pct = Math.max(-45, Math.min(0, base + ((e.clientY - drag.y) / drag.h) * 100));
      inner.style.transform = `translateY(${pct}%)`;
    });
    const release = (e) => {
      if (!drag) return;
      const moved = ((e.clientY - drag.y) / drag.h) * 100;
      inner.style.transition = '';
      set(drag.was ? moved < 23 : moved < -12);
      drag = null;
    };
    grab.addEventListener('pointerup', release);
    grab.addEventListener('pointercancel', release);
    grab.addEventListener('click', (e) => { e.stopPropagation(); });
    grab.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(!cardOut); }
    });
  }

  function initScratch() {
    const box = $('#scratch'), cv = $('#scratchCanvas');
    if (!box) return;
    const ctx = cv.getContext('2d');
    let painting = false;

    const foil = () => {
      const r = box.getBoundingClientRect();
      if (!r.width) return;
      cv.width = r.width; cv.height = r.height;
      const g = ctx.createLinearGradient(0, 0, r.width, r.height);
      g.addColorStop(0, '#C29A45'); g.addColorStop(.42, '#E8CD89');
      g.addColorStop(.68, '#A98434'); g.addColorStop(1, '#D6B25E');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = g; ctx.fillRect(0, 0, r.width, r.height);
      ctx.fillStyle = 'rgba(255,255,255,.14)';
      for (let x = -r.height; x < r.width; x += 10) ctx.fillRect(x, 0, 3, r.height);
      ctx.fillStyle = 'rgba(36,28,22,.55)';
      ctx.font = `600 ${Math.round(r.height * .075)}px "Courier Prime", monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(D.scratch.label.toUpperCase(), r.width / 2, r.height / 2);
    };

    if (scratched) { box.classList.add('done'); return; }
    foil();
    new ResizeObserver(() => { if (!scratched) foil(); }).observe(box);

    const rub = (e) => {
      if (!painting) return;
      const r = cv.getBoundingClientRect();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(e.clientX - r.left, e.clientY - r.top, r.width * .06, 0, 7);
      ctx.fill();
    };
    const lift = () => {
      if (!painting) return;
      painting = false;
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
      let clear = 0, total = 0;
      for (let i = 3; i < d.length; i += 64) { total++; if (d[i] < 40) clear++; }
      if (clear / total > .34) reveal();
    };
    const reveal = () => { scratched = true; box.classList.add('done'); };

    cv.addEventListener('pointerdown', (e) => { painting = true; cv.setPointerCapture(e.pointerId); rub(e); });
    cv.addEventListener('pointermove', rub);
    cv.addEventListener('pointerup', lift);
    cv.addEventListener('pointercancel', lift);
    $('#scratchReveal').addEventListener('click', reveal);
  }

  function initJar() {
    const slip = $('#slip'), pull = $('#pullBtn');
    if (!pull) return;
    pull.addEventListener('click', () => {
      if (!jarPool.length) jarPool = [...D.reasons].sort(() => Math.random() - .5);
      slip.textContent = jarPool.pop();
      slip.classList.remove('pop');
      void slip.offsetWidth;
      slip.classList.add('pop');
      pull.textContent = jarPool.length ? 'Pull another' : 'Fill the jar again';
    });
  }

  /* -------------------------------------------------------
     Lightbox
     ------------------------------------------------------- */
  const lb = $('#lightbox');
  const closeLightbox = () => { lb.classList.remove('show'); $('#lbImg').src = ''; };
  document.addEventListener('click', (e) => {
    const fig = e.target.closest('.polaroid[data-full]');
    if (!fig) return;
    $('#lbImg').src = fig.dataset.full;
    $('#lbImg').alt = fig.dataset.cap || `${D.me} and ${D.her}`;
    $('#lbCap').textContent = fig.dataset.cap || '';
    lb.classList.add('show');
    $('#lbClose').focus();
  });
  lb.addEventListener('click', (e) => { if (e.target !== $('#lbImg')) closeLightbox(); });

  /* -------------------------------------------------------
     Pages are a fixed size, so writing that runs long shrinks
     to fit rather than getting cut off at the page edge.
     ------------------------------------------------------- */
  function fitText() {
    requestAnimationFrame(() => {
      $$('.page__body[data-fit]', host).forEach((b) => {
        let s = 1;
        b.style.setProperty('--s', s);
        while (b.scrollHeight > b.clientHeight + 2 && s > 0.55) {
          s -= 0.04;
          b.style.setProperty('--s', s.toFixed(2));
        }
        if (b.scrollHeight > b.clientHeight + 2) {
          console.warn('[diary] This page is too long even at the smallest size — trim it in content.js:',
            b.textContent.trim().slice(0, 60) + '…');
        }
      });
    });
  }

  /* -------------------------------------------------------
     Go
     ------------------------------------------------------- */
  narrow.addEventListener('change', (e) => {
    const next = e.matches ? 'single' : 'spread';
    if (next === mode) return;
    const at = turned * (mode === 'spread' ? 2 : 1);
    mode = next;
    const per = mode === 'spread' ? 2 : 1;
    turned = Math.min(Math.round(at / per), Math.ceil(pages.length / per));
    mount();
  });

  let t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fitText, 250); });

  /* Show the book straight away, then paginate again once the real fonts
     have landed — measuring against fallback metrics breaks pages early. */
  mount();

  const fonts = document.fonts;
  if (fonts && fonts.ready) {
    const wanted = ['400 1em "Newsreader"', '600 1em "Caveat"',
                    '400 1em "Courier Prime"', '400 1em "Rock Salt"'];
    Promise.all(wanted.map((f) => fonts.load(f).catch(() => {})))
      .then(() => fonts.ready)
      .then(() => mount());   // turned page and DIY state survive a remount
  }
})();
