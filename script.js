// ── Notebook: pages, tabs, page turning ─────────────────────────────────────
//
// Each section (.tab-section) is a stack of fixed-size .page elements inside
// .paper — nothing on the site scrolls. Index / about / colors pages are written
// in index.html; resume, projects and gallery pages are generated (overviews are
// re-split when the window size changes so they always fit on the page).

const paper = document.getElementById('paper');
const siteNav = document.querySelector('.binder-tabs');
const tabBtns = [...document.querySelectorAll('.tab-btn')];
const SECTIONS = tabBtns.map(b => b.dataset.tab); // tab order = page order
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Runs fn once layout has settled. rAF is the good path, but it's paused in
// background tabs — without the timer, a page opened in one would never build.
const afterLayout = (fn) => {
    let ran = false;
    const once = () => { if (!ran) { ran = true; fn(); } };
    requestAnimationFrame(() => requestAnimationFrame(once));
    setTimeout(once, 150);
};

const TURN_MS = 550; // keep in step with the page-turn animations in style.css

// these sections open on an overview; picking an item opens its own page
const sectionView = { projects: 'overview', gallery: 'overview', playground: 'overview' };

const FOOT_HTML = `
    <div class="page-foot">
        <button class="page-foot-btn" data-go="-1"></button>
        <span class="page-foot-num"></span>
        <button class="page-foot-btn" data-go="1"></button>
    </div>`;

// The dividers are one strip across the top; when there are more than fit the
// width, they wrap onto another row rather than being cut off.
function updateTabs() {
    document.documentElement.style.setProperty('--nav-height', siteNav.offsetHeight + 'px');
}
window.addEventListener('resize', updateTabs);

function sectionOf(page) { return page.closest('.tab-section').id; }

function sectionPages(id) {
    const view = sectionView[id];
    return [...document.getElementById(id).querySelectorAll(':scope > .page')]
        .filter(p => !view || p.dataset.mode === view);
}
function allPages() { return SECTIONS.flatMap(sectionPages); }

// Adds an empty page to a section and returns it. `measure` keeps it laid out
// (but invisible) so paginate() can tell when it's full.
function makePage(sectionId, data = {}, measure = true) {
    const page = document.createElement('div');
    page.className = measure ? 'page measuring' : 'page';
    Object.assign(page.dataset, data);
    page.innerHTML = `<div class="page-body"></div>${FOOT_HTML}`;
    document.getElementById(sectionId).appendChild(page);
    return page;
}

function clearPages(sectionId) {
    document.getElementById(sectionId).querySelectorAll(':scope > .page').forEach(p => p.remove());
}
function doneMeasuring(sectionId) {
    document.getElementById(sectionId).querySelectorAll(':scope > .page.measuring').forEach(p => p.classList.remove('measuring'));
}

// Pours blocks into a box on the current page until the page would overflow,
// then starts a new one with newBox().
function paginate(blocks, newBox) {
    let box = newBox(), onPage = [];
    const overflows = () => {
        const body = box.closest('.page-body');
        return box.scrollHeight > box.clientHeight + 1 || body.scrollHeight > body.clientHeight + 1;
    };
    for (const block of blocks) {
        box.appendChild(block);
        onPage.push(block);
        if (onPage.length > 1 && overflows()) {
            box = newBox();
            box.appendChild(block);
            onPage = [block];
        }
    }
}

function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html != null) node.innerHTML = html;
    return node;
}

// every item page gets one of these; the overview itself needs no control
function backButton() {
    return '<button class="tool-btn back-btn" data-back>&larr; back to overview</button>';
}

function refreshPageNumbers() {
    const pages = allPages();
    const label = (from, to, word) => sectionOf(to) === sectionOf(from) ? word : sectionOf(to);
    pages.forEach((page, i) => {
        const [prevBtn, nextBtn] = page.querySelectorAll('.page-foot-btn');
        const prev = pages[i - 1], next = pages[i + 1];
        prevBtn.disabled = !prev;
        nextBtn.disabled = !next;
        prevBtn.innerHTML = prev ? `&larr; ${label(page, prev, 'prev')}` : '';
        nextBtn.innerHTML = next ? `${label(page, next, 'next')} &rarr;` : '';
        page.querySelector('.page-foot-num').textContent = `— ${i === 0 ? 'i' : i} —`;
    });
    // the index lists the page each section starts on
    document.querySelectorAll('[data-pg-for]').forEach(span => {
        span.textContent = pages.indexOf(sectionPages(span.dataset.pgFor)[0]);
    });
}

function setView(id, view) {
    if (sectionView[id] === view) return;
    sectionView[id] = view;
    refreshPageNumbers();
}

// ── Turning to a page ──

let currentPage = null;
let finishTurn = null;

// [section, page] order, to know which way the page should turn
function position(page) {
    const id = sectionOf(page);
    return [SECTIONS.indexOf(id), [...document.getElementById(id).querySelectorAll(':scope > .page')].indexOf(page)];
}

function showPage(page, { animate = true } = {}) {
    if (!page || page === currentPage) return;
    if (finishTurn) finishTurn();

    const from = currentPage;
    const [fromSection, fromIndex] = from && from.isConnected ? position(from) : [-1, -1];
    const [toSection, toIndex] = position(page);
    const forward = toSection > fromSection || (toSection === fromSection && toIndex > fromIndex);

    if (from) from.classList.remove('active');
    page.classList.add('active');
    currentPage = page;

    const id = sectionOf(page);
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === id));
    paper.style.setProperty('--active-tab', tabBtns.find(b => b.dataset.tab === id).style.getPropertyValue('--tab'));
    updateTabs();
    document.dispatchEvent(new CustomEvent('pagechange', { detail: { id, toy: page.dataset.toy } }));

    if (from && from.isConnected && animate && !reduceMotion.matches) {
        // forward: old page swings away on top; backward: new page swings back over the old one
        const turning = forward ? from : page;
        from.classList.add(forward ? 'turn-away' : 'under');
        if (!forward) page.classList.add('turn-back');

        // Cleanup runs on animationend, but never trusts it alone: if the event is
        // missed — an interrupted turn, a hidden tab, a browser that skips it — a
        // timer still restores everything, so nothing can stay stuck mid-flip.
        let cleaned = false;
        const done = () => {
            if (cleaned) return;
            cleaned = true;
            clearTimeout(timer);
            from.classList.remove('turn-away', 'under');
            page.classList.remove('turn-back');
            turning.removeEventListener('animationend', onEnd);
            if (finishTurn === done) finishTurn = null;
        };
        const onEnd = (e) => { if (e.target === turning) done(); };
        const timer = setTimeout(done, TURN_MS + 80);
        turning.addEventListener('animationend', onEnd);
        finishTurn = done;
    }
}

// URLs: #gallery, #gallery/12 (photo 12 on its own page)
function hashFor(page) {
    const id = sectionOf(page);
    if (page.dataset.toy) return `#${id}/${page.dataset.toy}`;
    if (page.dataset.item !== undefined) return `#${id}/${+page.dataset.item + 1}`;
    const i = sectionPages(id).indexOf(page);
    return i > 0 && !sectionView[id] ? `#${id}/${i + 1}` : `#${id}`;
}

function pageForHash(hash) {
    const [id, n] = hash.slice(1).split('/');
    if (!SECTIONS.includes(id)) return allPages()[0];
    // a section with an overview shows it unless the link points at one item
    if (sectionView[id]) setView(id, n ? 'detail' : 'overview');
    const pages = sectionPages(id);
    if (!n) return pages[0];
    if (isNaN(+n)) return pages.find(p => p.dataset.toy === n) || pages[0];         // #playground/photobooth
    if (sectionView[id]) return pages.find(p => p.dataset.item === String(n - 1)) || pages[0];  // #gallery/12
    return pages[+n - 1] || pages[0];                                              // #resume/2
}

function goTo(page) {
    if (!page || page === currentPage) return;
    // flipping within a section replaces the history entry; jumping sections adds one
    const sameSection = currentPage && sectionOf(currentPage) === sectionOf(page);
    history[sameSection ? 'replaceState' : 'pushState'](null, '', hashFor(page));
    showPage(page);
}

function flip(step) {
    const pages = allPages();
    goTo(pages[pages.indexOf(currentPage) + step]);
}

// Back to the wall you came from. The overview page isn't rebuilt on the way
// out, so it still holds the scroll position you left it at.
function backToOverview(id) {
    const item = currentPage.dataset.item;
    setView(id, 'overview');
    const pages = sectionPages(id);
    const page = pages.find(p => p.querySelector(`[data-jump="${item}"]`)) || pages[0];
    goTo(page);
    page.querySelector(`[data-jump="${item}"]`)?.scrollIntoView({ block: 'nearest' });
}

// a divider tab always opens its section at the front, not wherever you last were
function goToSection(id) {
    if (sectionView[id]) setView(id, 'overview');
    goTo(sectionPages(id)[0]);
}

function jumpTo(id, item) {
    setView(id, 'detail');
    goTo(sectionPages(id).find(p => p.dataset.item === item));
}

window.addEventListener('popstate', () => showPage(pageForHash(location.hash)));

document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab], [data-go], [data-back], [data-jump], [data-resume]');
    if (!btn) return;
    if ('back' in btn.dataset) backToOverview(sectionOf(btn.closest('.page')));
    else if (btn.dataset.tab) goToSection(btn.dataset.tab);
    else if (btn.dataset.go) flip(+btn.dataset.go);
    else if (btn.dataset.jump) jumpTo(sectionOf(btn.closest('.page')), btn.dataset.jump);
    else if (btn.dataset.resume) setResumeVersion(btn.dataset.resume);
});

// filters / sorting on the overview pages rebuild that section
document.addEventListener('change', (e) => {
    const select = e.target.closest('[data-filter]');
    if (!select) return;
    const id = sectionOf(select.closest('.page'));
    if (select.dataset.filter === 'category') projectCategory = select.value;
    if (select.dataset.filter === 'camera') galleryCamera = select.value;
    if (select.dataset.filter === 'sort') gallerySort = select.value;
    if (id === 'projects') buildProjects(); else buildGallery();
    refreshPageNumbers();
    showPage(sectionPages(id)[0], { animate: false });
    history.replaceState(null, '', hashFor(currentPage));
    currentPage.querySelector(`[data-filter="${select.dataset.filter}"]`)?.focus();
});

document.addEventListener('keydown', (e) => {
    // arrow keys flip pages, unless you're typing / dragging a slider / picking from a dropdown
    if (e.target.closest?.('input, textarea, select') || e.altKey || e.ctrlKey || e.metaKey) return;
    const crop = document.getElementById('booth-crop');
    if (crop && !crop.hidden) return;
    if (e.key === 'ArrowRight') flip(1);
    if (e.key === 'ArrowLeft') flip(-1);
});

// ── Resume (one page; the sheet taped to it scrolls) ────────────────────────
//
// A resume is read top to bottom, so it stays one continuous document: the
// notebook page is fixed like the others, but the sheet inside scrolls.

const resumeSource = document.querySelector('.resume-source');
let resumeVersion = 'short';

function buildResume() {
    clearPages('resume');
    const body = makePage('resume', {}, false).querySelector('.page-body');
    body.classList.add('resume-page');
    body.innerHTML = `
        <div class="page-head">
            <h2 class="page-title">resume</h2>
            <div class="page-tools">
                <div class="switch">
                    <button data-resume="short" class="${resumeVersion === 'short' ? 'active' : ''}">default</button>
                    <button data-resume="extended" class="${resumeVersion === 'extended' ? 'active' : ''}">extended</button>
                </div>
                <a class="tool-btn" href="Anh_Phan_Resume.pdf" target="_blank" rel="noreferrer" download>download pdf</a>
            </div>
        </div>
        <div class="resume-sheet-wrap"><div class="resume-sheet"></div></div>`;
    const sheet = body.querySelector('.resume-sheet');
    sheet.append(...resumeSource.querySelector(`.resume-version[data-version="${resumeVersion}"]`).cloneNode(true).children);
    const head = sheet.firstElementChild;
    if (head.style.textAlign === 'center') { head.removeAttribute('style'); head.className = 'resume-head'; }
}

function setResumeVersion(version) {
    if (version === resumeVersion) return;
    resumeVersion = version;
    buildResume();
    refreshPageNumbers();
    showPage(sectionPages('resume')[0], { animate: false });
    history.replaceState(null, '', hashFor(currentPage));
}

// ── Truths and a lie ─────────────────────────────────────────────────────

// The streak was 1230 on 27 Oct 2026 and counts up a day at a time from there
// (as long as it holds, which is the plan).
const STREAK_ANCHOR = { date: new Date(2026, 9, 27), days: 1230 };
function streakToday() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return STREAK_ANCHOR.days + Math.max(0, Math.round((today - STREAK_ANCHOR.date) / 86400000));
}

// each statement answers back differently; `reply` can be text or a function
const TRUTHS = [
    { text: 'I created the font used in this website.', reply: 'this is all (technically) my handwriting!' },
    { text: 'I am lactose intolerant.', reply: 'would never stop me from some ice cream...' },
    { text: 'I have a 1200+ day streak on Duolingo.', reply: () => `specifically ${streakToday()} days!` },
    { text: 'I can say "67" in 5 languages.', reply: 'sechs sieben!!!' },
    { text: 'I currently own 4 cameras.', reply: 'i own 5 cameras!', lie: true },
];

const truthsOptions = document.getElementById('truths-options');
const truthsResult = document.getElementById('truths-result');
if (truthsOptions) {
    TRUTHS.forEach((t) => {
        const btn = document.createElement('button');
        btn.className = 'truth-option';
        btn.textContent = t.text;
        btn.addEventListener('click', () => {
            truthsResult.textContent = typeof t.reply === 'function' ? t.reply() : t.reply;
            if (t.lie) {
                truthsOptions.querySelectorAll('.truth-option').forEach(b => (b.disabled = true));
                btn.classList.add('is-lie');
            } else {
                btn.disabled = true;
                btn.classList.add('is-wrong-pick');
            }
        });
        truthsOptions.appendChild(btn);
    });
}

