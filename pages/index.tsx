import endent from "endent";
import { PGChunk } from '@/types';
import {useState} from 'react';

export default function Home() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [chunks, setChunks] = useState<PGChunk[]>([]);
  const [loading, setLoading] = useState(false);


  const handleAnswer = async ()=>{
    setLoading(true);
    const searchResponse = await fetch('/api/search', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({query})
    })

    if(!searchResponse.ok){
      setLoading(false)
      return;
    }

    const results: PGChunk[] = await searchResponse.json();
    setChunks(results);
    
    const prompt = endent`
    Use the following passages to answer the query: ${query}
    
    ${results.map((chunk)=>chunk.content).join("\n")}
    `;
    
    const answerResponse = await fetch("/api/answer",{
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({prompt})
    })

    if(!answerResponse.ok){
      setLoading(false)
      return;
    }

    const data = answerResponse.body;

    if(!data){
      setLoading(false)
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

      while(!done){
        const {value, done: doneReading} = await reader.read();
        done = doneReading;

        const chunkValue = decoder.decode(value);
        setAnswer((prev) => prev + chunkValue);
       }

       setLoading(false);
  }

  return (
    <>
    <div className="flex flex-col w-[350px]">
      <input
      className="border border-gray-300 rounded-md p-2"
      type="text"
      placeholder='Ask Paul Graham something'
      value={query}
      onChange={(e)=> setQuery(e.target.value)}
      />
      <button
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      onClick={handleAnswer}
      >
        Submit
      </button>

      <div className="mt-4">
    {
      loading
      ? <div>Loading...</div>
      : <div>{answer}</div>

    }
      </div>
    </div>
    </>
  )
}
