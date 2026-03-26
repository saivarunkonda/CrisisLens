$excludes = @('.git','.tools','.venv','node_modules','.next','.terraform','.idea','.vscode')
$dest = Join-Path $PSScriptRoot '..\clean-worktree'
Get-ChildItem -Force | Where-Object { $excludes -notcontains $_.Name } | ForEach-Object {
    $src = $_.FullName
    Copy-Item $src -Destination $dest -Recurse -Force -ErrorAction SilentlyContinue
}