// ── Projects data ────────────────────────────────────────────────────────────

const PROJECTS = [
    {
        title: 'Hinge History',
        category: 'Data Analysis',
        tags: ['PowerBI'],
        color: '#7fa06a',
        paras: [
            `<p><strong>Context.</strong> My roommate informed me that Hinge lets you export all your data on Hinge as a giant JSON. At the moment of writing this, I am currently in a relationship with one of the people I met on there(!!), and it took me about half a year. I was just curious about the journey, so I <em>had</em> to make a Power BI dashboard.</p>`,
            `<p><strong>Process.</strong> I took a lot of help from Claude to transform the JSON into csv's I can work with. I also racked Claude's brain for drafting layouts for my dashboard. The rest was just questions I wanted to know: how many people did I match with, what were the outcomes, etc. I knew there had to be a flowchart. It was very fun getting to look at the bigger picture of my Hinge journey.</p><a href="images/hinge.png" target="_blank" rel="noreferrer"><img src="images/hinge.png" alt="Power BI dashboard of Hinge matches and chats, December 2025 to May 2026"></a>`,
            `<p><strong>Afterthought(s).</strong> My most unique project thus far?</p>`,
        ],
    },
    {
        title: 'Dogs on Greek Vases',
        category: 'Machine Learning',
        tags: ['Python', 'TensorFlow/PyTorch'],
        color: '#b9cba3',
        paras: [
            `<p><strong>Context.</strong> There is a faculty member at Knox who specializes in research about identifying canine figures on Greek vases. She came to my faculty advisor, and they had discussions about how she thinks most people miscategorize the canine figures because they don't have the biological knowledge of canine behavior. A question was brought up about whether we can train an image classifier on her hand-labeled data to correctly categorize these figures, and I was the student recommended to work on this, given my previous work on CNNs and image classification models.</p>`,
            `<p><strong>Process.</strong> I started out by vibe-coding <a href="https://salad905.github.io/dogs/vase-dog-labeler.html" target="_blank" rel="noreferrer">a data annotator</a> for this very specific task. I built a data collection pipeline to gather ~1,000 black-figure vase images from the Beazley Archive Pottery Database, and I wanted the faculty member to identify the dogs on the vases. The thing is that this could be very time-consuming, and I was messing with the UI to make the process as efficient for her as possible. That's where the project is at. It's a work in progress.</p>`,
            `<p><strong>Afterthought(s).</strong> The data annotator is, as you can tell, hosted on my GitHub website. Since I made it before I changed the layout/aesthetic of the website, the annotator has my old CSS, so you can sort of see what the website used to look like. Only thing I kept is the Comic Sans and the green...</p>`,
        ],
    },
    {
        title: 'Oh Sheet!',
        category: 'Software Development',
        tags: ['React', 'TypeScript', 'OpenSheetMusicDisplay (OSMD)', 'Vite', 'Tailwind CSS', 'Firebase', 'Modal'],
        color: '#9ab97e',
        paras: [
            `<p><strong>Context.</strong> As part of my Artificial Neural Network class (once again, not needed for my major), my group made a machine-learning-based optimal recognition platform called <a href="https://music-app-924.pages.dev/" target="_blank" rel="noreferrer">Oh Sheet!</a> I knew coming into this group that I would play mostly a support role, since our group has a very prominent character (in the best way possible), which is... not a bad thing by any means, but I definitely did not contribute as much as I could've.</p>`,
            `<p><strong>Process.</strong> I architected a browser-based music sheet editor with React, TypeScript, OSMD, and Firebase. This allowed users to view, edit, transpose, and play back the generated scores. I also debugged complex synchronization issues involving coordinate mapping, rendering states, and user interactions. I was in charge of the business and monetization model behind the website, and we settled on basing our revenue on Google Ads (running a 30s ad as the scores are being processed since they take a minute anyway). I also... designed the logo... but that's kinda minor lmao.</p>`,
            `<p><strong>Afterthought(s).</strong> Funnily enough, I learned a lot more about website deployment and sheet music than about... machine learning... but I guess that makes sense since I'm just reapplying knowledge I already have to the project. I also had to figure out music sheet editor UI, which was quite the challenge. At the time of writing, my very prominent groupmate had submitted this to a major music technology conference and would list us as co-authors if it were approved. He plans on continuing working on it (I don't), and I'm excited for him because it is basically his Honors project now.</p>`,
        ],
    },
    {
        title: 'SVH Pediatric Patient Journey',
        category: 'Data Analysis',
        tags: ['Python (numpy, pandas)', 'PowerBI'],
        color: '#7fa06a',
        paras: [
            `<p><strong>Context.</strong> Every year, Knox College has a team at the Central Illinois ASA Datafest. For 2026, Knox had 4 teams, and my roommate and I were one of them. It was interesting because we were the smallest team (they allowed teams of 2-5 members), and this was our first time at a data contest of sorts.</p>`,
            `<p><strong>Process.</strong> We processed 8.1 million patient encounters across multiple datasets and performed geographic analysis using Census FIPS codes with Python. We spoke to a winner of the previous year's DataFest, and he told us that we should aim for a specific category. We went for Best Visualization and created <a href="https://github.com/salad905/df26submission" target="_blank" rel="noreferrer">dashboards</a> (I used Power BI and my roommate used Tableau) highlighting patient density, growth trends, and transportation-related barriers. We identified a relevant news article that stated that a huge intensive pediatric care unit had shut down in the area, and therefore decided to focus on pediatric care and expected growth.</p>`,
            `<p><strong>Afterthought(s).</strong> This was both of our first times creating dashboards. I had only taken online courses in Power BI, but had never applied it to a real-world dataset. Originally, we would've both used Power BI, but my roommate uses a Macbook (which doesn't support free Power BI), so we both had to learn a lot as we went. We got Honorable Mention!</p>`,
        ],
    },
    {
        title: 'bzbee',
        category: 'Software Development',
        tags: ['JavaScript', 'HTML', 'CSS', 'Chrome Extension API', 'DOM Manipulation', 'Figma', 'Git'],
        color: '#4a6741',
        paras: [
            `<p><strong>Context.</strong> For my Software Development class (which I did not have to take, but my roommate and I decided to take for fun), my group made a productivity-based study companion Google Extension called <a href="https://chromewebstore.google.com/detail/mnobhlpgjflegmnoimkaikenmngbcjhh?utm_source=item-share-cb" target="_blank" rel="noreferrer">bzbee</a>.</p><p>My group consisted of 3 programmers and 1 graphic designer. We knew right off the bat that we wanted something visually striking so we could make the most of our graphic designer, since most other groups don't really have one. After going through many ideas, we decided on a productivity-based application, but since the project assignment asked for a game made with Godot, we asked our instructor for permission to pivot to a Google Extension.</p>`,
            `<p><strong>Process.</strong> We had a lot of fun. The art is very quirky, and I absolutely adore it. I was very passionate about working on this extension, and I was happy to apply my prior extension knowledge to this project. We developed a Chrome extension with timers, to-do lists, ambient sounds, and website blocking capabilities. Created dynamic browser overlays through DOM manipulation (oh my god you would never know how much I was stressing about DOM manipulation) (it took me a minute to wrap my head around it) and iterated on user flows through Figma prototypes.</p>`,
            `<p><strong>Afterthought(s).</strong> This was my first time collaborative coding on GitHub. Before that, I never had to deal with pushing, pulling, version control, commits, branches, or whatever comes with it. There were some hiccups here and there, but nothing we could not recover from.</p><p>I was mostly the CSS person, meaning I was in charge of bringing our graphic designer's vision to code. It was... an experience (she was pretty particular with her vision), but I appreciate that she was firm on her decisions.</p><p>I was also kinda the UI/UX person. Our graphic designer was fluent in Figma, so I was mostly just deciding what would be most intuitive for our users. My goal was for the controls to feel intuitive without needing instructions, and I came to realize that it was not as easy as it seemed.</p><p>We did manage to push it onto the Marketplace, but it took us a few rejections. My previous extensions were never really intense on the permissions required, so it was pretty new to me.</p>`,
        ],
    },
    {
        title: 'Honor System Statistical Report',
        category: 'Data Analysis',
        tags: ['Google Apps Script', 'Google Sheets', 'OCR', 'Excel'],
        color: '#8f9c5e',
        paras: [
            `<p><strong>Context.</strong> For the 2025-2026 academic year (and at the present as I'm writing this), I was the co-chair of Knox's Honor Board. I stepped into the role when the system was slightly dysfunctional and had to work my way through the backlog of cases last year's co-chairs left me. No biggie (yes biggie, but we shall not speak of that). I came to the realization within my first few cases that there is a major distrust from (some of) the faculty members towards the Board for how long some cases can take. My fellow co-chairs, newly appointed advisor (he made this happen if I'm being very honest), and I managed to work through the backlog while making adjustments to our 12-year-old constitution.</p><p>While working on a case, a professor brought up to me how little the Knox community knows about the Board. This is when the idea came to me of releasing an annual statistical report for the community to have a better idea of the Honor System. When we were interviewing for new members, one of them really left an impression on me when they said the Board feels like an ominous, mysterious group that one only remembers when the professor goes through their syllabus on the first day of class and comes across the Honor Code section. After that, I wanted to push for the Board to be more student-facing and transparent with the community. The Honor Board intends to go through major (positive!) changes, and this report is one of them.</p>`,
            `<p><strong>Process.</strong> I worked with the advisor of the Board (who happens to be the chair of the Data Science department). The Board had never had a system that makes it easy to produce aggregate figures. I figured then that it was time to start. Two issues we had in mind as we started were maintaining student confidentiality in compliance with FERPA and making it so that future (potentially not very technical) co-chairs can maintain the database. I started by running our 10-year data (pdfs, or sometimes .pngs organized clumsily in a Google Folder, with common misspellings) through OCR via Google Scripts and extracted all the data I needed for the report. I then designed a standardized Google Sheet to help make the aggregation of data easy, even for non-technical users. I also wrote a manual to instruct future co-chairs on how to format things and navigate the spreadsheets and pivot tables.</p>`,
            `<p><strong>Afterthought(s).</strong> I presented at Knox's research symposium. It was actually very fun and fruitful chatting with different Knox community members about the Honor System and seeing their reaction to the figures presented. As funny as it is, before I became the co-chair and was just a member of the Board, we'd have about 1-2 hearings a month, which led me to think "woa! there must not be that many cases of academic dishonesty at Knox!" I was very wrong… but it provokes a feeling in me to think that the rest of the Knox community thought the same. I'm more than happy to change that.</p><a href="images/poster2.png" target="_blank" rel="noreferrer"><img src="images/poster2.png" alt="Knox College Honor Code Violation Report poster"></a>`,
        ],
    },
    {
        title: 'Fortune Cookie',
        category: 'Software Development',
        tags: ['HTML', 'CSS', 'JavaScript', 'Google Extension API'],
        color: '#b9cba3',
        paras: [
            `<p><strong>Context.</strong> After working on Magic 8 Ball, I had the motivation to apply my skills to another extension, leading to <a href="https://chromewebstore.google.com/detail/kkbpacbjblnhhplpeefdgofboifemela?utm_source=item-share-cb" target="_blank" rel="noreferrer">Fortune Cookie</a>.</p>`,
            `<p><strong>Process.</strong> Same thing, really, except I had to gather a few hundred fortunes online. My plan one day is to write my own quirky fortunes for the extension and to make the fortune cookie icon actually break when the user receives their fortune (this is a Canva asset).</p>`,
            `<p><strong>Afterthought(s).</strong> This extension does not perform half as well as my 8 ball, which leads me to wonder what went differently. I guess I won't know the answer…</p>`,
        ],
    },
    {
        title: 'Magic 8 Ball',
        category: 'Software Development',
        tags: ['HTML', 'CSS', 'JavaScript', 'Google Extension API'],
        color: '#9ab97e',
        paras: [
            `<p><strong>Context.</strong> With my deepfake detection project, one thing I was hoping to do is make it into a Google Extension. That, as we now know, did not happen, but during my attempt to get to know the Google Extension API, I made <a href="https://chromewebstore.google.com/detail/fdnbiicphhaahkmaclijpbgnjakajlkj?utm_source=item-share-cb" target="_blank" rel="noreferrer">this Magic 8 Ball</a>.</p>`,
            `<p><strong>Process.</strong> It is as simple as it gets. I got 20 magic 8 ball sayings, put them in a randomizer, added a progress bar for dramatic effect, and voila. At the time of writing this, the extension has 35 organic users. Every now and then, I get a scammy email from people wishing to promote my extension. I never intended to monetize off it, so I never cared to look into it.</p><img src="images/Magic 8 Ball.png" alt="Magic 8 Ball extension screenshot">`,
            `<p><strong>Afterthought(s).</strong> I now know the process of making a Google Extension and publishing it onto the Extension Marketplace. I use it very sparingly whenever I feel lost in life and want a sign from the universe. Most of the time it has been hopeful (and correct!).</p>`,
        ],
    },
    {
        title: 'Deepfake Generation & Detection',
        category: 'Machine Learning',
        tags: ['Python', 'PyTorch', 'FaceNet', 'OpenCV', 'FastAPI'],
        color: '#7fa06a',
        paras: [
            `<p><strong>Context.</strong> For my 2025 summer project, I worked with my academic advisor on a deepfake generation & detection machine learning project.</p>`,
            `<p><strong>Process.</strong> By now, I'm slightly familiar with a machine learning project, so I am quite happy with my work. I generated photos with StyleGAN3, removed photo backgrounds using BiRefNet, and used MTCNN and facenet-pytorch to perform face detection and cropping. Embeddings from a pre-trained FaceNet model were extracted and used to train a classifier. Evaluation included accuracy, confusion matrices, ROC-AUC, and visual inspection of misclassified samples. Currently has a <a href="https://huggingface.co/spaces/salad905/space2" target="_blank" rel="noreferrer">Gradio interface</a>.</p>`,
            `<p><strong>Afterthought(s).</strong> It was pretty sweet to use the skills I've acquired thus far in my own project. I did have a faculty mentor, but the work was mostly my own. This was my first exposure to neural network architecture and transfer learning. I did come to the realization that deepfake technology was rapidly growing at the time and that whatever I managed to come up with may fall behind before I was even done. Regardless, I <a href="https://docs.google.com/presentation/d/16wrJgu9f2zreRwBTFoj5PWlhl51HZ83MhoY5II38fUM/edit?usp=sharing" target="_blank" rel="noreferrer">presented</a> at Knox's summer research symposium and hoped that this would at least provoke some thought about media literacy and raise awareness about how we consume online content.</p>`,
        ],
    },
    {
        title: 'Fake News Detector',
        category: 'Machine Learning',
        tags: ['Python', 'Scikit-learn', 'Keras', 'TensorFlow', 'NLTK', 'BeautifulSoup', 'Pandas', 'NumPy', 'Gradio', 'TF-IDF'],
        color: '#4a6741',
        paras: [
            `<p><strong>Context.</strong> For my Data Mining class (early 2025), 2 classmates and I decided to work on a fake news detector.</p>`,
            `<p><strong>Process.</strong> We found a Kaggle dataset with about 40k articles. We preprocessed the dataset with tokenization, lemmatization, and feature extraction using Bag of Words and TF-IDF. Several classifiers were tested, including Logistic Regression, Naive Bayes, and Random Forest. A <a href="https://huggingface.co/spaces/salad905/fake_news_detector" target="_blank" rel="noreferrer">Gradio interface</a> was created for interactive predictions. More information can be found in our <a href="https://drive.google.com/file/d/1EK490I5k3OPS1GW0fnBfoLVexApzETaZ/view" target="_blank" rel="noreferrer">report</a>.</p>`,
            `<p><strong>Afterthought(s).</strong> At the end of the day, I don't believe we actually made a fake news detector. We didn't even really know what would classify as "fake", and never spent the time to double-check the information in the dataset. A machine learning approach is probably also not the best for fact-checking. However, it was my first machine learning project. I self-taught Python as I was working on the project (I had not used Python before), and my senior groupmate showed us the building blocks of a machine learning project. I got to familiarize myself with NLP tasks, exploratory data analysis, and building a front-end interface.</p>`,
        ],
    },
    {
        title: 'Waiting Room',
        category: 'Software Development',
        tags: ['Java'],
        color: '#8f9c5e',
        paras: [
            `<p><strong>Context.</strong> For my freshman year winter break (2023), I applied to be part of a collaborative research project, where we aimed to find the most efficient supercomputer topology.</p>`,
            `<p><strong>Process.</strong> We started as a group of 8 students who would read research papers on the topic, then split into 4 pairs to experiment with different approaches. My to-be-roommate and I were paired up, and we would simulate the connectivity of the topology in Java and log our results in an Excel sheet. We also tried it on various sizes and numbers of links per node. In the end, we found a topology that goes through each node, finds the furthest node from it, and connects the two. We found that it performed up to 5% better at smaller sizes than the topologies we read about, which is, to be frank, slightly trivial since most supercomputer systems use quite several machines. We named it Waiting Room after <a href="https://www.codewars.com/kata/542f0c36d002f8cd8a0005e5" target="_blank" rel="noreferrer">a Codewars problem</a> that inspired this approach.</p>`,
            `<p><strong>Afterthought(s).</strong> Nevertheless, this was my introduction to doing research. It familiarized me with how to conduct a proper literature review, brainstorm and propose compelling research questions, and make a research poster. We presented at Horizons, Knox College's on-campus research symposium. Below is the poster we made.</p><a href="images/poster.jpg" target="_blank" rel="noreferrer"><img src="images/poster.jpg" alt="Winter Collaborative Project Poster"></a>`,
        ],
    },
    {
        title: 'salad905.github.io',
        category: 'Software Development',
        tags: ['HTML', 'CSS', 'JavaScript'],
        color: '#b9cba3',
        paras: [
            `<p><strong>Context.</strong> For my Programming Languages class, we were all asked to make a personal website to be hosted on GitHub. This website looked pretty different when I started, but here we are now.</p>`,
            `<p><strong>Process &amp; Afterthought(s).</strong> It's still ongoing work. I try to update it every now and then when I have the time. I wanted this to be a thing someone can look at to get to know me, professionally or personally. I hope it's doing a good job at that…</p>`,
        ],
    },
];


