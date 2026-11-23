(() => {
    const key = 'proyecto-ingles-gramatica-elite-v1';
    const quizKeys = JSON.parse(document.querySelector('#clave').textContent);
    const sections = [...document.querySelectorAll('.unit')];
    const buttons = [...document.querySelectorAll('[data-open]')];
    const progress = document.querySelector('#progreso');
    const passed = new Set();
    const attempts = Array(quizKeys.length).fill(0);
    let persistent = true;
    let unlocked = 1;
    try {
        const previous = JSON.parse(localStorage.getItem(key) || '{}') || {};
        for (let i = 0; i < quizKeys.length; i += 1) {
            const count = previous.attempts?.[i];
            if (Number.isSafeInteger(count) && count >= 0) attempts[i] = count;
        }
        while (unlocked <= quizKeys.length && previous.passed?.includes?.(unlocked)) {
            passed.add(unlocked);
            unlocked += 1;
        }
    } catch {
        persistent = false;
    }

    function update() {
        for (const [i, button] of buttons.entries()) {
            button.disabled = i + 1 > unlocked;
            button.dataset.passed = String(passed.has(i + 1));
        }
        const evaluation = document.querySelector('#final');
        evaluation.hidden = passed.size < quizKeys.length;
        const finalLink = document.querySelector('.menu a[href="#final"]');
        finalLink.hidden = evaluation.hidden;
        progress.textContent = passed.size + ' de ' + quizKeys.length + ' unidades aprobadas.' +
            (persistent ? '' : ' El navegador no pudo recuperar o guardar el progreso.');
    }

    function openUnit(unit, scroll) {
        if (!Number.isInteger(unit) || unit < 1 || unit > Math.min(unlocked, sections.length)) return;
        for (const [i, section] of sections.entries()) {
            section.hidden = i + 1 !== unit;
            buttons[i].setAttribute('aria-pressed', String(i + 1 === unit));
        }
        if (scroll) {
            const heading = sections[unit - 1].querySelector('h2');
            heading.tabIndex = -1;
            heading.focus({preventScroll: true});
            sections[unit - 1].scrollIntoView();
        }
    }

    for (const button of buttons) {
        button.addEventListener('click', () => openUnit(Number(button.dataset.open), true));
    }
    for (const form of document.querySelectorAll('.quiz')) {
        const next = form.querySelector('.next-unit');
        const formUnit = Number(form.dataset.unit);
        if (next && formUnit < sections.length) {
            next.hidden = !passed.has(formUnit);
            next.addEventListener('click', () => openUnit(formUnit + 1, true));
        }
        form.addEventListener('submit', event => {
            event.preventDefault();
            const unit = Number(form.dataset.unit);
            if (unit > unlocked) return;
            const comparison = new FormData(form);
            const incorrect = quizKeys[unit - 1].flatMap(([correct, explanation], i) =>
                comparison.get('q' + i) === correct ? [] : ['Pregunta ' + (i + 1) + '. ' + explanation]);
            const score = 5 - incorrect.length;
            attempts[unit - 1] += 1;
            if (score >= 4) {
                passed.add(unit);
                if (next && unit < sections.length) next.hidden = false;
                if (unit === unlocked) unlocked += 1;
            }
            try {
                localStorage.setItem(key, JSON.stringify({passed: [...passed], attempts}));
                persistent = true;
            } catch {
                persistent = false;
            }
            const feedback = form.querySelector('.feedback');
            const result = document.createElement('p');
            result.textContent = 'Intento ' + attempts[unit - 1] + ' · ' + score + '/5. ' +
                (score >= 4 ? (unit < sections.length ? 'Siguiente unidad disponible.' : 'Evaluación final disponible.') :
                    'Repasa la explicación antes de repetir. Puedes enviar un nuevo intento.');
            feedback.replaceChildren(result);
            if (incorrect.length) {
                const list = document.createElement('ul');
                for (const summary of incorrect) {
                    const item = document.createElement('li');
                    item.textContent = summary;
                    list.append(item);
                }
                feedback.append(list);
            }
            update();
        });
    }
    for (const button of document.querySelectorAll('[data-timer]')) {
        let clock;
        button.addEventListener('click', () => {
            const display = button.nextElementSibling;
            const seconds = Number(button.parentElement.querySelector('select').value);
            const deadline = Date.now() + seconds * 1000;
            clearInterval(clock);
            display.textContent = seconds + ' s. Responde en voz alta.';
            function tick() {
                const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
                if (remaining) {
                    display.textContent = remaining + ' s';
                } else {
                    clearInterval(clock);
                    display.textContent = 'Tiempo. Abre el modelo y corrige tu respuesta.';
                }
            }
            clock = setInterval(tick, 1000);
        });
    }
    openUnit(Math.min(unlocked, sections.length), false);
    update();
})();
