param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,

  [string]$Language = "vi",

  [string]$Model = "small",

  [string]$OutputDir = "./output/whisperx"
)

$resolvedInput = Resolve-Path -LiteralPath $InputPath -ErrorAction Stop

if (-not (Get-Command whisperx -ErrorAction SilentlyContinue)) {
  throw "whisperx not found. Install it first with: pip install whisperx"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$env:PYTHONIOENCODING = "utf-8"
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

whisperx $resolvedInput.Path --language $Language --model $Model --device cpu --compute_type int8 --output_format json --output_dir $OutputDir --verbose False
