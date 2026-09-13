export class FolhaSprites {
  constructor(origem, larguraQuadro, alturaQuadro) {
    this.imagem = new Image();
    this.imagem.src = origem;
    this.larguraQuadro = larguraQuadro;
    this.alturaQuadro = alturaQuadro;
    this.pronta = false;
    this.imagem.onload = () => { this.pronta = true; };
  }

  desenhar(contexto, quadro, x, y, largura, altura, inverter = false) {
    if (!this.pronta) return false;
    contexto.save();
    const posicaoX = inverter ? x + largura : x;
    contexto.translate(posicaoX, y);
    if (inverter) contexto.scale(-1, 1);
    contexto.drawImage(this.imagem, quadro * this.larguraQuadro, 0, this.larguraQuadro, this.alturaQuadro, 0, 0, largura, altura);
    contexto.restore();
    return true;
  }
}
