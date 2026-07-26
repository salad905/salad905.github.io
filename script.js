// ── Nav / tab switching ─────────────────────────────────────────────────────

const siteNav = document.querySelector('.site-nav');
function updateNavHeight() {
    document.documentElement.style.setProperty('--nav-height', siteNav.offsetHeight + 'px');
}
updateNavHeight();
window.addEventListener('resize', updateNavHeight);

function showSection(id) {
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
}

document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => showSection(btn.dataset.tab));
});

// ── Resume short/extended toggle ─────────────────────────────────────────────

function showResumeVersion(version) {
    document.querySelectorAll('.resume-version').forEach(el => el.classList.toggle('active', el.dataset.version === version));
    document.querySelectorAll('.resume-toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.version === version));
}

document.querySelectorAll('.resume-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => showResumeVersion(btn.dataset.version));
});

// ── Two truths and a lie ─────────────────────────────────────────────────────

const TRUTHS = [
    { text: 'I have a 1100+ day streak on Duolingo.', lie: false },
    { text: 'I am lactose intolerant.', lie: false },
    { text: "I currently own 4 cameras.", lie: true },
];

const truthsOptions = document.getElementById('truths-options');
const truthsResult = document.getElementById('truths-result');
if (truthsOptions) {
    TRUTHS.forEach((t, i) => {
        const btn = document.createElement('button');
        btn.className = 'truth-option';
        btn.textContent = t.text;
        btn.addEventListener('click', () => {
            if (t.lie) {
                truthsOptions.querySelectorAll('.truth-option').forEach(b => (b.disabled = true));
                btn.classList.add('is-lie');
                truthsResult.textContent = "i own 5 cameras!";
            } else {
                btn.disabled = true;
                btn.classList.add('is-wrong-pick');
                truthsResult.textContent = 'nope, try again';
            }
        });
        truthsOptions.appendChild(btn);
    });
}

// ── Projects data ────────────────────────────────────────────────────────────

const PROJECTS = [
    {
        title: 'Deepfake Generation & Detection',
        tags: ['PyTorch', 'FaceNet', 'OpenCV'],
        stat: '92% accuracy',
        color: '#b9cba3',
        rotate: -1.2,
        paras: [
            `<p><strong>Abstract.</strong> This project addresses the growing threat of deepfake videos by building a machine learning pipeline to detect manipulated facial content. It targets the classification of real vs. fake images, contributing to media authentication efforts.</p>`,
            `<p><strong>Methodology.</strong> Removed background using BiRefNet. Face detection and cropping were performed using MTCNN and facenet-pytorch. Embeddings from a pre-trained FaceNet model were extracted and used to train a classifier. Evaluation included accuracy, confusion matrices, ROC-AUC, and visual inspection of misclassified samples. Currently has a running <a href="https://salad905-space2.hf.space/?__theme=system&deep_link=hVptdHSzaXo" target="_blank" rel="noreferrer">Gradio interface</a>, planning to expand to a Chrome extension.</p>`,
            `<p><strong>Reflection.</strong> Deepfake images are reaching an eery realness. AI will eventually get to the point of complete indistinguishability from real images to the average human eye. I am aware that I can't shoot for anything groundbreaking with this project, but I at the very least hoped for promotion of media literacy and a sense of caution when approaching faces on the internet.</p>`,
        ],
    },
    {
        title: 'Fake News Detector',
        tags: ['Keras', 'NLTK', 'TF-IDF'],
        stat: '98% accuracy',
        color: '#9ab97e',
        rotate: 0.8,
        paras: [
            `<p><strong>Abstract.</strong> Misinformation is an ever-lasting relevant issue. To combat this, we aimed to classify news articles as real or fake using natural language processing and machine learning, aiming to support digital literacy and trust in online information. Full details in our <a href="https://drive.google.com/file/d/1EK490I5k3OPS1GW0fnBfoLVexApzETaZ/view?usp=sharing" target="_blank" rel="noreferrer">paper</a>.</p>`,
            `<p><strong>Methodology.</strong> Found a Kaggle dataset with about 40k articles. Preprocessing steps included tokenization, lemmatization, and feature extraction using Bag of Words and TF-IDF. Several classifiers were tested, including Logistic Regression, Naive Bayes, and Random Forest. A <a href="https://salad905-fake-news-detector.hf.space/?__theme=system&deep_link=hF7hJs8eL14" target="_blank" rel="noreferrer">Gradio interface</a> was created for interactive predictions.</p>`,
            `<p><strong>Reflection.</strong> The lines between "fake" and "real" are ambiguous. As much as this project helped familiarize me with NLP tasks, exploratory data analysis, and building a front-end interface, I found that it's not the most practical.</p>`,
        ],
    },
    {
        title: 'Magic 8 Ball',
        tags: ['HTML', 'CSS', 'JavaScript'],
        stat: '28+ users',
        color: '#7fa06a',
        rotate: -0.5,
        paras: [
            `<p><a href="https://chromewebstore.google.com/detail/fdnbiicphhaahkmaclijpbgnjakajlkj?utm_source=item-share-cb" target="_blank" rel="noreferrer">Link to the extension in the Chrome Web Store</a>.</p><img src="images/Magic 8 Ball.png" alt="Magic 8 Ball extension screenshot">`,
            `<p>This was a fun project I did while trying to gain understanding of how to make a Google extension. I used HTML, CSS, and JavaScript.</p>`,
            `<p>Ask it a question, and the program randomizes 1 of 20 answers (courtesy of <a href="https://magic-8ball.com/magic-8-ball-answers/" target="_blank" rel="noreferrer">this website</a>).</p>`,
        ],
    },
    {
        title: 'Hospital Chairs',
        tags: ['Java', 'Topologies'],
        stat: 'Novel topology',
        color: '#8f9c5e',
        rotate: 1.0,
        paras: [
            `<p>This was my Winter 2024 Collaborative Research Project. We worked in 4 pairs, each tackling a different question. Mine was "Can we come up with a better-performing topology?" The answer is no. But the process is what mattered!</p>`,
            `<p>We learned how to conduct a proper literature review, brainstorm and propose compelling research questions, and make a research poster. We presented at Horizons, Knox College's on-campus research symposium.</p>`,
            `<p>Here's our poster (click to view full size):</p><a href="images/poster.jpg" target="_blank" rel="noreferrer"><img src="images/poster.jpg" alt="Winter Collaborative Project Poster"></a>`,
        ],
    },
];

