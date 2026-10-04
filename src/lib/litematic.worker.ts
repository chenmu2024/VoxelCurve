import { generateCircle, generateOval, generateDome } from '../core/geometry';
import type { BlueprintState } from './state';
import { exportLitematic } from './litematic';

self.onmessage=(event:MessageEvent<{params:BlueprintState;name:string;material:string}>)=>{
  try{
    const {params:p,name,material}=event.data;
    self.postMessage({type:'status',message:'Generating export blueprint…'});
    const result=p.shape==='circle'?generateCircle(p.diameter,p.style,p.thickness):
      p.shape==='oval'?generateOval(p.width,p.height,p.style,p.thickness):
      generateDome(p.width,p.depth,p.height,p.style,p.thickness);
    self.postMessage({type:'status',message:'Packing and compressing Litematic…'});
    const bytes=exportLitematic(result,name,material);
    self.postMessage({type:'ready',bytes}, {transfer:[bytes.buffer]});
  }catch(error){
    self.postMessage({type:'error',message:error instanceof Error?error.message:'Could not create Litematic file.'});
  }
};
