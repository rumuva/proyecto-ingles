const keys = [[{"correct": 2, "why": "I exige am."}, {"correct": 0, "why": "Are precede a you."}, {"correct": 1, "why": "La respuesta breve afirmativa usa am sin contraer."}, {"correct": 2, "why": "Spell pide las letras."}, {"correct": 0, "why": "Con be, not sigue al verbo."}], [{"correct": 1, "why": "Thirty es la decena."}, {"correct": 2, "why": "On introduce un día."}, {"correct": 0, "why": "Dot nombra el punto."}, {"correct": 1, "why": "Time pide la hora."}, {"correct": 2, "why": "La lectura digital dice hora y minutos."}], [{"correct": 0, "why": "Her precede al nombre y remite a Maya."}, {"correct": 1, "why": "Con she se usa has."}, {"correct": 2, "why": "Aunt comienza por sonido vocálico y es singular."}, {"correct": 0, "why": "People es el plural habitual."}, {"correct": 1, "why": "La estructura usa this is."}], [{"correct": 2, "why": "Leo equivale a he."}, {"correct": 0, "why": "Después de does se usa el verbo base."}, {"correct": 1, "why": "Doesn't va con work."}, {"correct": 2, "why": "Usually va delante del verbo principal."}, {"correct": 0, "why": "Finish significa terminar."}], [{"correct": 1, "why": "Some water expresa una cantidad indeterminada."}, {"correct": 2, "why": "Without significa sin."}, {"correct": 0, "why": "Glasses es el elemento contable."}, {"correct": 1, "why": "No, thanks responde a Anything else?"}, {"correct": 2, "why": "How much pregunta por precio en este contexto."}], [{"correct": 0, "why": "Two cafés es plural."}, {"correct": 1, "why": "Opposite indica que dos puntos están frente a frente."}, {"correct": 2, "why": "El imperativo usa la forma base."}, {"correct": 0, "why": "Is there pide comprobar existencia singular."}, {"correct": 1, "why": "Then significa después en una secuencia."}], [{"correct": 2, "why": "Shoes exige are."}, {"correct": 0, "why": "These acompaña plural cercano."}, {"correct": 1, "why": "Them remite al plural."}, {"correct": 2, "why": "Es una respuesta al ofrecimiento de ayuda."}, {"correct": 0, "why": "Larger describe aumento de talla."}], [{"correct": 1, "why": "Single significa solo ida."}, {"correct": 2, "why": "Does va seguido de la base."}, {"correct": 0, "why": "Platform nombra el andén."}, {"correct": 1, "why": "14 menos 12 es 2 de la tarde."}, {"correct": 2, "why": "More slowly pide un ritmo más lento."}], [{"correct": 0, "why": "Can exige verbo base."}, {"correct": 1, "why": "Doesn't lleva la forma base."}, {"correct": 2, "why": "Need to seguido de verbo expresa la acción necesaria."}, {"correct": 0, "why": "Can I use…? pide permiso."}, {"correct": 1, "why": "Repite el dato que se quiere comprobar."}], [{"correct": 2, "why": "What time pide hora y does va con start."}, {"correct": 0, "why": "Repite el dato para confirmarlo."}, {"correct": 1, "why": "Without excluye el azúcar."}, {"correct": 2, "why": "How much pide el importe."}, {"correct": 0, "why": "Thanks for your help agradece la ayuda."}]];
const count = keys.length;
const storageKey = 'ingles-a1-50h-intentos-v1';
const progress = document.querySelector('#progress');
const storage = document.querySelector('#storage');
const buttons = [...document.querySelectorAll('[data-open]')];
const panels = [...document.querySelectorAll('article')];
let active = 1;
let records = [];
try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(saved)) records = saved.filter(record =>
        record && Number.isInteger(record.unit) && record.unit >= 1 && record.unit <= count &&
        Number.isInteger(record.score) && record.score >= 0 && record.score <= 5);
} catch {
    storage.textContent = 'El navegador restringe el guardado. El avance se mantendrá mientras esta página siga abierta.';
}
function passed(unit) {
    return records.some(record => record.unit === unit && record.score >= 4);
}
function available(unit) {
    for (let n = 1; n < unit; n++) if (!passed(n)) return false;
    return true;
}
function refresh() {
    buttons.forEach((button, index) => {
        const unit = index + 1;
        button.disabled = !available(unit);
        if (unit === active) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
        if (passed(unit) && !button.textContent.endsWith(' · aprobada')) button.append(' · aprobada');
        panels[index].hidden = unit !== active;
    });
    document.querySelector('#final').hidden = !available(count + 1);
    const current = records.filter(record => record.unit === active);
    const last = current.at(-1);
    progress.textContent = last ? 'Unidad ' + active + ' · ' + current.length + ' intentos · último resultado: ' + last.score + '/5.' : 'Unidad ' + active + ' · pendiente de autoevaluación.';
}
buttons.forEach((button, index) => button.addEventListener('click', () => {
    if (!available(index + 1)) return;
    active = index + 1;
    refresh();
    const heading = panels[index].querySelector('h2');
    heading.tabIndex = -1;
    heading.focus();
}));
panels.forEach((panel, index) => {
    const form = panel.querySelector('form');
    form.addEventListener('submit', event => {
        event.preventDefault();
        if (!available(index + 1)) return;
        const answers = new FormData(form);
        let score = 0;
        const missed = [];
        keys[index].forEach((item, j) => {
            if (Number(answers.get('q'+j)) === item.correct) score++;
            else missed.push('Pregunta '+(j+1)+': '+item.why);
        });
        records.push({unit:index+1, score, date:new Date().toISOString()});
        try { localStorage.setItem(storageKey, JSON.stringify(records)); }
        catch { storage.textContent = 'Guardado bloqueado en este navegador. El avance se mantiene durante esta visita.'; }
        form.querySelector('.result').textContent = score+'/5. '+(score>=4 ? 'Unidad superada. ' : 'Repasa y vuelve a intentarlo. ')+missed.join(' ');
        refresh();
    });
});
while (active < count && passed(active)) active++;
refresh();
