param([int]$TaskProcessId,[ValidateSet('save','cancel')][string]$TaskAction,[string]$TaskTitle,[string]$TaskDestination)
$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)
if($env:CI-ne'true'){throw 'Native dialog automation is confined to the isolated CI Windows runner'}
if($TaskProcessId-le0){throw 'Explicit owned application PID required'}
Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes
$taskOwner=[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::ProcessIdProperty,$TaskProcessId)
$taskClass=[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::ClassNameProperty,'#32770')
$taskCondition=[System.Windows.Automation.AndCondition]::new($taskOwner,$taskClass)
$taskDialog=$null
$taskWatch=[Diagnostics.Stopwatch]::StartNew()
do{
 $taskMatches=[System.Windows.Automation.AutomationElement]::RootElement.FindAll([System.Windows.Automation.TreeScope]::Children,$taskCondition)
 foreach($taskMatch in $taskMatches){if($taskMatch.Current.Name-eq$TaskTitle){$taskDialog=$taskMatch;break}}
 if(!$taskDialog){Start-Sleep -Milliseconds 150}
}while(!$taskDialog-and$taskWatch.ElapsedMilliseconds-lt15000)
if(!$taskDialog){throw 'Owned native save dialog with exact translated title was not found'}
$taskControls=$taskDialog.FindAll([System.Windows.Automation.TreeScope]::Descendants,[System.Windows.Automation.Condition]::TrueCondition)
$taskReceipt=@{method='Real production Windows file dialog, Microsoft UI Automation ValuePattern/InvokePattern; only the explicit AYQYN PID; no dialog mock, camera, microphone, clipboard or system policy change';ownerPid=$TaskProcessId;title=$taskDialog.Current.Name;action=$TaskAction;controls=@()}
foreach($taskControl in $taskControls){$taskReceipt.controls+=@{id=$taskControl.Current.AutomationId;name=$taskControl.Current.Name;type=$taskControl.Current.ControlType.ProgrammaticName}}
if($TaskAction-eq'save'){
 $taskWorkspace=[IO.Path]::GetFullPath((Get-Location).Path)
 $taskAbsolute=[IO.Path]::GetFullPath($TaskDestination)
 if(!$taskAbsolute.StartsWith((Join-Path $taskWorkspace 'artifacts')+[IO.Path]::DirectorySeparatorChar)){throw 'Destination must stay in owned CI artifacts'}
 if(Test-Path -LiteralPath $taskAbsolute){throw 'Dialog destination already exists'}
 $taskEdit=$null
 foreach($taskControl in $taskControls){if($taskControl.Current.ControlType-eq[System.Windows.Automation.ControlType]::Edit-and$taskControl.Current.AutomationId-in@('1001','1148')){$taskEdit=$taskControl;break}}
 if(!$taskEdit){throw 'Native filename edit was not found; do not fall back to global keys'}
 $taskValue=$taskEdit.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
 $taskValue.SetValue($taskAbsolute)
 if($taskValue.Current.Value-ne$taskAbsolute){throw 'Native filename edit did not retain exact owned destination'}
 $taskReceipt.destination=$taskAbsolute
 $taskButtonId='1'
}else{$taskButtonId='2'}
$taskButton=$taskDialog.FindFirst([System.Windows.Automation.TreeScope]::Descendants,[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::AutomationIdProperty,$taskButtonId))
if(!$taskButton-or!$taskButton.Current.IsEnabled){throw 'Expected native Save/Cancel button unavailable'}
$taskReceipt.buttonName=$taskButton.Current.Name
$taskButton.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
$taskReceipt|ConvertTo-Json -Depth 6 -Compress