const PROJECT_CATEGORIES = ['Machine Learning', 'Data Analysis', 'Software Development'];
const CATEGORY_NOTE = {
    'Machine Learning': '#cfe0b4',
    'Data Analysis': '#e7eecf',
    'Software Development': '#bcd4af',
};
let projectCategory = 'all';

function buildProjects() {
    clearPages('projects');
    const list = projectCategory === 'all' ? PROJECTS : PROJECTS.filter(p => p.category === projectCategory);

    // overview: small cards, as many pages as they need
    const cards = list.map(p => el('button', 'project-card', `
        <span class="sticky-note" style="--note:${CATEGORY_NOTE[p.category] || 'var(--sage)'}">
            <span class="sticky-cat">${p.category}</span>
            <span class="sticky-title">${p.title}</span>
            <span class="project-tags">${p.tags.map(t => `<span class="project-tag">${t}</span>`).join('')}</span>
        </span>`));
    cards.forEach((card, i) => { card.dataset.jump = PROJECTS.indexOf(list[i]); });
    const categorySelect = `<select class="chip-select" data-filter="category" aria-label="category">
        <option value="all">all categories</option>
        ${PROJECT_CATEGORIES.map(c => `<option value="${c}" ${c === projectCategory ? 'selected' : ''}>${c.toLowerCase()}</option>`).join('')}
    </select>`;
    // the whole wall of notes lives on one page and scrolls, so a note keeps its place
    const body = makePage('projects', { mode: 'overview' }).querySelector('.page-body');
    body.classList.add('projects-body');
    body.innerHTML = `
        <div class="page-head">
            <h2 class="page-title">projects</h2>
            <div class="page-tools">${categorySelect}</div>
        </div>
        <div class="projects-grid"></div>`;
    const grid = body.querySelector('.projects-grid');
    if (list.length) grid.append(...cards);
    else grid.append(el('p', 'grid-empty', 'no projects match this filter.'));

    // every note the same size: as tall as the one with the most tags needs,
    // measured rather than guessed so nothing inside ever gets cut off
    grid.style.gridAutoRows = 'min-content';
    const tallest = cards.reduce((h, c) => Math.max(h, c.firstElementChild.scrollHeight), 0);
    grid.style.gridAutoRows = Math.max(tallest, 130) + 'px';

    // one by one: each project gets one page; a long story scrolls inside it
    list.forEach(p => {
        const body = makePage('projects', { mode: 'detail', item: PROJECTS.indexOf(p) }, false).querySelector('.page-body');
        body.classList.add('project-body');
        body.innerHTML = `
            <div class="page-head project-page-head">
                <div>
                    <span class="project-category-badge" style="--accent:${p.color}">${p.category}</span>
                    <h2 class="page-title">${p.title}</h2>
                    <div class="project-tags">${p.tags.map(t => `<span class="project-tag">${t}</span>`).join('')}</div>
                </div>
                ${backButton()}
            </div>
            <div class="project-paras">${p.paras.map(html => `<div class="project-para">${html}</div>`).join('')}</div>`;
    });
    doneMeasuring('projects');
}

// ── Gallery data ─────────────────────────────────────────────────────────────

const GALLERY = [
    { src: 'images/web/20210207.jpg', caption: 'Yellow chrysanthemum offerings', camera: 'Fujifilm X-A5', date: 'February 7th, 2021', desc: 'In Vietnamese culture, yellow chrysanthemums are generally used in the table of "offerings" for ancestors. Our culture is deeply rooted in gratitude, and every 15th day in the lunisolar calendar, we set a table of "offerings" for our ancestors.' },
    { src: 'images/web/20210501.jpg', caption: 'Vietnamese straw hat display', camera: 'Fujifilm X-A5', date: 'May 1st, 2021', desc: 'I was on a mini vacation with my family, and they had a cool display of Vietnamese straw hats.' },
    { src: 'images/web/20220125.jpg', caption: 'A quiet beach', camera: 'Fujifilm X-A5', date: 'January 25th, 2022', desc: "We went on a little vacation to my parents' hometown for my mom's birthday. This was taken at a beach in the neighboring city. This might be my favorite photo (that I took) ever. There's something so calming about the ocean when no one's around." },
    { src: 'images/web/20220126.jpg', caption: 'Feeding the goldfish', camera: 'Fujifilm X-A5', date: 'January 26th, 2022', desc: "Legend has it that Uncle Ho had a fondness for raising goldfish. It just so happened that he's not around anymore, so there's always someone selling fish food at the pond where he grew up (it's a tourist attraction). They seem hungry. Business for that fish food vendor must not be going too well." },
    { src: 'images/web/20220127.jpg', caption: 'Huong Tich Pagoda', camera: 'Fujifilm X-A5', date: 'January 27th, 2022', desc: "This was taken at Huong Tich Pagoda in my hometown. It's somewhere we hike every time we visit my parents' hometown." },
    { src: 'images/web/20220330.jpg', caption: 'Mirror selfie, high school', camera: 'Minolta SR101', date: 'March 30th, 2022', desc: 'My first (and still only) analog SLR. Taken in front of a mirror somewhere in high school.' },
    { src: 'images/web/20220413.jpg', caption: 'My high school', camera: 'Minolta SR101', date: 'April 13th, 2022', desc: "My high school. The school had a change of leadership and was renovated the year after I left, so I'm very sure this is not how it looks anymore." },
    { src: 'images/web/20220529.jpg', caption: 'A stroll in Sài Gòn', camera: 'Minolta SR101', date: 'May 29th, 2022', desc: "My mom. We had a mini girls' trip to Sài Gòn and we took a stroll in a little park." },
    { src: 'images/web/20220607.jpg', caption: 'Plum farm, Moc Chau', camera: 'Minolta SR101', date: 'June 7th, 2022', desc: 'My high school friends and I took a little trip to Moc Chau, and this photo was taken at a plum farm we visited during that trip.' },
    { src: 'images/web/000052090024.jpg', caption: 'Cafe near high school', camera: 'Konica Z-UP70', date: 'October 10th, 2022', desc: 'This was taken at a cafe near my high school.' },
    { src: 'images/web/20221111.jpg', caption: 'Senior photo session', camera: 'Konica Z-UP70', date: 'November 11th, 2022', desc: 'My parents at my senior photo session. We were all dressed up in graduation gowns and our parents were dressed in traditional Vietnamese dresses or suits.' },
    { src: 'images/web/20230115.jpg', caption: 'The pedestrian bridge', camera: 'Minolta SR101', date: 'January 15th, 2023', desc: "This is the street I cross every day to get to the bus station on my way to high school. I've had my fair share of memories on the pedestrian bridge this photo was taken from." },
    { src: 'images/web/20230821.jpg', caption: 'Photography club prep', camera: 'Minolta SR101', date: 'August 21st, 2023', desc: 'I happened to be the Vice President of the Photography club at my high school. We were getting ready for one of the first organization fairs at my high school at one of the members\' dorm rooms.' },
    { src: 'images/web/20240618.jpg', caption: 'Sa Vi, north-eastern Vietnam', camera: 'Sony Cybershot DSC-RX100', date: 'June 18th, 2024', desc: 'Sa Vi is the north-eastern-most point of Vietnam. They have a cool Australian pine-shaped building because that is what the area is best known for.' },
    { src: 'images/web/20240714.jpg', caption: 'Red roofs', camera: 'Sony Cybershot DSC-RX100', date: 'July 14th, 2024', desc: 'I asked my dad why the roofs of most buildings are red. He told me that back in the day, roofs tended to be made up of clay tiles, which were naturally red. Red roofs became a signature look, and even roofs with other materials nowadays would still be red.' },
    { src: 'images/web/20240810.jpg', caption: 'Hang Ma street market', camera: 'Sony Cybershot DSC-RX100', date: 'August 10th, 2024', desc: 'My high school friends and I went to Hang Ma street, known for its bustling holiday markets. Mid-Autumn festival was approaching, so the streets were packed with people looking for decorations.' },
    { src: 'images/web/20241120.jpg', caption: 'Chinatown, Chicago', camera: 'Olympus MJU', date: 'November 20th, 2024', desc: 'We explored the vibrant streets of Chinatown, immersing ourselves in the rich cultural experience.' },
    { src: 'images/web/20241121.jpg', caption: 'Chinatown, Chicago (1)', camera: 'Olympus MJU', date: 'November 21st, 2024', desc: 'Us in Chinatown again the next day. Funny how the weather can change so quickly.' },
    { src: 'images/web/20241228.jpg', caption: 'Navy Pier, Chicago', camera: 'Olympus MJU', date: 'December 28th, 2024', desc: 'I traveled solo in Chicago for 3 days. Oh, the perks of living 3 hours away from a big city. I took a stroll near Navy Pier, got one of the coolest photos I ever took, and witnessed a proposal(!!). It was eventful in the most unexpected ways.' },
    { src: 'images/web/20250318.jpg', caption: 'NASA in Houston', camera: 'Olympus MJU', date: 'March 18th, 2025', desc: 'I had a weeklong roadtrip to Texas. We were mostly in Houston and San Antonio, so I got to go see the NASA Johnson Space Center. First time in the South!' },
    { src: 'images/web/2025081304.jpg', caption: 'Pier 39', camera: 'Konica Z-UP110', date: 'August 13th, 2025', desc: 'I was in San Francisco and San Jose for a networking event, so me and my friend decided to make the most of it and go around. So many seals!' },
    { src: 'images/web/20250813.jpg', caption: 'San Francisco City View', camera: 'Konica Z-UP110', date: 'August 13th, 2025', desc: 'The photo is a bit crooked... but one can imagine how it\'d look if it was leveled.' },
    { src: 'images/web/2025081301.jpg', caption: 'Alcatraz', camera: 'Konica Z-UP110', date: 'August 13th, 2025', desc: 'We went to the Alcatraz. I\'ve learned a lot about mass incarceration since arriving here, and this experience was a good glimpse into the history of the prison system in the US.' },
    { src: 'images/web/2025081302.jpg', caption: 'Alcatraz (1)', camera: 'Konica Z-UP110', date: 'August 13th, 2025', desc: 'Another photo from the Alcatraz. Lots of birds.' },
    { src: 'images/web/2025081303.jpg', caption: 'Alcatraz (2)', camera: 'Konica Z-UP110', date: 'August 13th, 2025', desc: 'Another photo from the Alcatraz. More birds!' },
    { src: 'images/web/20251107.jpg', caption: 'McCormick Place', camera: 'Konica Z-UP110', date: 'November 7th, 2025', desc: 'I was in Chicago for the 2025 Grace Hopper Celebration. It was definitely a fruitful experience and I got to connect with many professionals that do admirable work.' },
    { src: 'images/web/20251113.jpg', caption: 'Chicago River', camera: 'Konica Z-UP110', date: 'November 13th, 2025', desc: 'I had a phase where I was attempting to follow the actuarial career path, so this photo was taken when I came to Chicago to take the P exam. I did not pass it. Fall term has never been the kindest to me. Only time will tell if I ever attempt it again.' },
    { src: 'images/web/20251203.jpg', caption: 'Naperville', camera: 'Konica Z-UP110', date: 'December 3rd, 2025', desc: 'As you can probably tell by now, I\'ve frequented Chicago quite a bit. Me and my roommate decided to switch things up and go to Naperville (one Amtrak stop from Chicago) for a change. We were only there for a day trip, but it was fun (and we did Metra to Chicago again afterwards).' },
    { src: 'images/web/20260131.jpg', caption: 'Flag Fair 2026', camera: 'Konica Z-UP110', date: 'January 31st, 2026', desc: 'Every year at Knox, we have a International Day, where students from different countries showcase their cultures. The event opens with the "Flag Fair", where students represent their countries and wave their flags. I might participate next year, I might not, at the time of writing this I don\'t know for sure yet. ' },
    { src: 'images/web/20260228.jpg', caption: 'Seymour Library', camera: 'Konica Z-UP110', date: 'February 28th, 2026', desc: 'My sister wanted to do a mini photoshoot around the Knox campus. We were in Old Main and the Library, which in my opinion are the best buildings (aesthetically) on campus.' },
    { src: 'images/web/20260713.jpg', caption: 'Mississipi River', camera: 'Panasonic Lumix DMC-TZ4', date: 'July 13th, 2026', desc: 'I got this nice little digital camera from Ebay (for a very good price I am very proud) and I really like it so far. I was in Iowa and this photo was taken while I was on my Greyhound back to Galesburg.' },
];


