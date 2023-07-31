import { cookies } from 'next/headers';
import { Piano } from './components/piano';
import { Navbar } from './components/navbar';

const getPiano = async () => {
  const nextCookies = cookies();
  const piano = nextCookies.get('latest_conv')

  if (!piano) {
    return null;
  }

  var parsed_piano = JSON.parse(piano.value)

  return [parsed_piano["data"], parsed_piano["title"]];
}

export default async function Page() {
  var piano_data = await getPiano();
  if (!piano_data) {
    piano_data = ["", ""]
  }
  return (
    <>
      <main className="bg-transparent">
        <Navbar />
        <div id="main-container" className='pt-24 grid h-screen place-items-center'>
          <div className='block p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700'>
            <Piano piano={piano_data[0]} piano_name={piano_data[1]}/>
          </div>
        </div>
      </main>
    </>
  )
}
