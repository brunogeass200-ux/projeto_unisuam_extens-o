export function criarGerenciadorAudio() {
  let contextoAudio = null;

  function inicializar() {
    if (!contextoAudio) {
      const AudioContexto = window.AudioContext || window.webkitAudioContext;
      if (!AudioContexto) return;
      contextoAudio = new AudioContexto();
    }
    if (contextoAudio.state === 'suspended') contextoAudio.resume();
  }

  function emitir(frequencia = 440, duracao = .06, tipo = 'square', volume = .02) {
    if (!contextoAudio) return;
    const oscilador = contextoAudio.createOscillator();
    const ganho = contextoAudio.createGain();
    oscilador.type = tipo;
    oscilador.frequency.value = frequencia;
    ganho.gain.value = volume;
    oscilador.connect(ganho);
    ganho.connect(contextoAudio.destination);
    oscilador.start();
    ganho.gain.exponentialRampToValueAtTime(.0001, contextoAudio.currentTime + duracao);
    oscilador.stop(contextoAudio.currentTime + duracao);
  }

  return {
    inicializar,
    pulo: () => emitir(360, .05, 'triangle', .015),
    tiro: () => { emitir(170, .045, 'square', .03); emitir(90, .035, 'sawtooth', .012); },
    acerto: () => emitir(60, .08, 'triangle', .03),
    coleta: () => { emitir(740, .08, 'sine', .025); emitir(990, .09, 'sine', .018); },
    dano: () => emitir(70, .08, 'square', .02),
    dash: () => emitir(120, .09, 'sawtooth', .025),
    emitir
  };
}
