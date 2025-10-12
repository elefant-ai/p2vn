import { useTypewriter } from '../hooks/useTypewriter';

interface TypewriterProps {
  text: string;
}

export function Typewriter({ text }: TypewriterProps) {
  const displayText = useTypewriter(text, 30);

  return (
    <div className="vn-box p-8 max-w-3xl mx-4 pointer-events-auto">
      <div className="vn-text text-2xl text-center" style={{ color: 'var(--color-text)' }}>
        {displayText}
        <span className="inline-block w-3 h-6 ml-2 bg-current animate-pulse terminal-cursor"></span>
      </div>
    </div>
  );
}
