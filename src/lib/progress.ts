export interface ProgressStep { key:string }

export interface DecodedProgress {
  completed:Set<string>;
  stepIndex:number;
}

function clampIndex(index:number, length:number):number {
  if (!length) return 0;
  if (!Number.isFinite(index)) return 0;
  return Math.max(0, Math.min(length - 1, Math.round(index)));
}

function bytesToBase64(bytes:Uint8Array):string {
  let binary='';
  for (let i=0;i<bytes.length;i++) binary+=String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(value:string):Uint8Array {
  const binary=atob(value);
  const bytes=new Uint8Array(binary.length);
  for (let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
  return bytes;
}

export function encodeProgress(
  completed:Set<string>,
  steps:ProgressStep[],
  stepIndex:number
):string {
  const bytes=new Uint8Array(Math.ceil(steps.length/8));
  steps.forEach((step,index)=>{
    if (!completed.has(step.key)) return;
    bytes[index>>3] |= 1 << (index & 7);
  });

  return JSON.stringify({
    v:2,
    bits:bytesToBase64(bytes),
    stepIndex:clampIndex(stepIndex,steps.length),
    updatedAt:Date.now()
  });
}

export function decodeProgress(raw:string | null,steps:ProgressStep[]):DecodedProgress {
  const empty={completed:new Set<string>(),stepIndex:0};
  if (!raw) return empty;

  try {
    const parsed=JSON.parse(raw);
    const validKeys=new Set(steps.map(step=>step.key));

    // Legacy VoxelCurve format: { completed: string[], stepIndex: number }
    if (Array.isArray(parsed?.completed)) {
      const completed=new Set<string>();
      for (const key of parsed.completed) {
        if (typeof key==='string' && validKeys.has(key)) completed.add(key);
      }
      return {
        completed,
        stepIndex:clampIndex(Number(parsed.stepIndex),steps.length)
      };
    }

    if (parsed?.v!==2 || typeof parsed?.bits!=='string') return empty;
    const bytes=base64ToBytes(parsed.bits);
    const completed=new Set<string>();

    steps.forEach((step,index)=>{
      const byte=bytes[index>>3];
      if (byte!==undefined && (byte & (1 << (index & 7)))) completed.add(step.key);
    });

    return {
      completed,
      stepIndex:clampIndex(Number(parsed.stepIndex),steps.length)
    };
  } catch {
    return empty;
  }
}
