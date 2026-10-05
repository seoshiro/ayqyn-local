param([int]$TaskProcessId,[long]$TaskWindowHandle,[ValidateSet('save','cancel')][string]$TaskAction,[string]$TaskTitle,[string]$TaskDestination)
$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)
if($env:CI-ne'true'){throw 'Native dialog automation is confined to the isolated CI Windows runner'}
if($TaskProcessId-le0){throw 'Explicit owned application PID required'}
Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes
Add-Type -TypeDefinition @'
using System;using System.Collections.Generic;using System.Runtime.InteropServices;using System.Text;
public class AyqynOwnedWindow {public IntPtr Handle;public string Title;public string Class;}
public static class AyqynOwnedWindows {
 delegate bool Visitor(IntPtr h,IntPtr p);
 [DllImport("user32.dll")]static extern bool EnumWindows(Visitor v,IntPtr p);
 [DllImport("user32.dll")]static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);
 [DllImport("user32.dll")]static extern IntPtr GetLastActivePopup(IntPtr h);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)]static extern int GetWindowText(IntPtr h,StringBuilder b,int n);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)]static extern int GetClassName(IntPtr h,StringBuilder b,int n);
 public static List<AyqynOwnedWindow> Read(int pid){var result=new List<AyqynOwnedWindow>();EnumWindows((h,p)=>{uint owner;GetWindowThreadProcessId(h,out owner);if(owner==(uint)pid){var title=new StringBuilder(1024);var cls=new StringBuilder(128);GetWindowText(h,title,title.Capacity);GetClassName(h,cls,cls.Capacity);result.Add(new AyqynOwnedWindow{Handle=h,Title=title.ToString(),Class=cls.ToString()});}return true;},IntPtr.Zero);return result;}
 public static AyqynOwnedWindow Popup(long main,int pid){var h=GetLastActivePopup(new IntPtr(main));uint owner;GetWindowThreadProcessId(h,out owner);if(owner!=(uint)pid)return null;var title=new StringBuilder(1024);var cls=new StringBuilder(128);GetWindowText(h,title,title.Capacity);GetClassName(h,cls,cls.Capacity);return new AyqynOwnedWindow{Handle=h,Title=title.ToString(),Class=cls.ToString()};}
}
'@
$taskDialog=$null
$taskOwned=@()
$taskWatch=[Diagnostics.Stopwatch]::StartNew()
do{
 $taskOwned=[AyqynOwnedWindows]::Read($TaskProcessId)
 $taskPopup=[AyqynOwnedWindows]::Popup($TaskWindowHandle,$TaskProcessId)
 if($taskPopup){$taskOwned=@($taskOwned)+@($taskPopup)}
 foreach($taskMatch in $taskOwned){if($taskMatch.Title-eq$TaskTitle-and$taskMatch.Class-eq'#32770'){$taskDialog=[System.Windows.Automation.AutomationElement]::FromHandle($taskMatch.Handle);break}}
 if(!$taskDialog){Start-Sleep -Milliseconds 150}
}while(!$taskDialog-and$taskWatch.ElapsedMilliseconds-lt15000)
if(!$taskDialog){throw ('Owned native save dialog with exact translated title was not found. Owned windows: '+($taskOwned|ConvertTo-Json -Depth 3 -Compress))}
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
