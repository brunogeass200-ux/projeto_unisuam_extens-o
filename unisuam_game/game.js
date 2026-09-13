import { criarGerenciadorAudio } from './modulos/audio.js';
import { configurarEntrada } from './modulos/entrada.js';
import { FolhaSprites } from './modulos/sprites.js';

const tela = document.getElementById('tela-jogo');
const contexto = tela.getContext('2d');
const sobreposicaoInicio = document.getElementById('sobreposicao-inicio');
const botaoInicio = document.getElementById('botao-inicio');
const mensagem = document.getElementById('mensagem');
const sobreposicaoPausa = document.getElementById('sobreposicao-pausa');
const botaoContinuar = document.getElementById('botao-continuar');
const botoesTouch = [...document.querySelectorAll('[data-acao]')];

const LARGURA_TELA = tela.width, ALTURA_TELA = tela.height;
const teclasPressionadas = new Set();
let jogoEmAndamento = false;
let jogoPausado = false;
let ultimoQuadro = 0;
let tempoJogo = 0;
const audio = criarGerenciadorAudio();

const mundo = { width: 12000, ground: 560, cameraX: 0 };
const fases = [
  { numero: 1, nome: 'Distrito Neon', inicio: 0, fim: 2400 },
  { numero: 2, nome: 'Zona Industrial', inicio: 2400, fim: 4800 },
  { numero: 3, nome: 'Centro de Comando', inicio: 4800, fim: 7200 },
  { numero: 4, nome: 'Base Elevada', inicio: 7200, fim: 9600 },
  { numero: 5, nome: 'Corredor Aéreo', inicio: 9600, fim: mundo.width }
];
const jogador = {
  x: 180, y: 430, w: 51, h: 50, vx: 0, vy: 0, speed: 310, jump: 670,
  onGround: false, health: 100, maxHealth: 100, score: 0, ammo: 30, grenades: 10,
  powResgatados: 0, powSequencia: 0, entrouNoSlug: false,
  facing: 1, dashTime: 0, dashCooldown: 0, shootCooldown: 0, grenadeCooldown: 0, invuln: 0,
  state: 'idle'
};

let projeteisJogador = [], projeteisInimigos = [], granadas = [], granadasInimigas = [], inimigos = [], itensLoot = [], prisioneiros = [], particulas = [], capsulas = [], explosoes = [];
let obstaculos = [];
let bases = [], aves = [];
let slug = null;
let tremorCamera = 0;
let missaoEncerrada = false;
let avisouBandeira = false;
const folhaSpritesJogador = new FolhaSprites('assets/player_original.svg', 64, 72);
let tempoMensagem = 0;
const bandeira = { x: mundo.width - 260, y: mundo.ground - 190, w: 40, h: 110 };

function reiniciarJogo() {
  jogador.x = 110; jogador.y = mundo.ground - jogador.h; jogador.vx = 0; jogador.vy = 0;
  jogador.health = 88; jogador.score = 0; jogador.ammo = 30; jogador.grenades = 10; jogador.facing = 1;
  jogador.powResgatados = 0; jogador.powSequencia = 0; jogador.entrouNoSlug = false;
  jogador.dashTime = 0; jogador.dashCooldown = 0; jogador.shootCooldown = 0; jogador.grenadeCooldown = 0; jogador.invuln = 0; jogador.state = 'idle';
  mundo.cameraX = 0; missaoEncerrada = false; avisouBandeira = false; jogoPausado = false; tremorCamera = 0;
  sobreposicaoPausa.classList.add('oculto');
  projeteisJogador = []; projeteisInimigos = []; granadas = []; granadasInimigas = []; inimigos = []; itensLoot = []; prisioneiros = []; particulas = []; capsulas = []; explosoes = []; obstaculos = []; bases = []; aves = []; slug = null;
  const enemyXs = [820, 1150, 1540, 1940, 2410, 2860, 3310, 3730, 4260, 4690, 5160, 5630, 6180, 6840, 7460, 8120, 8780, 9460, 10020, 10640, 11300];
  enemyXs.forEach((x, i) => inimigos.push({ x, y: mundo.ground - 56, w: 38, h: 56, vx: 0, health: 35, maxHealth: 35, type: i % 4 === 0 ? 'runner' : 'guard', shoot: 0.8 + (i % 3) * .3, alive: true }));
  itensLoot.push({x: 1270, y: mundo.ground - 38, w: 34, h: 34, type: 'ammo', taken: false});
  itensLoot.push({x: 2140, y: mundo.ground - 38, w: 34, h: 34, type: 'med', taken: false});
  itensLoot.push({x: 3550, y: mundo.ground - 38, w: 34, h: 34, type: 'score', taken: false});
  itensLoot.push({x: 4880, y: mundo.ground - 38, w: 34, h: 34, type: 'ammo', taken: false});
  itensLoot.push({x: 5900, y: mundo.ground - 38, w: 34, h: 34, type: 'med', taken: false});
  [980, 1870, 2680, 4320, 5020, 6040].forEach((x, i) => prisioneiros.push({x, y: mundo.ground - 54, w: 30, h: 54, resgatado: false, seguindo: false, destino: x, bonus: 150 + i * 50}));
  slug = { x: 3260, y: mundo.ground - 78, w: 108, h: 78, health: 180, maxHealth: 180, collected: false, destruido: false, shootCooldown: 0 };
  for (let i=0;i<9;i++) capsulas.push({x: 680 + i*760, w: 120, h: 56});
  const configuracoesObstaculos = [
    [620, 88, 44], [1420, 120, 58], [2260, 92, 42],
    [2760, 140, 66], [3410, 88, 44], [4140, 130, 58],
    [5080, 100, 52], [5480, 150, 72], [6330, 110, 48],
    [7040, 100, 54], [7600, 150, 72], [8260, 110, 48],
    [8920, 140, 64], [9680, 110, 52], [10340, 150, 72], [11120, 120, 58]
  ];
  configuracoesObstaculos.forEach(([x, width, height]) => obstaculos.push({ x, y: mundo.ground - height, w: width, h: height }));
  bases.push({ x: 7420, y: 210, w: 250, h: 34, tiro: 1.2, vida: 3 });
  bases.push({ x: 8720, y: 160, w: 280, h: 34, tiro: .8, vida: 3 });
  bases.push({ x: 9880, y: 120, w: 300, h: 34, tiro: .65, vida: 3 });
  [7860, 8360, 9250, 10180, 10820, 11520].forEach((x, indice) => aves.push({ x, y: 150 + (indice % 2) * 35, w: 44, h: 22, inicio: x, fase: indice * .8, granada: 1.5 + indice * .25, vida: 30, viva: true }));
}

