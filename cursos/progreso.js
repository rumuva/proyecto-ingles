(() => {
    const { keys, storageKey, passingScore } = window.courseConfig;
    const count = keys.length;
    const buttons = [...document.querySelectorAll('[data-open]')];
    const panels = [...document.querySelectorAll('main > article')];
    const progress = document.querySelector('#progress');
    const notice = document.querySelector('#storage');
    const final = document.querySelector('#final');
    const finalLink = document.querySelector('#open-final');
    const variants = window.courseVariants?.[document.documentElement?.dataset.course] ?? [];
    let active = 1;
    let records = readRecords();

    function readRecords() {
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
            return Array.isArray(saved) ? saved.filter(record =>
                record && Number.isInteger(record.unit) && record.unit >= 1 && record.unit <= count &&
                Number.isInteger(record.score) && record.score >= 0 && record.score <= 5
            ) : [];
        } catch {
            notice.textContent = 'El historial guardado no se puede leer. Puedes practicar durante esta visita.';
            return [];
        }
    }

    function passed(unit) {
        return records.some(record => record.unit === unit && record.score >= passingScore);
    }

    function available(unit) {
        for (let previous = 1; previous < unit; previous++) {
            if (!passed(previous)) return false;
        }
        return true;
    }

    function refresh() {
        buttons.forEach((button, index) => {
            const unit = index + 1;
            button.disabled = !available(unit);
            if (unit === active) button.setAttribute('aria-current', 'step');
            else button.removeAttribute('aria-current');
            button.lastChild.textContent = passed(unit) ? ' · aprobada' : '';
            panels[index].hidden = unit !== active;
        });
        final.hidden = !available(count + 1);
        finalLink.hidden = final.hidden;
        const attempts = records.filter(record => record.unit === active);
        const last = attempts.at(-1);
        const state = passed(active) ? 'Aprobada.' : 'Pendiente de aprobar.';
        progress.textContent = last
            ? `Unidad ${active} · ${attempts.length} intentos · último resultado ${last.score}/5. ${state}`
            : `Unidad ${active} · pendiente de autoevaluación.`;
    }

    function openUnit(unit) {
        if (!available(unit)) return;
        for (const audio of panels[active - 1].querySelectorAll('audio')) audio.pause();
        active = unit;
        refresh();
        const heading = panels[unit - 1].querySelector('h2');
        heading.tabIndex = -1;
        heading.focus();
    }

    buttons.forEach((button, index) => {
        button.append(document.createElement('span'));
        button.addEventListener('click', () => openUnit(index + 1));
    });

    panels.forEach((panel, index) => {
        const unit = index + 1;
        const form = panel.querySelector('form');
        const result = form.querySelector('.result');
        const next = document.createElement(unit === count ? 'a' : 'button');
        next.className = "next-unit";
        next.hidden = true;
        if (unit === count) {
            next.href = '#final';
            next.textContent = finalLink.textContent;
        } else {
            next.type = 'button';
            next.textContent = 'Ir a la unidad ' + (unit + 1);
            next.addEventListener('click', () => openUnit(unit + 1));
        }
        form.after(next);

        const alternative = variants[index];
        let questions = keys[index];
        function useAlternative() {
            if (!alternative || questions !== keys[index]) return;
            const first = form.querySelector('fieldset');
            const legend = first.querySelector('legend');
            legend.textContent = '1. ' + alternative.q;
            first.querySelectorAll('label').forEach((label, option) => {
                label.replaceChildren(label.querySelector('input'), ' ' + alternative.a[option]);
            });
            questions = [{correct: alternative.right, why: alternative.why}, ...keys[index].slice(1)];
        }
        let retry;
        if (alternative) {
            retry = document.createElement('button');
            retry.type = 'button';
            retry.className = 'retry-unit';
            retry.textContent = 'Nuevo intento con una variante';
            retry.hidden = true;
            form.after(retry);
            retry.addEventListener('click', () => {
                if (unit !== active) return;
                form.reset();
                useAlternative();
                result.textContent = 'Nuevo intento. La primera pregunta tiene una variante.';
                form.querySelector('input').focus();
                retry.hidden = true;
            });
            if (records.some(record => record.unit === unit && record.score < passingScore)) {
                useAlternative();
                retry.hidden = false;
            }
        }
        form.addEventListener('submit', event => {
            event.preventDefault();
            if (unit !== active || !available(unit) || !form.reportValidity()) return;
            const answers = new FormData(form);
            if (questions.some((_, question) => !answers.has('q' + question))) return;
            let score = 0;
            const missed = [];
            questions.forEach((item, question) => {
                if (answers.get('q' + question) === String(item.correct)) score++;
                else missed.push('Pregunta ' + (question + 1) + '. ' + item.why);
            });

            const saved = readRecords();
            const ids = new Set(records.map(record => JSON.stringify(record)));
            records.push(...saved.filter(record => !ids.has(JSON.stringify(record))));
            records.push({unit, score, date: new Date().toISOString()});
            try {
                localStorage.setItem(storageKey, JSON.stringify(records));
            } catch {
                notice.textContent = 'El navegador ha bloqueado el guardado. El avance se conserva durante esta visita.';
            }
            const success = score >= passingScore;
            if (retry) retry.hidden = success;
            result.textContent = `${score}/5. ${success ? 'Unidad superada.' : 'Repasa y vuelve a intentarlo.'} ${missed.join(' ')}`;
            next.hidden = !passed(unit);
            refresh();
        });
    });

    while (active < count && passed(active)) active++;
    refresh();

    if (location.hash === '#final') {
        const destination = final.hidden ? document.querySelector('#units') : final;
        requestAnimationFrame(() => destination.scrollIntoView());
        if (final.hidden) notice.textContent = 'Aprueba todas las unidades para abrir la evaluación final.';
    }
})();
