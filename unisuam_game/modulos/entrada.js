export function configurarEntrada({ teclas, podeJogar, aoAtirar, aoPular, aoDash, aoGranada, aoReiniciar, aoPausar, botoesTouch }) {
  function limparTeclas() {
    teclas.clear();
  }

  function tratarTeclaPressionada(evento) {
    const tecla = evento.key.toLowerCase();
    if ([' ', 'arrowup', 'arrowleft', 'arrowright'].includes(tecla)) evento.preventDefault();
    teclas.add(tecla);

    if (tecla === 'r') aoReiniciar();
    if (tecla === 'p' || tecla === 'escape') aoPausar();
    if (tecla === 'j' && podeJogar()) aoAtirar();
    if (tecla === 'g' && podeJogar()) aoGranada();
    if ((tecla === 'w' || tecla === ' ' || tecla === 'arrowup') && podeJogar()) aoPular();
    if (tecla === 'k' && podeJogar()) aoDash();
  }

  function tratarTeclaSolta(evento) {
    teclas.delete(evento.key.toLowerCase());
  }

  window.addEventListener('keydown', tratarTeclaPressionada);
  window.addEventListener('keyup', tratarTeclaSolta);
  window.addEventListener('blur', limparTeclas);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) limparTeclas();
  });

  const mapaTeclas = { esquerda: 'a', direita: 'd' };
  botoesTouch.forEach(botao => {
    const acao = botao.dataset.acao;
    const teclaMovimento = mapaTeclas[acao];

    const pressionar = evento => {
      evento.preventDefault();
      botao.setPointerCapture?.(evento.pointerId);
      if (teclaMovimento) teclas.add(teclaMovimento);
      if (acao === 'pausar') aoPausar();
      if (acao === 'pular' && podeJogar()) aoPular();
      if (acao === 'atirar' && podeJogar()) aoAtirar();
      if (acao === 'granada' && podeJogar()) aoGranada();
      if (acao === 'dash' && podeJogar()) aoDash();
    };
    const soltar = evento => {
      evento.preventDefault();
      if (teclaMovimento) teclas.delete(teclaMovimento);
    };

    botao.addEventListener('pointerdown', pressionar);
    botao.addEventListener('pointerup', soltar);
    botao.addEventListener('pointercancel', soltar);
    botao.addEventListener('pointerleave', soltar);
  });

  return { limparTeclas };
}
