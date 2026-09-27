import { useEffect, useState } from 'react';
import { CameraOff } from 'lucide-react';
import { cn } from '@/utils';
import { tokenService } from '@/services/tokenService';

export function FaceImage({ userId, path, alt = 'Captured face', className }: { userId: string | null; path?: string | null; alt?: string; className?: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let active = true;
    if (!path) { setUrl(''); return () => { active = false; }; }
    void tokenService.getFaceImageUrl(userId, path).then((value) => { if (active) setUrl(value); }).catch(() => { if (active) setUrl(''); });
    return () => { active = false; };
  }, [userId, path]);
  if (!path || !url) return <div className={cn('flex h-28 w-24 items-center justify-center rounded-xl border border-dashed border-ink-300 bg-ink-50 text-ink-400', className)}><CameraOff size={20}/></div>;
  return <img src={url} alt={alt} className={cn('h-28 w-24 rounded-xl border border-ink-200 object-cover shadow-sm', className)} />;
}