const ACCENTS = ['#b9cba3', '#9ab97e', '#7fa06a', '#4a6741', '#8f9c5e'];
const CAMERAS = [...new Set(GALLERY.map(p => p.camera))];
let gallerySort = 'oldest';
let galleryCamera = 'all';

function buildGallery() {
    clearPages('gallery');
    let list = GALLERY;
    if (galleryCamera !== 'all') list = list.filter(photo => photo.camera === galleryCamera);
    if (gallerySort === 'newest') list = list.slice().reverse();

    // overview: a wall of little polaroids
    const cards = list.map((photo, i) => {
        const card = el('button', 'photo-card', `
            <span class="photo-thumb"><img src="${photo.src}" alt="${photo.caption}" loading="lazy"></span>
            <span class="photo-card-caption">${photo.caption}</span>`);
        card.dataset.jump = GALLERY.indexOf(photo);
        card.style.setProperty('--accent', ACCENTS[i % ACCENTS.length]);
        return card;
    });
    const tools = `
        <select class="chip-select" data-filter="sort" aria-label="sort">
            <option value="oldest" ${gallerySort === 'oldest' ? 'selected' : ''}>oldest first</option>
            <option value="newest" ${gallerySort === 'newest' ? 'selected' : ''}>newest first</option>
        </select>
        <select class="chip-select" data-filter="camera" aria-label="camera">
            <option value="all">all cameras</option>
            ${CAMERAS.map(c => `<option value="${c}" ${c === galleryCamera ? 'selected' : ''}>${c}</option>`).join('')}
        </select>`;
    // the whole wall lives on one page and scrolls, so photos stay in one place
    const body = makePage('gallery', { mode: 'overview' }, false).querySelector('.page-body');
    body.classList.add('gallery-body');
    body.innerHTML = `
        <div class="page-head">
            <h2 class="page-title">gallery</h2>
            <div class="page-tools">${tools}</div>
        </div>
        <p class="page-sub">film &amp; digital · hanoi, galesburg, and in between</p>
        <div class="gallery-grid"></div>`;
    body.querySelector('.gallery-grid').append(...cards);

    // one by one: a page per photo (not measured, so the big images only load when you get there)
    list.forEach((photo, i) => {
        const body = makePage('gallery', { mode: 'detail', item: GALLERY.indexOf(photo) }, false).querySelector('.page-body');
        body.classList.add('photo-body');
        body.innerHTML = `
            <div class="page-head">
                ${backButton()}
            </div>
            <div class="photo-page">
                <div class="photo-page-frame" style="--accent:${ACCENTS[i % ACCENTS.length]}">
                    <img src="${photo.src}" alt="${photo.caption}" loading="lazy">
                </div>
                <div class="photo-page-text">
                    <h2 class="photo-page-caption">${photo.caption}</h2>
                    <p class="photo-page-meta">${photo.camera} · ${photo.date}</p>
                    <p class="photo-page-desc">${photo.desc}</p>
                </div>
            </div>`;
    });
    doneMeasuring('gallery');
}

// ── Color analysis ───────────────────────────────────────────────────────────

// The classic 12-season (Sci/ART-derived) personal color analysis system used by
// professional color analysts: each of the 4 main seasons splits into 3 sub-seasons
// along its neighboring axes (e.g. Spring splits toward Summer's "light" and
// Winter's "bright"). Colors below are representative swatches for each sub-season.
const COLOR_PALETTES = {
    lightSpring: {
        label: 'light spring', family: 'spring', desc: 'light, warm & clear',
        colors: ['#FFF1D6', '#F6B38A', '#FF8F7A', '#F7A6B8', '#F7D86A', '#9FD8B5', '#68C7C1', '#67BDE0', '#C99A5B', '#A8D8EA']
    },
    warmSpring: {
        label: 'warm spring', family: 'spring', desc: 'warm, bright & clear',
        colors: ['#FFF4D6', '#F5C542', '#F4A51C', '#FF6F61', '#E94B35', '#54A24B', '#28B7A8', '#177E7A', '#B86B2B', '#8A5A2B']
    },
    brightSpring: {
        label: 'bright spring', family: 'spring', desc: 'bright, warm & vivid',
        colors: ['#FFF7E8', '#FF5A5F', '#FF4F7B', '#F53B2F', '#F4E04D', '#A7D129', '#00A676', '#00B8C8', '#4FA3E3', '#CC5FA3']
    },
    lightSummer: {
        label: 'light summer', family: 'summer', desc: 'light, cool & soft',
        colors: ['#F2F3F5', '#E9B7C7', '#DFA0B6', '#B7A7D8', '#8FA8D8', '#9EC9E2', '#A6CFC4', '#AEDCD0', '#B7B7B7', '#3D5470']
    },
    coolSummer: {
        label: 'cool summer', family: 'summer', desc: 'cool, soft & muted',
        colors: ['#F4F5F5', '#C9869A', '#B57B9A', '#B2456E', '#A99AC4', '#667FA3', '#6F9A9A', '#4F7C72', '#8B8F96', '#6F4E73']
    },
    softSummer: {
        label: 'soft summer', family: 'summer', desc: 'soft, cool & muted',
        colors: ['#B8A99A', '#C894A0', '#9E5F73', '#9B7A8A', '#7E93A8', '#62788F', '#93A58A', '#789486', '#8F8377', '#565B63']
    },
    softAutumn: {
        label: 'soft autumn', family: 'autumn', desc: 'soft, warm & muted',
        colors: ['#E7D8C3', '#D9A77F', '#C97963', '#B66A58', '#B88957', '#7D7A3E', '#6F7B45', '#4F7F78', '#9A6A3A', '#5B4432']
    },
    warmAutumn: {
        label: 'warm autumn', family: 'autumn', desc: 'warm, deep & muted',
        colors: ['#F2E1C2', '#C99718', '#C86428', '#A94724', '#B46A32', '#6E6B2F', '#5D6B38', '#356F64', '#5A3825', '#7A2F2F']
    },
    deepAutumn: {
        label: 'deep autumn', family: 'autumn', desc: 'deep, warm & rich',
        colors: ['#E8D4B0', '#C78319', '#B24A24', '#8E2F27', '#5C2E22', '#4F5426', '#354C2F', '#0A5B5A', '#2F211A', '#4B2E3A']
    },
    deepWinter: {
        label: 'deep winter', family: 'winter', desc: 'deep, cool & rich',
        colors: ['#FFFFFF', '#000000', '#B00030', '#8A1538', '#5B1235', '#004B3C', '#006B54', '#102A56', '#0F52BA', '#2A2D34']
    },
    coolWinter: {
        label: 'cool winter', family: 'winter', desc: 'cool, bright & clear',
        colors: ['#FFFFFF', '#000000', '#C4002F', '#C2185B', '#D1008F', '#F4D8E8', '#0047AB', '#D7ECFF', '#008060', '#34363A']
    },
    brightWinter: {
        label: 'bright winter', family: 'winter', desc: 'bright, cool & vivid',
        colors: ['#FFFFFF', '#000000', '#FF2D95', '#D20F4B', '#0066FF', '#00B7C7', '#B9E600', '#6A00B9', '#7A3EC8', '#001F54']
    }
};
const PALETTE_FAMILIES = ['spring', 'summer', 'autumn', 'winter'];

const FACEAPI_SCRIPT = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
const FACEAPI_MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';

const colorsStage = document.getElementById('colors-stage');
const colorsPhoto = document.getElementById('colors-photo');
const colorsVideo = document.getElementById('colors-video');
const colorsDim = document.getElementById('colors-dim');
const colorsRingSvg = document.getElementById('colors-ring');
const colorsWorkspace = document.getElementById('colors-workspace');
const colorsUploadBtn = document.getElementById('colors-upload-btn');
const colorsFileInput = document.getElementById('colors-file-input');
const colorsWebcamBtn = document.getElementById('colors-webcam-btn');
const colorsWebcamBtnRow = document.getElementById('colors-webcam-btnrow');
const colorsCaptureBtn = document.getElementById('colors-capture-btn');
const colorsTrackToggleBtn = document.getElementById('colors-track-toggle-btn');
const colorsHint = document.getElementById('colors-hint');
const colorsPaletteRow = document.getElementById('colors-palette-row');
const colorsSizeSlider = document.getElementById('colors-size-slider');
const colorsRotateSlider = document.getElementById('colors-rotate-slider');

let currentPaletteKey = 'warmSpring';
let ringState = { cx: 0, cy: 0, r: 0, rot: 0, stageWidthAtSet: 0 };
let webcamStream = null;
let faceApiPromise = null;
let isDraggingRing = false;
let dragStart = { x: 0, y: 0, cx: 0, cy: 0 };
let liveTrackingTimer = null;
let liveTrackingPaused = false;
let ringTarget = null;
let smoothRafId = null;

function clampNum(n, min, max) { return Math.min(max, Math.max(min, n)); }

function debounce(fn, wait) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

function ensureFaceApiLoaded() {
    if (faceApiPromise) return faceApiPromise;
    faceApiPromise = new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = FACEAPI_SCRIPT;
        script.onload = async () => {
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri(FACEAPI_MODEL_URL);
                resolve(true);
            } catch (e) {
                resolve(false);
            }
        };
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
    });
    return faceApiPromise;
}

function computeCoverFit(natW, natH) {
    const rect = colorsStage.getBoundingClientRect();
    const boxW = rect.width, boxH = rect.height;
    const scale = Math.max(boxW / natW, boxH / natH);
    const dispW = natW * scale, dispH = natH * scale;
    return { scale, dispW, dispH, offX: (boxW - dispW) / 2, offY: (boxH - dispH) / 2, boxW, boxH };
}

function applyFitToMedia(el, fit) {
    el.style.left = fit.offX + 'px';
    el.style.top = fit.offY + 'px';
    el.style.width = fit.dispW + 'px';
    el.style.height = fit.dispH + 'px';
}