function obterFaseAtual() {
  return fases.find(fase => jogador.x >= fase.inicio && jogador.x < fase.fim) || fases[fases.length - 1];
}

function mostrarMensagem(texto) { mensagem.textContent = texto; mensagem.classList.add('visivel'); tempoMensagem = 2; }
function emitirSom(frequencia=440, duracao=.06, tipo='square', volume=.02) { audio.emitir(frequencia, duracao, tipo, volume); }
function tocarSomDeTiro(){ audio.tiro(); }
function tocarSomDeAcerto(){ audio.acerto(); }
function tocarSomDeColeta(){ audio.coleta(); }
function tocarSomDeDano(){ audio.dano(); }

function destruirMetalSlug() {
  jogador.entrouNoSlug = false;
  jogador.w = 51;
  jogador.h = 50;
  jogador.maxHealth = 100;
  jogador.health = 100;
  jogador.y = mundo.ground - jogador.h;
  if (slug) {
    slug.destruido = true;
    slug.collected = false;
  }
  mostrarMensagem('O Metal Slug foi destruído! Você voltou ao normal.');
}

function aplicarDanoAoJogador(dano) {
  if (jogador.invuln > 0 || missaoEncerrada) return;
  jogador.invuln = jogador.entrouNoSlug ? .55 : .35;
  tremorCamera = jogador.entrouNoSlug ? 16 : 10;
  criarParticulas(jogador.x + jogador.w / 2, jogador.y + 20, 9, 'dano');
  tocarSomDeDano();

  if (jogador.entrouNoSlug && slug) {
    slug.health -= dano;
    jogador.health = Math.max(0, slug.health);
    if (slug.health <= 0) destruirMetalSlug();
    return;
  }

  jogador.health -= dano;
  if (jogador.health <= 0) {
    jogador.health = 0;
    jogador.powSequencia = 0;
    jogador.powResgatados = 0;
    missaoEncerrada = true;
  }
}

function iniciarJogo() {
  jogoEmAndamento = true;
  sobreposicaoInicio.classList.add('oculto');
  audio.inicializar();
  reiniciarJogo(); mostrarMensagem('Missão iniciada — alcance o final da cidade.');
}
botaoInicio.addEventListener('click', iniciarJogo);
function pular() {
  if (jogador.onGround && jogoEmAndamento && !jogoPausado) {
    jogador.vy = -jogador.jump;
    jogador.onGround = false;
    audio.pulo();
  }
}
function reiniciarPartida() {
  audio.inicializar();
  reiniciarJogo();
  jogoEmAndamento = true;
  sobreposicaoInicio.classList.add('oculto');
  mostrarMensagem('Missão reiniciada.');
}
function alternarPausa() {
  if (!jogoEmAndamento || missaoEncerrada) return;
  jogoPausado = !jogoPausado;
  sobreposicaoPausa.classList.toggle('oculto', !jogoPausado);
  if (jogoPausado) teclasPressionadas.clear();
}
configurarEntrada({
  teclas: teclasPressionadas,
  podeJogar: () => jogoEmAndamento && !jogoPausado && !missaoEncerrada,
  aoAtirar: atirar,
  aoGranada: lancarGranada,
  aoPular: pular,
  aoDash: usarDash,
  aoReiniciar: reiniciarPartida,
  aoPausar: alternarPausa,
  botoesTouch
});
botaoContinuar.addEventListener('click', alternarPausa);

function retangulosColidem(primeiro, segundo){ return primeiro.x < segundo.x+segundo.w && primeiro.x+primeiro.w > segundo.x && primeiro.y < segundo.y+segundo.h && primeiro.y+primeiro.h > segundo.y; }
function criarParticulas(x,y,quantidade=8,tipo='faísca'){
  for(let i=0;i<quantidade;i++) particulas.push({x,y,vx:(Math.random()-.5)*260,vy:(Math.random()-.6)*260,life:.35+Math.random()*.35,max:.7,kind: tipo});
}
function atirar(){
  if (!jogoEmAndamento || jogador.shootCooldown > 0 || (!jogador.entrouNoSlug && jogador.ammo <= 0)) return;
  const sx = jogador.x + (jogador.facing > 0 ? jogador.w : -10);
  const sy = jogador.y + 26;
  const mirandoParaCima = teclasPressionadas.has('w') || teclasPressionadas.has('arrowup');
  projeteisJogador.push({x:sx,y:sy,w:jogador.entrouNoSlug?24:16,h:5,vx:mirandoParaCima ? jogador.facing * 360 : jogador.facing * (jogador.entrouNoSlug?980:820),vy:mirandoParaCima ? -620 : 0,damage:jogador.entrouNoSlug?42:18,life:1.4});
  capsulas.push({x:jogador.x+jogador.w/2, y:jogador.y+28, vx:-80+Math.random()*35, vy:-120-Math.random()*70, life:.25});
  if(!jogador.entrouNoSlug) jogador.ammo--; jogador.shootCooldown=jogador.entrouNoSlug?.1:.15; jogador.state='shoot';
  criarParticulas(sx,sy,4,'muzzle'); tocarSomDeTiro();
}
function lancarGranada(){
  if (!jogoEmAndamento || jogador.grenadeCooldown > 0 || jogador.grenades <= 0) return;
  const sx = jogador.x + (jogador.facing > 0 ? jogador.w : -8);
  granadas.push({x:sx, y:jogador.y+24, w:12, h:12, vx:jogador.facing*420, vy:-470, life:1.35});
  jogador.grenades--; jogador.grenadeCooldown=.45; jogador.state='shoot';
  criarParticulas(sx,jogador.y+24,6,'muzzle'); emitirSom(170,.08,'square',.025);
}
function usarDash(){
  if (jogador.dashCooldown > 0 || jogador.dashTime > 0) return;
  jogador.dashTime=.18; jogador.dashCooldown=1.0; jogador.vx=jogador.facing*900; jogador.invuln=.22; criarParticulas(jogador.x+jogador.w/2, jogador.y+jogador.h/2, 16,'dash'); emitirSom(120,.09,'sawtooth',.025);
}

