(()=>{
  const API_ORIGIN='https://beatai.games';
  const nativeFetch=window.fetch.bind(window);
  window.fetch=(input,init)=>{
    try{
      const raw=typeof input==='string'?input:input?.url||'';
      if(raw.startsWith('/api/')) return nativeFetch(API_ORIGIN+raw,init);
    }catch{}
    return nativeFetch(input,init);
  };
  window.BEAT_AI_HOST=API_ORIGIN;
  // CrazyGames package build trigger marker.
})();
