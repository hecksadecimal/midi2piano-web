'use client'
import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { FileUploader } from "react-drag-drop-files";
import { useRouter } from "next/navigation";
import { IMidiFile } from 'midi-json-parser-worker';
import { parseArrayBuffer } from 'midi-json-parser';
import { encode } from 'json-midi-encoder';
import { bankToInstrument, percussionPrograms } from '@/app/helpers/midi';

const fileTypes = ["MID", "MIDI"];
type TrackInfo = [number, number, string];


// Given a Midi Object, will identify the instrument tracks and their indexes.
function trackParser(midiObject: IMidiFile) {
  var trackInfo: Array<TrackInfo> = []
  for (const track in midiObject.tracks) {
    var trackName = ""
    var programName = ""
    var programBank = -1
    var identifiedTrack: TrackInfo | undefined

    for (const event in midiObject.tracks[parseInt(track)]) {
      var eventData = midiObject.tracks[parseInt(track)][parseInt(event)]
      if (eventData.noteOn && programName == "") {
        //Special case for tracks which do not define a program, but still play notes
        programName = bankToInstrument[1] // Acoustic Grand Piano
        programBank = 1
      }
      if (eventData.programChange) {
        //@ts-expect-error
        programName = bankToInstrument[eventData.programChange.programNumber + 1]
        //@ts-expect-error
        programBank = eventData.programChange.programNumber + 1
      }
      if (eventData.trackName) {
        trackName = eventData.trackName.toString()
      }
    }
    if (trackName != "" || programName != "") {
      var finalName = trackName + (programName != "" ? ` (${programName})` : "")
      identifiedTrack = [parseInt(track), programBank, finalName]
      trackInfo.push(identifiedTrack)
    }
  }
  return trackInfo
}