const projectsGrid = document.getElementById('projects-grid');
PROJECTS.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.className = 'project-card';
    btn.style.setProperty('--rot', p.rotate + 'deg');
    btn.innerHTML = `
        <div class="sketchy" style="--accent:${p.color}">
            <div class="sketchy-shadow"></div>
            <div class="sketchy-body">
                <div class="project-card-body">
                    <h3>${p.title}</h3>
                    <div class="project-tags">${p.tags.map(t => `<span class="project-tag">${t}</span>`).join('')}</div>
                    <div class="project-cta">read all about it &rarr;</div>
                </div>
            </div>
        </div>
    `;
    btn.addEventListener('click', () => openProjectModal(i));
    projectsGrid.appendChild(btn);
});

const projectModal = document.getElementById('project-modal');
function openProjectModal(i) {
    const p = PROJECTS[i];
    document.getElementById('project-modal-sketchy').style.setProperty('--accent', p.color);
    document.getElementById('modal-title').textContent = p.title;
    document.getElementById('modal-tags').innerHTML = p.tags.map(t => `<span class="project-tag">${t}</span>`).join('');
    const stat = document.getElementById('modal-stat');
    stat.textContent = p.stat;
    stat.style.setProperty('--accent', p.color);
    document.getElementById('modal-paras').innerHTML = p.paras.map(html => `<div class="modal-para">${html}</div>`).join('');
    projectModal.classList.add('open');
}
function closeProjectModal() { projectModal.classList.remove('open'); }

document.getElementById('modal-close').addEventListener('click', closeProjectModal);
projectModal.addEventListener('click', (e) => { if (e.target === projectModal) closeProjectModal(); });

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
const ROTATES = [-1.5, 1.2, -0.8, 1.5, -1.2, 0.7, -0.5, 1.0, -1.3];

const galleryGrid = document.getElementById('gallery-grid');

// ── Gallery controls (sort + filter) ──────────────────────────────────────

const CAMERAS = [...new Set(GALLERY.map(p => p.camera))];
let sortOrder = 'oldest';
let cameraFilter = 'all';
let currentList = [];

