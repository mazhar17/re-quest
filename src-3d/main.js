import {isSupported,mount,unmount,thumbnails} from './core.js';
import {builders} from './scenes.js';
window.RE3D={supported:isSupported,unmount,ids:Object.keys(builders),
  mount:(host,id,vals,opts)=>builders[id]?mount(host,builders[id],vals,opts):null,
  thumbs:(items,w,h,cb)=>thumbnails(items.filter(i=>builders[i[0]]).map(([id,vals])=>[id,builders[id],vals]),w,h,cb)};
