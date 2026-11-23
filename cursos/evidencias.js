(() => {
    const root = document.querySelector('main[data-course]');
    const course = root.dataset.course;
    const overview = root.querySelector('#portfolio-overview');
    const download = root.querySelector('#portfolio-download');
    const status = root.querySelector('#portfolio-status');
    const entries = [...root.querySelectorAll('[data-challenge]')];
    const dateLabel = new Intl.DateTimeFormat('es-ES', {dateStyle: 'medium'});
    let memory = portfolioStore.read();

    function describe(saved) {
        const {first, second, date} = saved;
        return `${dateLabel.format(new Date(date))} · Criterio 1: ${portfolioStore.labels[first]} · Criterio 2: ${portfolioStore.labels[second]}`;
    }

    function drawOverview() {
        const units = Object.values(memory[course] ?? {});
        const pairs = units.filter(unit => unit.primera && unit.repeticion).length;
        overview.textContent = `${units.length} de ${entries.length} retos con evidencias. ${pairs} con dos intentos comparables.`;
        download.disabled = units.length === 0;
    }

    function fresh() {
        memory = portfolioStore.merge(memory, portfolioStore.read());
    }

    for (const item of entries) {
        const unit = item.dataset.challenge;
        const details = item.querySelector('[data-portfolio]');
        const form = details.querySelector('form');
        const stage = form.elements.stage;
        const localStatus = details.querySelector('[role="status"]');
        const summaries = [...details.querySelectorAll('[data-stage]')];

        function draw() {
            const records = memory[course]?.[unit] ?? {};
            for (const summary of summaries) {
                const saved = records[summary.dataset.stage];
                summary.textContent = saved ? describe(saved) : 'Sin registro';
            }
        }

        function fill() {
            const saved = memory[course]?.[unit]?.[stage.value];
            for (const field of ['note', 'next', 'first', 'second']) form.elements[field].value = saved?.[field] ?? '';
        }

        stage.addEventListener('change', () => {
            fresh();
            fill();
            draw();
            localStatus.textContent = '';
        });

        form.addEventListener('submit', event => {
            event.preventDefault();
            const {note, next, first, second} = form.elements;
            if (!note.value.trim() || !next.value.trim()) {
                localStatus.textContent = 'Escribe una evidencia y un siguiente paso antes de guardar.';
                (!note.value.trim() ? note : next).focus();
                return;
            }

            fresh();
            const current = {note: note.value, next: next.value, first: first.value, second: second.value,
                date: new Date().toISOString()};
            memory = portfolioStore.merge(memory, {[course]: {[unit]: {[stage.value]: current}}});
            try {
                localStorage.setItem(portfolioStore.key, JSON.stringify(memory));
                localStatus.textContent = 'Evidencia guardada en este navegador.';
            } catch {
                localStatus.textContent = 'Evidencia guardada durante esta visita. Descarga el portafolio para conservarla.';
            }
            draw();
            drawOverview();
        });

        details.hidden = false;
        draw();
        fill();
    }

    download.addEventListener('click', () => {
        fresh();
        const data = memory[course] ?? {};
        const blocks = entries.flatMap(item => {
            const unit = item.dataset.challenge;
            const saved = data[unit];
            if (!saved) return [];
            const lines = [item.querySelector('h2').textContent];
            for (const stage of portfolioStore.stages) {
                if (!saved[stage]) continue;
                const record = saved[stage];
                lines.push('', stage === 'primera' ? 'Primer intento' : 'Repetición con variante',
                    describe(record), 'Evidencia: ' + record.note, 'Siguiente paso: ' + record.next);
            }
            return lines.join('\n');
        });
        const raw = [document.title, ...blocks].join('\n\n');
        const url = URL.createObjectURL(new Blob([raw], {type: 'text/plain;charset=utf-8'}));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Portafolio-' + course + '.txt';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
        status.textContent = 'Portafolio preparado para descargar.';
    });

    download.hidden = false;
    drawOverview();
})();
