const search = document.querySelector('#course-search');
const category = document.querySelector('#course-category');
const cards = document.querySelector('#catalog-cards');
const summary = document.querySelector('#catalog-count');
let catalogue = [];

function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
}

function link(text, href, className) {
    const node = element('a', text, className);
    node.href = href;
    return node;
}

function readProgress(course) {
    const passed = new Set();
    let latest = null;
    let attempted = false;
    let unavailable = false;
    if (course.storageKey && Number.isInteger(course.passingScore) && course.units) {
        try {
            const saved = JSON.parse(localStorage.getItem(course.storageKey) ?? '[]');
            if (Array.isArray(saved)) {
                for (const record of saved) {
                    if (!record || !Number.isInteger(record.unit) || record.unit < 1 ||
                        record.unit > course.units || !Number.isInteger(record.score) ||
                        record.score < 0 || record.score > 5) continue;

                    attempted = true;
                    if (record.score >= course.passingScore) passed.add(record.unit);
                    if (typeof record.date === 'string') {
                        const date = Date.parse(record.date);
                        if (Number.isFinite(date) && (latest === null || date > latest)) latest = date;
                    }
                }
            }
        } catch {
            unavailable = true;
        }
    }
    const completed = Boolean(course.units && passed.size === course.units);
    let next = 1;
    while (passed.has(next)) next++;
    return { passed: passed.size, latest, attempted, unavailable, completed, next };
}

function courseAction(course, progress) {
    const url = 'cursos/' + encodeURIComponent(course.id) + '/';
    if (progress.completed && course.finalLabel) {
        return { title: course.finalLabel, url: url + '#final' };
    }
    if (progress.completed) return { title: 'Repasar curso', url };
    const title = progress.attempted ? 'Continuar · Unidad ' + progress.next : 'Abrir curso';
    return { title, url: course.units ? url + '#units' : url };
}

function renderCard(course, progress) {
    const article = element('article', null, 'card');
    const heading = element('h3', course.title);
    heading.id = 'curso-' + course.id;
    article.setAttribute('aria-labelledby', heading.id);
    if (course.cover) {
        const image = element('img');
        image.src = course.cover.src;
        image.alt = course.cover.alt;
        image.loading = 'lazy';
        image.width = course.cover.width;
        image.height = course.cover.height;
        article.append(image);
    } else {
        article.classList.add('without-cover');
    }

    const body = element('div', null, 'details');
    const metadata = [course.level, course.duration, course.units && course.units + ' unidades'].filter(Boolean);
    body.append(element('p', metadata.join(' · '), 'level'), heading, element('p', course.summary));
    if (course.storageKey && course.units && !progress.unavailable) {
        const label = element('p', progress.passed + ' de ' + course.units + ' unidades aprobadas');
        const bar = element('progress');
        bar.max = course.units;
        bar.value = progress.passed;
        bar.setAttribute('aria-label', 'Unidades aprobadas en ' + course.title);
        const reading = element('div', null, 'course-progress');
        reading.append(label, bar);
        body.append(reading);
    }

    const actions = element('div', null, 'actions');
    const action = courseAction(course, progress);
    actions.append(link(action.title, action.url, 'button'));
    for (const resource of course.resources ?? []) {
        actions.append(link(resource.label, 'cursos/' + encodeURIComponent(course.id) + '/' + resource.anchor));
    }
    body.append(actions);
    article.append(body);
    return article;
}

function searchable(value) {
    return value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').trim();
}

function renderIndex() {
    const tokens = searchable(search.value).split(/\s+/).filter(Boolean);
    const matches = catalogue.filter(course => {
        const info = searchable([course.title, course.id, course.category, course.level, course.summary].join(' '));
        return (!category.value || course.category === category.value) && tokens.every(word => info.includes(word));
    });
    summary.textContent = matches.length
        ? matches.length + (matches.length === 1 ? ' curso' : ' cursos')
        : 'No hay cursos que coincidan con tu búsqueda.';
    cards.replaceChildren(...matches.map(course => renderCard(course, readProgress(course))));
}

function renderOverview() {
    const snapshots = catalogue.map(course => ({ course, progress: readProgress(course) }));
    document.querySelector('#total-courses').textContent = String(catalogue.length);
    document.querySelector('#passed-units').textContent = String(snapshots.reduce((total, item) => total + item.progress.passed, 0));
    document.querySelector('#finished-courses').textContent = String(snapshots.filter(item => item.progress.completed).length);
    document.querySelector('#storage-notice').hidden = !snapshots.some(item => item.progress.unavailable);

    const started = snapshots.filter(item => item.progress.attempted);
    started.sort((first, second) => (second.progress.latest ?? 0) - (first.progress.latest ?? 0));
    const recent = started.find(item => !item.progress.completed) ?? started[0];
    const resume = document.querySelector('#resume-course');
    resume.textContent = recent ? 'Retomar ' + recent.course.title : 'Elegir un curso';
    resume.href = recent ? courseAction(recent.course, recent.progress).url : '#cursos';
}

async function initialise() {
    try {
        const response = await fetch('catalogo.json', { cache: 'no-cache' });
        if (!response.ok) throw new Error('No se pudo cargar el catálogo');
        catalogue = await response.json();
        if (!Array.isArray(catalogue)) throw new Error('Catálogo incorrecto');

        for (const group of new Set(catalogue.map(course => course.category).filter(Boolean))) {
            category.add(new Option(group, group));
        }
        renderIndex();
        renderOverview();
        document.querySelector('#catalog-fallback').hidden = true;
        document.querySelector('#catalog-filters').hidden = false;
        document.querySelector('#progreso').hidden = false;

        search.addEventListener('input', renderIndex);
        category.addEventListener('change', renderIndex);
        document.querySelector('#catalog-filters').addEventListener('submit', event => event.preventDefault());
        function updateProgress() {
            renderOverview();
            renderIndex();
        }
        window.addEventListener('storage', event => {
            if (!event.key || catalogue.some(course => course.storageKey === event.key)) updateProgress();
        });
        window.addEventListener('pageshow', event => {
            if (event.persisted) updateProgress();
        });
    } catch {
        summary.textContent = 'El índice completo no está disponible. Usa los enlaces directos.';
    }
}

initialise();
