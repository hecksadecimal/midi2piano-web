import { NextRequest, NextResponse } from "next/server";
import { convertMidi } from '../../actions/convert-midi'
import { setCookie } from 'cookies-next';
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

type Data = {
    piano: string
}
  
export async function POST (req: NextRequest, res: NextResponse) {
    const formData = await req.formData();
    const file: File | null = formData.get('file') as unknown as File

    var piano_data = await convertMidi(formData)
    var piano_title = file.name

    var cookie_value = JSON.stringify({data: piano_data, title: piano_title})
    if (cookie_value.length < 4096) {
        cookies().set('latest_conv', cookie_value)
    }

    var response = NextResponse.json({piano: piano_data, piano_title: piano_title}, { status: 200 })
    return response
}
