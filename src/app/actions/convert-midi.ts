'use server';

import { revalidatePath } from "next/cache"
import { spawn } from 'child_process';
import { Readable, Writable } from 'stream';
import { streamWrite, streamEnd, onExit, readableToString } from '@rauschma/stringio';

async function writeToWritable(writable: Writable, data: Buffer) {
  await streamWrite(writable, data);
  await streamEnd(writable);
}

async function returnReadable(readable: Readable) {
  var data = await readableToString(readable);
  return data
}

async function executeScript(path: String, data: Buffer) {
  const sink = spawn('python', [`${path}`],
    {stdio: ['pipe', 'pipe', process.stderr]});

  writeToWritable(sink.stdin, data);
  var piano_data = await returnReadable(sink.stdout);
  await onExit(sink);

  return piano_data
}

export async function convertMidi(data: FormData) {
    const file: File | null = data.get('file') as unknown as File
    if (!file) {
      throw new Error('No file uploaded')
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let piano_data = await executeScript('scripts/midi2piano/midi2piano.py', buffer)

    return piano_data
}