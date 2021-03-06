import { window, Task, ShellExecution, tasks } from 'vscode';
import { join } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

import { DeviceItem, TargetItem } from '../providers/devices';
import { devtype } from '../driver/frida';
import { ssh as proxySSH } from '../iproxy';
import { executable } from '../utils';


export async function copyid(node: TargetItem) {
  if (!(node instanceof DeviceItem)) {
    window.showErrorMessage('This command is only avaliable on context menu');
    return;
  }

  // todo: decorator
  const deviceType = await devtype(node.data.id);
  if (deviceType !== 'iOS') {
    window.showErrorMessage(`Device type "${deviceType}" is not supported`);
    return;
  }

  const py: string = join(__dirname, '..', '..', 'backend', 'driver.py');
  const args = [py, 'ssh-copy-id', node.data.id];
  const exec = promisify(execFile);
  await exec(executable('python3'), args);

  window.showInformationMessage(`Succesfully installed SSH public key on "${node.data.name}"`);
}

export async function shell(node: TargetItem) {
  if (!(node instanceof DeviceItem)) {
    window.showErrorMessage('This command is only avaliable on context menu');
    return;
  }

  const deviceType = await devtype(node.data.id);
  const name = `SSH: ${node.data.name}`;
  if (deviceType === 'iOS') {
    const port = await proxySSH(node.data.id);
    const shellPath = executable('ssh');
    const shellArgs = ['-q', `-p${port}`, 'root@localhost', '-o', 'StrictHostKeyChecking=no'];
    window.createTerminal({
      name,
      shellArgs,
      shellPath
    }).show();
  } else if (deviceType === 'Android') {
    const shellPath = executable('adb');
    const shellArgs = ['-s', node.data.id, 'shell'];
    window.createTerminal({
      name,
      shellArgs,
      shellPath
    }).show();
  } else {
    window.showErrorMessage(`Device type "${deviceType}" is not supported`);
  }
}