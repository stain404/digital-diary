/* ===========================================================
   Two Years. The scrapbook, its pages, the turning, and the DIYs.
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

  document.title = `${D.cover.kicker} · ${D.me} & ${D.her}`;

  const HEART = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 21s-8-5.1-8-10.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 3.6C20 15.9 12 21 12 21z'/%3E%3C/svg%3E\")";
  document.documentElement.style.setProperty('--heart', HEART);

  const longDate = (iso) => new Date(iso + 'T00:00:00')
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const daysSince = (iso) =>
    Math.max(0, Math.floor((Date.now() - new Date(iso + 'T00:00:00')) / 86400000));
  const paras = (text) => String(text || '').split(/\n\s*\n/)
    .map((p) => p.trim()).filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`).join('');
  const chunk = (arr, n) => arr.reduce((out, x, i) =>
    (i % n ? out[out.length - 1].push(x) : out.push([x]), out), []);

  /* Split long writing into pages by actually laying it out in a hidden
     page of the real size, rather than guessing from character counts.
     Returns [{ head, paras }], one entry per page. */
  const MEASURE_LEAF = '<div class="leaf measure" aria-hidden="true"><div class="face">' +
    '<div class="page page--recto"><div class="page__body"></div></div></div></div>';

  const SPLIT_RE = /\n\s*\n/;      // a blank line starts a new paragraph
  function paginate(text, headHTML, contHTML, cls = 'note') {
    const parts = String(text || '').split(SPLIT_RE).map((x) => x.trim()).filter(Boolean);
    if (!parts.length) return [{ head: headHTML, paras: [] }];

    const bodyEl = host && host.querySelector('.measure .page__body');
    if (!bodyEl) return [{ head: headHTML, paras: parts }];   // nothing to measure into

    const sheets = [];
    let head = headHTML, cur = [];
    const reset = (h) => {
      bodyEl.innerHTML = h + '<div class="' + cls + '"></div>';
      const note = bodyEl.lastElementChild;
      note.style.flex = '0 0 auto';        // must not stretch, or it always "fits"
      return note;
    };
    let note = reset(head);

    // The last paragraph's bottom margin collapses out of the measurement,
    // so a line can "fit" and then render over the page number. Keeping a
    // sentinel at the end holds that margin inside the measured height.
    const sentinel = document.createElement('div');
    sentinel.style.height = '1px';

    parts.forEach((para) => {
      const el = document.createElement('p');
      el.textContent = para;
      note.appendChild(el);
      note.appendChild(sentinel);
      if (cur.length && bodyEl.scrollHeight > bodyEl.clientHeight + 1) {
        note.removeChild(el);              // it didn't fit: start the next page with it
        sheets.push({ head, paras: cur });
        head = contHTML; cur = [];
        note = reset(head);
        const again = document.createElement('p');
        again.textContent = para;
        note.appendChild(again);
        note.appendChild(sentinel);
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

  /* The bouquet the flap opens onto: blooms gathered on stems that meet at
     a ribbon, wrapped in kraft paper. Same crayon roughening as the flap. */
  function crayonBouquet() {
    const petals = (fill) => Array.from({ length: 5 }, (_, i) =>
      `<ellipse cx="0" cy="-10" rx="6" ry="10" fill="${fill}" transform="rotate(${i * 72})"/>`).join('');
    const bloom = (x, y, sc, petal, heart) =>
      `<g transform="translate(${x},${y}) scale(${sc})">${petals(petal)}<circle r="4.6" fill="${heart}"/></g>`;
    const stem = (x, y) =>
      `<path d="M${x} ${y} Q ${Math.round((x + 120) / 2)} ${Math.round((y + 150) / 2 + 16)}, 120 156" stroke="#7E8C67" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    const leaf = (x, y, f) =>
      `<path d="M${x} ${y} C ${x + 16 * f} ${y - 8}, ${x + 24 * f} ${y + 2}, ${x + 18 * f} ${y + 10} C ${x + 9 * f} ${y + 13}, ${x + 2 * f} ${y + 6}, ${x} ${y} Z" fill="#7E8C67"/>`;
    return `
      <svg class="crayon crayon--bouquet" viewBox="0 0 240 215" aria-hidden="true">
        <defs>
          <filter id="crayonBq" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="4" result="n"/>
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.3"
                               xChannelSelector="R" yChannelSelector="G"/>
          </filter>
        </defs>
        <g filter="url(#crayonBq)">
          ${stem(62, 64)}${stem(120, 42)}${stem(178, 68)}${stem(90, 100)}${stem(152, 104)}
          ${leaf(104, 118, -1)}${leaf(136, 126, 1)}
          <path d="M94 150 L146 150 L134 206 L106 206 Z" fill="#DCC8A4" stroke="#A98A5E" stroke-width="2.4"/>
          ${bloom(62, 64, 1, '#BE3A30', '#E3A32B')}
          ${bloom(120, 42, 1.12, '#D98A94', '#E3A32B')}
          ${bloom(178, 68, 0.95, '#E3A32B', '#BE3A30')}
          ${bloom(90, 100, 0.86, '#E3A32B', '#BE3A30')}
          ${bloom(152, 104, 0.9, '#BE3A30', '#E3A32B')}
          <path d="M104 154 q16 -9 32 0 q-16 9 -32 0 Z" fill="#BE3A30"/>
          <path d="M118 158 l-12 16 m14 -16 l12 16" stroke="#BE3A30" stroke-width="3.4" fill="none" stroke-linecap="round"/>
        </g>
      </svg>`;
  }

  const IS_VIDEO = /\.(mp4|mov|webm|m4v)$/i;

  /* A swipeable run of photos and clips in one polaroid frame. Videos play
     on a tap rather than carrying native controls, so the whole frame stays
     draggable. */
  function mediaReel(items, caption) {
    const list = (items || []).filter(Boolean);
    if (!list.length) {
      return `<figure class="polaroid"><div class="ph">Photo here<br>images/</div></figure>`;
    }
    const alt = esc(caption || `${D.me} and ${D.her}`);
    const slide = (src, clone) => `<div class="reel__item${clone ? ' reel__item--clone' : ''}"${clone ? ' aria-hidden="true"' : ''}>${
      IS_VIDEO.test(src)
        ? `<video src="${esc(src)}" playsinline preload="metadata"${clone ? ' muted' : ''}></video>
           <span class="reel__play" aria-hidden="true"></span>`
        : `<img src="${esc(src)}" data-slot alt="${alt}" loading="lazy">`}</div>`;
    // A copy of the last slide before the first, and of the first after the
    // last, so wrapping around slides in the direction you swiped instead of
    // rewinding through everything.
    const slides = list.length > 1
      ? slide(list[list.length - 1], true) + list.map((x) => slide(x, false)).join('') + slide(list[0], true)
      : slide(list[0], false);
    const dots = list.length > 1
      ? `<div class="reel__dots">${list.map((_, i) =>
          `<button type="button" class="reel__dot${i ? '' : ' on'}" data-go="${i}"
                   aria-label="Show ${i + 1} of ${list.length}"></button>`).join('')}</div>`
      : '';
    return `<figure class="polaroid reel" data-n="${list.length}">
      <div class="reel__win"><div class="reel__track">${slides}</div></div>
      ${caption ? `<figcaption>${esc(caption)}</figcaption>` : ''}${dots}
    </figure>`;
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

    /* the story, a photo and then as many pages as the writing needs */
    D.chapters.forEach((c, i) => {
      startLeft();
      // Hand-laid, not machine-set: every frame gets its own angle and its
      // tape sits a little differently.
      const tape = ['taped--red', 'taped--sage', '', 'taped--red', 'taped--sage'][i % 5];
      const tilt = [-2.3, 1.7, -1.1, 2.4, -1.8][i % 5];
      const lean = [`--tape-a:${[-5, -2, -6, -3, -4][i % 5]}cqw`,
                    `--tape-b:${[-3, -6, -2, -5, -3][i % 5]}cqw`,
                    `--tape-rot-a:${[-11, -6, -13, -8, -9][i % 5]}deg`,
                    `--tape-rot-b:${[-7, -12, -6, -10, -8][i % 5]}deg`].join(';');
      add(c.title, `<div class="photo-page" style="--tilt:${tilt}deg;${lean}">
        <div class="taped ${tape}">${mediaReel(c.media, c.caption)}</div></div>`);

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

    /* the long one, flowing across as many pages as it needs */
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
    // The letter is measured with the signature included, so the closing
    // never gets pushed onto a page of its own.
    const sigLine = `${D.letter.signoff} ${D.letter.signature}`;
    const letterText = [D.letter.salutation, ...D.letter.paragraphs, sigLine].join('\n\n');
    const letterSheets = paginate(letterText, '', '', 'letter-flow');
    // The envelope shares the first letter page: breaking the seal fades the
    // envelope away and the letter takes its place, so it costs no extra page.
    const envelope = `
      <div class="env-stage" id="envStage">
        <p class="eyebrow">Sealed</p>
        <div class="env-page">
          <div class="envelope" id="envelope">
            <div class="env__body" id="envBody" role="button" tabindex="0" aria-label="Open the letter">
              <div class="env__pocket"></div>
              <div class="env__flap"></div>
              <div class="env__seal" aria-hidden="true">${esc(D.me[0])}</div>
            </div>
            <p class="env__hint hand" id="envHint">${esc(D.letter.envelopeNote)}</p>
          </div>
        </div>
      </div>`;

    letterSheets.forEach((sheet, i) => {
      const first = i === 0, last = i === letterSheets.length - 1;
      const body = last ? sheet.paras.slice(0, -1) : sheet.paras;
      add('The letter', `
        ${first ? envelope : '<div class="letter__wait">Still sealed</div>'}
        <div class="letter" hidden>
          <div class="letter-flow">${body.map((x) => `<p>${esc(x)}</p>`).join('')}</div>
          ${last ? `<p class="sig">${esc(D.letter.signoff)}<br>${esc(D.letter.signature)}</p>` : ''}
        </div>`, { fit: true });
    });

    /* photo pages, four to a page */
    chunk(D.gallery, 4).forEach((four, i) => {
      add('Photos', `<div class="grid4">${four.map((g) => polaroid(g.src, g.caption)).join('')}</div>`);
    });

    /* DIY: the pull-out card, then the scratch card */
    add('Pull-out card', `
      <p class="eyebrow">${esc(D.pullCard.hint)}</p>
      <div class="pull-page">
        <div class="pullcard" id="pullcard">
          <div class="pullcard__card">
            <div class="pullcard__photo">${bareImg(D.pullCard.photo, D.pullCard.message)}</div>
            <p>${esc(D.pullCard.message)}</p>
          </div>
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
          <div class="flapbox__under">${crayonBouquet()}</div>
          <div class="flapbox__flap" id="flapLift" role="button" tabindex="0" aria-label="Lift the flap">
            <span>${esc(D.flap.front)}</span>
          </div>
        </div>
      </div>`);
    /* DIY: the film strip, then the fold-out */
    add('The negatives', `
      <p class="eyebrow">${esc(D.filmTitle)} &middot; ${esc(D.filmHint)}</p>
      <div class="film-page">
        <div class="film" id="film">
          <div class="film__reel" id="filmReel">
            ${[0, 1].map(() => (D.film || []).map((f) =>
              `<div class="film__frame">${bareImg(f.src, f.caption)}</div>`).join('')).join('')}
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
      <div class="record">${D.firsts.map((f) => `
        <div class="record__row">
          <span class="record__k">${esc(f.label)}</span>
          <span class="record__v">${esc(f.value)}</span>
        </div>`).join('')}</div>`);
    /* The ending wants to be a right-hand page, and the back board has to be
       the very last face in the book. If parity is off, the one blank goes
       before the ending as an endpaper, never trailing after it. */
    if (pages.length % 2 === 1) endpaper();
    add('The end', `
      <div class="outro">
        <h2 class="h">${esc(D.outro.title)}</h2>
        ${paras(D.outro.body)}
        ${D.outro.signoff ? `<p class="hand">${esc(D.outro.signoff)}</p>` : ''}
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
    el.classList.add('turning');      // shades the leaf while it swings
    el.style.zIndex = 1500;          // ride above both stacks while crossing
    el.style.pointerEvents = 'none';
    setTimeout(() => { busy = false; el.classList.remove('turning'); apply(); }, TURN_MS);
  }

  /* -------------------------------------------------------
     Turning. Anything you can actually use is off limits, so
     a drag across the scratch card never turns the page.
     ------------------------------------------------------- */
  const LIVE = 'button, a, canvas, input, .env__body, .polaroid[data-full], .pullcard, .film, .flapbox, .reel, .promise, .no-turn';
  const isLive = (t) => !!(t && t.closest && t.closest(LIVE));


  // Only the closed cover opens on a tap. Everywhere else the buttons turn
  // the page, so tapping a photo, a clip or a DIY can never flip it.
  book.addEventListener('click', (e) => {
    if (turned !== 0 || isLive(e.target)) return;
    go(1);
  });

  book.addEventListener('mousemove', (e) => {
    book.style.cursor = (turned === 0 && !isLive(e.target)) ? 'pointer' : '';
  });

  $('#next').addEventListener('click', () => go(1));
  $('#prev').addEventListener('click', () => go(-1));

  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest(LIVE)) return;
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'Escape') closeLightbox();
  });

  /* swipe, ignored when the gesture starts on something usable */
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
  let flapOpen = false, foldOpen = false;
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
    initFoldout();
    initPromises();
    initReels();
    initFilm();
  }

  /* The negatives roll by themselves and can be dragged by hand. The strip is
     two identical passes, so the offset wraps at one pass and never seams. */
  let filmLoop = 0;
  function initFilm() {
    cancelAnimationFrame(filmLoop);
    const film = $('.film', host);
    const reel = film && $('.film__reel', film);
    if (!reel) return;

    const slow = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const SPEED = 26;                       // px a second, left
    let x = 0, last = 0, drag = null, vx = 0;

    const pass = () => reel.scrollWidth / 2 || 1;
    const wrap = () => { const w = pass(); x = ((x % w) + w) % w; };
    const paint = () => { reel.style.transform = 'translateX(' + (-x) + 'px)'; };

    const tick = (now) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      if (drag) {
        /* held still: the strip waits where you left it */
      } else if (Math.abs(vx) > 1) {
        x -= vx * dt;                       // the throw, bleeding off
        vx *= Math.pow(0.002, dt);
      } else if (!slow) {
        x += SPEED * dt;
      }
      wrap();
      paint();
      filmLoop = requestAnimationFrame(tick);
    };

    film.addEventListener('pointerdown', (e) => {
      drag = { px: e.clientX, x: x, t: performance.now(), moved: 0 };
      vx = 0;
      film.classList.add('dragging');
      film.setPointerCapture(e.pointerId);
    });
    film.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.px;
      drag.moved = Math.abs(dx);
      const now = performance.now(), dt = (now - drag.t) / 1000;
      if (dt > 0.01) { vx = (x - (drag.x - dx)) / dt; drag.t = now; }
      x = drag.x - dx;
      wrap();
      paint();
    });
    const drop = () => {
      if (!drag) return;
      if (drag.moved < 6) vx = 0;           // a tap, not a throw
      drag = null;
      film.classList.remove('dragging');
    };
    film.addEventListener('pointerup', drop);
    film.addEventListener('pointercancel', drop);

    filmLoop = requestAnimationFrame(tick);
  }
  /* Swipe or use the dots. A tap on a clip plays or pauses it; the slide is
     read at pointerdown, because setPointerCapture retargets later pointer
     events to the reel and the tapped video would never be found. */
  function initReels() {
    $$('.reel', host).forEach((reel) => {
      const track = $('.reel__track', reel);
      const n = Number(reel.dataset.n) || 1;
      const looped = n > 1;
      let pos = looped ? 1 : 0;          // track position, including the clones
      let drag = null;

      const place = (animate) => {
        track.style.transition = animate ? '' : 'none';
        track.style.transform = `translateX(${-pos * 100}%)`;
        reel.dataset.pos = pos;
      };
      const current = () => (looped ? ((pos - 1) % n + n) % n : 0);
      const paint = () => {
        $$('video', reel).forEach((v) => { v.pause(); });
        $$('.reel__item', reel).forEach((it) => it.classList.remove('playing'));
        $$('.reel__dot', reel).forEach((d, j) => d.classList.toggle('on', j === current()));
      };
      const settle = () => {                 // hop off a clone onto the real slide
        if (!looped) return;
        if (pos === n + 1) { pos = 1; place(false); }
        else if (pos === 0) { pos = n; place(false); }
      };
      track.addEventListener('transitionend', settle);

      const go = (next) => {
        pos = looped ? next : Math.max(0, Math.min(n - 1, next));
        place(true);
        paint();
      };

      reel.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.reel__dot')) return;
        settle();
        drag = {
          x: e.clientX, y: e.clientY,
          w: reel.getBoundingClientRect().width,
          slide: e.target.closest('.reel__item'),   // grabbed before capture retargets
        };
        track.style.transition = 'none';
        reel.setPointerCapture(e.pointerId);
      });
      reel.addEventListener('pointermove', (e) => {
        if (!drag) return;
        track.style.transform = `translateX(calc(${-pos * 100}% + ${e.clientX - drag.x}px))`;
      });
      const release = (e) => {
        if (!drag) return;
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        const w = drag.w, slide = drag.slide;
        drag = null;

        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {          // a tap, not a swipe
          place(true);
          const video = slide && slide.querySelector('video');
          if (video) {
            if (video.paused) {
              $$('video', reel).forEach((v) => { if (v !== video) v.pause(); });
              video.play().then(() => slide.classList.add('playing')).catch(() => {});
            } else {
              video.pause();
              slide.classList.remove('playing');
            }
          }
          return;
        }
        if (Math.abs(dx) > w * 0.15) go(pos + (dx < 0 ? 1 : -1));
        else place(true);
      };
      reel.addEventListener('pointerup', release);
      reel.addEventListener('pointercancel', release);

      $$('.reel__dot', reel).forEach((d) =>
        d.addEventListener('click', () => { settle(); go(Number(d.dataset.go) + (looped ? 1 : 0)); }));
      $$('video', reel).forEach((v) => {
        const item = v.closest('.reel__item');
        v.addEventListener('pause', () => item.classList.remove('playing'));
        v.addEventListener('ended', () => item.classList.remove('playing'));
        v.addEventListener('play', () => item.classList.add('playing'));
      });
      place(false);
    });
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

  /* promises you tick off, remembered on this device */
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
    const stage = $('#envStage');
    const clear = () => {
      if (stage) {
        stage.classList.add('gone');
        setTimeout(() => { stage.hidden = true; fitText(); }, 420);
      }
    };
    const open = () => {
      sealBroken = true;
      env.classList.add('open');
      if (reduced) { clear(); showLetter(true); return; }
      setTimeout(clear, 620);          // let the flap finish swinging first
      setTimeout(() => showLetter(), 900);
    };
    body.addEventListener('click', open);
    body.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
    if (sealBroken) {
      env.classList.add('open');
      if (stage) { stage.classList.add('gone'); stage.hidden = true; }
      showLetter(true);
    }
  }

  function showLetter(instant) {
    const letters = $$('.letter');
    if (!letters.length) return;
    $$('.letter__wait').forEach((w) => w.classList.add('gone'));
    letters.forEach((letter) => {
      letter.hidden = false;
      if (instant || reduced) letter.classList.add('show');
      else requestAnimationFrame(() => letter.classList.add('show'));
    });
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
        // The envelope shares this page but is on its way out; measuring the
        // letter around it would shrink the letter permanently.
        if (b.querySelector('.env-stage:not([hidden])')) {
          b.style.setProperty('--s', 1);
          return;
        }
        let s = 1;
        b.style.setProperty('--s', s);
        while (b.scrollHeight > b.clientHeight + 2 && s > 0.55) {
          s -= 0.04;
          b.style.setProperty('--s', s.toFixed(2));
        }
        if (b.scrollHeight > b.clientHeight + 2) {
          console.warn('[diary] This page is too long even at the smallest size; trim it in content.js:',
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
     have landed; measuring against fallback metrics breaks pages early. */
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
