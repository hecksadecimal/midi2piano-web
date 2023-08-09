'use server';

import { TrackManager } from "piano-ts";

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
    let trackManager = new TrackManager({tickLag: tick_lag, linesLimit: line_limit})
    trackManager.setMidi(buffer)
    let piano_data = await trackManager.toPiano()

    return piano_data
}