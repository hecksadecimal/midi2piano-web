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

async function executeScript(path: String, data: Buffer, tick_lag?: number, line_limit?: number) {
  const sink = spawn('python', [`${path}`, `--ticklag=${tick_lag ? tick_lag : 0.5}`, `--limit=${line_limit ? line_limit : 200}`],
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
    var tick_lag: number | null = data.get('tick_lag') as unknown as number
    if (tick_lag) { 
      if (tick_lag <= 0) {
        tick_lag = 0.01
      }
      if (tick_lag > 1) {
        tick_lag = 1
      }
    }

    var line_limit: number | null = data.get('line_limit') as unknown as number

    if (line_limit) {
      if (line_limit <= 4) {
        line_limit = 5
      }
      if (line_limit > 5000) {
        line_limit = 5000
      }
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let piano_data = await executeScript('scripts/midi2piano/midi2piano.py', buffer, tick_lag, line_limit)

    return piano_data
}