function resolverColisoesObstaculos(posicaoAnteriorX) {
  for (const obstaculo of obstaculos) {
    if (!retangulosColidem(jogador, obstaculo)) continue;

    const veioDaEsquerda = posicaoAnteriorX + jogador.w <= obstaculo.x;
    const veioDaDireita = posicaoAnteriorX >= obstaculo.x + obstaculo.w;
    if (veioDaEsquerda) {
      jogador.x = obstaculo.x - jogador.w;
      jogador.vx = 0;
    } else if (veioDaDireita) {
      jogador.x = obstaculo.x + obstaculo.w;
      jogador.vx = 0;
    } else if (jogador.vy >= 0) {
      jogador.y = obstaculo.y - jogador.h;
      jogador.vy = 0;
      jogador.onGround = true;
    }
  }
}

function atualizarJogo(dt){
  tempoJogo += dt; if (tempoMensagem>0){ tempoMensagem-=dt; if(tempoMensagem<=0) mensagem.classList.remove('visivel'); }
  jogador.shootCooldown=Math.max(0,jogador.shootCooldown-dt); jogador.grenadeCooldown=Math.max(0,jogador.grenadeCooldown-dt); jogador.dashCooldown=Math.max(0,jogador.dashCooldown-dt); jogador.invuln=Math.max(0,jogador.invuln-dt);
  if (missaoEncerrada) return;

  const esquerda = teclasPressionadas.has('a') || teclasPressionadas.has('arrowleft'); const direita = teclasPressionadas.has('d') || teclasPressionadas.has('arrowright');
  if (jogador.dashTime > 0) { jogador.dashTime -= dt; }
  else {
    const velocidadeAlvo = (direita-esquerda) * jogador.speed;
    jogador.vx += (velocidadeAlvo-jogador.vx) * Math.min(1, dt*9);
    if (!esquerda && !direita) jogador.vx *= Math.pow(.07, dt);
  }
  if (direita) jogador.facing=1; if (esquerda) jogador.facing=-1;
  const posicaoAnteriorX = jogador.x;
  jogador.vy += 1700*dt; jogador.x += jogador.vx*dt; jogador.y += jogador.vy*dt;
  if (jogador.y + jogador.h >= mundo.ground){ jogador.y=mundo.ground-jogador.h; jogador.vy=0; jogador.onGround=true; } else jogador.onGround=false;
  resolverColisoesObstaculos(posicaoAnteriorX);
  jogador.x = Math.max(50, Math.min(mundo.width-jogador.w-60, jogador.x));
  if (Math.abs(jogador.vx)>80 && jogador.onGround) jogador.state='run'; else if (jogador.shootCooldown>0) jogador.state='shoot'; else jogador.state='idle';

  if (jogador.x > bandeira.x - 40 && jogador.powResgatados < prisioneiros.length && !avisouBandeira) {
    avisouBandeira = true;
    mostrarMensagem('Resgate todos os POWs antes de seguir para a bandeira.');
  }
  if (retangulosColidem(jogador, bandeira)) missaoEncerrada=true;
  mundo.cameraX += ((jogador.x - LARGURA_TELA*.32) - mundo.cameraX) * Math.min(1, dt*4);
  mundo.cameraX = Math.max(0, Math.min(mundo.width-LARGURA_TELA, mundo.cameraX));

  for (const projetil of projeteisJogador){ projetil.x+=projetil.vx*dt; projetil.y+=(projetil.vy || 0)*dt; projetil.life-=dt; }
  for (const granada of granadas){ granada.x+=granada.vx*dt; granada.y+=granada.vy*dt; granada.vy+=1100*dt; granada.life-=dt; if(granada.y+granada.h>=mundo.ground){granada.y=mundo.ground-granada.h;granada.vy*=-.42;granada.vx*=.7;} }
  for (const projetil of projeteisInimigos){ projetil.x+=projetil.vx*dt; projetil.y+=projetil.vy*dt; projetil.vy+=360*dt; projetil.life-=dt; }
  for (const granada of granadasInimigas){
    granada.x += granada.vx * dt;
    granada.y += granada.vy * dt;
    granada.vy += 420 * dt;
    granada.life -= dt;
  }
  projeteisJogador = projeteisJogador.filter(projetil=>projetil.life>0 && projetil.x>-100 && projetil.x<mundo.width+100);
  for (const granada of granadas) {
    if (granada.life > 0 || granada.explodida) continue;
    granada.explodida = true;
    explosoes.push({x: granada.x + granada.w / 2, y: granada.y + granada.h / 2, life: .5, radius: 120});
    for (const inimigo of inimigos) {
      if (!inimigo.alive || Math.hypot(inimigo.x - granada.x, inimigo.y - granada.y) > 120) continue;
      inimigo.health -= 85;
      if (inimigo.health <= 0) { inimigo.alive = false; jogador.score += 100; }
    }
    criarParticulas(granada.x, granada.y, 24, 'explosao');
    emitirSom(55, .16, 'sawtooth', .04);
  }
  granadas = granadas.filter(granada=>granada.life>0 && granada.x>-100 && granada.x<mundo.width+100);
  for (const granada of granadasInimigas){
    if (granada.life > 0 || granada.explodida) continue;
    granada.explodida = true;
    explosoes.push({x: granada.x, y: granada.y, life: .5, radius: 90});
    if (Math.hypot(jogador.x - granada.x, jogador.y - granada.y) < 115) aplicarDanoAoJogador(22);
    criarParticulas(granada.x, granada.y, 16, 'explosao');
    emitirSom(65, .12, 'sawtooth', .03);
  }
  granadasInimigas = granadasInimigas.filter(granada=>granada.life>0 && granada.x>-100 && granada.x<mundo.width+100);
  projeteisInimigos = projeteisInimigos.filter(projetil=>projetil.life>0 && projetil.x>-100 && projetil.x<mundo.width+100 && projetil.y<mundo.ground+100);

  for(const inimigo of inimigos){
    if(!inimigo.alive) continue;
    const distanciaX = jogador.x-inimigo.x;
    inimigo.vx = Math.sign(distanciaX) * (inimigo.type==='runner'?64:38);
    if(Math.abs(distanciaX)<530 && Math.abs(jogador.y-inimigo.y)<120){
      inimigo.x += inimigo.vx*dt*.6;
      inimigo.shoot -= dt;
      if(inimigo.shoot<=0){
        inimigo.shoot = 1.4 + Math.random()*.9;
        projeteisInimigos.push({x:inimigo.x+(distanciaX>0?inimigo.w:0),y:inimigo.y+18,w:11,h:5,vx:Math.sign(distanciaX)*480,vy:-40,life:1.6});
      }
    } else inimigo.x += inimigo.vx*dt*.15;
    inimigo.x = Math.max(500,Math.min(mundo.width-180,inimigo.x));
  }

  for (const base of bases){
    base.tiro -= dt;
    if (base.vida > 0 && base.tiro <= 0 && Math.abs(jogador.x - base.x) < 900){
      base.tiro = .9;
      projeteisInimigos.push({x: base.x + base.w / 2, y: base.y + base.h, w: 12, h: 12, vx: Math.sign(jogador.x - base.x) * 90, vy: 260, life: 3.5});
    }
  }
  for (const ave of aves){
    if (!ave.viva) continue;
    ave.x = ave.inicio + Math.sin(tempoJogo * 1.2 + ave.fase) * 90;
    ave.granada -= dt;
    if (ave.granada <= 0 && Math.abs(jogador.x - ave.x) < 850){
      ave.granada = 2.8;
      granadasInimigas.push({x: ave.x, y: ave.y + 26, vx: Math.sign(jogador.x - ave.x) * 150, vy: 80, life: 4.5});
    }
  }

  if(slug && !slug.collected && !slug.destruido && retangulosColidem(slug,jogador)){
    slug.collected=true; jogador.entrouNoSlug=true; jogador.health=slug.health; jogador.maxHealth=slug.maxHealth; jogador.w=88; jogador.h=78; jogador.y=mundo.ground-jogador.h; mostrarMensagem('METAL SLUG capturado — canhão pronto!'); emitirSom(90,.2,'sawtooth',.04);
  }
  if(jogador.entrouNoSlug && slug){ slug.x=jogador.x; slug.y=jogador.y; slug.health=jogador.health; slug.shootCooldown=Math.max(0,slug.shootCooldown-dt); }

  for(const projetil of projeteisJogador){
    for(const inimigo of inimigos){ if(inimigo.alive && retangulosColidem(projetil,inimigo)){ inimigo.health-=projetil.damage; projetil.life=0; criarParticulas(projetil.x,projetil.y,7,'impacto'); tocarSomDeAcerto(); if(inimigo.health<=0){inimigo.alive=false; jogador.score+=100; criarParticulas(inimigo.x+inimigo.w/2,inimigo.y+inimigo.h/2,16,'explosao'); explosoes.push({x:inimigo.x+inimigo.w/2,y:inimigo.y+inimigo.h/2,life:.4});} break; } }
    for(const base of bases){
      if(base.vida > 0 && retangulosColidem(projetil, base)){
        base.vida--;
        projetil.life = 0;
        criarParticulas(projetil.x, projetil.y, 8, 'impacto');
        if(base.vida === 0) mostrarMensagem('Base elevada destruída!');
      }
    }
    for(const ave of aves){
      if(ave.viva && retangulosColidem(projetil, {x: ave.x - ave.w / 2, y: ave.y - ave.h / 2, w: ave.w, h: ave.h})){
        ave.vida -= projetil.damage;
        projetil.life = 0;
        criarParticulas(ave.x, ave.y, 8, 'impacto');
        tocarSomDeAcerto();
        if(ave.vida <= 0){
          ave.viva = false;
          jogador.score += 150;
          criarParticulas(ave.x, ave.y, 16, 'explosao');
          mostrarMensagem('Ave abatida! +150 pontos');
        }
      }
    }
  }
  for(const prisioneiro of prisioneiros){
    if(!prisioneiro.resgatado && retangulosColidem(prisioneiro,jogador)){
      prisioneiro.resgatado=true; prisioneiro.seguindo=true; prisioneiro.destino=bandeira.x - 55;
      jogador.powResgatados++; jogador.powSequencia++; jogador.score+=prisioneiro.bonus*jogador.powSequencia; tocarSomDeColeta(); mostrarMensagem(`POW resgatado! Combo x${jogador.powSequencia} • +${prisioneiro.bonus*jogador.powSequencia}`);
    }
    if (prisioneiro.seguindo) {
      prisioneiro.x = Math.min(prisioneiro.destino, prisioneiro.x + 120 * dt);
      if (prisioneiro.x >= prisioneiro.destino) prisioneiro.seguindo = false;
    }
  }
  for(const projetil of projeteisInimigos){ if(retangulosColidem(projetil,jogador)){ projetil.life=0; aplicarDanoAoJogador(10); } }
  for(const inimigo of inimigos){ if(inimigo.alive && retangulosColidem(inimigo,jogador)){ aplicarDanoAoJogador(18); jogador.vx += Math.sign(jogador.x-inimigo.x)*320; } }
  for(const item of itensLoot){ if(!item.taken && retangulosColidem(item,jogador)){ item.taken=true; if(item.type==='ammo') jogador.ammo+=18; if(item.type==='med') jogador.health=Math.min(100,jogador.health+30); if(item.type==='score') jogador.score+=250; tocarSomDeColeta(); mostrarMensagem(item.type==='ammo'?'Munição +18':item.type==='med'?'Kit médico +30 HP':'Bônus +250 score'); } }

  atualizarParticulas(dt); atualizarCapsulas(dt); atualizarExplosoes(dt);
  tremorCamera=Math.max(0,tremorCamera-dt*30);
}
function atualizarParticulas(dt){ for(const particula of particulas){particula.x+=particula.vx*dt;particula.y+=particula.vy*dt;particula.vy+=380*dt;particula.life-=dt;} particulas=particulas.filter(particula=>particula.life>0); }
function atualizarCapsulas(dt){ for(const capsula of capsulas){ if(capsula.y!==undefined){capsula.x+=capsula.vx*dt;capsula.y+=capsula.vy*dt;capsula.vy+=500*dt;capsula.life-=dt;} } capsulas=capsulas.filter(capsula=>capsula.life===undefined || capsula.life>0); }
function atualizarExplosoes(dt){ for(const explosao of explosoes)explosao.life-=dt; explosoes=explosoes.filter(explosao=>explosao.life>0); }

