function enableProgressBackup(courseList, refresh) {
    const panel = document.querySelector('#copia-progreso');
    const file = panel.querySelector('input');
    const status = panel.querySelector('[role="status"]');
    const storageRead = key => JSON.parse(localStorage.getItem(key) ?? 'null');
    const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    const examKeys = ['b1', 'b2'].map(level => 'proyecto-ingles-simulacros-' + level + '-v1');
    const draftKey = 'rutinas_ingles_10h_v1_draft';

    function attempts(value, units) {
        if (!Array.isArray(value)) return [];
        return value.filter(entry => object(entry) && Number.isInteger(entry.unit) && entry.unit >= 1 &&
            entry.unit <= units && Number.isInteger(entry.score) && entry.score >= 0 && entry.score <= 5 &&
            typeof entry.date === 'string' && Number.isFinite(Date.parse(entry.date)))
            .map(({unit, score, date}) => ({unit, score, date}));
    }

    function completions(value, units) {
        if (!Array.isArray(value)) return [];
        return value.filter(index => Number.isInteger(index) && index >= 1 && index <= units);
    }

    function exams(value, level) {
        const marks = level === 'b1'
            ? {read: 32, listen: 25, write: 40, speak: 30}
            : {read: 42, use: 28, listen: 30, write: 40, speak: 60};
        const eoi = {read: 10, listen: 10, write: 10, speak: 10, mediate: 10};
        const keys = ['cambridge-a', 'cambridge-b', 'eoi-a', 'eoi-b'];
        const valid = {};
        for (const key of keys) {
            const entry = value?.[key];
            if (!object(entry) || !object(entry.points) || typeof entry.date !== 'string' ||
                !Number.isFinite(Date.parse(entry.date))) continue;
            const limits = key.startsWith('eoi') ? eoi : marks;
            const points = Object.fromEntries(Object.entries(limits).flatMap(([name, max]) => {
                const points = entry.points[name];
                return typeof points === 'number' && points >= 0 && points <= max ? [[name, points]] : [];
            }));
            valid[key] = {
                points, date: entry.date,
                errors: typeof entry.errors === 'string' ? entry.errors.slice(0, 1200) : '',
                next: typeof entry.next === 'string' ? entry.next.slice(0, 700) : ''
            };
        }
        return valid;
    }

    function snapshot() {
        const data = {};
        for (const c of courseList) {
            data[c.storageKey] = attempts(storageRead(c.storageKey), c.units);
            if (c.completedStorageKey) data[c.completedStorageKey] =
                completions(storageRead(c.completedStorageKey), c.units);
        }
        const draft = localStorage.getItem(draftKey);
        if (typeof draft === 'string') data[draftKey] = draft.slice(0, 12000);
        for (const key of examKeys) data[key] = exams(storageRead(key), key.split('-')[3]);
        data[portfolioStore.key] = portfolioStore.read();
        return data;
    }

    function merge(imported) {
        const current = snapshot();
        const merged = {...current};
        for (const c of courseList) {
            const list = [...current[c.storageKey], ...attempts(imported[c.storageKey], c.units)];
            const keyed = new Map(list.map(record => [JSON.stringify(record), record]));
            merged[c.storageKey] = [...keyed.values()].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
            if (c.completedStorageKey) {
                const allPassed = list.filter(item => item.score >= c.passingScore).map(item => item.unit);
                merged[c.completedStorageKey] = [...new Set([
                    ...current[c.completedStorageKey], ...completions(imported[c.completedStorageKey], c.units), ...allPassed
                ])];
            }
        }
        for (const key of examKeys) {
            const entries = exams(imported[key], key.split('-')[3]);
            for (const [name, item] of Object.entries(entries)) {
                const local = current[key][name];
                if (!local || Date.parse(item.date) > Date.parse(local.date)) merged[key][name] = item;
            }
        }
        merged[portfolioStore.key] = portfolioStore.merge(current[portfolioStore.key], imported[portfolioStore.key]);
        if (!current[draftKey] && typeof imported[draftKey] === 'string') merged[draftKey] = imported[draftKey].slice(0, 12000);
        const entries = Object.entries(merged).map(([key, value]) => ({
            key, before: localStorage.getItem(key), after: key === draftKey ? value : JSON.stringify(value)
        }));
        const written = [];
        try {
            for (const entry of entries) {
                if (entry.before === entry.after) continue;
                localStorage.setItem(entry.key, entry.after);
                written.push(entry);
            }
        } catch (error) {
            for (const entry of written.reverse()) {
                if (entry.before === null) localStorage.removeItem(entry.key);
                else localStorage.setItem(entry.key, entry.before);
            }
            throw error;
        }
    }

    panel.querySelector('button').addEventListener('click', () => {
        try {
            const bytes = JSON.stringify({type: 'proyecto-ingles', version: 1, data: snapshot()}, null, 2);
            const url = URL.createObjectURL(new Blob([bytes], {type: 'application/json'}));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Proyecto_Ingles_Mi_Progreso.json';
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 30000);
            status.textContent = 'Copia preparada. Guárdala para recuperarla en otro navegador.';
        } catch {
            status.textContent = 'El navegador impide leer el historial o descargar el archivo.';
        }
    });

    file.addEventListener('change', async () => {
        if (!file.files.length) return;
        try {
            const selected = file.files[0];
            if (selected.size > 5_000_000) throw new Error('La copia supera los 5 MB.');
            const payload = JSON.parse(await selected.text());
            if (payload?.type !== 'proyecto-ingles' || payload.version !== 1 || !object(payload.data)) {
                throw new Error('Selecciona un archivo de copia del Proyecto Inglés.');
            }
            merge(payload.data);
            refresh();
            status.textContent = 'Copia importada. Los intentos se han combinado con el historial de este navegador.';
        } catch (error) {
            status.textContent = error instanceof SyntaxError
                ? 'El archivo no contiene una copia válida en formato JSON.'
                : error instanceof DOMException ? 'No se pudo guardar toda la copia. Revisa el espacio o los permisos del navegador.'
                : error.message;
        } finally {
            file.value = '';
        }
    });
}