export function MIDIUploadForm() {
  const [midi, setMidi] = useState<File>();
  const [midiName, setMidiName] = useState('');
  const [midiObject, setMidiObject] = useState<IMidiFile>();
  const [editedMidiObject, setEditedMidiObject] = useState<IMidiFile>();
  const [disabledTracks, setDisabledTracks] = useState<Array<number>>();
  const [midiTracks, setMidiTracks] = useState<Array<TrackInfo>>();
  const [downloadFilename, setDownloadFilename] = useState('');
  const [downloadData, setDownloadData] = useState('');
  const [tickLag, setTickLag] = useState(50);
  const [lineLimit, setLineLimit] = useState(200);

  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    var download_element = document.getElementById("download_link");
    var piano_element = document.getElementById("piano");
    var piano_title_element = document.getElementById("piano_title");

    if (!download_element || !piano_element || !piano_title_element) {
      return
    }

    if (!piano_element.innerText) {
      return
    }

    var data = window.URL.createObjectURL(new Blob([piano_element.innerText], {type: "text/plain"}));
    var title = piano_title_element.innerText.split('.').slice(0,-1)
    title.push("txt")
    var title_final = title.join(".")

    setDownloadFilename(title_final)
    setDownloadData(data)
  }, [])
  
  const copyToClipboard = async () => {
    var piano_element = document.getElementById("piano");
    if (!piano_element) {
      return
    }
    navigator.clipboard.writeText(piano_element.innerText)
  }

  const handleTrackCheckboxClick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setDisabledTracks(disabledTracks?.filter(function(item) {
        return item !== parseInt(event.target.id.replace("track_", ""))
      }))
    } else {
      setDisabledTracks(disabledTracks => [...disabledTracks ?? [], parseInt(event.target.id.replace("track_", ""))])
    }
  }

  const handleTickRateChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setTickLag(parseInt(event.target.value))
  }

  const handleLineLimitChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setLineLimit(parseInt(event.target.value))
  }

  const handleChange = async (file: File) => {
    setMidi(file);
    setMidiName(file.name);
    var obj = await parseArrayBuffer(await file.arrayBuffer());
    if (obj) {
      setMidiObject(obj);
      var currentMidiTracks = trackParser(obj);
      var currentDisabledTracks = []
      setMidiTracks(currentMidiTracks);
      for(const track in currentMidiTracks) {
        if(percussionPrograms.includes(currentMidiTracks[parseInt(track)][1])) {
          currentDisabledTracks.push(parseInt(track))
        } 
      }
      setDisabledTracks(currentDisabledTracks);
      var checkboxes = window.document.getElementsByClassName('trackCheckbox');
      for(var item in checkboxes) {
        var checkbox = checkboxes[parseInt(item)] as HTMLInputElement;
        if (checkbox) {
          if (currentDisabledTracks && currentDisabledTracks.includes(parseInt(checkbox.id.replace("track_", "")))) {
            checkbox.checked = false;
          } else {
            checkbox.checked = true;
          }
        }
      }
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setIsLoading(true);

    const fd = new FormData();
    if (!midi) {
      return;
    }

    if (!midiObject) {
      return;
    }

    var newMidiObject = { ...midiObject }
    
    if (disabledTracks && disabledTracks.length > 0 && midiObject) {
      newMidiObject.tracks = midiObject.tracks.filter((_, index) => !disabledTracks.includes(index));
      var midiBlob = new Blob([await encode(newMidiObject)])
      var editedMidiFile = new File([midiBlob], midiName)
      fd.append('file', editedMidiFile, midiName);
    } else {
      fd.append('file', midi, midiName);
    }

    fd.append('tick_lag', (tickLag / 100).toString());
    fd.append('line_limit', lineLimit.toString())

    const response = await fetch("/api/midi", {
      method: "post",
      body: fd,
    });

    setIsLoading(false);

    var piano_element = document.getElementById("piano");
    var piano_title_element = document.getElementById("piano_title");
    var piano_container = document.getElementById("piano_container");
    var piano_result = await response.json();

    if (piano_element && piano_title_element && piano_container) {
      piano_element.innerText = piano_result["piano"];
      piano_title_element.innerText = piano_result["piano_title"];
      piano_container.classList.remove("hidden");

      var data = window.URL.createObjectURL(new Blob([piano_element.innerText], {type: "text/plain"}));
      var title = piano_title_element.innerText.split('.').slice(0,-1)
      title.push("txt")
      var title_final = title.join(".")

      setDownloadFilename(title_final)
      setDownloadData(data)
    }
  };

  return (
    <>
    <form action="/api/midi" method="post" onSubmit={onSubmit}>
      <div className="flex flex-col w-64 space-y-8 items-center justify-center">
        <FileUploader 
          handleChange={handleChange} 
          name="file" 
          types={fileTypes}
          classList="grow">
          <label htmlFor="dropzone-file" className="flex flex-col w-64 items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 mx-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span>, or drag and drop.</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">MID, MIDI</p>
            </div>
          </label>
        </FileUploader>
        <button type="submit" disabled={!midiName} className='flex-1 grow text-white w-full disabled:bg-gray-500 disabled:hover:bg-gray-500 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800'>
          {isLoading ? 'Processing...' : midiName ? "Upload  " + midiName : "Upload"}
        </button>
        <button type="button" disabled={!downloadFilename} onClick={copyToClipboard} className='disabled:bg-gray-500 disabled:hover:bg-gray-500 flex-1 grow text-white w-full focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800'>
          Copy To Clipboard
        </button>
        <a id="download_link" type="button" className={`flex-1 grow w-full focus:outline-none text-white text-center ${downloadFilename ? "bg-orange-400 hover:bg-orange-500" : "bg-gray-500 hover:bg-gray-500"} focus:ring-4 focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:focus:ring-orange-900`} href={downloadData ? downloadData : undefined} download={downloadFilename}>
          Download
        </a>
      </div>
      <input type="hidden" name="tick_lag" value={tickLag / 100}/>
      <input type="hidden" name="line_limit" value={lineLimit}/>
    </form>
    { midiTracks &&
    <div className='flex flex-col space-y-4'>
      <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Parameters</h3>
      <label htmlFor="steps-range" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Tick Lag: {tickLag / 100}</label>
      <input id="steps-range" type="range" min="0" max="100" value={tickLag} onChange={handleTickRateChange} step="1" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"></input>
      <label htmlFor="steps-range" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Max Lines: {lineLimit}</label>
      <input id="steps-range" type="range" min="5" max="5000" value={lineLimit} onChange={handleLineLimitChange} step="5" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"></input>
      <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Tracks</h3>
      <ul className="w-48 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
        { midiTracks?.map(track => (
          <li key={`track_${midiName}_${track[0].toString()}`} className="trackCheckbox w-full border-b border-gray-200 rounded-t-lg dark:border-gray-600">
              <div className="flex items-center pl-3 pr-1">
                  <input key={`track_${midiName}_${track[0].toString()}_checkbox`} id={`track_${track[0].toString()}`} type="checkbox" defaultChecked={true} onChange={handleTrackCheckboxClick} value="" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500" />
                  <label id={`track_${track[0].toString()}`} className="w-full py-3 ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">{track[2]}</label>
              </div>
          </li>
        ))}
      </ul>
    </div>
    }
    </>
  )
}