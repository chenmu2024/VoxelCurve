import fs from 'node:fs';
import zlib from 'node:zlib';

const W=1200,H=630;
const px=Buffer.alloc(W*H*4);

const color=(hex)=>{
  const v=hex.replace('#','');
  return [parseInt(v.slice(0,2),16),parseInt(v.slice(2,4),16),parseInt(v.slice(4,6),16),255];
};
const C={
  bg:color('#0f1110'),
  panel:color('#131613'),
  line:color('#2b2f2c'),
  green:color('#34d399'),
  soft:color('#a7f3d0'),
  ink:color('#f7f7f7'),
  muted:color('#747b76')
};

function rect(x,y,w,h,c){
  const x0=Math.max(0,Math.floor(x)),y0=Math.max(0,Math.floor(y));
  const x1=Math.min(W,Math.ceil(x+w)),y1=Math.min(H,Math.ceil(y+h));
  for(let yy=y0;yy<y1;yy++){
    for(let xx=x0;xx<x1;xx++){
      const i=(yy*W+xx)*4;
      px[i]=c[0];px[i+1]=c[1];px[i+2]=c[2];px[i+3]=255;
    }
  }
}
function border(x,y,w,h,t,c){
  rect(x,y,w,t,c);rect(x,y+h-t,w,t,c);rect(x,y,t,h,c);rect(x+w-t,y,t,h,c);
}
rect(0,0,W,H,C.bg);
rect(54,54,1092,522,C.panel);
border(54,54,1092,522,2,C.line);

// stepped VoxelCurve mark
rect(104,112,92,92,C.bg);border(104,112,92,92,2,C.line);
const mark=[[0,0],[0,1],[1,2],[2,3],[3,3],[4,2],[5,1],[5,0]];
for(const [gx,gy] of mark) rect(122+gx*10,130+gy*10,8,8,C.green);

// blueprint circle motif
const cx=865,cy=315,r=164,cell=18;
for(let gy=-11;gy<=11;gy++){
  for(let gx=-11;gx<=11;gx++){
    const x=cx+gx*cell,y=cy+gy*cell;
    const d=Math.hypot(x-cx,y-cy);
    if(Math.abs(d-r)<cell*.72) rect(x-cell*.38,y-cell*.38,cell*.76,cell*.76,C.green);
  }
}
// current segment
for(let gx=-2;gx<=2;gx++) rect(cx+gx*cell-cell*.38,cy-r-cell*.38,cell*.76,cell*.76,C.ink);

// center axes
rect(cx-1,132,2,366,C.muted);
rect(682,cy-1,366,2,C.muted);

// left information bars: abstract, text-free but branded
rect(104,264,430,18,C.ink);
rect(104,300,360,10,C.muted);
rect(104,326,286,10,C.muted);
rect(104,404,104,9,C.green);
rect(226,404,86,9,C.ink);
rect(330,404,98,9,C.ink);
rect(104,506,420,2,C.line);
rect(104,530,132,8,C.muted);

function crc32(buf){
  let c=0xffffffff;
  for(const byte of buf){
    c^=byte;
    for(let k=0;k<8;k++) c=(c>>>1)^((c&1)?0xedb88320:0);
  }
  return (c^0xffffffff)>>>0;
}
function chunk(type,data){
  const t=Buffer.from(type);
  const out=Buffer.alloc(12+data.length);
  out.writeUInt32BE(data.length,0);
  t.copy(out,4);data.copy(out,8);
  out.writeUInt32BE(crc32(Buffer.concat([t,data])),8+data.length);
  return out;
}

const raw=Buffer.alloc((W*4+1)*H);
for(let y=0;y<H;y++){
  const row=y*(W*4+1);
  raw[row]=0;
  px.copy(raw,row+1,y*W*4,(y+1)*W*4);
}
const ihdr=Buffer.alloc(13);
ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);
ihdr[8]=8;ihdr[9]=6;ihdr[10]=0;ihdr[11]=0;ihdr[12]=0;

const png=Buffer.concat([
  Buffer.from([137,80,78,71,13,10,26,10]),
  chunk('IHDR',ihdr),
  chunk('IDAT',zlib.deflateSync(raw,{level:9})),
  chunk('IEND',Buffer.alloc(0))
]);

fs.writeFileSync(new URL('../public/og.png',import.meta.url),png);
console.log(`Generated public/og.png (${Math.round(png.length/1024)}KB)`);
