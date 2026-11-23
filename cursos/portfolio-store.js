const portfolioStore = (() => {
    const key = 'proyecto-ingles-evidencias-v1';
    const limits = {
        'rutinas-diarias-10h': 5, 'a1-50h': 10, 'a2-50h': 10,
        'b1-50h': 10, 'b2-50h': 10, 'ingles-comercio-0179': 5
    };
    const stages = ['primera', 'repeticion'];
    const ratings = ['pendiente', 'con-ayuda', 'autonomo'];
    const labels = {pendiente: 'Seguir practicando', 'con-ayuda': 'Con ayuda', autonomo: 'De forma autónoma'};
    const maxText = 3500;
    const maxNext = 500;

    function sanitise(input) {
        const clean = {};
        for (const [course, count] of Object.entries(limits)) {
            const lessons = {};
            for (let unit = 1; unit <= count; unit++) {
                const entries = {};
                for (const stage of stages) {
                    const record = input?.[course]?.[unit]?.[stage];
                    if (!record || !ratings.includes(record.first) || !ratings.includes(record.second) ||
                        typeof record.note !== 'string' || typeof record.next !== 'string' ||
                        typeof record.date !== 'string' || !Number.isFinite(Date.parse(record.date))) continue;
                    if (!record.note.trim() || !record.next.trim()) continue;
                    entries[stage] = {
                        note: record.note.trim().slice(0, maxText), next: record.next.trim().slice(0, maxNext),
                        first: record.first, second: record.second, date: new Date(record.date).toISOString()
                    };
                }
                if (Object.keys(entries).length) lessons[unit] = entries;
            }
            if (Object.keys(lessons).length) clean[course] = lessons;
        }
        return clean;
    }

    function merge(current, imported) {
        const combined = sanitise(current);
        for (const [course, lessons] of Object.entries(sanitise(imported))) {
            combined[course] ??= {};
            for (const [unit, entries] of Object.entries(lessons)) {
                combined[course][unit] ??= {};
                for (const [stage, record] of Object.entries(entries)) {
                    const existing = combined[course][unit][stage];
                    if (!existing || existing.date < record.date) combined[course][unit][stage] = record;
                }
            }
        }
        return combined;
    }

    function read() {
        try {
            return sanitise(JSON.parse(localStorage.getItem(key) ?? '{}'));
        } catch {
            return {};
        }
    }

    return {key, stages, labels, read, sanitise, merge};
})();
