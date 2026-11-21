(() => {
    const root = document.querySelector('#simulacros');
    if (!root) return;
    const level = root.dataset.level;
    const clock = document.querySelector('#exam-clock');
    const select = clock.querySelector('select');
    const displayed = clock.querySelector('output');
    const elapsed = clock.querySelector('[role="status"]');
    let deadline = Number(sessionRead('exam-clock-' + level));
    let announced = false;

    function sessionRead(key) {
        try { return sessionStorage.getItem(key); } catch { return null; }
    }

    function updateClock() {
        const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        displayed.textContent = seconds
            ? Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0')
            : '00:00';
        if (!seconds && deadline && !announced) {
            elapsed.textContent = 'Tiempo agotado. Guarda tus respuestas y corrige esta prueba.';
            announced = true;
        }
    }

    function startClock(minutes, message) {
        deadline = Date.now() + minutes * 60000;
        announced = false;
        try { sessionStorage.setItem('exam-clock-' + level, String(deadline)); } catch { /* works in this visit */ }
        elapsed.textContent = message;
        updateClock();
    }

    clock.addEventListener('submit', event => {
        event.preventDefault();
        startClock(Number(select.value), 'Cronómetro iniciado para ' + select.selectedOptions[0].textContent + '.');
    });
    clock.querySelector('[data-clear-clock]').addEventListener('click', () => {
        deadline = 0;
        announced = false;
        try { sessionStorage.removeItem('exam-clock-' + level); } catch { /* optional persistence */ }
        elapsed.textContent = 'Cronómetro detenido.';
        updateClock();
    });
    clock.querySelector('[data-add-time]').addEventListener('click', () => {
        const remaining = Math.max(0, deadline - Date.now());
        startClock(remaining / 60000 + 5, 'Se han añadido 5 minutos para esta práctica.');
    });
    updateClock();
    setInterval(updateClock, 500);

    const forms = [...root.querySelectorAll('form[data-exam]')];
    const rows = [...root.querySelectorAll('[data-report]')];
    const progressKey = 'proyecto-ingles-simulacros-' + level + '-v1';
    const reportStatus = root.querySelector('#exam-report-status');
    let scores = {};

    function readScores() {
        try {
            const data = JSON.parse(localStorage.getItem(progressKey) ?? '{}');
            return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
        } catch { return {}; }
    }

    function markReport() {
        for (const row of rows) {
            const [provider, skill] = row.dataset.report.split(':');
            const first = scores[provider + '-a']?.points?.[skill];
            const second = scores[provider + '-b']?.points?.[skill];
            const max = Number(row.dataset.max);
            const valid = value => typeof value === 'number' && value >= 0 && value <= max;
            row.querySelector('[data-score-a]').textContent = valid(first) ? first + '/' + max : 'Pendiente';
            row.querySelector('[data-score-b]').textContent = valid(second) ? second + '/' + max : 'Pendiente';
            const delta = valid(first) && valid(second) ? Math.round((second - first) * 1000 / max) / 10 : null;
            row.querySelector('[data-delta]').textContent = delta === null ? '—' : (delta > 0 ? '+' : '') + delta + ' pp';
        }
    }

    scores = readScores();
    for (const form of forms) {
        const fields = [...form.querySelectorAll('input[data-skill]')];
        const notes = [...form.querySelectorAll('textarea')];
        const initial = scores[form.dataset.exam];
        for (const field of fields) {
            const value = initial?.points?.[field.name];
            if (typeof value === 'number' && value >= 0 && value <= Number(field.max)) field.value = value;
        }
        for (const field of notes) if (typeof initial?.[field.name] === 'string') field.value = initial[field.name];
        form.addEventListener('submit', event => {
            event.preventDefault();
            const points = Object.fromEntries(fields.filter(field => field.value !== '')
                .map(field => [field.name, field.valueAsNumber]));
            const reflection = Object.fromEntries(notes.map(field => [field.name, field.value.trim()]));
            if (!Object.keys(points).length && !Object.values(reflection).some(Boolean)) {
                reportStatus.textContent = 'Anota al menos un resultado o una observación.';
                form.querySelector('[data-skill]').focus();
                return;
            }
            for (const [id, saved] of Object.entries(readScores())) {
                if (!scores[id] || Date.parse(saved?.date) > Date.parse(scores[id].date)) scores[id] = saved;
            }
            scores[form.dataset.exam] = {points, ...reflection, date: new Date().toISOString()};
            markReport();
            try {
                localStorage.setItem(progressKey, JSON.stringify(scores));
                reportStatus.textContent = 'Resultados guardados. Consulta la comparación por destreza.';
            } catch {
                reportStatus.textContent = 'El navegador impide guardar. Los resultados se muestran durante esta visita.';
            }
        });
    }
    markReport();

    for (const exercise of root.querySelectorAll('form[data-diagnostic]')) {
        exercise.addEventListener('submit', event => {
            event.preventDefault();
            for (const field of exercise.querySelectorAll('fieldset')) {
                const selected = field.querySelector('input:checked');
                const output = field.querySelector('[data-answer]');
                output.textContent = (selected.value === field.dataset.correct ? 'Correcto. ' : 'Repasa. ') + field.dataset.feedback;
            }
            exercise.querySelector('[data-diagnostic-status]').textContent =
                'Revisa los comentarios y elige la primera destreza que debes practicar.';
        });
    }
})();