function desenharJogo(){
  contexto.clearRect(0,0,LARGURA_TELA,ALTURA_TELA);
  desenharFundo();
  contexto.save();
  const deslocamentoX=(Math.random()-.5)*tremorCamera, deslocamentoY=(Math.random()-.5)*tremorCamera;
  contexto.translate(deslocamentoX,deslocamentoY);
  contexto.save(); contexto.translate(-mundo.cameraX,0); desenharMundo(); contexto.restore();
  contexto.restore();
  desenharInterface();
  if(missaoEncerrada) desenharTelaFinal();
}

function desenharFundo(){
  const gradiente= contexto.createLinearGradient(0,0,0,ALTURA_TELA); gradiente.addColorStop(0,'#050a1b'); gradiente.addColorStop(.55,'#0d1830'); gradiente.addColorStop(1,'#07111d'); contexto.fillStyle=gradiente; contexto.fillRect(0,0,LARGURA_TELA,ALTURA_TELA);
  desenharCamadaParalaxe(.08,420,'#0a1124',24,110);
  desenharCamadaParalaxe(.16,470,'#0d1730',34,130);
  desenharCamadaParalaxe(.27,520,'#111c37',46,150);
  contexto.fillStyle='rgba(110,231,255,.08)'; for(let i=0;i<7;i++){contexto.fillRect((i*230 - (mundo.cameraX*.05)%230),80+i*22,90,2);}
}
function desenharCamadaParalaxe(speed,base,fill,step,maxH){
  const deslocamento=-(mundo.cameraX*speed)%step; contexto.fillStyle=fill;
  for(let x=deslocamento-step;x<LARGURA_TELA+step;x+=step){ const altura=maxH*((Math.sin((x+mundo.cameraX*speed)*.05)+1)/2)*.55+36; contexto.fillRect(x,base-altura,step-4,altura); if(altura>75){contexto.fillStyle='rgba(110,231,255,.08)';contexto.fillRect(x+10,base-altura+18,5,5);contexto.fillRect(x+27,base-altura+18,5,5);contexto.fillStyle=fill;} }
}

