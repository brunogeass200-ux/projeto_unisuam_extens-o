Add-Type -AssemblyName System.Drawing

$origem = Join-Path $PSScriptRoot '..\assets\frames_do_personagem.png'
$destino = Join-Path $PSScriptRoot '..\assets\player_spritesheet.png'
$imagem = [System.Drawing.Bitmap]::FromFile((Resolve-Path $origem).Path)
$larguraQuadro = 64
$alturaQuadro = 72
$quadros = @(
  @{ nome = 'idle'; centros = @(330, 399, 468, 537, 606, 675, 744, 803); y = 54; altura = 136 },
  @{ nome = 'run'; centros = @(906, 978, 1051, 1124, 1196, 1268, 1341, 1414); y = 54; altura = 136 },
  @{ nome = 'jump'; centros = @(322, 391, 460, 529, 598, 667, 736, 805); y = 265; altura = 142 },
  @{ nome = 'dash'; centros = @(901, 973, 1045, 1117, 1189, 1261, 1333, 1405); y = 265; altura = 142 },
  @{ nome = 'shoot'; centros = @(322, 430, 531, 635, 739, 842, 945, 1048, 1151, 1254, 1357, 1460); y = 475; altura = 134 },
  @{ nome = 'death'; centros = @(322, 422, 522, 622, 722, 822, 922, 1022, 1122, 1222, 1322, 1422); y = 665; altura = 112 }
)

$atlas = [System.Drawing.Bitmap]::new($larguraQuadro * 56, $alturaQuadro)
$grafico = [System.Drawing.Graphics]::FromImage($atlas)
$grafico.Clear([System.Drawing.Color]::Transparent)
$indice = 0

foreach ($faixa in $quadros) {
  foreach ($centro in $faixa.centros) {
    $origemRecorte = [System.Drawing.Rectangle]::new($centro - 32, $faixa.y, 64, $faixa.altura)
    $recorte = $imagem.Clone($origemRecorte, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $escala = [Math]::Min(58.0 / $recorte.Width, 68.0 / $recorte.Height)
    $destinoLargura = [int]($recorte.Width * $escala)
    $destinoAltura = [int]($recorte.Height * $escala)
    $destinoX = $indice * $larguraQuadro + [int](($larguraQuadro - $destinoLargura) / 2)
    $destinoY = [int](($alturaQuadro - $destinoAltura) / 2)
    $grafico.DrawImage($recorte, $destinoX, $destinoY, $destinoLargura, $destinoAltura)
    $recorte.Dispose()
    $indice++
  }
}

$atlas.Save($destino, [System.Drawing.Imaging.ImageFormat]::Png)
$grafico.Dispose()
$atlas.Dispose()
$imagem.Dispose()
Write-Output "Gerado: $destino ($indice frames)"