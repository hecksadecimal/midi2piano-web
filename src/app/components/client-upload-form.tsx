'use client'
import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useRouter } from "next/navigation";

export function MIDIUploadForm() {
  const [midi, setMidi] = useState<File>();
  const [midiName, setMidiName] = useState('');
  const [downloadFilename, setDownloadFilename] = useState('');
  const [downloadData, setDownloadData] = useState('');
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

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setMidi(event.target.files[0]);
      setMidiName(event.target.files[0].name);
    }
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setIsLoading(true);

    const fd = new FormData();
    if (!midi) {
      return;
    }

    fd.append('file', midi, midiName);

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
    <form action="/api/midi" method="post" onSubmit={onSubmit}>
      <div className="flex flex-col w-full space-y-8 items-center justify-center">
        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 mx-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span></p>
                <p className="text-xs text-gray-500 dark:text-gray-400">MID, MIDI</p>
            </div>
            <input required onChange={onChange} id="dropzone-file" name="file" type="file" className="hidden" />
        </label>
        <button type="submit" className='flex-1 grow text-white w-full bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800'>
          {isLoading ? 'Processing...' : midiName ? "Upload  " + midiName : "Upload"}
        </button>
        <button type="button" disabled={!downloadFilename} onClick={copyToClipboard} className='disabled:bg-gray-500 disabled:hover:bg-gray-500 flex-1 grow text-white w-full focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800'>
          Copy To Clipboard
        </button>
        <a id="download_link" type="button" className={`flex-1 grow w-full focus:outline-none text-white text-center ${downloadFilename ? "bg-orange-400 hover:bg-orange-500" : "bg-gray-500 hover:bg-gray-500"} focus:ring-4 focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:focus:ring-orange-900`} href={downloadData ? downloadData : undefined} download={downloadFilename}>
          Download
        </a>
      </div>
    </form>
  )
}