function desenharMundo(){
  // prédios e letreiros ao fundo
  contexto.fillStyle='#182844'; contexto.fillRect(0,510,mundo.width,50);
  for(let x=0;x<mundo.width;x+=330){contexto.fillStyle='#0e172b';contexto.fillRect(x,360+(x%130),260,200);}
  // rua
  contexto.fillStyle='#0a0d14';contexto.fillRect(0,mundo.ground,mundo.width,ALTURA_TELA-mundo.ground);
  contexto.fillStyle='#263547';contexto.fillRect(0,mundo.ground,mundo.width,8);
  contexto.fillStyle='rgba(255,255,255,.08)'; for(let x=0;x<mundo.width;x+=170){contexto.fillRect(x,645,85,7);}
  desenharElementosDaRua();
  desenharBandeira(bandeira);
  for(const base of bases) if(base.vida > 0) desenharBaseElevada(base);
  for(const ave of aves) if(ave.viva) desenharAve(ave);
  for(const obstaculo of obstaculos) desenharObstaculo(obstaculo);
  for(const capsula of capsulas) desenharCapsula(capsula);
  for(const item of itensLoot) if(!item.taken) desenharItem(item);
  for(const prisioneiro of prisioneiros) if(!prisioneiro.resgatado || prisioneiro.seguindo) desenharPrisioneiro(prisioneiro);
  if(slug && !slug.collected && !slug.destruido) desenharSlug(slug);
  for(const inimigo of inimigos) if(inimigo.alive) desenharInimigo(inimigo);
  for(const projetil of projeteisJogador) desenharProjetil(projetil,false);
  for(const granada of granadas) desenharGranada(granada);
  for(const granada of granadasInimigas) desenharGranadaInimiga(granada);
  for(const projetil of projeteisInimigos) desenharProjetil(projetil,true);
  for(const explosao of explosoes) desenharExplosao(explosao);
  desenharJogador();
  for(const particula of particulas) desenharParticula(particula);
}
function desenharObstaculo(obstaculo){
  contexto.fillStyle='#29394b'; contexto.fillRect(obstaculo.x,obstaculo.y,obstaculo.w,obstaculo.h);
  contexto.fillStyle='#6ee7ff'; contexto.fillRect(obstaculo.x+8,obstaculo.y+8,obstaculo.w-16,5);
  contexto.fillStyle='rgba(255,255,255,.14)'; contexto.fillRect(obstaculo.x+8,obstaculo.y+20,obstaculo.w-16,4);
  contexto.strokeStyle='rgba(255,79,216,.7)'; contexto.lineWidth=2; contexto.strokeRect(obstaculo.x,obstaculo.y,obstaculo.w,obstaculo.h);
}
function desenharElementosDaRua(){
  for(let x=260;x<mundo.width;x+=580){
    contexto.fillStyle='#0b0e17';contexto.fillRect(x,410,12,150);contexto.fillRect(x+12,418,72,7);
    contexto.fillStyle='#ff4fd8';contexto.fillRect(x+56,385,55,28);
    contexto.fillStyle='#08111f';contexto.fillRect(x+58,388,51,21);
    contexto.fillStyle='rgba(110,231,255,.8)';contexto.font='700 11px sans-serif';contexto.fillText('NEON',x+64,402);
  }
  for(let x=680;x<mundo.width;x+=760){
    // silhueta dos jeeps táticos
    contexto.fillStyle='#121b28';contexto.fillRect(x,494,150,44);contexto.fillRect(x+22,470,86,33);contexto.fillStyle='#0a1119';contexto.beginPath();contexto.arc(x+36,540,18,0,Math.PI*2);contexto.arc(x+120,540,18,0,Math.PI*2);contexto.fill();
    contexto.fillStyle='#50d9ff';contexto.fillRect(x+31,481,27,12);contexto.fillRect(x+70,481,34,12);
    contexto.fillStyle='#334452';contexto.fillRect(x+144,508,30,8);
  }
  // faixas de grafite
  for(let x=430;x<mundo.width;x+=920){contexto.save();contexto.translate(x,448);contexto.rotate(-.03);contexto.strokeStyle='rgba(255,79,216,.55)';contexto.lineWidth=5;contexto.beginPath();contexto.moveTo(0,30);contexto.lineTo(44,0);contexto.lineTo(84,28);contexto.stroke();contexto.strokeStyle='rgba(110,231,255,.55)';contexto.beginPath();contexto.moveTo(35,38);contexto.lineTo(73,12);contexto.lineTo(112,34);contexto.stroke();contexto.restore();}
}
function desenharBaseElevada(base){
  contexto.fillStyle='rgba(0,0,0,.35)';
  contexto.fillRect(base.x + 20, base.y + base.h, base.w - 40, mundo.ground - base.y - base.h);
  contexto.fillStyle='#394c61';
  contexto.fillRect(base.x, base.y, base.w, base.h);
  contexto.fillStyle='#ff7b6e';
  contexto.fillRect(base.x + base.w / 2 - 9, base.y + base.h, 18, 16);
  contexto.fillStyle='#6ee7ff';
  contexto.fillRect(base.x + 14, base.y + 9, base.w - 28, 5);
  contexto.fillStyle='#ffcf5a';
  contexto.font='900 11px sans-serif';
  contexto.fillText('BASE', base.x + 12, base.y - 8);
}
function desenharAve(ave){
  contexto.save();
  contexto.translate(ave.x, ave.y + Math.sin(tempoJogo * 3 + ave.fase) * 8);
  contexto.fillStyle='#d7edf5';
  contexto.beginPath();
  contexto.ellipse(0, 0, 22, 10, 0, 0, Math.PI * 2);
  contexto.fill();
  contexto.fillStyle='#ff4fd8';
  contexto.beginPath();
  contexto.moveTo(-8, 0); contexto.lineTo(-34, -18); contexto.lineTo(-20, 5);
  contexto.moveTo(8, 0); contexto.lineTo(34, -18); contexto.lineTo(20, 5);
  contexto.fill();
  contexto.fillStyle='#ffcf5a';
  contexto.beginPath(); contexto.arc(19, -2, 4, 0, Math.PI * 2); contexto.fill();
  contexto.restore();
}
function desenharJogador(){
  if(jogador.invuln>0 && Math.floor(tempoJogo*20)%2===0) return;
  const x=jogador.x,y=jogador.y-30;
  // sombra
  contexto.fillStyle='rgb(0, 0, 0)';contexto.beginPath();contexto.ellipse(x+32,mundo.ground+3,32,7,0,0,Math.PI*2);contexto.fill();
  if(jogador.entrouNoSlug){ desenharSlug({x:jogador.x,y:jogador.y,w:jogador.w,h:jogador.h,health:jogador.health,maxHealth:jogador.maxHealth,collected:true}); return; }
  const faixasAnimacao = { idle: [0, 1, 2], run: [1, 1, 1], jump: [1, 1, 1], dash: [2, 1, 1], shoot: [3, 1, 1], death: [2, 1, 1] };
  const estadoAnimacao = jogador.health <= 0 ? 'death' : jogador.dashTime > 0 ? 'dash' : !jogador.onGround ? 'jump' : jogador.state;
  const [inicio, quantidade, velocidade] = faixasAnimacao[estadoAnimacao] || faixasAnimacao.idle;
  const quadro = inicio + Math.floor(tempoJogo * velocidade) % quantidade;
  if (!folhaSpritesJogador.desenhar(contexto, quadro, x, y, 72, 77, jogador.facing<0)) {
    contexto.fillStyle='#162535';contexto.fillRect(x+6,y+18,31,36); contexto.fillStyle='#d7edf5';contexto.beginPath();contexto.arc(x+21,y+13,12,0,Math.PI*2);contexto.fill();
  }
}
function desenharInimigo(e){
  const x=e.x,y=e.y; contexto.fillStyle='rgba(0,0,0,.28)';contexto.beginPath();contexto.ellipse(x+19,mundo.ground+2,23,6,0,0,Math.PI*2);contexto.fill();
  contexto.fillStyle=e.type==='runner'?'#ff4fd8':'#ff7b6e';contexto.fillRect(x+6,y+18,26,36);contexto.fillStyle='#d8e7ed';contexto.beginPath();contexto.arc(x+19,y+11,10,0,Math.PI*2);contexto.fill();contexto.fillStyle='#151c2b';contexto.fillRect(x+8,y+5,22,7);contexto.fillStyle='#0d121b';contexto.fillRect(x+28,y+29,22,6);
  contexto.fillStyle='rgba(0,0,0,.4)';contexto.fillRect(x,y-10,e.w,5);contexto.fillStyle='#ff4fd8';contexto.fillRect(x,y-10,e.w*(e.health/e.maxHealth),5);
}
function desenharProjetil(b, inimigo){contexto.fillStyle=inimigo?'#ff7b6e':'#fff0b2';contexto.shadowBlur=12;contexto.shadowColor=inimigo?'#ff4f4f':'#6ee7ff';contexto.fillRect(b.x,b.y,b.w,b.h);contexto.shadowBlur=0;}
function desenharGranada(g){ contexto.save(); contexto.fillStyle='rgba(183,255,85,.22)'; contexto.beginPath(); contexto.arc(g.x+6,g.y+6,14,0,Math.PI*2); contexto.fill(); contexto.fillStyle='#b7ff55'; contexto.beginPath(); contexto.arc(g.x+6,g.y+6,8,0,Math.PI*2); contexto.fill(); contexto.fillStyle='#fff0b2'; contexto.fillRect(g.x+4,g.y-3,5,5); contexto.restore(); }
function desenharGranadaInimiga(g){ contexto.save(); contexto.fillStyle='rgba(255,123,110,.22)'; contexto.beginPath(); contexto.arc(g.x,g.y,15,0,Math.PI*2); contexto.fill(); contexto.fillStyle='#ff7b6e'; contexto.beginPath(); contexto.arc(g.x,g.y,8,0,Math.PI*2); contexto.fill(); contexto.fillStyle='#fff0b2'; contexto.fillRect(g.x-2,g.y-12,5,5); contexto.restore(); }
function desenharPrisioneiro(p){ const pulse=1+Math.sin(tempoJogo*5+p.x)*.08; contexto.save(); contexto.translate(p.x,p.y); contexto.fillStyle='rgba(0,0,0,.25)';contexto.beginPath();contexto.ellipse(15,56,20,5,0,0,Math.PI*2);contexto.fill(); contexto.fillStyle='#d9a36a';contexto.beginPath();contexto.arc(15,12,9*pulse,0,Math.PI*2);contexto.fill(); contexto.fillStyle='#f0f4f5';contexto.fillRect(7,21,16,27); contexto.fillStyle='#e1b85d';contexto.fillRect(3,48,9,6);contexto.fillRect(18,48,9,6); contexto.fillStyle='#ffcf5a';contexto.font='900 9px sans-serif';contexto.fillText('POW',-2,-5); contexto.restore(); }
function desenharBandeira(f){ contexto.save(); contexto.fillStyle='#8d9cab'; contexto.fillRect(f.x,f.y,6,f.h); contexto.fillStyle='#ffcf5a'; contexto.fillRect(f.x-4,f.y+f.h-5,14,5); contexto.fillStyle='#ff4fd8'; contexto.beginPath(); contexto.moveTo(f.x+6,f.y+10); contexto.lineTo(f.x+f.w,f.y+28); contexto.lineTo(f.x+6,f.y+58); contexto.closePath(); contexto.fill(); contexto.fillStyle='#e9f7ff'; contexto.font='900 11px sans-serif'; contexto.fillText('RESGATE',f.x+13,f.y+84); contexto.restore(); }
function desenharSlug(s){ contexto.save(); contexto.translate(s.x,s.y); contexto.fillStyle='rgba(0,0,0,.3)';contexto.beginPath();contexto.ellipse(s.w/2,s.h+5,s.w*.48,8,0,0,Math.PI*2);contexto.fill(); contexto.fillStyle='#536d4b';contexto.fillRect(12,24,s.w-24,38); contexto.fillStyle='#87a86d';contexto.fillRect(28,8,48,28); contexto.fillStyle='#25392d';contexto.fillRect(36,14,30,15); contexto.fillStyle='#6f8d60';contexto.fillRect(48,0,12,15); contexto.fillStyle='#9aaf75';contexto.fillRect(52,-22,8,25); contexto.fillStyle='#1a2730';contexto.fillRect(0,55,30,17);contexto.fillRect(s.w-30,55,30,17); contexto.fillStyle='#111b20';contexto.beginPath();contexto.arc(16,64,12,0,Math.PI*2);contexto.arc(s.w-16,64,12,0,Math.PI*2);contexto.fill(); if(s.collected){contexto.fillStyle='#b7ff55';contexto.fillRect(12,17,(s.w-24)*(s.health/s.maxHealth),4);} else {contexto.fillStyle='#ffcf5a';contexto.font='900 11px sans-serif';contexto.fillText('METAL SLUG',5,-30);} contexto.restore(); }
function desenharItem(l){contexto.save();contexto.translate(l.x,l.y);contexto.rotate(Math.sin(tempoJogo*2)*.06);contexto.fillStyle=l.type==='med'?'#b7ff55':l.type==='ammo'?'#6ee7ff':'#ffcf5a';contexto.fillRect(0,0,34,34);contexto.fillStyle='#07101b';contexto.fillRect(7,7,20,20);contexto.fillStyle='#fff';contexto.font='900 12px sans-serif';contexto.textAlign='center';contexto.textBaseline='middle';contexto.fillText(l.type==='med'?'+':l.type==='ammo'?'AM':'★',17,17);contexto.restore();}
function desenharCapsula(s){ if(s.y===undefined) return; contexto.save();contexto.translate(s.x,s.y);contexto.fillStyle='#dfaa54';contexto.fillRect(0,0,5,2);contexto.restore(); }
function desenharParticula(p){const alpha=Math.max(0,p.life/p.max);contexto.globalAlpha=alpha;contexto.fillStyle=p.kind==='dano'?'#ff7b6e':p.kind==='dash'?'#ff4fd8':p.kind==='muzzle'?'#fff0b2':'#6ee7ff';contexto.fillRect(p.x,p.y,3+(1-alpha)*3,3+(1-alpha)*3);contexto.globalAlpha=1;}
function desenharExplosao(e){const alpha=Math.max(0,Math.min(1,e.life/.5));const raio=e.radius??50;contexto.globalAlpha=alpha;contexto.strokeStyle='#ffb347';contexto.lineWidth=4;contexto.beginPath();contexto.arc(e.x,e.y,(1-alpha)*raio,0,Math.PI*2);contexto.stroke();contexto.globalAlpha=1;}

