param([int]$TaskCycles=6)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class StartupWindow{[StructLayout(LayoutKind.Sequential)]public struct RECT{public int l,t,r,b;}[DllImport("user32.dll")]public static extern bool GetWindowRect(IntPtr h,out RECT r);[DllImport("user32.dll")]public static extern bool PrintWindow(IntPtr h,IntPtr dc,uint flags);[DllImport("user32.dll")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);[DllImport("user32.dll")]public static extern bool PostMessage(IntPtr h,uint m,IntPtr w,IntPtr l);[DllImport("user32.dll")]public static extern IntPtr SetThreadDpiAwarenessContext(IntPtr c);}'
$taskRoot=[IO.Path]::GetFullPath((Get-Location).Path)
$taskExecutable=[IO.Path]::GetFullPath($env:AYQYN_EXECUTABLE)
if(-not$taskExecutable.StartsWith((Join-Path $taskRoot 'release')+[IO.Path]::DirectorySeparatorChar)){throw 'Candidate must be inside project release'}
$taskStamp=[DateTimeOffset]::Now.ToUnixTimeMilliseconds()
$taskProfile=Join-Path $taskRoot ('data\native-start-audit-'+$taskStamp)
$taskOutput=[IO.Path]::GetFullPath($(if($env:AYQYN_EVIDENCE_DIR){$env:AYQYN_EVIDENCE_DIR}else{'artifacts\native-start'}))
if(-not$taskOutput.StartsWith($taskRoot+[IO.Path]::DirectorySeparatorChar)){throw 'Evidence output escaped workspace'}
[IO.Directory]::CreateDirectory($taskProfile)|Out-Null
[IO.Directory]::CreateDirectory($taskOutput)|Out-Null
$taskSession=@{schema=1;id='native-restart-fixture';title='Native restart persistence fixture';createdAt=[DateTime]::UtcNow.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'");policy=@{dwell=2500;absence=3000;phone=900;cooldown=5000;yaw=24;pitch=18;eye=0.18;retention=24;evidence=$false;attention=$false};status='interrupted';source='live';events=@();answers=@{q1='0';note='Two retained answers, fixture only'};elapsed=0}
$taskJournal=Join-Path $taskProfile 'current.json'
[IO.File]::WriteAllText($taskJournal,($taskSession|ConvertTo-Json -Depth 8 -Compress),[Text.UTF8Encoding]::new($false))
$taskValidate="const f=require('fs');import('./web/core.js').then(m=>m.validateSession(JSON.parse(f.readFileSync(process.argv[1],'utf8'))));"
& node -e $taskValidate $taskJournal
if($LASTEXITCODE-ne0){throw 'Native restart fixture failed session schema before launch'}
$taskHash=(Get-FileHash -LiteralPath $taskJournal -Algorithm SHA256).Hash
$env:AYQYN_DATA_DIR=$taskProfile
Remove-Item Env:AYQYN_TEST -ErrorAction SilentlyContinue
Remove-Item Env:AYQYN_TEST_VIDEO -ErrorAction SilentlyContinue
$taskRecords=@();$taskFailure=$null;$taskInstance=$null
try{
for($taskCycle=0;$taskCycle-lt$TaskCycles;$taskCycle++){
 $taskWatch=[Diagnostics.Stopwatch]::StartNew()
 $taskInstance=Start-Process -FilePath $taskExecutable -WorkingDirectory $taskRoot -WindowStyle Normal -PassThru
 do{$taskInstance.Refresh();if($taskInstance.HasExited){throw 'Candidate exited before showing UI'};if($taskInstance.MainWindowHandle-ne0-and$taskInstance.MainWindowTitle.Contains('AYQYN')){break};Start-Sleep -Milliseconds 100}while($taskWatch.ElapsedMilliseconds-lt10000)
 if($taskInstance.MainWindowHandle-eq0){throw 'Native window not shown within 10 seconds'}
 Start-Sleep -Milliseconds 350
 $taskHandle=$taskInstance.MainWindowHandle;$taskOwner=[uint32]0
 [void][StartupWindow]::GetWindowThreadProcessId($taskHandle,[ref]$taskOwner)
 if($taskOwner-ne$taskInstance.Id){throw 'Native window owner mismatch'}
 $taskPrevious=[StartupWindow]::SetThreadDpiAwarenessContext([IntPtr](-4))
 try{
  $taskRect=New-Object StartupWindow+RECT
  if(-not[StartupWindow]::GetWindowRect($taskHandle,[ref]$taskRect)){throw 'Window rectangle unavailable'}
  $taskWidth=$taskRect.r-$taskRect.l;$taskHeight=$taskRect.b-$taskRect.t
  if($taskWidth-lt800-or$taskHeight-lt650-or$taskWidth-gt5000-or$taskHeight-gt5000){throw 'Unexpected native geometry'}
  $taskBitmap=New-Object Drawing.Bitmap $taskWidth,$taskHeight
  $taskGraphics=[Drawing.Graphics]::FromImage($taskBitmap);$taskDc=$taskGraphics.GetHdc()
  try{$taskCaptured=[StartupWindow]::PrintWindow($taskHandle,$taskDc,2)}finally{$taskGraphics.ReleaseHdc($taskDc)}
  if(-not$taskCaptured){throw 'Native window capture unsupported'}
  $taskColors=New-Object 'Collections.Generic.HashSet[int]';$taskNonBackground=0;$taskSamples=0
  for($taskY=70;$taskY-lt$taskHeight-20;$taskY+=40){for($taskX=20;$taskX-lt$taskWidth-20;$taskX+=40){$taskColor=$taskBitmap.GetPixel($taskX,$taskY);[void]$taskColors.Add($taskColor.ToArgb());$taskSamples++;if([Math]::Abs($taskColor.R-243)+[Math]::Abs($taskColor.G-246)+[Math]::Abs($taskColor.B-247)-gt18){$taskNonBackground++}}}
  $taskBitmap.Save((Join-Path $taskOutput ('native-restart-'+$taskCycle+'.png')),[Drawing.Imaging.ImageFormat]::Png)
  $taskRatio=$taskNonBackground/$taskSamples
  $taskRecords+=@{cycle=$taskCycle;pid=$taskInstance.Id;visibleWithinMs=$taskWatch.ElapsedMilliseconds;colorSamples=$taskSamples;uniqueColors=$taskColors.Count;nonBackgroundFraction=$taskRatio;journalHash=(Get-FileHash -LiteralPath $taskJournal).Hash}
  if($taskColors.Count-lt8-or$taskRatio-lt0.15){throw 'Native body remained blank: insufficient visible UI pixels'}
  if((Get-FileHash -LiteralPath $taskJournal).Hash-ne$taskHash){throw 'Restart changed accepted journal bytes'}
 }finally{if($taskGraphics){$taskGraphics.Dispose();$taskGraphics=$null};if($taskBitmap){$taskBitmap.Dispose();$taskBitmap=$null};[void][StartupWindow]::SetThreadDpiAwarenessContext($taskPrevious)}
 [void][StartupWindow]::PostMessage($taskHandle,16,[IntPtr]0,[IntPtr]0)
 if(-not$taskInstance.WaitForExit(10000)){throw 'Normal native close did not finish'}
 $taskInstance=$null
}
}catch{$taskFailure=$_.Exception.Message}finally{
if($taskInstance-and-not$taskInstance.HasExited){$taskInstance.Refresh();if($taskInstance.MainWindowHandle-ne0){[void][StartupWindow]::PostMessage($taskInstance.MainWindowHandle,16,[IntPtr]0,[IntPtr]0);[void]$taskInstance.WaitForExit(5000)}}
$taskBuild=Get-Content -LiteralPath (Join-Path ([IO.Path]::GetDirectoryName($taskExecutable)) 'BUILD-INFO.json') -Raw|ConvertFrom-Json
$taskResult=@{sourceCommit=$taskBuild.sourceCommit;passed=($null-eq$taskFailure-and$taskRecords.Count-eq$TaskCycles);cycles=$taskRecords;error=$taskFailure;profile=$taskProfile;originalJournalHash=$taskHash;method='Native production EXE, no inspector/Playwright, normal visible launches and WM_CLOSE; actual PrintWindow pixels sampled before accessibility warm-up; no camera/mic; fixture-only answers'}
[IO.File]::WriteAllText((Join-Path $taskOutput 'native-start-audit.json'),($taskResult|ConvertTo-Json -Depth 6),[Text.UTF8Encoding]::new($false))
[Console]::OutputEncoding=[Text.UTF8Encoding]::new();$taskResult|ConvertTo-Json -Depth 6 -Compress
}
if($taskFailure){throw $taskFailure}
