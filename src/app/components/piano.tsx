'use server';

import { MIDIUploadForm } from "./client-upload-form";

export async function Piano(props: { piano: string | null, piano_name: string | null }) {
    const {piano, piano_name} = props;
    return (
        <div className="flex justify-center space-x-8">
            <MIDIUploadForm />
                <div id="piano_container" className={`flex shrink flex-col ${(!piano_name && !piano) ? "hidden" : ""} min-w-0`}>
                    <h3 id="piano_title" className="justify-center min-w-0 mb-4 text-2xl font-bold dark:text-white">
                        { piano_name }
                    </h3>
                <code id="piano" className="whitespace-pre-line min-w-0 bg-gray-200 dark:text-white dark:bg-gray-900 p-4 rounded-lg">
                    { piano }
                </code>
            </div>
        </div>
    )
}