function polarToCartesian(cx, cy, r, angleDeg) {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcSegmentPath(cx, cy, rOuter, rInner, startDeg, endDeg) {
    const outerStart = polarToCartesian(cx, cy, rOuter, startDeg);
    const outerEnd = polarToCartesian(cx, cy, rOuter, endDeg);
    const innerStart = polarToCartesian(cx, cy, rInner, endDeg);
    const innerEnd = polarToCartesian(cx, cy, rInner, startDeg);
    const largeArc = (endDeg - startDeg) % 360 > 180 ? 1 : 0;
    return `M ${outerStart.x} ${outerStart.y} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y} L ${innerStart.x} ${innerStart.y} A ${rInner} ${rInner} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y} Z`;
}

function renderRing() {
    const rect = colorsStage.getBoundingClientRect();
    colorsRingSvg.setAttribute('width', rect.width);
    colorsRingSvg.setAttribute('height', rect.height);
    colorsRingSvg.innerHTML = '';

    const { cx, cy, r, rot } = ringState;
    const colors = COLOR_PALETTES[currentPaletteKey].colors;
    const n = colors.length;
    const seg = 360 / n;
    const gap = 3;
    const rInner = r;
    const rOuter = rInner + clampNum(r * 0.22, 10, 30);
    const ns = 'http://www.w3.org/2000/svg';

    colors.forEach((color, i) => {
        const startDeg = rot + i * seg + gap / 2;
        const endDeg = rot + (i + 1) * seg - gap / 2;
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', arcSegmentPath(cx, cy, rOuter, rInner, startDeg, endDeg));
        path.setAttribute('fill', color);
        colorsRingSvg.appendChild(path);
    });

    const maskCss = `radial-gradient(circle at ${cx}px ${cy}px, rgba(0,0,0,0) ${Math.max(r - 1, 0)}px, rgba(0,0,0,1) ${r + 1}px)`;
    colorsDim.style.webkitMaskImage = maskCss;
    colorsDim.style.maskImage = maskCss;
}

function setRing(cx, cy, r, rot) {
    const rect = colorsStage.getBoundingClientRect();
    ringState.cx = clampNum(cx, 0, rect.width);
    ringState.cy = clampNum(cy, 0, rect.height);
    ringState.r = clampNum(r, rect.width * 0.08, rect.width * 0.5);
    ringState.rot = ((rot % 360) + 360) % 360;
    ringState.stageWidthAtSet = rect.width;
    colorsSizeSlider.value = Math.round((ringState.r / rect.width) * 100);
    colorsRotateSlider.value = Math.round(ringState.rot);
    renderRing();
}

function setRingPosition(cx, cy) {
    const rect = colorsStage.getBoundingClientRect();
    ringState.cx = clampNum(cx, 0, rect.width);
    ringState.cy = clampNum(cy, 0, rect.height);
    renderRing();
}

function lerp(a, b, t) { return a + (b - a) * t; }

// Lightweight per-frame update used by the live-tracking smoother: skips the
// slider DOM writes setRing() does, since those only need to move a few times
// a second, not every animation frame.
function applyRingFrame(cx, cy, r) {
    const rect = colorsStage.getBoundingClientRect();
    ringState.cx = clampNum(cx, 0, rect.width);
    ringState.cy = clampNum(cy, 0, rect.height);
    ringState.r = clampNum(r, rect.width * 0.08, rect.width * 0.5);
    ringState.stageWidthAtSet = rect.width;
    renderRing();
}

function smoothTrackingLoop() {
    if (!webcamStream || colorsVideo.style.display === 'none') { smoothRafId = null; return; }
    if (ringTarget && !liveTrackingPaused && !isDraggingRing) {
        const closeEnough = Math.abs(ringState.cx - ringTarget.cx) < 0.3
            && Math.abs(ringState.cy - ringTarget.cy) < 0.3
            && Math.abs(ringState.r - ringTarget.r) < 0.3;
        if (!closeEnough) {
            applyRingFrame(
                lerp(ringState.cx, ringTarget.cx, 0.22),
                lerp(ringState.cy, ringTarget.cy, 0.22),
                lerp(ringState.r, ringTarget.r, 0.22)
            );
        }
    }
    smoothRafId = requestAnimationFrame(smoothTrackingLoop);
}

function hasMedia() { return colorsPhoto.style.display !== 'none' || colorsVideo.style.display !== 'none'; }

async function detectAndPlaceRing(imgEl) {
    colorsHint.textContent = 'finding your face…';
    const fit = computeCoverFit(imgEl.naturalWidth, imgEl.naturalHeight);
    applyFitToMedia(colorsPhoto, fit);
    colorsPhoto.style.display = 'block';

    const ready = await ensureFaceApiLoaded();
    if (ready) {
        try {
            const det = await faceapi.detectSingleFace(imgEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }));
            if (det) {
                const box = det.box;
                const cx = fit.offX + (box.x + box.width / 2) * fit.scale;
                const cy = fit.offY + (box.y + box.height / 2) * fit.scale;
                const r = (Math.max(box.width, box.height) / 2) * 1.35 * fit.scale;
                setRing(cx, cy, r, ringState.rot);
                colorsHint.textContent = 'found you! not quite right? drag the ring or use the sliders below.';
                return;
            }
        } catch (e) { /* fall through to manual default */ }
    }
    colorsHint.textContent = "couldn't auto-detect a face — drag the ring around and resize it to line it up!";
    setRing(fit.boxW / 2, fit.boxH * 0.42, Math.min(fit.boxW, fit.boxH) * 0.26, ringState.rot);
}

function showWorkspace() { colorsWorkspace.classList.add('is-active'); }

function setTrackingPaused(paused) {
    liveTrackingPaused = paused;
    colorsTrackToggleBtn.textContent = paused ? 'resume live tracking' : 'pause live tracking';
}

async function startLiveTracking() {
    const ready = await ensureFaceApiLoaded();
    if (!ready) {
        colorsHint.textContent = "couldn't load face detection — drag the ring to line it up manually!";
        return;
    }
    // Detection runs on its own (slower) cadence and just updates a target;
    // smoothTrackingLoop() eases the visible ring toward that target every
    // frame, so motion stays fluid even between detection ticks.
    const tick = async () => {
        if (!webcamStream || colorsVideo.style.display === 'none') return;
        if (!liveTrackingPaused) {
            try {
                const det = await faceapi.detectSingleFace(colorsVideo, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }));
                if (det && webcamStream) {
                    const fit = computeCoverFit(colorsVideo.videoWidth, colorsVideo.videoHeight);
                    const box = det.box;
                    // the picture is shown mirrored, so the ring has to be too: flip the face's x
                    const mirroredX = colorsVideo.videoWidth - (box.x + box.width / 2);
                    const cx = fit.offX + mirroredX * fit.scale;
                    const cy = fit.offY + (box.y + box.height / 2) * fit.scale;
                    const r = (Math.max(box.width, box.height) / 2) * 1.35 * fit.scale;
                    ringTarget = { cx, cy, r };
                    colorsSizeSlider.value = Math.round((r / fit.boxW) * 100);
                    colorsHint.textContent = 'tracking your face live! drag the ring or use the sliders to fine-tune anytime.';
                }
            } catch (e) { /* skip this tick */ }
        }
        if (webcamStream) liveTrackingTimer = setTimeout(tick, 280);
    };
    tick();
    if (!smoothRafId) smoothRafId = requestAnimationFrame(smoothTrackingLoop);
}

function stopLiveTracking() {
    if (liveTrackingTimer) { clearTimeout(liveTrackingTimer); liveTrackingTimer = null; }
    if (smoothRafId) { cancelAnimationFrame(smoothRafId); smoothRafId = null; }
    ringTarget = null;
    setTrackingPaused(false);
}

function stopWebcam() {
    if (webcamStream) {
        webcamStream.getTracks().forEach(t => t.stop());
        webcamStream = null;
    }
    stopLiveTracking();
    colorsWebcamBtnRow.style.display = 'none';
}

function loadPhoto(src) {
    stopWebcam();
    colorsVideo.style.display = 'none';
    showWorkspace();
    colorsPhoto.onload = () => detectAndPlaceRing(colorsPhoto);
    colorsPhoto.src = src;
}

colorsUploadBtn.addEventListener('click', () => colorsFileInput.click());
colorsFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => loadPhoto(ev.target.result);
    reader.readAsDataURL(file);
    colorsFileInput.value = '';
});

colorsWebcamBtn.addEventListener('click', async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        colorsHint.textContent = "your browser doesn't support webcam access here — try uploading a photo instead!";
        return;
    }
    try {
        webcamStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    } catch (err) {
        colorsHint.textContent = "couldn't access your webcam — check your browser's camera permissions!";
        return;
    }
    colorsPhoto.style.display = 'none';
    showWorkspace();
    colorsVideo.srcObject = webcamStream;
    colorsWebcamBtnRow.style.display = 'flex';
    setTrackingPaused(false);
    colorsHint.textContent = 'finding your face…';
    colorsVideo.onloadedmetadata = () => {
        const fit = computeCoverFit(colorsVideo.videoWidth, colorsVideo.videoHeight);
        applyFitToMedia(colorsVideo, fit);
        colorsVideo.style.display = 'block';
        setRing(fit.boxW / 2, fit.boxH * 0.42, Math.min(fit.boxW, fit.boxH) * 0.26, ringState.rot);
        startLiveTracking();
    };
});

colorsTrackToggleBtn.addEventListener('click', () => setTrackingPaused(!liveTrackingPaused));

colorsCaptureBtn.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    canvas.width = colorsVideo.videoWidth;
    canvas.height = colorsVideo.videoHeight;
    const cctx = canvas.getContext('2d');
    cctx.translate(canvas.width, 0); cctx.scale(-1, 1);   // keep the capture mirrored, like the live view
    cctx.drawImage(colorsVideo, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    stopWebcam();
    colorsVideo.style.display = 'none';
    colorsPhoto.onload = () => detectAndPlaceRing(colorsPhoto);
    colorsPhoto.src = dataUrl;
});

colorsStage.addEventListener('pointerdown', (e) => {
    if (!hasMedia()) return;
    if (webcamStream && !liveTrackingPaused) setTrackingPaused(true);
    isDraggingRing = true;
    colorsStage.setPointerCapture(e.pointerId);
    const rect = colorsStage.getBoundingClientRect();
    dragStart = { x: e.clientX - rect.left, y: e.clientY - rect.top, cx: ringState.cx, cy: ringState.cy };
});
colorsStage.addEventListener('pointermove', (e) => {
    if (!isDraggingRing) return;
    const rect = colorsStage.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    setRingPosition(dragStart.cx + (x - dragStart.x), dragStart.cy + (y - dragStart.y));
});
colorsStage.addEventListener('pointerup', () => { isDraggingRing = false; });
colorsStage.addEventListener('pointercancel', () => { isDraggingRing = false; });

colorsSizeSlider.addEventListener('input', () => {
    if (webcamStream && !liveTrackingPaused) setTrackingPaused(true);
    const rect = colorsStage.getBoundingClientRect();
    ringState.r = clampNum((Number(colorsSizeSlider.value) / 100) * rect.width, rect.width * 0.08, rect.width * 0.5);
    ringState.stageWidthAtSet = rect.width;
    renderRing();
});
colorsRotateSlider.addEventListener('input', () => {
    ringState.rot = Number(colorsRotateSlider.value);
    renderRing();
});

function selectPalette(key) {
    currentPaletteKey = key;
    colorsPaletteRow.querySelectorAll('.colors-palette-btn').forEach(b => b.classList.toggle('active', b.dataset.key === key));
    renderRing();
}

function buildPaletteButtons() {
    colorsPaletteRow.innerHTML = '';
    PALETTE_FAMILIES.forEach((family) => {
        const group = document.createElement('div');
        group.className = 'colors-palette-family';
        const groupLabel = document.createElement('div');
        groupLabel.className = 'colors-palette-family-label';
        groupLabel.textContent = family;
        group.appendChild(groupLabel);

        const groupBtns = document.createElement('div');
        groupBtns.className = 'colors-palette-family-btns';
        Object.entries(COLOR_PALETTES).filter(([, p]) => p.family === family).forEach(([key, palette]) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.key = key;
            btn.className = 'colors-palette-btn' + (key === currentPaletteKey ? ' active' : '');
            btn.textContent = palette.label.replace(family, '').trim() || palette.label;
            btn.addEventListener('click', () => selectPalette(key));
            groupBtns.appendChild(btn);
        });
        group.appendChild(groupBtns);
        colorsPaletteRow.appendChild(group);
    });
}
buildPaletteButtons();

window.addEventListener('resize', debounce(() => {
    if (!hasMedia() || !ringState.stageWidthAtSet) return;
    const rect = colorsStage.getBoundingClientRect();
    if (rect.width === 0) return;
    const scale = rect.width / ringState.stageWidthAtSet;
    ringState.cx *= scale; ringState.cy *= scale; ringState.r *= scale;
    ringState.stageWidthAtSet = rect.width;
    if (colorsPhoto.style.display !== 'none' && colorsPhoto.naturalWidth) {
        applyFitToMedia(colorsPhoto, computeCoverFit(colorsPhoto.naturalWidth, colorsPhoto.naturalHeight));
    } else if (colorsVideo.style.display !== 'none' && colorsVideo.videoWidth) {
        applyFitToMedia(colorsVideo, computeCoverFit(colorsVideo.videoWidth, colorsVideo.videoHeight));
    }
    renderRing();
}, 150));

document.addEventListener('pagechange', (e) => {
    if (e.detail.toy !== 'colors') stopWebcam();
    if (e.detail.toy !== 'photobooth') stopBooth();
});



// ── Photobooth ───────────────────────────────────────────────────────────────
//
// The camera is drawn onto a canvas rather than shown directly, so the funhouse
// filters bend the live view exactly the way they bend the photo. Each shot is
// kept as the raw camera frame plus its look (a colour filter and, maybe, a
// warp); the strip is re-rendered from those whenever something changes. That is
// what makes editing afterwards possible, within limits: a finished strip can
// have its colour filters changed, a photo retaken, a background and stickers
// added. Warps only apply while shooting. Nothing leaves the browser.

// Add a layout by adding a row: shots = cols × rows.
const BOOTH_LAYOUTS = [
    { key: 'strip3', label: '1×3', cols: 1, rows: 3 },
    { key: 'strip4', label: '1×4', cols: 1, rows: 4 },
    { key: 'grid4', label: '2×2', cols: 2, rows: 2 },
    { key: 'grid6', label: '2×3', cols: 2, rows: 3 },
    { key: 'single', label: '1×1', cols: 1, rows: 1 },
];

// `css` is a plain canvas/CSS filter; `warp` bends the picture itself. Filters
// without a warp are "colour" filters, the only kind that can be changed later.
const BOOTH_FILTERS = [
    { key: 'none', label: 'as is', css: 'none' },
    { key: 'bw', label: 'b&w', css: 'grayscale(1) contrast(1.08)' },
    { key: 'sepia', label: 'sepia', css: 'sepia(0.62) contrast(1.02)' },
    { key: 'dreamy', label: 'dreamy', css: 'saturate(1.35) brightness(1.08)' },
    { key: 'wave', label: 'wavy', css: 'none', warp: 'wave' },
    { key: 'bulge', label: 'fisheye', css: 'none', warp: 'bulge' },
    { key: 'pinch', label: 'pinch', css: 'none', warp: 'pinch' },
    { key: 'wide', label: 'wide', css: 'none', warp: 'wide' },
    { key: 'tall', label: 'tall', css: 'none', warp: 'tall' },
    { key: 'twin', label: 'twins', css: 'none', warp: 'twin' },
];
const BOOTH_COLORS = BOOTH_FILTERS.filter(f => !f.warp);
// Mirrors are picked while shooting; colours are picked afterwards, on the edit tab. Each only
// ever shows on its own tab. "normal" is the no-mirror choice.
const BOOTH_WARPS = [{ key: 'none', label: 'normal', css: 'none' }, ...BOOTH_FILTERS.filter(f => f.warp)];
const colorFilter = (key) => BOOTH_COLORS.find(f => f.key === key) || BOOTH_COLORS[0];
// what a shot looks like right now: its colour filter, plus its warp if it has one
const lookOf = (shot) => ({ css: colorFilter(shot.color).css, warp: shot.warp || null });

