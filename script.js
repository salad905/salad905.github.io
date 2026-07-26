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
    window.scrollTo(0, 0);
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
        title: 'Dogs on Greek Vases',
        category: 'Machine Learning',
        tags: ['Python', 'TensorFlow/PyTorch'],
        color: '#b9cba3',
        rotate: -1.2,
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
        rotate: 0.8,
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
        rotate: -0.5,
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
        rotate: 1.3,
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
        rotate: -1.0,
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
        rotate: 0.6,
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
        rotate: -0.3,
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
        rotate: 1.1,
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
        rotate: -0.8,
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
        rotate: 0.9,
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
        rotate: -1.1,
        paras: [
            `<p><strong>Context.</strong> For my Programming Languages class, we were all asked to make a personal website to be hosted on GitHub. This website looked pretty different when I started, but here we are now.</p>`,
            `<p><strong>Process &amp; Afterthought(s).</strong> It's still ongoing work. I try to update it every now and then when I have the time. I wanted this to be a thing someone can look at to get to know me, professionally or personally. I hope it's doing a good job at that…</p>`,
        ],
    },
];

const PROJECT_CATEGORIES = ['Machine Learning', 'Data Analysis', 'Software Development'];
let projectCategoryFilter = 'all';
let currentProjectList = [];

const projectFilter = document.getElementById('project-filter');
projectFilter.innerHTML = `
    <button class="project-filter-btn active" data-category="all">All</button>
    ${PROJECT_CATEGORIES.map(c => `<button class="project-filter-btn" data-category="${c}">${c}</button>`).join('')}
`;
projectFilter.addEventListener('click', (e) => {
    const btn = e.target.closest('.project-filter-btn');
    if (!btn) return;
    projectFilter.querySelectorAll('.project-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    projectCategoryFilter = btn.dataset.category;
    renderProjects();
});

const projectsGrid = document.getElementById('projects-grid');
function renderProjects() {
    let list = PROJECTS;
    if (projectCategoryFilter !== 'all') list = list.filter(p => p.category === projectCategoryFilter);
    currentProjectList = list;

    projectsGrid.innerHTML = '';
    if (!list.length) {
        projectsGrid.innerHTML = '<p class="projects-empty">No projects match this filter.</p>';
        return;
    }
    list.forEach((p, i) => {
        const btn = document.createElement('button');
        btn.className = 'project-card';
        btn.style.setProperty('--rot', p.rotate + 'deg');
        btn.innerHTML = `
            <div class="sketchy" style="--accent:${p.color}">
                <div class="sketchy-shadow"></div>
                <div class="sketchy-body">
                    <div class="project-card-body">
                        <span class="project-category-badge" style="--accent:${p.color}">${p.category}</span>
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
}
renderProjects();

const projectModal = document.getElementById('project-modal');
function openProjectModal(i) {
    const p = currentProjectList[i];
    document.getElementById('project-modal-sketchy').style.setProperty('--accent', p.color);
    document.getElementById('modal-title').textContent = p.title;
    document.getElementById('modal-tags').innerHTML = p.tags.map(t => `<span class="project-tag">${t}</span>`).join('');
    const category = document.getElementById('modal-category');
    category.textContent = p.category;
    category.style.setProperty('--accent', p.color);
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
