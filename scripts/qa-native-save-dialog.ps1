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
 [DllImport("user32.dll")]static extern IntPtr GetDlgItem(IntPtr h,int id);
 [DllImport("user32.dll")]static extern bool SetForegroundWindow(IntPtr h);
 [DllImport("user32.dll")]static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")]static extern bool IsWindow(IntPtr h);
 [DllImport("user32.dll",CharSet=CharSet.Unicode,EntryPoint="SendMessageW")]static extern IntPtr SetText(IntPtr h,uint m,IntPtr w,string text);
 [DllImport("user32.dll",CharSet=CharSet.Unicode,EntryPoint="SendMessageW")]static extern IntPtr ReadText(IntPtr h,uint m,IntPtr w,StringBuilder text);
 [DllImport("user32.dll",EntryPoint="SendMessageW")]static extern IntPtr SendButton(IntPtr h,uint m,IntPtr w,IntPtr l);
 static string Guard(IntPtr h,int pid){uint owner;GetWindowThreadProcessId(h,out owner);if(h==IntPtr.Zero||owner!=(uint)pid)throw new InvalidOperationException("Native control is not owned by AYQYN");var cls=new StringBuilder(128);GetClassName(h,cls,cls.Capacity);return cls.ToString();}
 // GetWindowText cannot read another process's Edit contents: use owned WM_GETTEXT.
 // https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowtextw
 public static string SetFileName(long handle,int pid,string text){var h=new IntPtr(handle);var cls=Guard(h,pid);if(cls!="Edit"&&cls!="ComboBox")throw new InvalidOperationException("Expected owned filename Edit/ComboBox");SetText(h,12,IntPtr.Zero,text);var value=new StringBuilder(4096);ReadText(h,13,new IntPtr(value.Capacity),value);if(value.ToString()!=text)throw new InvalidOperationException("Native filename text mismatch");return value.ToString();}
 // BM_CLICK can fail on an inactive dialog. Activate only the validated CI-owned dialog.
 // https://learn.microsoft.com/en-us/windows/win32/controls/bm-click
 public static bool Activate(long dialog,int pid){var h=new IntPtr(dialog);if(Guard(h,pid)!="#32770")throw new InvalidOperationException("Expected owned native dialog");SetForegroundWindow(h);return GetForegroundWindow()==h;}
 public static bool Open(long dialog){return IsWindow(new IntPtr(dialog));}
 public static void Click(long dialog,int pid,int id,string name){var d=new IntPtr(dialog);if(Guard(d,pid)!="#32770"||GetForegroundWindow()!=d)throw new InvalidOperationException("Expected active owned native dialog");var h=GetDlgItem(d,id);if(Guard(h,pid)!="Button")throw new InvalidOperationException("Expected owned native Button");var text=new StringBuilder(128);GetWindowText(h,text,text.Capacity);if(text.ToString().Replace("&","")!=name)throw new InvalidOperationException("Native button caption mismatch");SendButton(h,245,IntPtr.Zero,IntPtr.Zero);}
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
$taskReceipt=@{method='Real production Windows dialog: UI Automation or scoped native control messages, verified explicit AYQYN PID and class/caption; no dialog mock, camera, microphone, clipboard or system policy change';ownerPid=$TaskProcessId;title=$taskDialog.Current.Name;action=$TaskAction;controls=@()}
$taskDialogHandle=$taskDialog.Current.NativeWindowHandle
$taskReceipt.dialogActivated=[AyqynOwnedWindows]::Activate($taskDialogHandle,$TaskProcessId)
if(!$taskReceipt.dialogActivated){throw 'Owned CI dialog could not become active; no keys or policy workaround is permitted'}
foreach($taskControl in $taskControls){$taskReceipt.controls+=@{id=$taskControl.Current.AutomationId;name=$taskControl.Current.Name;type=$taskControl.Current.ControlType.ProgrammaticName;class=$taskControl.Current.ClassName}}
if($TaskAction-eq'save'){
 $taskWorkspace=[IO.Path]::GetFullPath((Get-Location).Path)
 $taskAbsolute=[IO.Path]::GetFullPath($TaskDestination)
 if(!$taskAbsolute.StartsWith((Join-Path $taskWorkspace 'artifacts')+[IO.Path]::DirectorySeparatorChar)){throw 'Destination must stay in owned CI artifacts'}
 if(Test-Path -LiteralPath $taskAbsolute){throw 'Dialog destination already exists'}
 $taskFileHost=$taskDialog.FindFirst([System.Windows.Automation.TreeScope]::Descendants,[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::AutomationIdProperty,'FileNameControlHost'))
 if(!$taskFileHost){throw 'Native filename control host was not found'}
 $taskEdit=$taskFileHost.FindFirst([System.Windows.Automation.TreeScope]::Descendants,[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::AutomationIdProperty,'1001'))
 if(!$taskEdit){throw 'Native filename edit was not found; do not fall back to global keys'}
 $taskValue=$null
 if($taskEdit.TryGetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern,[ref]$taskValue)){
  $taskValue.SetValue($taskAbsolute)
  if($taskValue.Current.Value-ne$taskAbsolute){throw 'Native filename edit did not retain exact owned destination'}
  $taskReceipt.filenameMethod='Scoped UI Automation ValuePattern'
 }else{
  [void][AyqynOwnedWindows]::SetFileName($taskEdit.Current.NativeWindowHandle,$TaskProcessId,$taskAbsolute)
  $taskReceipt.filenameMethod='Scoped owned native Edit/ComboBox WM_SETTEXT and WM_GETTEXT with exact value verification'
 }
 $taskReceipt.destination=$taskAbsolute
 $taskButtonId='1'
 $taskButtonName='Save'
}else{$taskButtonId='2';$taskButtonName='Cancel'}
# The hosted Windows runner is English; ids repeat in the file list and address bar.
$taskButtonCondition=[System.Windows.Automation.AndCondition]::new([System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::AutomationIdProperty,$taskButtonId),[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::NameProperty,$taskButtonName))
$taskButtons=$taskDialog.FindAll([System.Windows.Automation.TreeScope]::Descendants,$taskButtonCondition)
if($taskButtons.Count-ne1){throw 'Expected exactly one owned native Save/Cancel named control'}
$taskButton=$taskButtons.Item(0)
if(!$taskButton-or!$taskButton.Current.IsEnabled){throw 'Expected native Save/Cancel button unavailable'}
$taskReceipt.buttonName=$taskButton.Current.Name
$taskInvoke=$null
if($taskButton.TryGetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern,[ref]$taskInvoke)){$taskInvoke.Invoke();$taskReceipt.buttonMethod='Scoped UI Automation InvokePattern'}
else{[AyqynOwnedWindows]::Click($taskDialog.Current.NativeWindowHandle,$TaskProcessId,[int]$taskButtonId,$taskButtonName);$taskReceipt.buttonMethod='Scoped owned native Button BM_CLICK with exact caption verification'}
$taskCloseWatch=[Diagnostics.Stopwatch]::StartNew()
while([AyqynOwnedWindows]::Open($taskDialogHandle)-and$taskCloseWatch.ElapsedMilliseconds-lt5000){Start-Sleep -Milliseconds 100}
$taskReceipt.dialogClosed=![AyqynOwnedWindows]::Open($taskDialogHandle)
if(!$taskReceipt.dialogClosed){$taskReceipt.remainingOwnedWindows=@([AyqynOwnedWindows]::Read($TaskProcessId)|ForEach-Object{@{title=$_.Title;class=$_.Class}})}
$taskReceipt|ConvertTo-Json -Depth 6 -Compress
