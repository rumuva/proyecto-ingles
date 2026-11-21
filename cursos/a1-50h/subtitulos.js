const captionPlayers = document.querySelectorAll('[data-captions]');
let captionData;

function loadCaptions() {
    if (!captionData) {
        captionData = fetch('audio/subtitulos.json')
            .then(response => {
                if (!response.ok) throw new Error('Subtítulos no disponibles');
                return response.json();
            })
            .catch(error => {
                captionData = null;
                throw error;
            });
    }
    return captionData;
}

for (const player of captionPlayers) {
    const audio = player.querySelector('audio');
    const toggle = player.querySelector('.captions-toggle');
    const output = player.querySelector('.audio-captions');
    const state = output.querySelector('.captions-state');
    const speaker = output.querySelector('.captions-speaker');
    const text = output.querySelector('.captions-text');
    let cues;
    let currentCue = null;

    function renderCue() {
        const cue = cues && !output.hidden && !audio.ended && cues.find(
            line => audio.currentTime >= line.start && audio.currentTime < line.end
        );
        if (cue === currentCue) return;
        currentCue = cue;
        speaker.textContent = cue?.speaker ? cue.speaker + ' · ' : '';
        text.textContent = cue?.text || '';
    }

    toggle.addEventListener('click', async () => {
        const visible = output.hidden;
        output.hidden = !visible;
        toggle.setAttribute('aria-pressed', String(visible));
        renderCue();
        if (!visible || cues) return;

        state.textContent = 'Cargando subtítulos…';
        try {
            cues = (await loadCaptions())[player.dataset.captions];
            if (!cues?.length) throw new Error('Pista de subtítulos no encontrada');
            state.textContent = '';
            renderCue();
        } catch {
            state.textContent = 'Subtítulos no disponibles. Ocúltalos y vuelve a activarlos para reintentar.';
        }
    });

    for (const event of ['playing', 'timeupdate', 'seeking', 'seeked', 'ended', 'emptied']) {
        audio.addEventListener(event, renderCue);
    }
    toggle.hidden = false;
}
