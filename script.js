const slides = [
    { src: "images/DSCF1837.JPG", caption: `Date taken: February 7th, 2021<br>
        Camera: Fujifilm X-A5<br>
        Description: In Vietnamese culture, yellow chrysanthemums are generally used in the table of "offerings" for ancestors. Our culture is deeply rooted in gratitude, and every 15th day in the lunisolar calendar, we set a table of "offerings" for our ancestors.` },
    { src: "images/DSCF2067.JPG", caption: `Date taken: May 1st, 2021<br>
        Camera: Fujifilm X-A5<br>
        Description: I was on a mini vacation with my family, and they had a cool display of Vietnamese straw hats.` },
    { src: "images/DSCF3806.JPG", caption: `Date taken: January 25th, 2022<br>
        Camera: Fujifilm X-A5<br>
        Description: We went on a little vacation to my parents' hometown for my mom's birthday. This was taken at a beach in the neighboring city. This might be my favorite photo (that I took) ever. There's something so calming about the ocean when no one's around.` },
    { src: "images/DSCF3982.JPG", caption: `Date taken: January 26th, 2022<br>
        Camera: Fujifilm X-A5<br>
        Description: Legend has it that Uncle Ho had a fondness for raising goldfish. It just so happened that he's not around anymore, so there's always someone selling fish food at the pond where he grew up (it's a tourist attraction). They seem hungry. Business for that fish food vendor must not be going too well.` },
    { src: "images/DSCF4091.JPG", caption: `Date taken: January 27th, 2022<br>
        Camera: Fujifilm X-A5<br>
        Description: This was taken at Huong Tich Pagoda in my hometown. It's somewhere we hike everytime we visit my parents' hometown.` },
    { src: "images/000043.JPG", caption: `Date taken: March 30th, 2022<br>
        Camera: Minolta SR101<br>
        Description: My first (and still only) analog SLR. Taken in front of a mirror somewhere in high school.` },
    { src: "images/000038.JPG", caption: `Date taken: April 13th, 2022<br>
        Camera: Minolta SR101<br>
        Description: My high school. The school had a change of leadership and was renovated the year after I left, so I'm very sure this is not how it looks anymore.` },
    { src: "images/000041.JPG", caption: `Date taken: May 29th, 2022<br>
        Camera: Minolta SR101<br>
        Description: My mom. We had a mini girls' trip to Sài Gòn and we took a stroll in a little park.` },
    { src: "images/000058.JPG", caption: `Date taken: June 7th, 2022<br>
        Camera: Minolta SR101<br>
        Description: My high school friends and I took a little trip to Moc Chau, and this photo was taken at a plum farm we visited during that trip.` },
    { src: "images/000039.JPEG", caption: `Date taken: November 11th, 2022<br>
        Camera: Konica Z-UP70<br>
        Description: My parents at my senior photo session. We were all dressed up in graduation gowns and our parents were dressed in traditional Vietnamese dresses or suits.` },
    { src: "images/000052090024.jpg", caption: `Date taken: October 10th, 2022<br>
        Camera: Konica Z-UP70<br>
        Description: This was taken at a cafe near my high school. As you may recognize, this is the background photo of this website.` },
    { src: "images/000055.JPEG", caption: `Date taken: January 15th, 2023<br>
        Camera: Minolta SR101<br>
        Description: This is the street I cross everyday to get to the bus station on my way to high school. I've had my fair share of memories on the pedestrian bridge this photo was taken from.` },
    { src: "images/000035.JPG", caption: `Date taken: August 21st, 2023<br>
        Camera: Minolta SR101<br>
        Description: I happened to be the Vice President of the Photography club at my high school. We were getting ready for one of the first organization fairs at my high school at one of the member's dorm room.` },
    { src: "images/DSC01667.JPG", caption: `Date taken: June 18th, 2024<br>
        Camera: Sony Cybershot DSC-RX100<br>
        Description: Sa Vi is the north-eastern most point of Vietnam. They have a cool Australian pine-shaped building because that is what the area is best known for.` },
    { src: "images/DSC01776.JPG", caption: `Date taken: July 14th, 2024<br>
        Camera: Sony Cybershot DSC-RX100<br>
        Description: I asked my dad why the roofs of most buildings are red. He told me that back in the day, roofs tended to make up of clay tiles, which were naturally red. Red roofs became a signature look, and even roofs with other materials nowadays would still be red.` },
    { src: "images/DSC01977.JPG", caption: `Date taken: August 10th, 2024<br>
        Camera: Sony Cybershot DSC-RX100<br>
        Description: My high school friends and I went to Hang Ma street, known for its bustling holiday markets. Mid-Autumn festival was approaching, so the streets were packed with people looking for decorations.` },
    { src: "images/May101589-R1-019-8.jpg", caption: `Date taken: November 21st, 2024<br>
        Camera: Olympus MJU<br>
        Description: Me and some college friends visited Chicago for a short trip right after we were done with our finals. We did the thing most international students do: take the Red line to Chinatown.` },
    { src: "images/May101589-R1-077-37.jpg", caption: `Date taken: December 28th, 2024<br>
        Camera: Sony Cybershot DSC-RX100<br>
        Description: I travelled solo in Chicago for 3 days. Oh the perks of living 3 hours away from a big city. I took a stroll near Navy Pier, got one of the coolest I ever took, and witnessed a proposal(!!). It was eventful in the most unexpected ways.` }
];

let current = 0;

slides.push({
    src: "images/poster.jpg",
    caption: "Winter Collaborative Project Poster."
});

function showSection(id) {
    document.querySelectorAll('.tab-section').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    document.querySelectorAll('.navbar a').forEach(a => a.classList.remove('active-tab'));
    document.querySelector(`.navbar a[onclick*="${id}"]`).classList.add('active-tab');

    if (id === 'projects') {
        document.querySelectorAll('.project-section').forEach(s => s.style.display = 'none');
        document.querySelectorAll('.sub-navbar button').forEach(b => b.classList.remove('active-sub-tab'));
        const hint = document.getElementById('project-hint');
        if (hint) hint.style.display = '';
        return;
    }
}

function showProject(id) {
    const hint = document.getElementById('project-hint');
    if (hint) hint.style.display = 'none';

    document.querySelectorAll('.project-section').forEach(s => s.style.display = 'none');
    const section = document.getElementById(id);
    if (section) section.style.display = 'block';

    document.querySelectorAll('.sub-navbar button').forEach(b => b.classList.remove('active-sub-tab'));
    const btn = document.querySelector(`.sub-navbar button[onclick*="${id}"]`);
    if (btn) btn.classList.add('active-sub-tab');
}

function openSlideshow(i) {
    current = i;
    updateSlide();
    document.getElementById('slideshow').style.display = 'flex';
}
function closeSlideshow() {
    document.getElementById('slideshow').style.display = 'none';
}
function updateSlide() {
    document.getElementById('slide-img').src = slides[current].src;
    document.getElementById('slide-caption').innerHTML = slides[current].caption;
}
function nextSlide() { current=(current+1)%slides.length; updateSlide(); }
function prevSlide() { current=(current-1+slides.length)%slides.length; updateSlide(); }

document.addEventListener('keydown', e => {
    const vis = document.getElementById('slideshow').style.display==='flex';
    if (!vis) return;
    if (e.key==='Escape') closeSlideshow();
    if (e.key==='ArrowRight') nextSlide();
    if (e.key==='ArrowLeft') prevSlide();
});

window.onload = () => showSection('about');
