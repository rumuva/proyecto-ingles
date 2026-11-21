const SpeechEngine = window.SpeechRecognition || window.webkitSpeechRecognition;

const smallNumbers = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(' ');
const tens = 'zero ten twenty thirty forty fifty'.split(' ');
const expansions = {
    "i'm": 'i am', "what's": 'what is', "she's": 'she is', "he's": 'he is',
    "it's": 'it is', "that's": 'that is', "doesn't": 'does not', "don't": 'do not',
    "they're": 'they are', "i'll": 'i will', "i'd": 'i would', "can't": 'cannot'
};

function compareWords(phrase, reference) {
    function number(n) {
        if (n < 20) return smallNumbers[n];
        return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + smallNumbers[n % 10] : '');
    }
    function tokens(value) {
        let source = value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[‘’]/g, "'");
        if (/^n, o, r, a\.$/i.test(reference)) {
            source = source.replace(/\bnora\b/g, 'n o r a')
                .replace(/\ben\b/g, 'n').replace(/\boh\b/g, 'o')
                .replace(/\bar\b/g, 'r').replace(/\bay\b/g, 'a');
        }
        source = source.replace(/\bkeycard\b/g, 'key card')
            .replace(/\bnoralee\b/g, 'nora lee')
            .replace(/\bokay\b/g, 'ok')
            .replace(/\bcan not\b/g, 'cannot');
        const hasClockTime = /\b(?:nine fifteen|eleven twenty|nine thirty|ten thirty)\b/i.test(reference);
        source = source.replace(/\b(\d{1,2})\s*[:.]\s*(\d{2})\b/g, '$1$2')
            .replace(/\b\d+\b/g, digits => {
                if (hasClockTime && /^\d{3,4}$/.test(digits)) {
                    const hour = Number(digits.slice(0, -2));
                    const minute = Number(digits.slice(-2));
                    if (hour > 0 && hour < 24 && minute > 0 && minute < 60) {
                        return number(hour) + ' ' + (minute < 10 ? 'oh ' : '') + number(minute);
                    }
                }
                if (digits.length <= 2 && Number(digits) < 60) return number(Number(digits));
                return [...digits].map(digit => smallNumbers[Number(digit)]).join(' ');
            });
        return (source.match(/[a-z]+(?:'[a-z]+)?/g) || [])
            .flatMap(word => (expansions[word] || word).split(' '));
    }

    const target = tokens(reference);
    const heard = tokens(phrase);
    const cost = Array.from({ length: target.length + 1 }, () => Array(heard.length + 1).fill(0));
    for (let i = 0; i <= target.length; i++) cost[i][0] = i;
    for (let j = 0; j <= heard.length; j++) cost[0][j] = j;
    for (let i = 1; i <= target.length; i++) {
        for (let j = 1; j <= heard.length; j++) {
            cost[i][j] = Math.min(cost[i - 1][j] + 1, cost[i][j - 1] + 1,
                cost[i - 1][j - 1] + Number(target[i - 1] !== heard[j - 1]));
        }
    }
    let i = target.length;
    let j = heard.length;
    const issues = [];
    while (i > 0 || j > 0) {
        if (i && j && target[i - 1] === heard[j - 1]) {
            i--;
            j--;
        } else if (i && j && cost[i][j] === cost[i - 1][j - 1] + 1) {
            issues.push({ expected: target[--i], heard: heard[--j] });
        } else if (i && cost[i][j] === cost[i - 1][j] + 1) {
            issues.push({ expected: target[--i] });
        } else {
            issues.push({ heard: heard[--j] });
        }
    }
    return issues.reverse();
}

const pronunciationTips = {
    this: 'Para /ð/, coloca la lengua entre los dientes suavemente y usa la voz.',
    there: 'Para /ð/, coloca la lengua entre los dientes suavemente y usa la voz.',
    they: 'Para /ð/, coloca la lengua entre los dientes suavemente y usa la voz.',
    the: 'Para /ð/, coloca la lengua entre los dientes suavemente y usa la voz.',
    three: 'Empieza con /θ/: deja pasar aire entre la lengua y los dientes sin vibración.',
    thank: 'Empieza con /θ/: deja pasar aire entre la lengua y los dientes sin vibración.',
    thanks: 'Empieza con /θ/ y deja oír la /s/ del final.',
    think: 'Empieza con /θ/: deja pasar aire entre la lengua y los dientes sin vibración.',
    without: 'Practica el diptongo /aʊ/ en la segunda sílaba y la /t/ final.',
    water: 'En inglés británico, la primera sílaba lleva la vocal larga /ɔː/. Escucha el modelo.',
    work: 'Alarga la vocal /ɜː/ y marca la /k/ final.',
    where: 'Redondea los labios al principio para la /w/.',
    who: 'Empieza con /h/ aspirada y continúa con una /uː/ larga.',
    shoes: 'Empieza con /ʃ/, como al pedir silencio, y termina con /z/ sonora.',
    shirt: 'Empieza con /ʃ/ y alarga la vocal /ɜː/.',
    sugar: 'Empieza con /ʃ/, el mismo sonido inicial de shoes.',
    spain: 'Empieza directamente con /sp/ y pronuncia /eɪ/ en la vocal.',
    six: 'Haz la vocal breve /ɪ/ y termina con /ks/.',
    leave: 'Alarga la vocal /iː/ y termina con /v/.',
    please: 'Alarga la vocal /iː/ y termina con /z/ sonora.',
    card: 'Alarga la vocal /ɑː/ y marca la /d/ final.',
    time: 'Pronuncia el diptongo /aɪ/ y cierra con /m/.',
    right: 'Practica el diptongo /aɪ/ y la /t/ del final.',
    repeat: 'La fuerza cae en la segunda sílaba: re-PEAT.'
};

const speechMessages = {
    'audio-capture': 'No se ha detectado un micrófono disponible.',
    'not-allowed': 'El navegador ha bloqueado el micrófono. Revisa el permiso del sitio.',
    'service-not-allowed': 'El navegador no permite usar su servicio de reconocimiento aquí.',
    'network': 'El servicio de reconocimiento no ha respondido. Revisa la conexión y vuelve a intentarlo.',
    'no-speech': 'No se ha detectado voz. Acércate al micrófono e inténtalo de nuevo.',
    'language-not-supported': 'El reconocimiento en inglés británico no está disponible en este navegador.'
};

let listening = null;
function stopListening() {
    if (!listening) return;
    listening.cancel();
}
const courseAudio = document.querySelectorAll('audio');
document.addEventListener('play', stopListening, true);
document.querySelector('#units').addEventListener('click', event => {
    if (event.target.closest('[data-open]')) stopListening();
});
window.addEventListener('pagehide', stopListening);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopListening();
});

