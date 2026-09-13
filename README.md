# NEON RUN — Protótipo UNISUAM

Protótipo jogável de ação 2D com rolagem lateral para Web, desenvolvido em Canvas HTML5 + JavaScript puro, sem bibliotecas externas.

## Executar
1. Abra a pasta no Visual Studio Code.
2. Use uma extensão como **Live Server** para servir a pasta localmente.
3. Abra `index.html` e clique em **INICIAR MISSÃO**.

## Controles
- A / D ou setas: mover
- W / Espaço / ↑: pular
- J: atirar
- W / seta para cima + J: atirar para cima
- G: lançar granada
- K: dash
- R: reiniciar
- P ou Esc: pausar/continuar
- Em telas sensíveis ao toque, use os controles exibidos sobre o jogo.

## O que já está implementado
- Canvas 1280×720 e loop `requestAnimationFrame`
- Classe de spritesheet e spritesheet local do protagonista
- Atlas PNG do operativo com 56 frames separados: 8 idle, 8 corrida, 8 salto, 8 dash, 12 tiro e 12 morte
- Estados de idle, corrida, tiro e dash
- Controles `keydown` / `keyup`
- Tiros do jogador e projéteis inimigos
- Colisão AABB entre projéteis, inimigos, player e loot
- Inimigos com perseguição e disparo
- Arsenal de pistola com munição limitada, granadas e canhão do Metal Slug
- Resgate de seis POWs com bônus em sequência; ao morrer, a sequência e a contagem são perdidas
- Metal Slug coletável com vida própria, metralhadora de munição infinita e dano aumentado
- Granadas com trajetória, ricochete e explosão em área
- Loot de munição, cura e score
- Cenário urbano com grafites, postes e jeeps táticos
- Parallax em múltiplas camadas
- HUD com HP, score, munição, dash e minimapa
- Efeitos sonoros via Web Audio API
- Vitória ao chegar ao fim do percurso e derrota por HP
- Reinício rápido com R
- Cinco fases: Distrito Neon, Zona Industrial, Centro de Comando, Base Elevada e Corredor Aéreo
- Bases elevadas que atiram de cima e podem ser destruídas
- Aves que lançam granadas de grande altura, dando tempo para o jogador reagir
- Obstáculos sólidos que podem ser bloqueados ou usados como plataformas
- Tela de pausa com P, Esc ou botão de toque
- Limpeza automática das teclas quando a janela perde o foco
- Áudio inicializado também ao reiniciar a partida

## Estrutura
```
index.html
style.css
game.js
modulos/
  audio.js
  entrada.js
  sprites.js
assets/
  player_spritesheet.svg
  player_spritesheet.png
  frames_do_personagem.png
  personagem.png
tools/
  recortar-frames.ps1
README.md
```
