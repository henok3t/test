import { useState } from 'react';
import { useApp } from '../state.tsx';
import { Anbessa } from '../art/Anbessa.tsx';
import { Tibeb } from '../ui/ui.tsx';

/** First run: a grown-up types the child's name, which Anbessa uses in the story. */
export function Setup() {
  const { saved, update, go } = useApp();
  const [n, setN] = useState(saved.childName);
  const finish = (childName: string) => {
    update((s) => ({ ...s, childName: childName.trim().slice(0, 24), setupDone: true }));
    go({ name: 'map' });
  };
  return (
    <div className="screen setup-screen">
      <div className="panel pop-in">
        <Tibeb />
        <div className="setup-lion"><Anbessa pose="wave" /></div>
        <h2>Hello, grown-up!</h2>
        <p>Anbessa the lion cub will teach your child their first Amharic words. What should Anbessa call your child?</p>
        <form onSubmit={(e) => { e.preventDefault(); finish(n); }}>
          <input value={n} onChange={(e) => setN(e.target.value)} placeholder="Child’s first name" aria-label="Child’s first name" autoComplete="off" maxLength={24} />
          <button type="submit" className="big-pill green">Let’s go!</button>
        </form>
        <button type="button" className="link-btn" onClick={() => finish('')}>Skip</button>
        <p className="small">
          The story is read aloud in English, and Amharic words are spoken by a built-in computer voice.
          You can record your own voice for every word: on the home screen, press and hold <b>Grown-ups</b>.
        </p>
      </div>
    </div>
  );
}