const galleryControls = document.createElement('div');
galleryControls.className = 'gallery-controls';
galleryControls.innerHTML = `
    <button class="gallery-controls-toggle" type="button" aria-expanded="false">
        <span class="gallery-controls-toggle-label">filter &amp; sort</span>
        <span class="gallery-controls-caret">▾</span>
    </button>
    <div class="gallery-controls-panel">
        <div class="gallery-sort">
            <button class="gallery-sort-btn" data-sort="newest">Newest first</button>
            <button class="gallery-sort-btn active" data-sort="oldest">Oldest first</button>
        </div>
        <div class="gallery-filter">
            <button class="gallery-filter-btn active" data-camera="all">All cameras</button>
            ${CAMERAS.map(c => `<button class="gallery-filter-btn" data-camera="${c}">${c}</button>`).join('')}
        </div>
    </div>
`;
galleryGrid.parentElement.insertBefore(galleryControls, galleryGrid);

const galleryControlsToggle = galleryControls.querySelector('.gallery-controls-toggle');
const galleryControlsPanel = galleryControls.querySelector('.gallery-controls-panel');
galleryControlsToggle.addEventListener('click', () => {
    const isOpen = galleryControlsPanel.classList.toggle('open');
    galleryControlsToggle.setAttribute('aria-expanded', String(isOpen));
});

galleryControls.addEventListener('click', (e) => {
    const sortBtn = e.target.closest('.gallery-sort-btn');
    if (sortBtn) {
        galleryControls.querySelectorAll('.gallery-sort-btn').forEach(b => b.classList.remove('active'));
        sortBtn.classList.add('active');
        sortOrder = sortBtn.dataset.sort;
        renderGallery();
        return;
    }
    const filterBtn = e.target.closest('.gallery-filter-btn');
    if (filterBtn) {
        galleryControls.querySelectorAll('.gallery-filter-btn').forEach(b => b.classList.remove('active'));
        filterBtn.classList.add('active');
        cameraFilter = filterBtn.dataset.camera;
        renderGallery();
    }
});

function renderGallery() {
    let list = GALLERY;
    if (cameraFilter !== 'all') list = list.filter(photo => photo.camera === cameraFilter);
    if (sortOrder === 'newest') list = list.slice().reverse();
    currentList = list;

    galleryGrid.innerHTML = '';
    if (!list.length) {
        galleryGrid.innerHTML = '<p class="gallery-empty">No photos match this filter.</p>';
        return;
    }
    list.forEach((photo, i) => {
        const color = ACCENTS[i % ACCENTS.length];
        const rotate = ROTATES[i % ROTATES.length];
        const card = document.createElement('div');
        card.className = 'photo-card';
        card.style.setProperty('--rot', rotate + 'deg');
        card.style.setProperty('--accent', color);
        card.innerHTML = `
            <div class="photo-card-inner">
                <div class="photo-thumb"><img src="${photo.src}" alt="${photo.caption}" loading="lazy"></div>
                <p class="photo-caption">${photo.caption}</p>
                <p class="photo-meta">${photo.camera} · ${photo.date}</p>
            </div>
        `;
        card.addEventListener('click', () => openLightbox(i));
        galleryGrid.appendChild(card);
    });
}

renderGallery();

// ── Lightbox ─────────────────────────────────────────────────────────────────

const lightbox = document.getElementById('lightbox');
let current = 0;

function updateLightbox() {
    const photo = currentList[current];
    document.getElementById('lightbox-img').src = photo.src;
    document.getElementById('lightbox-img').alt = photo.caption;
    document.getElementById('lightbox-caption').textContent = photo.caption;
    document.getElementById('lightbox-meta').textContent = `${photo.camera} · ${photo.date}`;
    document.getElementById('lightbox-desc').textContent = photo.desc;
    document.getElementById('lightbox-box').style.setProperty('--accent', ACCENTS[current % ACCENTS.length]);
}

function openLightbox(i) {
    current = i;
    updateLightbox();
    lightbox.classList.add('open');
}
function closeLightbox() { lightbox.classList.remove('open'); }
function nextSlide() { current = (current + 1) % currentList.length; updateLightbox(); }
function prevSlide() { current = (current - 1 + currentList.length) % currentList.length; updateLightbox(); }

document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
document.getElementById('lightbox-next').addEventListener('click', nextSlide);
document.getElementById('lightbox-prev').addEventListener('click', prevSlide);
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('open')) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
        return;
    }
    if (projectModal.classList.contains('open') && e.key === 'Escape') closeProjectModal();
});

// ── Init ─────────────────────────────────────────────────────────────────────

showSection('about');