function desenharInterface(){
  const faseAtual = obterFaseAtual();
  contexto.fillStyle='rgba(3,8,17,.72)';contexto.fillRect(20,18,420,124);contexto.strokeStyle='rgba(110,231,255,.22)';contexto.strokeRect(20,18,420,124);
  contexto.fillStyle='#e9f7ff';contexto.font='800 16px system-ui';contexto.fillText('NEON RUN',35,43);
  contexto.fillStyle='#86a8bb';contexto.font='600 11px system-ui';contexto.fillText('UNISUAM • EXTENSÃO ACADÊMICA',35,59);
  contexto.fillStyle='rgba(255,255,255,.12)';contexto.fillRect(35,72,190,13);contexto.fillStyle='#b7ff55';contexto.fillRect(35,72,190*(jogador.health/jogador.maxHealth),13);
  contexto.fillStyle='#e9f7ff';contexto.font='700 11px system-ui';contexto.fillText(`HP ${jogador.health}`,35,99);
  contexto.fillStyle='#6ee7ff';contexto.fillText(`FASE ${faseAtual.numero} • ${faseAtual.nome}`,35,119);
  contexto.fillText(`SCORE  ${String(jogador.score).padStart(5,'0')}`,250,82);contexto.fillText(`MUNIÇÃO  ${jogador.ammo}`,250,99); contexto.fillText(`GRANADAS  ${jogador.grenades}`,250,116);
  contexto.fillStyle='#ffcf5a'; contexto.fillText(`POWs ${jogador.powResgatados}/6`,250,132);
  // minimapa
  const larguraMinimapa=300,alturaMinimapa=56,posicaoMinimapaX=LARGURA_TELA-larguraMinimapa-20,posicaoMinimapaY=18;contexto.fillStyle='rgba(3,8,17,.72)';contexto.fillRect(posicaoMinimapaX,posicaoMinimapaY,larguraMinimapa,alturaMinimapa);contexto.strokeStyle='rgba(255,255,255,.13)';contexto.strokeRect(posicaoMinimapaX,posicaoMinimapaY,larguraMinimapa,alturaMinimapa);
  contexto.fillStyle='#1f3140';contexto.fillRect(posicaoMinimapaX+10,posicaoMinimapaY+20,larguraMinimapa-20,22);
  for(const inimigo of inimigos) if(inimigo.alive){const posicaoInimigo=posicaoMinimapaX+10+(inimigo.x/mundo.width)*(larguraMinimapa-20);contexto.fillStyle='#ff4fd8';contexto.fillRect(posicaoInimigo,posicaoMinimapaY+28,4,4);}
  contexto.fillStyle='#b7ff55';contexto.fillRect(posicaoMinimapaX+10+(jogador.x/mundo.width)*(larguraMinimapa-20),posicaoMinimapaY+25,6,10);
  contexto.fillStyle='#6ee7ff';contexto.font='700 10px system-ui';contexto.fillText('MINIMAPA',posicaoMinimapaX+10,posicaoMinimapaY+13);
  // progresso da missão
  const progresso=Math.min(1,jogador.x/(mundo.width-480));contexto.fillStyle='rgba(255,255,255,.08)';contexto.fillRect(20,ALTURA_TELA-22,LARGURA_TELA-40,5);contexto.fillStyle='#6ee7ff';contexto.fillRect(20,ALTURA_TELA-22,(LARGURA_TELA-40)*progresso,5);
  if(jogador.entrouNoSlug){contexto.fillStyle='#b7ff55';contexto.fillText(`SLUG HP ${jogador.health}`,LARGURA_TELA-150,ALTURA_TELA-27);} else if(jogador.dashCooldown<=0){contexto.fillStyle='#b7ff55';contexto.fillText('DASH PRONTO',LARGURA_TELA-150,ALTURA_TELA-27);} else {contexto.fillStyle='#86a8bb';contexto.fillText(`DASH ${jogador.dashCooldown.toFixed(1)}s`,LARGURA_TELA-150,ALTURA_TELA-27);}
}
function desenharTelaFinal(){
  contexto.fillStyle='rgba(3,7,16,.72)';contexto.fillRect(0,0,LARGURA_TELA,ALTURA_TELA);
  contexto.fillStyle='#e9f7ff';contexto.textAlign='center';contexto.font='900 52px system-ui';contexto.fillText(jogador.health>0?'MISSÃO CONCLUÍDA':'MISSÃO ENCERRADA',LARGURA_TELA/2,270);
  contexto.font='700 20px system-ui';contexto.fillStyle=jogador.health>0?'#b7ff55':'#ff7b6e';contexto.fillText(`Score final: ${jogador.score} • HP: ${jogador.health}`,LARGURA_TELA/2,315);
  contexto.font='600 16px system-ui';contexto.fillStyle='#ffcf5a';contexto.fillText(`POWs salvos: ${jogador.powResgatados}/${prisioneiros.length}`,LARGURA_TELA/2,342);
  contexto.fillStyle='#a8c1ce';contexto.font='500 15px system-ui';contexto.fillText('Pressione R para jogar novamente.',LARGURA_TELA/2,378);
  contexto.textAlign='left';
}

function desenharTelaDePausa(){
  contexto.fillStyle='rgba(3,7,16,.32)'; contexto.fillRect(0,0,LARGURA_TELA,ALTURA_TELA);
}

function executarQuadro(marcaDeTempo){ const deltaTempo=Math.min(.033,(marcaDeTempo-ultimoQuadro)/1000||0); ultimoQuadro=marcaDeTempo; if(jogoEmAndamento && !jogoPausado) atualizarJogo(deltaTempo); desenharJogo(); if(jogoPausado) desenharTelaDePausa(); requestAnimationFrame(executarQuadro); }
reiniciarJogo(); requestAnimationFrame(executarQuadro);
