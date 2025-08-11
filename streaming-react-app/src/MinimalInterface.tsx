import {useEffect, useRef, useState} from 'react';
import {StreamingClient} from './sdk';

export default function MinimalInterface() {
  const clientRef = useRef<StreamingClient | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const [languages, setLanguages] = useState<Array<string>>([]);
  const [targetLang, setTargetLang] = useState<string>('eng');
  const [transcript, setTranscript] = useState<string>('');
  const [preempted, setPreempted] = useState<boolean>(false);

  useEffect(() => {
    const client = new StreamingClient();
    clientRef.current = client;

    const unsubStatus = client.on('status', (s) => setStatus(s));
    const unsubText = client.on('text', (t) => setTranscript((prev) => prev + t));
    const unsubCaps = client.on('capabilities', (caps) => {
      const first = caps?.[0] ?? null;
      if (first) {
        const langs = first.targetLangs ?? [];
        setLanguages(langs);
        if (langs.length > 0) setTargetLang((prev) => prev ?? langs[0]);
      }
    });
    const unsubPreempt = client.on('preempted', () => setPreempted(true));

    client
      .init()
      .then(() => {
        if (targetLang) client.setTargetLanguage(targetLang);
      })
      .catch((e) => console.error('StreamingClient init failed', e));

    return () => {
      unsubStatus();
      unsubText();
      unsubCaps();
      unsubPreempt();
      client.destroy();
      clientRef.current = null;
    };
  }, []);

  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;
    if (targetLang) client.setTargetLanguage(targetLang);
  }, [targetLang]);

  const onStart = async () => {
    try {
      await clientRef.current?.start();
    } catch (e) {
      console.error('start failed', e);
    }
  };

  const onStop = async () => {
    try {
      await clientRef.current?.stop();
    } catch (e) {
      console.error('stop failed', e);
    }
  };

  return (
    <div style={{padding: 16, fontFamily: 'sans-serif'}}>
      <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
        <button onClick={onStart} disabled={status === 'running'}>
          Start
        </button>
        <button onClick={onStop} disabled={status !== 'running'}>
          Stop
        </button>
        <span>Status: {status}</span>
        {preempted && (
          <span style={{marginLeft: 8, color: '#b00'}}>Preempted by another client</span>
        )}
        <label>
          Target Language:
          <select
            value={targetLang}
            onChange={(e) => {
              const code = e.target.value;
              setTargetLang(code);
              const client = clientRef.current;
              if (client) client.setTargetLanguage(code);
            }}
            style={{marginLeft: 8}}>
            {languages.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div style={{marginTop: 12}}>
        <div style={{fontWeight: 'bold'}}>Transcript</div>
        <div
          style={{
            whiteSpace: 'pre-wrap',
            border: '1px solid #ddd',
            padding: 12,
            minHeight: 160,
          }}>
          {transcript}
        </div>
      </div>
    </div>
  );
}