// Add a paper by adding a row. `grid` draws graph-paper lines over the fill.
const BOOTH_PAPERS = [
    { key: 'cream', label: 'cream', fill: '#fffdf6', ink: '#1a1008' },
    { key: 'graph', label: 'graph', fill: '#fffdf6', ink: '#1a1008', grid: '#d3e0c6' },
    { key: 'sage', label: 'sage', fill: '#b9cba3', ink: '#1a1008' },
    { key: 'night', label: 'night', fill: '#1a1008', ink: '#fdf6e9' },
];

const BOOTH_MODES = [
    { key: 'auto', label: 'all at once', help: 'one shot straight after another' },
    { key: 'step', label: 'one at a time', help: 'pause after each shot, so you can change the filter' },
];
const BOOTH_TIMERS = [{ key: '3', label: '3s', secs: 3 }, { key: '5', label: '5s', secs: 5 }, { key: '10', label: '10s', secs: 10 }];
const BOOTH_STICKERS = [{ key: 'smile', label: 'add ☺' }];
const BOOTH_CAPTION_MAX = 24;
const BOOTH_BG_MAX = 2200;   // longest side kept of an uploaded background, in pixels

const boothVideo = document.getElementById('booth-video');
const boothPreview = document.getElementById('booth-preview');
const boothFrame = document.getElementById('booth-frame');
const boothFlash = document.getElementById('booth-flash');
const boothCount = document.getElementById('booth-count');
const boothStrip = document.getElementById('booth-strip');
const boothHint = document.getElementById('booth-hint');
const boothStartBtn = document.getElementById('booth-start');
const boothShootBtn = document.getElementById('booth-shoot');
const boothSaveBtn = document.getElementById('booth-save');
const boothAgainBtn = document.getElementById('booth-again');
const boothPick = document.getElementById('booth-pick');
const boothLockHint = document.getElementById('booth-lockhint');
const boothPickInfo = document.getElementById('booth-pickinfo');
const boothCaptionInput = document.getElementById('booth-caption');
const boothCapCount = document.getElementById('booth-capcount');
const boothDateBox = document.getElementById('booth-showdate');

let boothStream = null;
let boothLayout = BOOTH_LAYOUTS[0];
let boothFilter = BOOTH_WARPS[0];     // the mirror the next shot is taken with
let boothPaper = BOOTH_PAPERS[0];
let boothMode = BOOTH_MODES[0];
let boothTimer = BOOTH_TIMERS[0];
let boothCaption = "anh's notebook";
let boothShowDate = true;
let boothBg = null;             // { img, quarter, fine, zoom, cx, cy }: an uploaded background and how it's cropped
let boothShots = [];            // [{ raw, color, warp, t }]; raw = the unfiltered camera frame
let boothStickers = [];         // [{ key, x, y, size }] in strip pixels
let boothSticker = null;        // the sticker armed for placing, if any
let boothSel = -1;              // the photo picked for editing
let boothBusy = false;          // a series is in progress
let boothPaused = false;        // ...and it's waiting between shots ("one at a time")
let boothResume = null;
let boothProgress = { n: 0, total: 0 };
let boothRaf = null;
let boothSession = 0;

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const boothSlots = () => boothLayout.cols * boothLayout.rows;
const boothComplete = () => { const n = boothSlots(); for (let i = 0; i < n; i++) if (!boothShots[i]) return false; return true; };
const boothAny = () => boothShots.some(Boolean);
const boothReviewing = () => !boothBusy && boothComplete();
// Filters can change while idle, and between shots in "one at a time" mode, but
// not in the middle of an "all at once" run.
const boothFilterLocked = () => boothBusy && !boothPaused;

// ── chips ──

function chipRow(id, items, current, onPick, isLocked, onLocked) {
    const row = document.getElementById(id);
    row.innerHTML = '';
    items.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip' + (item.key === current().key ? ' active' : '');
        btn.textContent = item.label;
        if (item.help) btn.title = item.help;
        btn.addEventListener('click', () => {
            if (isLocked && isLocked()) { if (onLocked) onLocked(); return; }
            onPick(item);
            row.querySelectorAll('.chip').forEach(b => b.classList.toggle('active', b === btn));
        });
        row.appendChild(btn);
    });
}

chipRow('booth-layouts', BOOTH_LAYOUTS, () => boothLayout, (l) => { boothLayout = l; resetStrip(); }, () => boothBusy);
chipRow('booth-modes', BOOTH_MODES, () => boothMode, (m) => { boothMode = m; refreshBooth(); }, () => boothBusy);
chipRow('booth-timers', BOOTH_TIMERS, () => boothTimer, (t) => { boothTimer = t; }, () => boothBusy);
chipRow('booth-backdrops', BOOTH_PAPERS, () => boothPaper, (p) => { boothPaper = p; applyPaper(); drawStrip(); });

// The filter row holds two sets that are picked at different times and only ever show on their own tab:
//   mirrors (+ "normal"): chosen while shooting, for the next shot; locked during an all-at-once run
//   colours: chosen afterwards on the edit tab, for the picked photo (or every photo if none is picked)
const filterRow = document.getElementById('booth-filters');
BOOTH_WARPS.forEach((f) => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'chip f-warp'; btn.textContent = f.label; btn.dataset.key = f.key;
    btn.addEventListener('click', () => {
        if (boothFilterLocked()) { boothHint.textContent = 'mirrors are locked while shooting. pick "one at a time" to change them between shots.'; return; }
        boothFilter = f;
        refreshBooth();
    });
    filterRow.appendChild(btn);
});
BOOTH_COLORS.forEach((f) => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'chip f-color'; btn.textContent = f.label; btn.dataset.key = f.key;
    btn.addEventListener('click', () => {
        if (!boothReviewing()) { boothHint.textContent = 'take your photos first, then pick a colour here.'; return; }
        const targets = boothSel >= 0 ? [boothSel] : boothShots.map((_, i) => i);
        targets.forEach(i => { if (boothShots[i]) boothShots[i].color = f.key; });
        drawStrip(); refreshBooth();
    });
    filterRow.appendChild(btn);
});

function refreshFilterChips() {
    const reviewing = boothReviewing();
    // the colour of the picked photo, or the shared one if every photo matches
    const colors = reviewing ? (boothSel >= 0 ? [boothShots[boothSel]] : boothShots).filter(Boolean).map(s => s.color) : [];
    const shared = colors.length && colors.every(c => c === colors[0]) ? colors[0] : null;
    filterRow.querySelectorAll('.chip').forEach((b) => {
        if (b.classList.contains('f-warp')) { b.classList.toggle('active', b.dataset.key === boothFilter.key); return; }
        b.classList.toggle('active', b.dataset.key === shared);
        b.classList.toggle('is-off', !reviewing);
    });
}

const stickerRow = document.getElementById('booth-stickers');
BOOTH_STICKERS.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip sticker-chip'; b.textContent = s.label; b.dataset.key = s.key; b.title = 'add a smiley to the strip';
    b.addEventListener('click', () => {
        if (!boothReviewing()) return;
        boothSticker = boothSticker && boothSticker.key === s.key ? null : s;
        stickerRow.querySelectorAll('.chip').forEach(x => x.classList.toggle('active', !!boothSticker && x.dataset.key === boothSticker.key));
        boothStrip.classList.toggle('is-placing', !!boothSticker);
        boothHint.textContent = boothSticker ? 'click the strip to place the smiley.' : '';
    });
    stickerRow.appendChild(b);
});

// the preview's mat shows the paper you picked
function applyPaper() {
    document.querySelector('.booth-page').style.setProperty('--booth-paper', boothPaper.fill);
}
applyPaper();

// tabs: shoot / edit
// On a phone the edit tab shows one section at a time (a row of buttons picks which), so the
// strip you're editing keeps most of the screen. On the very shortest phones the shoot tab
// does the same. Taller screens and desktop show everything at once.
const BOOTH_SECTIONS = {
    shoot: [['filter', 'filter'], ['layout', 'layout'], ['shots', 'shots'], ['timer', 'timer']],
    edit: [['filter', 'colour'], ['paper', 'paper'], ['background', 'background'], ['caption', 'caption'], ['stickers', 'smiley'], ['photo', 'retake']],
};
const tinyPhone = window.matchMedia('(max-height: 480px), (max-width: 760px) and (max-height: 600px)');
const secBar = document.getElementById('booth-secbar');
const boothSecFor = { shoot: 'layout', edit: null };
let boothPane = 'shoot';
function openSection(key) {
    boothSecFor[boothPane] = key;
    document.querySelector('.booth-page').dataset.sec = key;
    secBar.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.secbtn === key));
    document.querySelectorAll('.booth-page [data-sec]').forEach(g => g.classList.toggle('is-open-sec', g.dataset.sec === key));
    afterLayout(positionPick);
}
function renderSecBar(pane) {
    secBar.innerHTML = '';
    BOOTH_SECTIONS[pane].forEach(([key, label]) => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = label; b.dataset.secbtn = key;   // (not data-sec: that marks the sections themselves)
        b.addEventListener('click', () => openSection(key));
        secBar.appendChild(b);
    });
}

function showBoothPane(name) {
    boothPane = name;
    document.querySelectorAll('#booth-tabs button').forEach(x => x.classList.toggle('active', x.dataset.pane === name));
    document.querySelectorAll('.booth-pane').forEach(p => { p.hidden = p.dataset.pane !== name; });
    document.querySelector('.booth-page').dataset.pane = name;   // lets the phone layout give the strip the room
    renderSecBar(name);
    openSection(boothSecFor[name] || (boothReviewing() ? 'filter' : 'paper'));
    // the layout under the strip just changed shape, so the picked-photo highlight has to follow it
    afterLayout(positionPick);   // (rAF plus a timer fallback: rAF alone can be throttled)
}
document.querySelectorAll('#booth-tabs button').forEach((b) => b.addEventListener('click', () => showBoothPane(b.dataset.pane)));
showBoothPane('shoot');

// caption: limited length, optional, and the date can go too
boothCaptionInput.maxLength = BOOTH_CAPTION_MAX;
boothCaptionInput.value = boothCaption;
const syncCaption = () => {
    boothCaption = boothCaptionInput.value.slice(0, BOOTH_CAPTION_MAX);
    boothCapCount.textContent = `${boothCaption.length}/${BOOTH_CAPTION_MAX}`;
    drawStrip();
};
boothCaptionInput.addEventListener('input', syncCaption);
boothDateBox.addEventListener('change', () => { boothShowDate = boothDateBox.checked; drawStrip(); });
boothCapCount.textContent = `${boothCaption.length}/${BOOTH_CAPTION_MAX}`;

// ── drawing the live picture ──

// Paints one frame of `src` (the live camera, or a stored raw frame) into ctx at
// dw×dh, mirrored like a real booth, with the filter ({css, warp}) applied. The
// same routine draws the preview, the shot, and every re-render of a shot.
function paintFrame(ctx, dw, dh, t, src = boothVideo, filter = boothFilter) {
    const vw = src.videoWidth || src.width, vh = src.videoHeight || src.height;
    if (!vw) return false;
    const warp = filter.warp;

    // Crop the camera to the output shape. The bending warps sample the camera
    // differently per slice rather than moving the slices around, so the frame
    // always stays full, with no gaps at the edges.
    let aspect = dw / dh;
    if (warp === 'wide') aspect *= 0.68;
    if (warp === 'tall') aspect /= 0.68;
    const bends = warp === 'wave' || warp === 'bulge' || warp === 'pinch';
    const margin = bends ? 0.84 : 1; // room to sample outside the base crop
    const sw = Math.min(vw, vh * aspect) * margin;
    const sh = (sw / aspect);
    const sx = (vw - sw) / 2;
    const sy = (vh - sh) / 2;

    ctx.save();
    ctx.clearRect(0, 0, dw, dh);
    ctx.filter = filter.css || 'none';
    ctx.translate(dw, 0);
    ctx.scale(-1, 1); // selfie mirror

    if (warp === 'twin') {
        // one half of you, mirrored onto the other
        ctx.drawImage(src, sx, sy, sw / 2, sh, 0, 0, dw / 2, dh);
        ctx.save();
        ctx.translate(dw, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(src, sx, sy, sw / 2, sh, 0, 0, dw / 2, dh);
        ctx.restore();
    } else if (bends) {
        const N = 80;
        const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
        for (let i = 0; i < N; i++) {
            const p = i / N;
            let srcW = sw, srcX = sx;
            if (warp === 'wave') srcX = sx + Math.sin(p * Math.PI * 3 + t) * sw * 0.06;
            if (warp === 'bulge') srcW = sw * (1 - 0.26 * Math.sin(p * Math.PI)); // middle magnified
            if (warp === 'pinch') srcW = sw * (1 + 0.30 * Math.sin(p * Math.PI)); // middle squeezed
            srcW = clamp(srcW, 8, vw);
            if (warp !== 'wave') srcX = sx + (sw - srcW) / 2;
            srcX = clamp(srcX, 0, vw - srcW);
            // each slice fills the full output width, so nothing is left blank
            ctx.drawImage(src, srcX, sy + p * sh, srcW, sh / N, 0, p * dh, dw, dh / N + 1);
        }
    } else {
        ctx.drawImage(src, sx, sy, sw, sh, 0, 0, dw, dh);
    }
    ctx.restore();
    return true;
}

function sizePreview() {
    const r = boothFrame.getBoundingClientRect();
    if (!r.width) return;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    boothPreview.width = Math.round(r.width * scale);
    boothPreview.height = Math.round(r.height * scale);
}

function boothLoop(ts) {
    if (!boothStream) return;
    if (boothFrame.offsetParent) {   // no point painting a view nobody can see
        sizePreview();
        paintFrame(boothPreview.getContext('2d'), boothPreview.width, boothPreview.height, ts / 380);
    }
    boothRaf = requestAnimationFrame(boothLoop);
}

// ── an uploaded background: cropped, zoomed and rotated ──
//
// The crop is stored independently of the strip's size (a zoom relative to the
// least that covers it, a centre point in the picture's own pixels, and a
// rotation), so it keeps covering the strip when the layout or caption changes.

function bgGeom(w, h, bg) {
    const th = (bg.quarter * 90 + bg.fine) * Math.PI / 180;
    const c = Math.abs(Math.cos(th)), s = Math.abs(Math.sin(th));
    // half-extents of the w×h window, measured along the picture's own axes
    const hx = (w / 2) * c + (h / 2) * s, hy = (w / 2) * s + (h / 2) * c;
    const iw = bg.img.width, ih = bg.img.height;
    const base = Math.max(2 * hx / iw, 2 * hy / ih);       // the smallest scale that still covers
    const sc = base * bg.zoom;
    return { th, sc, iw, ih, maxX: Math.max(0, iw / 2 - hx / sc), maxY: Math.max(0, ih / 2 - hy / sc) };
}
function clampBg(bg, w, h) {
    const g = bgGeom(w, h, bg);
    bg.cx = Math.min(g.maxX, Math.max(-g.maxX, bg.cx));
    bg.cy = Math.min(g.maxY, Math.max(-g.maxY, bg.cy));
}
function paintBg(ctx, w, h, bg) {
    const g = bgGeom(w, h, bg);
    const cx = Math.min(g.maxX, Math.max(-g.maxX, bg.cx)), cy = Math.min(g.maxY, Math.max(-g.maxY, bg.cy));
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(g.th);
    ctx.scale(g.sc, g.sc);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bg.img, -g.iw / 2 - cx, -g.ih / 2 - cy);
    ctx.restore();
}