for (const practice of document.querySelectorAll('.speaking-practice')) {
    const player = practice.closest('[data-captions]');
    const audio = player.querySelector('audio');
    const select = practice.querySelector('select');
    const model = practice.querySelector('.model-button');
    const speak = practice.querySelector('.speak-button');
    const status = practice.querySelector('.speaking-status');
    const feedback = practice.querySelector('.speaking-feedback');
    const recognized = practice.querySelector('.heard-words');
    const differences = practice.querySelector('.speaking-differences');
    const unsupported = 'Este navegador no ofrece reconocimiento de voz. Puedes seguir escuchando y repitiendo el modelo.';
    let phrases;
    let modelEnd = null;

    practice.hidden = false;
    practice.addEventListener('toggle', async () => {
        if (!practice.open) {
            if (listening?.practice === practice) stopListening();
            if (modelEnd !== null) audio.pause();
            return;
        }
        if (phrases) return;
        status.textContent = 'Cargando frases…';
        try {
            phrases = (await loadCaptions())[player.dataset.captions];
            if (!phrases?.length) throw new Error('Frases no disponibles');
            select.replaceChildren(...phrases.map((phrase, i) => new Option(phrase.text, i)));
            select.disabled = false;
            model.disabled = false;
            speak.disabled = !SpeechEngine;
            status.textContent = SpeechEngine ? '' : unsupported;
        } catch {
            phrases = undefined;
            status.textContent = 'Cierra y abre la práctica para volver a cargar las frases.';
        }
    });

    select.addEventListener('change', () => {
        if (modelEnd !== null) audio.pause();
        feedback.hidden = true;
        status.textContent = SpeechEngine ? '' : unsupported;
    });

    audio.addEventListener('timeupdate', () => {
        if (modelEnd !== null && audio.currentTime >= modelEnd) audio.pause();
    });
    audio.addEventListener('pause', () => { modelEnd = null; });

    model.addEventListener('click', () => {
        stopListening();
        for (const other of courseAudio) {
            if (other !== audio) other.pause();
        }
        const phrase = phrases[select.value];
        modelEnd = phrase.end;
        audio.currentTime = phrase.start;
        audio.play().catch(() => {
            modelEnd = null;
            status.textContent = 'El audio no se pudo reproducir. Vuelve a intentarlo.';
        });
    });

    function showResult(transcript, target) {
        const issues = compareWords(transcript, target);
        recognized.textContent = transcript;
        differences.replaceChildren();
        feedback.hidden = false;
        if (!issues.length) {
            status.textContent = 'OK. El navegador ha reconocido todas las palabras de la frase.';
            return;
        }
        status.textContent = 'Revisa estas palabras y vuelve a escuchar el modelo.';
        for (const { expected, heard } of issues) {
            const item = document.createElement('li');
            function addWord(word) {
                const label = document.createElement('strong');
                label.lang = 'en-GB';
                label.textContent = word;
                item.append(label);
            }
            if (expected && heard) {
                item.append('Se esperaba ');
                addWord(expected);
                item.append(' y se reconoció ');
                addWord(heard);
            } else {
                item.append(expected ? 'No se reconoció ' : 'Se reconoció de más ');
                addWord(expected || heard);
            }
            item.append('. ' + (pronunciationTips[expected] || ''));
            differences.append(item);
        }
    }

    speak.addEventListener('click', () => {
        if (listening?.practice === practice) {
            listening.finish();
            return;
        }
        stopListening();
        courseAudio.forEach(track => track.pause());
        const recognition = new SpeechEngine();
        recognition.lang = 'en-GB';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        const target = phrases[select.value].text;
        let timer;
        let finished = false;
        function clean(message) {
            if (listening !== session) return false;
            clearTimeout(timer);
            listening = null;
            select.disabled = false;
            model.disabled = false;
            speak.disabled = false;
            speak.textContent = 'Repetir con el micrófono';
            if (message) status.textContent = message;
            return true;
        }
        const session = {
            practice,
            cancel() {
                if (clean('Escucha detenida.')) recognition.abort();
            },
            finish() {
                if (finished) return;
                finished = true;
                status.textContent = 'Comprobando la frase…';
                speak.disabled = true;
                clearTimeout(timer);
                timer = setTimeout(() => {
                    if (clean('El reconocimiento no respondió. Vuelve a intentarlo.')) recognition.abort();
                }, 8_000);
                try { recognition.stop(); } catch { session.cancel(); }
            }
        };
        listening = session;
        feedback.hidden = true;
        select.disabled = true;
        model.disabled = true;
        speak.textContent = 'Terminar de hablar';
        status.textContent = 'Preparando el micrófono…';
        recognition.onstart = () => {
            if (listening !== session || finished) return;
            status.textContent = 'Te escucho. Repite la frase.';
            clearTimeout(timer);
            timer = setTimeout(() => session.finish(), 12_000);
        };
        recognition.onresult = event => {
            if (clean()) showResult(event.results[0][0].transcript.trim(), target);
        };
        recognition.onerror = event => {
            clean(speechMessages[event.error] || 'No se pudo reconocer la frase. Vuelve a intentarlo.');
        };
        recognition.onend = () => {
            clean('No se recibió una frase. Pulsa el micrófono para intentarlo de nuevo.');
        };
        try {
            recognition.start();
            if (listening === session && !timer) {
                timer = setTimeout(() => {
                    if (clean('No se pudo activar el micrófono. Revisa los permisos del sitio.')) recognition.abort();
                }, 20_000);
            }
        } catch {
            clean('No se pudo activar el micrófono. Vuelve a intentarlo.');
        }
    });
}