// ── the strip ──

function stripGeometry() {
    const pad = 26, gap = 18;
    const frameW = boothLayout.cols === 1 ? 560 : 352;
    const frameH = Math.round(frameW * 3 / 4);
    const caption = boothCaption.trim(), date = boothShowDate;
    const footer = (caption || date) ? (caption ? 42 : 0) + (date ? 30 : 0) + 16 : 0;
    return {
        pad, gap, footer, frameW, frameH, caption, date,
        w: pad * 2 + boothLayout.cols * frameW + gap * (boothLayout.cols - 1),
        h: pad * 2 + boothLayout.rows * frameH + gap * (boothLayout.rows - 1) + footer,
    };
}

function slotRect(i, g) {
    const col = i % boothLayout.cols, row = Math.floor(i / boothLayout.cols);
    return { x: g.pad + col * (g.frameW + g.gap), y: g.pad + row * (g.frameH + g.gap) };
}

// each shot is re-rendered from its raw frame, and cached until something about it changes
function renderShot(shot, g) {
    const key = [shot.color, shot.warp || '-', g.frameW, g.frameH, Math.round(shot.t * 10)].join('|');
    if (shot.cache && shot.cache.key === key) return shot.cache.canvas;
    const c = document.createElement('canvas');
    c.width = g.frameW; c.height = g.frameH;
    paintFrame(c.getContext('2d'), g.frameW, g.frameH, shot.t, shot.raw, lookOf(shot));
    shot.cache = { key, canvas: c };
    return c;
}

function roundedPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// The smiley is the handwriting font's own ☺, drawn with a paper-coloured halo so it reads on any
// background (a photo behind the strip, a dark paper) and looks the same on every device.
function drawSticker(ctx, key, x, y, size, ink, halo) {
    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.font = `${size}px 'Handwritten', 'Segoe UI Symbol', 'Apple Symbols', sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(6, size * 0.12); ctx.strokeStyle = halo; ctx.strokeText('\u263a', 0, 0);
    ctx.fillStyle = ink; ctx.fillText('\u263a', 0, 0);
    ctx.restore();
}

function drawStrip() {
    const g = stripGeometry();
    const slots = boothSlots();
    // a 2-up strip is landscape, so give the strip panel more room
    boothStrip.closest('.booth').classList.toggle('is-wide', boothLayout.cols > 1);
    boothStrip.width = g.w;
    boothStrip.height = g.h;
    const ctx = boothStrip.getContext('2d');

    ctx.fillStyle = boothPaper.fill;
    ctx.fillRect(0, 0, g.w, g.h);
    if (boothBg) {
        paintBg(ctx, g.w, g.h, boothBg);
    } else if (boothPaper.grid) {
        ctx.strokeStyle = boothPaper.grid;
        ctx.lineWidth = 1;
        for (let x = 0; x < g.w; x += 22) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, g.h); ctx.stroke(); }
        for (let y = 0; y < g.h; y += 22) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(g.w, y + 0.5); ctx.stroke(); }
    }

    for (let i = 0; i < slots; i++) {
        const { x, y } = slotRect(i, g);
        const shot = boothShots[i];
        if (shot) {
            ctx.drawImage(renderShot(shot, g), x, y);   // no frame: the photo is the photo
        } else {
            // an empty slot waiting for its shot
            ctx.save();
            if (boothBg) { ctx.globalAlpha = 0.6; ctx.fillStyle = boothPaper.fill; ctx.fillRect(x, y, g.frameW, g.frameH); }
            ctx.globalAlpha = 0.45;
            ctx.strokeStyle = boothPaper.ink;
            ctx.setLineDash([9, 7]);
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, g.frameW - 2, g.frameH - 2);
            ctx.fillStyle = boothPaper.ink;
            ctx.textAlign = 'center';
            ctx.font = "700 34px 'Handwritten', 'Comic Sans MS', cursive";
            ctx.fillText(i + 1, x + g.frameW / 2, y + g.frameH / 2 + 12);
            ctx.restore();
        }
    }

    // footer: a caption and/or the date, each optional
    if (g.footer) {
        if (boothBg) {   // a picture behind the words would swallow them, so they get a paper label
            ctx.save(); ctx.globalAlpha = 0.84; ctx.fillStyle = boothPaper.fill;
            roundedPath(ctx, g.pad, g.h - g.footer - 2, g.w - g.pad * 2, g.footer - 8, 14); ctx.fill(); ctx.restore();
        }
        let y = g.h - g.footer + 6;
        ctx.fillStyle = boothPaper.ink;
        ctx.textAlign = 'center';
        ctx.setLineDash([]);
        if (g.caption) {
            let size = 30;
            ctx.font = `700 ${size}px 'Handwritten', 'Comic Sans MS', cursive`;
            while (size > 14 && ctx.measureText(g.caption).width > g.w - g.pad * 2 - 20) { size -= 1; ctx.font = `700 ${size}px 'Handwritten', 'Comic Sans MS', cursive`; }
            ctx.fillText(g.caption, g.w / 2, y + 28);
            y += 42;
        }
        if (g.date) {
            ctx.globalAlpha = 0.75;
            ctx.font = "400 21px 'Handwritten', 'Comic Sans MS', cursive";
            ctx.fillText(new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), g.w / 2, y + 20);
            ctx.globalAlpha = 1;
        }
    }

    // stickers go on top of everything, each with a paper-coloured halo so it reads on any background
    boothStickers.forEach((s) => drawSticker(ctx, s.key, s.x, s.y, s.size, boothPaper.ink, boothPaper.fill));

    boothStrip.classList.add('is-ready');
    positionPick();
}

// the highlight on the picked photo is part of the page, not of the saved image
function positionPick() {
    if (!boothPick) return;
    if (boothSel < 0 || !boothReviewing() || !boothShots[boothSel]) { boothPick.hidden = true; return; }
    const g = stripGeometry(), { x, y } = slotRect(boothSel, g);
    const cr = boothStrip.getBoundingClientRect(), wr = boothPick.parentElement.getBoundingClientRect();
    if (!cr.width) { boothPick.hidden = true; return; }
    const k = cr.width / boothStrip.width;
    boothPick.hidden = false;
    boothPick.style.left = (cr.left - wr.left + x * k) + 'px';
    boothPick.style.top = (cr.top - wr.top + y * k) + 'px';
    boothPick.style.width = (g.frameW * k) + 'px';
    boothPick.style.height = (g.frameH * k) + 'px';
}
window.addEventListener('resize', () => positionPick());
if (window.ResizeObserver) new ResizeObserver(() => positionPick()).observe(document.querySelector('.booth-strip-wrap'));

function slotAt(px, py) {
    const g = stripGeometry();
    for (let i = 0; i < boothSlots(); i++) {
        const { x, y } = slotRect(i, g);
        if (px >= x && px < x + g.frameW && py >= y && py < y + g.frameH) return i;
    }
    return -1;
}

boothStrip.addEventListener('click', (e) => {
    if (!boothReviewing()) return;
    const r = boothStrip.getBoundingClientRect();
    const px = (e.clientX - r.left) * boothStrip.width / r.width, py = (e.clientY - r.top) * boothStrip.height / r.height;
    if (boothSticker) {
        boothStickers.push({ key: boothSticker.key, x: px, y: py, size: 84 });
        drawStrip(); refreshBooth();
        return;
    }
    const i = slotAt(px, py);
    boothSel = i === boothSel ? -1 : i;
    refreshBooth();
});

function resetStrip() {
    boothShots = []; boothStickers = []; boothSel = -1; boothSticker = null;
    stickerRow.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
    boothStrip.classList.remove('is-placing');
    drawStrip(); // the empty slots double as a preview of the layout
    refreshBooth();
}

// ── buttons, locks, and what's enabled when ──

function refreshBooth() {
    const live = !!boothStream, complete = boothComplete(), reviewing = boothReviewing();
    boothStartBtn.hidden = false;
    boothStartBtn.disabled = boothBusy;                       // switching the camera off mid-run would throw the run away
    boothStartBtn.textContent = live ? 'turn off camera' : 'turn on camera';
    boothStartBtn.classList.toggle('is-on', live);
    boothShootBtn.disabled = boothBusy && !boothPaused;       // (it switches the camera on itself if needed)
    boothShootBtn.textContent = boothPaused ? `next shot ▶ ${boothProgress.n + 1}/${boothProgress.total}` : (complete ? 'take again' : 'take photos');
    boothSaveBtn.hidden = !reviewing;
    boothAgainBtn.hidden = !(boothAny() || boothBusy);
    boothAgainBtn.textContent = boothBusy ? 'stop' : 'clear';

    const lock = (id, on) => document.getElementById(id).classList.toggle('is-locked', on);
    lock('booth-layouts', boothBusy); lock('booth-modes', boothBusy); lock('booth-timers', boothBusy);
    lock('booth-filters', boothFilterLocked());
    boothLockHint.hidden = !boothFilterLocked();
    if (!boothLockHint.hidden) boothLockHint.textContent = 'filters are locked while shooting. choose "one at a time" to change them between shots.';
    refreshFilterChips();

    // the edit tab: a few things work any time, the rest need a finished strip
    stickerRow.classList.toggle('is-locked', !reviewing);
    document.getElementById('booth-sticker-undo').disabled = !reviewing || !boothStickers.length;
    document.getElementById('booth-retake').disabled = !reviewing || boothSel < 0;   // (retaking switches the camera back on)
    document.getElementById('booth-bg-adjust').hidden = !boothBg;
    document.getElementById('booth-bg-remove').hidden = !boothBg;
    document.getElementById('booth-bg-upload').textContent = boothBg ? 'change photo' : 'upload photo';
    boothPickInfo.textContent = !reviewing ? 'take your photos first, then come back here to colour and decorate them.'
        : boothSel >= 0 ? `photo ${boothSel + 1}: the colour you pick changes just this one.${live ? '' : ' retaking turns the camera back on.'}`
        : 'the colour you pick changes every photo. click a photo to pick just one.';
    positionPick();
}

// ── running the booth ──

function grabRaw() {
    const c = document.createElement('canvas');
    c.width = boothVideo.videoWidth; c.height = boothVideo.videoHeight;
    c.getContext('2d').drawImage(boothVideo, 0, 0);
    return c;
}

function stopBooth() {
    boothSession++;
    if (boothResume) { boothResume(false); boothResume = null; }
    if (boothRaf) { cancelAnimationFrame(boothRaf); boothRaf = null; }
    if (boothStream) {
        boothStream.getTracks().forEach(t => t.stop());
        boothStream = null;
    }
    boothVideo.srcObject = null;
    boothFrame.classList.remove('is-live');
    boothCount.classList.remove('is-on');
    boothBusy = false; boothPaused = false;
    boothStartBtn.hidden = false;
    closeCrop(false);
    refreshBooth();
}

// Switches the camera on (a no-op if it already is). Returns whether there is a camera now.
async function ensureCamera() {
    if (boothStream) return true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        boothHint.textContent = "your browser won't let a page use the camera here.";
        return false;
    }
    boothStartBtn.disabled = true;
    boothHint.textContent = 'asking for your camera…';
    try {
        boothStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 } } });
    } catch (err) {
        boothHint.textContent = "couldn't get to your camera — check this site's camera permission.";
        refreshBooth();
        return false;
    }
    boothVideo.srcObject = boothStream;
    boothFrame.classList.add('is-live');
    boothHint.textContent = 'looking good — tap "take photos" when you’re ready!';
    boothRaf = requestAnimationFrame(boothLoop);
    refreshBooth();
    return true;
}

// one button, both ways: switch the camera on, or off whenever you like (your strip stays put)
boothStartBtn.addEventListener('click', async () => {
    if (!boothStream) { await ensureCamera(); return; }
    if (boothBusy) return;
    stopBooth();
    boothHint.textContent = 'camera off. turn it back on whenever you like.';
});
document.getElementById('booth-placeholder').addEventListener('click', () => { if (!boothStream) ensureCamera(); });

// Takes the shots for the given slots, in order. In "one at a time" mode it
// stops after each one until you hit "next shot". `look` fixes the look of the
// shots (a retake keeps the photo's own filter and warp).
async function takeShots(indices, look) {
    if (boothBusy || !boothStream) return;
    boothBusy = true; boothPaused = false; boothSticker = null;
    boothStrip.classList.remove('is-placing');
    stickerRow.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
    boothProgress = { n: 0, total: indices.length };
    refreshBooth();

    const session = boothSession;
    const alive = () => session === boothSession && boothStream;

    for (let k = 0; k < indices.length; k++) {
        boothProgress.n = k;
        boothHint.textContent = indices.length > 1 ? `shot ${k + 1} of ${indices.length}…` : 'get ready…';
        boothCount.classList.add('is-on');
        for (let c = boothTimer.secs; c > 0; c--) {
            boothCount.textContent = c;
            await wait(900);
            if (!alive()) return;
        }
        boothCount.textContent = '';
        boothCount.classList.remove('is-on');
        boothFlash.classList.remove('is-firing');
        void boothFlash.offsetWidth; // restart the animation
        boothFlash.classList.add('is-firing');
        const own = look || { color: boothFilter.warp ? 'none' : boothFilter.key, warp: boothFilter.warp || null };
        boothShots[indices[k]] = { raw: grabRaw(), color: own.color, warp: own.warp, t: performance.now() / 380 };
        drawStrip(); // the strip fills in as you go
        await wait(600);
        if (!alive()) return;

        if (k < indices.length - 1) {
            if (boothMode.key === 'step' && indices.length > 1) {
                boothPaused = true; refreshBooth();
                boothHint.textContent = 'paused. change the filter if you like, then hit "next shot".';
                if (tinyPhone.matches && boothPane === 'shoot') openSection('filter');
                const go = await new Promise((res) => { boothResume = res; });
                boothResume = null; boothPaused = false;
                if (!go || !alive()) return;
                refreshBooth();
            } else {
                await wait(300);
                if (!alive()) return;
            }
        }
    }

    boothBusy = false; boothPaused = false;
    if (indices.length > 1) {
        boothHint.textContent = 'cute! now pick a colour, add touches, or save it.';
        boothSecFor.edit = 'filter';      // colour comes first
        showBoothPane('edit');
    } else {
        boothHint.textContent = 'retaken!';
    }
    refreshBooth();
}

boothShootBtn.addEventListener('click', async () => {
    if (boothPaused && boothResume) { boothResume(true); return; }
    if (boothBusy) return;
    if (!(await ensureCamera())) return;
    showBoothPane('shoot');                   // you need to see yourself
    const n = boothSlots();
    boothShots = []; boothStickers = []; boothSel = -1;   // a new run starts a fresh strip
    drawStrip();
    takeShots(Array.from({ length: n }, (_, i) => i));
});

boothAgainBtn.addEventListener('click', () => {
    if (boothBusy) {                      // "stop": abandon this run
        boothSession++;
        if (boothResume) { boothResume(false); boothResume = null; }
        boothCount.classList.remove('is-on'); boothCount.textContent = '';
        boothBusy = false; boothPaused = false;
        boothHint.textContent = 'stopped.';
        resetStrip();
        return;
    }
    resetStrip();
    boothHint.textContent = 'ready when you are.';
});

boothSaveBtn.addEventListener('click', () => {
    boothStrip.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `photobooth-${new Date().toISOString().slice(0, 10)}.png`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, 'image/png');
});

// ── editing a finished strip ──

document.getElementById('booth-retake').addEventListener('click', async () => {
    if (boothSel < 0 || !boothReviewing()) return;
    // decide which photo and what it looked like *now*: turning the camera on can sit at a
    // permission prompt for a while, and a tap on another photo in the meantime must not change the target
    const i = boothSel, old = boothShots[i];
    if (!old) return;
    if (!(await ensureCamera())) return;
    if (!boothShots[i]) return;               // the strip was cleared while we waited
    const away = getComputedStyle(document.querySelector('.booth-stage')).display === 'none';
    if (away) showBoothPane('shoot');               // you need to see yourself to retake
    takeShots([i], { color: old.color, warp: old.warp }).then(() => { boothSel = i; if (away) showBoothPane('edit'); refreshBooth(); });
});
document.getElementById('booth-sticker-undo').addEventListener('click', () => { boothStickers.pop(); drawStrip(); refreshBooth(); });

// ── background photo: upload, then crop / rotate ──

const cropEl = document.getElementById('booth-crop');
const cropCv = document.getElementById('bgc-canvas');
const cropZoom = document.getElementById('bgc-zoom');
const cropAngle = document.getElementById('bgc-angle');
const bgFile = document.getElementById('booth-bg-file');
let cropDraft = null, cropIsNew = false, cropDrag = null;

document.getElementById('booth-bg-upload').addEventListener('click', () => { bgFile.value = ''; bgFile.click(); });
bgFile.addEventListener('change', () => {
    const file = bgFile.files && bgFile.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
        URL.revokeObjectURL(url);
        const k = Math.min(1, BOOTH_BG_MAX / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');   // keep it a sensible size: a phone photo can be enormous
        c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        openCrop({ img: c, quarter: 0, fine: 0, zoom: 1, cx: 0, cy: 0 }, true);
    };
    img.onerror = () => { URL.revokeObjectURL(url); boothHint.textContent = "couldn't open that file as a picture."; };
    img.src = url;
});
document.getElementById('booth-bg-adjust').addEventListener('click', () => { if (boothBg) openCrop({ ...boothBg }, false); });
document.getElementById('booth-bg-remove').addEventListener('click', () => { boothBg = null; drawStrip(); refreshBooth(); });

function openCrop(bg, isNew) {
    cropDraft = bg; cropIsNew = isNew;
    cropEl.hidden = false;
    // fit the preview to whatever room the page has, at the strip's own proportions
    const g = stripGeometry(), room = document.querySelector('.booth-page');
    const short = window.matchMedia('(max-height: 480px)').matches;   // sideways phone: the controls sit beside the picture
    const availW = short ? Math.min(300, room.clientWidth - 290) : Math.min(420, room.clientWidth - 56);
    const availH = short ? Math.max(100, room.clientHeight - 80) : Math.max(110, room.clientHeight - 238);
    const k = Math.min(availW / g.w, availH / g.h);
    cropCv.width = Math.max(48, Math.round(g.w * k)); cropCv.height = Math.max(48, Math.round(g.h * k));
    cropZoom.value = Math.round(bg.zoom * 100); cropAngle.value = bg.fine;
    clampBg(cropDraft, cropCv.width, cropCv.height);
    drawCrop();
    document.getElementById('bgc-apply').focus();
}
function closeCrop(apply) {
    if (cropEl.hidden) return;
    if (apply && cropDraft) { boothBg = cropDraft; clampBg(boothBg, cropCv.width, cropCv.height); drawStrip(); }
    cropEl.hidden = true; cropDraft = null; cropDrag = null;
    refreshBooth();
}
function drawCrop() {
    if (!cropDraft) return;
    const W = cropCv.width, H = cropCv.height, g = stripGeometry(), k = W / g.w, ctx = cropCv.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    paintBg(ctx, W, H, cropDraft);
    // where the photos will land
    ctx.save();
    for (let i = 0; i < boothSlots(); i++) {
        const { x, y } = slotRect(i, g);
        ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(x * k, y * k, g.frameW * k, g.frameH * k);
        ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#fff'; ctx.strokeRect(x * k + 0.5, y * k + 0.5, g.frameW * k - 1, g.frameH * k - 1);
        ctx.lineDashOffset = 4.5; ctx.strokeStyle = '#1a1008'; ctx.strokeRect(x * k + 0.5, y * k + 0.5, g.frameW * k - 1, g.frameH * k - 1); ctx.lineDashOffset = 0;
    }
    ctx.restore();
}
cropCv.addEventListener('pointerdown', (e) => {
    if (!cropDraft) return;
    cropDrag = { x: e.clientX, y: e.clientY };
    try { cropCv.setPointerCapture(e.pointerId); } catch (err) { /* works without it */ }
});
cropCv.addEventListener('pointermove', (e) => {
    if (!cropDrag || !cropDraft) return;
    const r = cropCv.getBoundingClientRect();
    const dx = (e.clientX - cropDrag.x) * cropCv.width / r.width, dy = (e.clientY - cropDrag.y) * cropCv.height / r.height;
    cropDrag = { x: e.clientX, y: e.clientY };
    // the picture moves with the pointer: undo the rotation, then the scale
    const g = bgGeom(cropCv.width, cropCv.height, cropDraft), c = Math.cos(g.th), s = Math.sin(g.th);
    cropDraft.cx -= (dx * c + dy * s) / g.sc;
    cropDraft.cy -= (-dx * s + dy * c) / g.sc;
    clampBg(cropDraft, cropCv.width, cropCv.height);
    drawCrop();
});
const endCropDrag = () => { cropDrag = null; };
cropCv.addEventListener('pointerup', endCropDrag);
cropCv.addEventListener('pointercancel', endCropDrag);
cropCv.addEventListener('wheel', (e) => {
    if (!cropDraft) return;
    e.preventDefault();
    cropZoom.value = Math.min(400, Math.max(100, +cropZoom.value + (e.deltaY < 0 ? 12 : -12)));
    cropZoom.dispatchEvent(new Event('input'));
}, { passive: false });
cropZoom.addEventListener('input', () => { if (!cropDraft) return; cropDraft.zoom = +cropZoom.value / 100; clampBg(cropDraft, cropCv.width, cropCv.height); drawCrop(); });
cropAngle.addEventListener('input', () => { if (!cropDraft) return; cropDraft.fine = +cropAngle.value; clampBg(cropDraft, cropCv.width, cropCv.height); drawCrop(); });
const turnQuarter = (d) => { if (!cropDraft) return; cropDraft.quarter = (cropDraft.quarter + d + 4) % 4; clampBg(cropDraft, cropCv.width, cropCv.height); drawCrop(); };
document.getElementById('bgc-left').addEventListener('click', () => turnQuarter(-1));
document.getElementById('bgc-right').addEventListener('click', () => turnQuarter(1));
document.getElementById('bgc-apply').addEventListener('click', () => closeCrop(true));
document.getElementById('bgc-cancel').addEventListener('click', () => closeCrop(false));
document.addEventListener('keydown', (e) => { if (!cropEl.hidden && e.key === 'Escape') closeCrop(false); });

// show the empty layout straight away, so the strip isn't a blank gap
resetStrip();
boothHint.textContent = 'turn on your camera to begin.';

// toy cards can carry a drawing; until one exists, drop the slot so the card
// doesn't show a broken image. Images load while the HTML parses, so one may
// already have failed by the time this runs — check as well as listen.
document.querySelectorAll('.toy-art img').forEach(img => {
    const drop = () => img.closest('.toy-art')?.remove();
    if (img.complete && !img.naturalWidth) drop();
    else img.addEventListener('error', drop);
});

// ── Init ─────────────────────────────────────────────────────────────────────

document.querySelectorAll('.page').forEach(page => page.insertAdjacentHTML('beforeend', FOOT_HTML));

function buildAll() {
    if (finishTurn) finishTurn();
    buildResume();
    buildProjects();
    buildGallery();
    refreshPageNumbers();
}

// rebuilds the generated pages, keeping you on the same item / page.
// `verify` re-runs the build once layout has settled: the first pass can measure
// before the webfont has been applied, which packs pages too loosely.
let verifying = false;
function rebuild({ verify = true } = {}) {
    if (verify && !verifying) {
        verifying = true;
        afterLayout(() => { verifying = false; rebuild({ verify: false }); });
    }
    return build();
}

let builtOnce = false;
function build() {
    // on the first build the generated pages didn't exist yet, so the URL
    // couldn't be resolved — go where the link actually pointed
    if (!builtOnce) {
        builtOnce = true;
        buildAll();
        showPage(pageForHash(location.hash), { animate: false });
        return;
    }
    const id = currentPage && sectionOf(currentPage);
    const item = currentPage && (currentPage.dataset.item ?? currentPage.querySelector('[data-jump]')?.dataset.jump);
    const index = id ? sectionPages(id).indexOf(currentPage) : 0;
    buildAll();
    if (!id) return showPage(pageForHash(location.hash), { animate: false });
    const pages = sectionPages(id);
    const hit = item !== undefined && pages.find(p => p.dataset.item === item || p.querySelector(`[data-jump="${item}"]`));
    showPage(hit || pages[Math.min(Math.max(index, 0), pages.length - 1)], { animate: false });
}

// show the hand-written pages straight away
refreshPageNumbers();
showPage(pageForHash(location.hash) || allPages()[0], { animate: false });

// Pages are measured to decide what fits, so they have to be measured with the
// real handwriting font: fallback metrics are wider, which leaves pages half
// empty. document.fonts.ready can resolve before the font has even been asked
// for, so request it by name, and wait two frames afterwards so the swap has
// actually been laid out before anything is measured. The cap keeps the site
// usable if the font never arrives.
const fontCap = setTimeout(() => rebuild(), 2500);
Promise.all([
    document.fonts.load("400 16px 'Handwritten'"),
    document.fonts.load("700 16px 'Handwritten'"),
]).catch(() => {}).then(() => afterLayout(() => { clearTimeout(fontCap); rebuild(); }));

// Re-paginate whenever the page itself changes size — a window resize, but also
// the font swap resizing the divider tabs, which are what set the page's width.
const repaginate = debounce(() => {
    const size = `${paper.clientWidth}x${paper.clientHeight}`;
    if (size === lastSize) return;
    lastSize = size;
    rebuild();
}, 250);
let lastSize = `${paper.clientWidth}x${paper.clientHeight}`;
if (window.ResizeObserver) new ResizeObserver(() => repaginate()).observe(paper);
window.addEventListener('resize', () => repaginate());
